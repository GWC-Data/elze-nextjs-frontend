import { redirect } from 'next/navigation'
import LoginPage from '@/views/LoginPage'
import { LoginRoute } from '@/router/guards'
import { homeForRole } from '@/router/paths'
import { SessionBoundary } from '@/server/SessionBoundary'
import { getSession } from '@/server/session'

export default async function Page() {
  const session = await getSession()
  if (session.kind === 'signed-in') redirect(homeForRole(session.user.role))
  return (
    <SessionBoundary>
      <LoginRoute>
        <LoginPage />
      </LoginRoute>
    </SessionBoundary>
  )
}
