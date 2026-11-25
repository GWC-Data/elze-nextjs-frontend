'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { msUntilAccessExpiry, noteAccessExpiry, restoreSession } from '@/api/client'
import { AuthContext, useAuthControl } from '@/context/authContext'
import type { SessionState } from '@/context/authContext'
import type { ClientSession } from '@/types/auth'

const RENEW_AHEAD_MS = 2 * 60_000
const CHECK_EVERY_MS = 60_000
const RETRY_AFTER_FAILURE_MS = 5 * 60_000

function isSignedIn(session: ClientSession): boolean {
  return (
    session.user !== null && (session.status === 'AUTHENTICATED' || session.status === 'PASSWORD_CHANGE_REQUIRED')
  )
}

function sameSession(a: ClientSession, b: ClientSession): boolean {
  return (
    a.status === b.status &&
    JSON.stringify(a.user) === JSON.stringify(b.user) &&
    JSON.stringify(a.dashboards) === JSON.stringify(b.dashboards)
  )
}

export function SessionProvider({ session, children }: { session: ClientSession; children: ReactNode }) {
  const { lost, renew, settle, track, signIn, signOut, adoptSession, refresh } = useAuthControl()
  const [shown, setShown] = useState(session)
  const next = session.status === 'RESTORING' && isSignedIn(shown) ? shown : session
  if (next !== shown && !sameSession(next, shown)) setShown(next)

  const status = lost ?? shown.status
  const signedIn = status === 'AUTHENTICATED' || status === 'PASSWORD_CHANGE_REQUIRED'

  useEffect(() => {
    track(status)
  }, [track, status])

  useEffect(() => {
    if (lost) return
    if (session.status === 'RESTORING') renew()
    else settle()
  }, [session, lost, renew, settle])

  useEffect(() => {
    noteAccessExpiry(session.accessExpiresAt)
  }, [session.accessExpiresAt])

  useEffect(() => {
    if (!signedIn) return
    let pausedUntil = 0
    const renewIfDue = () => {
      if (document.visibilityState !== 'visible' || Date.now() < pausedUntil) return
      const left = msUntilAccessExpiry()
      if (left === null || left >= RENEW_AHEAD_MS) return
      void restoreSession().then((renewed) => {
        if (!renewed) pausedUntil = Date.now() + RETRY_AFTER_FAILURE_MS
      })
    }
    renewIfDue()
    const timer = window.setInterval(renewIfDue, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', renewIfDue)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', renewIfDue)
    }
  }, [signedIn])

  const value = useMemo<SessionState>(
    () => ({
      status,
      user: lost ? null : shown.user,
      dashboards: lost ? [] : shown.dashboards,
      signIn,
      signOut,
      adoptSession,
      refresh,
    }),
    [status, lost, shown, signIn, signOut, adoptSession, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
