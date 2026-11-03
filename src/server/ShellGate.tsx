import 'server-only'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'
import { AbilityProvider } from '@/context/AbilityProvider'
import { SessionProvider } from '@/context/SessionProvider'
import { AppShell } from '@/layouts/AppShell'
import { homeForRole, shellForRole } from '@/router/paths'
import type { Shell } from '@/router/paths'
import { allowedNavigation, can } from '@/server/access'
import { getSession, toClientSession } from '@/server/session'

export async function ShellGate({ shell, children }: { shell: Shell; children: ReactNode }) {
  const session = await getSession()
  if (session.kind === 'signed-out') redirect('/login')
  if (session.kind === 'signed-in' && shellForRole(session.user.role) !== shell) {
    redirect(homeForRole(session.user.role))
  }

  const ready = session.kind === 'signed-in' && session.state === 'AUTHENTICATED' ? session : null
  const navigation = ready ? allowedNavigation(ready) : []
  const abilities = PAGE_ABILITIES.AppShell
  const granted = ready ? abilities.filter((key) => can(ready, key)) : []

  return (
    <SessionProvider session={toClientSession(session)}>
      <AbilityProvider
        granted={granted}
        declared={process.env.NODE_ENV === 'production' ? undefined : [...abilities]}
      >
        <AppShell shell={shell} navigation={navigation}>
          {children}
        </AppShell>
      </AbilityProvider>
    </SessionProvider>
  )
}
