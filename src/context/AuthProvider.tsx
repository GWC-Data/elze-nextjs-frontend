import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { restoreSession, setSessionLostHandler } from '@/api/client'
import { login as loginRequest, logout as logoutRequest } from '@/api/auth.api'
import { notify } from '@/lib/notify'
import { homeForRole } from '@/router/paths'
import { AuthControlContext } from '@/context/authContext'
import type { AuthControl } from '@/context/authContext'
import type { AuthStatus } from '@/types/auth'

const MAX_RENEWALS = 2

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [lost, setLost] = useState<AuthStatus | null>(null)

  const statusRef = useRef<AuthStatus>('RESTORING')
  const renewing = useRef(false)
  const renewals = useRef(0)

  const track = useCallback((status: AuthStatus) => {
    statusRef.current = status
  }, [])

  useEffect(() => {
    setSessionLostHandler((reason) => {
      const current = statusRef.current
      if (
        current === 'RESTORING' ||
        current === 'UNAUTHENTICATED' ||
        current === 'SESSION_EXPIRED' ||
        current === 'ACCOUNT_DISABLED'
      ) {
        return
      }

      if (reason === 'disabled') {
        statusRef.current = 'ACCOUNT_DISABLED'
        setLost('ACCOUNT_DISABLED')
        notify.error('Your access has been withdrawn.', 'Contact your administrator.')
      } else {
        statusRef.current = 'SESSION_EXPIRED'
        setLost('SESSION_EXPIRED')
        notify.warning('Your session has expired.', 'Sign in again to continue.')
      }
    })
    return () => setSessionLostHandler(null)
  }, [])

  const renew = useCallback(() => {
    if (renewing.current) return
    if (renewals.current >= MAX_RENEWALS) {
      setLost('UNAUTHENTICATED')
      return
    }
    renewing.current = true
    renewals.current += 1
    restoreSession()
      .then((renewed) => {
        if (renewed) router.refresh()
        else setLost('UNAUTHENTICATED')
      })
      .finally(() => {
        renewing.current = false
      })
  }, [router])

  const settle = useCallback(() => {
    renewals.current = 0
  }, [])

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const session = await loginRequest(identifier, password)
      setLost(null)
      router.replace(homeForRole(session.user.role))
    },
    [router]
  )

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
      notify.info('You have been signed out.')
    } catch {
      notify.warning('Signed out locally.', 'The server could not be reached to end the session.')
    } finally {
      statusRef.current = 'UNAUTHENTICATED'
      setLost('UNAUTHENTICATED')
    }
  }, [])

  const adoptSession = useCallback(() => {
    setLost(null)
    router.refresh()
  }, [router])

  const refresh = useCallback(async () => {
    router.refresh()
  }, [router])

  const value = useMemo<AuthControl>(
    () => ({ lost, renew, settle, track, signIn, signOut, adoptSession, refresh }),
    [lost, renew, settle, track, signIn, signOut, adoptSession, refresh]
  )

  return <AuthControlContext.Provider value={value}>{children}</AuthControlContext.Provider>
}
