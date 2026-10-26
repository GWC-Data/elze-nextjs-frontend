import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { backendUrl } from '@/server/backend'

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'cookie',
  'origin',
  'referer',
  'user-agent',
  'x-csrf-token',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-real-ip',
]

const FORWARDED_RESPONSE_HEADERS = ['cache-control', 'content-type', 'retry-after']

const ACCESS_LISTS = ['permissions', 'features']

function withoutAccessLists(body: string, contentType: string | null): string {
  if (!contentType?.includes('application/json')) return body
  try {
    const parsed = JSON.parse(body) as { data?: { user?: Record<string, unknown> } }
    const user = parsed?.data?.user
    if (!user || typeof user !== 'object') return body
    for (const key of ACCESS_LISTS) delete user[key]
    return JSON.stringify(parsed)
  } catch {
    return body
  }
}

export async function proxyAuth(request: NextRequest, path: string): Promise<NextResponse> {
  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const upstream = await fetch(`${backendUrl()}/api/auth/${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
    redirect: 'manual',
  })

  const contentType = upstream.headers.get('content-type')
  const response = new NextResponse(withoutAccessLists(await upstream.text(), contentType), {
    status: upstream.status,
  })
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) response.headers.set(name, value)
  }
  for (const cookie of upstream.headers.getSetCookie()) response.headers.append('set-cookie', cookie)
  return response
}
