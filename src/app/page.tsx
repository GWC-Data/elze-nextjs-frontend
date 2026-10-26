import { redirect } from 'next/navigation'
import { RootRedirect } from '@/router/guards'
import { homeForRole } from '@/router/paths'
import { SessionBoundary } from '@/server/SessionBoundary'
import { getSession } from '@/server/session'

export default async function Page() {
  const session = await getSession()
  if (session.kind === 'signed-in') redirect(homeForRole(session.user.role))
  if (session.kind === 'signed-out') redirect('/login')
  return (
    <SessionBoundary>
      <RootRedirect />
    </SessionBoundary>
  )
}
