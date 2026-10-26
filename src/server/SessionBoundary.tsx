import 'server-only'
import type { ReactNode } from 'react'
import { SessionProvider } from '@/context/SessionProvider'
import { getSession, toClientSession } from '@/server/session'

export async function SessionBoundary({ children }: { children: ReactNode }) {
  const session = await getSession()
  return <SessionProvider session={toClientSession(session)}>{children}</SessionProvider>
}
