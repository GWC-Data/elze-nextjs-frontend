'use client'

import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { AuthContext, useAuthControl } from '@/context/authContext'
import type { SessionState } from '@/context/authContext'
import type { ClientSession } from '@/types/auth'

export function SessionProvider({ session, children }: { session: ClientSession; children: ReactNode }) {
  const { lost, renew, settle, track, signIn, signOut, adoptSession, refresh } = useAuthControl()
  const status = lost ?? session.status

  useEffect(() => {
    track(status)
  }, [track, status])

  useEffect(() => {
    if (lost) return
    if (session.status === 'RESTORING') renew()
    else settle()
  }, [session, lost, renew, settle])

  useEffect(() => {
    if (status !== 'AUTHENTICATED') return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [status, refresh])

  const value = useMemo<SessionState>(
    () => ({
      status,
      user: lost ? null : session.user,
      dashboards: lost ? [] : session.dashboards,
      signIn,
      signOut,
      adoptSession,
      refresh,
    }),
    [status, lost, session, signIn, signOut, adoptSession, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
