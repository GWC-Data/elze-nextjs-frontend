import 'server-only'
import http from 'node:http'
import https from 'node:https'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import type { NextRequest } from 'next/server'
import { backendUrl } from '@/server/backend'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])
const NO_BODY_STATUSES = new Set([204, 205, 304])

function failure(status: number, message: string): Response {
  return Response.json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message } }, { status })
}

function requestHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name)) headers[name] = value
  })
  const host = request.headers.get('host')
  if (host) headers['x-forwarded-host'] = host
  return headers
}

function responseHeaders(upstream: http.IncomingMessage): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(upstream.headers)) {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(name)) continue
    if (Array.isArray(value)) for (const item of value) headers.append(name, item)
    else headers.set(name, value)
  }
  return headers
}

function send(
  target: URL,
  method: string,
  headers: Record<string, string>,
  body: ReadableStream<Uint8Array> | null,
  signal: AbortSignal
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const transport = target.protocol === 'https:' ? https : http
    const outgoing = transport.request(target, { method, headers, signal }, resolve)
    outgoing.on('error', reject)
    if (body) Readable.fromWeb(body as unknown as NodeReadableStream<Uint8Array>).on('error', reject).pipe(outgoing)
    else outgoing.end()
  })
}

export async function proxyApiRequest(request: NextRequest): Promise<Response> {
  let base: string
  try {
    base = backendUrl()
  } catch {
    return failure(503, 'The backend is not configured on this server (BACKEND_URL).')
  }

  const method = request.method.toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD' && request.body !== null

  let upstream: http.IncomingMessage
  try {
    upstream = await send(
      new URL(`${base}${request.nextUrl.pathname}${request.nextUrl.search}`),
      method,
      requestHeaders(request),
      hasBody ? request.body : null,
      request.signal
    )
  } catch {
    return failure(502, 'The backend could not be reached. Try again shortly.')
  }

  const status = upstream.statusCode ?? 502
  const body =
    method === 'HEAD' || NO_BODY_STATUSES.has(status)
      ? null
      : (Readable.toWeb(upstream) as unknown as ReadableStream<Uint8Array>)
  if (!body) upstream.resume()
  return new Response(body, { status, statusText: upstream.statusMessage, headers: responseHeaders(upstream) })
}
