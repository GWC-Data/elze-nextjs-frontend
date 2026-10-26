import ForgotPasswordPage from '@/views/ForgotPasswordPage'
import { LoginRoute } from '@/router/guards'
import { SessionBoundary } from '@/server/SessionBoundary'

export default function Page() {
  return (
    <SessionBoundary>
      <LoginRoute>
        <ForgotPasswordPage />
      </LoginRoute>
    </SessionBoundary>
  )
}
