import { get, post } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ActivationTarget, ResetTarget, SessionResponse, SessionSummary } from '@/types/auth'

export function login(identifier: string, password: string): Promise<SessionResponse> {
  return post<SessionResponse>(endpoints.auth.login, { identifier, password }, { renewOnExpiry: false })
}

export function logout(): Promise<{ state: 'UNAUTHENTICATED' }> {
  return post<{ state: 'UNAUTHENTICATED' }>(endpoints.auth.logout, undefined, { renewOnExpiry: false })
}

export function fetchSessions(): Promise<SessionSummary[]> {
  return get<SessionSummary[]>(endpoints.auth.sessions)
}

export function changePassword(currentPassword: string, newPassword: string): Promise<SessionResponse> {
  return post<SessionResponse>(
    endpoints.auth.changePassword,
    { currentPassword, newPassword },
    { renewOnExpiry: false }
  )
}

export function fetchActivationTarget(token: string): Promise<ActivationTarget> {
  return get<ActivationTarget>(endpoints.auth.activation, {
    params: { token },
    renewOnExpiry: false,
  })
}

export function activateAccount(token: string, password: string): Promise<SessionResponse> {
  return post<SessionResponse>(endpoints.auth.activation, { token, password }, { renewOnExpiry: false })
}

export function requestPasswordReset(identifier: string): Promise<{ message: string }> {
  return post<{ message: string }>(endpoints.auth.forgotPassword, { identifier }, { renewOnExpiry: false })
}

export function fetchResetTarget(token: string): Promise<ResetTarget> {
  return get<ResetTarget>(endpoints.auth.resetPassword, {
    params: { token },
    renewOnExpiry: false,
  })
}

export function resetPassword(token: string, password: string): Promise<SessionResponse> {
  return post<SessionResponse>(endpoints.auth.resetPassword, { token, password }, { renewOnExpiry: false })
}
