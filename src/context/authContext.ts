import { createContext, useContext, useMemo } from 'react'
import { useCan } from '@/context/abilityContext'
import type { AccessibleDashboard, AuthStatus, AuthUser } from '@/types/auth'

export interface AuthActions {
  signIn: (identifier: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  adoptSession: () => void
  refresh: () => Promise<void>
}

export interface AuthControl extends AuthActions {
  lost: AuthStatus | null
  renew: () => void
  settle: () => void
  track: (status: AuthStatus) => void
}

export interface SessionState extends AuthActions {
  status: AuthStatus
  user: AuthUser | null
  dashboards: AccessibleDashboard[]
}

export interface AuthState extends SessionState {
  can: (permission: string) => boolean
}

export const AuthControlContext = createContext<AuthControl | null>(null)

export const AuthContext = createContext<SessionState | null>(null)

export function useAuthControl(): AuthControl {
  const ctx = useContext(AuthControlContext)
  if (!ctx) throw new Error('useAuthControl must be used inside <AuthProvider>')
  return ctx
}

export function useAuth(): AuthState {
  const session = useContext(AuthContext)
  const can = useCan()
  const state = useMemo(() => (session ? { ...session, can } : null), [session, can])
  if (!state) throw new Error('useAuth must be used inside <SessionProvider>')
  return state
}
