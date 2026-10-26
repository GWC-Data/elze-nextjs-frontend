import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { backendUrl } from '@/server/backend'
import type { AccessibleDashboard, AuthUser, ClientSession } from '@/types/auth'

const ACCESS_COOKIE = 'da_access'
const CSRF_COOKIE = 'da_csrf'

export interface SignedInSession {
  kind: 'signed-in'
  state: 'AUTHENTICATED' | 'PASSWORD_CHANGE_REQUIRED'
  user: AuthUser
  dashboards: AccessibleDashboard[]
  permissions: ReadonlySet<string>
  features: ReadonlySet<string>
}

export type ServerSession = SignedInSession | { kind: 'renewable' } | { kind: 'signed-out' }

interface BackendProfile {
  state: SignedInSession['state']
  user: AuthUser & { permissions?: string[]; features?: string[] }
  dashboards?: AccessibleDashboard[]
}

async function loadSession(): Promise<ServerSession> {
  const jar = await cookies()
  const access = jar.get(ACCESS_COOKIE)?.value
  const fallback: ServerSession = jar.has(CSRF_COOKIE) ? { kind: 'renewable' } : { kind: 'signed-out' }
  if (!access) return fallback

  let response: Response
  try {
    response = await fetch(`${backendUrl()}/api/auth/me`, {
      headers: { cookie: `${ACCESS_COOKIE}=${access}`, accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return fallback
  }
  if (response.status === 401 || response.status >= 500) return fallback
  if (!response.ok) return { kind: 'signed-out' }

  const body = (await response.json()) as { success?: boolean; data?: BackendProfile }
  if (!body.success || !body.data?.user) return fallback

  const { permissions = [], features = [], ...user } = body.data.user
  return {
    kind: 'signed-in',
    state: body.data.state,
    user,
    dashboards: body.data.dashboards ?? [],
    permissions: new Set(permissions),
    features: new Set(features),
  }
}

export const getSession = cache(loadSession)

export function toClientSession(session: ServerSession): ClientSession {
  if (session.kind === 'signed-in') {
    return { status: session.state, user: session.user, dashboards: session.dashboards }
  }
  return { status: session.kind === 'renewable' ? 'RESTORING' : 'UNAUTHENTICATED', user: null, dashboards: [] }
}
