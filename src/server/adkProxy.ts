import 'server-only'
import http from 'node:http'
import https from 'node:https'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import type { NextRequest } from 'next/server'
import { backendUrl } from '@/server/backend'

const PREFIX = '/svc/adk'
const GATE_REASON = 'x-gate-reason'
const CREDIT_CHARGE = 'x-credit-charge'
const CSRF_COOKIE = 'da_csrf'
const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'content-length']
const DROPPED_RESPONSE_HEADERS = new Set(['connection', 'keep-alive', 'transfer-encoding', 'set-cookie'])
const NO_BODY_STATUSES = new Set([101, 204, 205, 304])

interface GateVerdict {
  status: number
  reason: string | null
  charge: string | null
}

function agentServiceUrl(): string | null {
  const configured = process.env.ADK_API_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  return process.env.NODE_ENV === 'production' ? null : 'http://127.0.0.1:7070'
}

function failure(status: number, detail: string): Response {
  return Response.json({ detail }, { status })
}

async function askGate(request: NextRequest, uri: string, method: string): Promise<GateVerdict> {
  const res = await fetch(`${backendUrl()}/api/gate/agents`, {
    method: 'GET',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      'x-original-uri': uri,
      'x-original-method': method,
    },
    cache: 'no-store',
  })
  return { status: res.status, reason: res.headers.get(GATE_REASON), charge: res.headers.get(CREDIT_CHARGE) }
}

async function refund(request: NextRequest, token: string): Promise<void> {
  const csrf = request.cookies.get(CSRF_COOKIE)?.value
  await fetch(`${backendUrl()}/api/credits/refunds`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      'content-type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  }).catch(() => null)
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

function responseHeaders(upstream: http.IncomingMessage): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(upstream.headers)) {
    if (value === undefined || DROPPED_RESPONSE_HEADERS.has(name)) continue
    headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  headers.set('x-accel-buffering', 'no')
  if ((headers.get('content-type') ?? '').includes('text/event-stream')) {
    headers.set('cache-control', 'no-cache, no-transform')
  }
  return headers
}

export async function proxyAgentRequest(request: NextRequest): Promise<Response> {
  const base = agentServiceUrl()
  if (!base) return failure(503, 'The agent service is not configured on this server (ADK_API_URL).')

  const path = request.nextUrl.pathname.slice(PREFIX.length) || '/'
  const search = request.nextUrl.search
  const method = request.method.toUpperCase()

  let verdict: GateVerdict
  try {
    verdict = await askGate(request, `${PREFIX}${path}${search}`, method)
  } catch {
    return failure(502, 'The access check could not be reached. Try again shortly.')
  }
  if (verdict.status === 401 || verdict.status === 403) {
    return new Response(null, {
      status: verdict.status,
      headers: verdict.reason ? { [GATE_REASON]: verdict.reason } : undefined,
    })
  }
  if (verdict.status !== 204 && verdict.status !== 200) {
    return failure(502, 'The access check did not answer. Try again shortly.')
  }

  const headers: Record<string, string> = {}
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers[name] = value
  }
  const apiKey = process.env.ADK_API_KEY?.trim()
  if (apiKey) headers['x-api-key'] = apiKey

  const hasBody = method !== 'GET' && method !== 'HEAD' && request.body !== null
  let upstream: http.IncomingMessage
  try {
    upstream = await send(
      new URL(`${base}${path}${search}`),
      method,
      headers,
      hasBody ? request.body : null,
      request.signal
    )
  } catch {
    if (verdict.charge) await refund(request, verdict.charge)
    return failure(502, 'The agent service could not be reached. Try again shortly.')
  }

  const status = upstream.statusCode ?? 502
  if (verdict.charge && status >= 400) await refund(request, verdict.charge)

  const body =
    method === 'HEAD' || NO_BODY_STATUSES.has(status)
      ? null
      : (Readable.toWeb(upstream) as unknown as ReadableStream<Uint8Array>)
  if (!body) upstream.resume()
  return new Response(body, { status, statusText: upstream.statusMessage, headers: responseHeaders(upstream) })
}
