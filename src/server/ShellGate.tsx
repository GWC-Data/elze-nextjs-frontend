import 'server-only'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { SessionProvider } from '@/context/SessionProvider'
import { AppShell } from '@/layouts/AppShell'
import { homeForRole, shellForRole } from '@/router/paths'
import type { Shell } from '@/router/paths'
import { allowedNavigation } from '@/server/access'
import { getSession, toClientSession } from '@/server/session'

export async function ShellGate({ shell, children }: { shell: Shell; children: ReactNode }) {
  const session = await getSession()
  if (session.kind === 'signed-out') redirect('/login')
  if (session.kind === 'signed-in' && shellForRole(session.user.role) !== shell) {
    redirect(homeForRole(session.user.role))
  }

  const navigation =
    session.kind === 'signed-in' && session.state === 'AUTHENTICATED' ? allowedNavigation(session) : []

  return (
    <SessionProvider session={toClientSession(session)}>
      <AppShell shell={shell} navigation={navigation}>
        {children}
      </AppShell>
    </SessionProvider>
  )
}
