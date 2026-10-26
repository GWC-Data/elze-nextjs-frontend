'use client'

import type { ReactElement } from 'react'
import { Navigate, useLocation } from '@/lib/router'
import { useAuth } from '@/context/authContext'
import { homeForRole } from '@/router/paths'
import type { AuthStatus, AuthUser } from '@/types/auth'

function isSignedIn(status: AuthStatus, user: AuthUser | null): user is AuthUser {
  return Boolean(user) && (status === 'AUTHENTICATED' || status === 'PASSWORD_CHANGE_REQUIRED')
}

export function RootRedirect() {
  const { status, user } = useAuth()

  if (status === 'RESTORING') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring your session…
      </div>
    )
  }
  if (!isSignedIn(status, user)) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

export function LoginRoute({ children }: { children: ReactElement }) {
  const { status, user } = useAuth()
  if (isSignedIn(status, user)) return <Navigate to={homeForRole(user.role)} replace />
  return children
}

export function LegacyContextRedirect() {
  const { pathname, search, hash } = useLocation()
  const to = pathname.replace(/\/context(?=\/|$)/, '/metadata-lakehouse')
  return <Navigate to={`${to}${search}${hash}`} replace />
}
