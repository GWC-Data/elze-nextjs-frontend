import { Suspense } from 'react'
import ResetPasswordPage from '@/views/ResetPasswordPage'
import { SessionBoundary } from '@/server/SessionBoundary'

export default function Page() {
  return (
    <SessionBoundary>
      <Suspense>
        <ResetPasswordPage />
      </Suspense>
    </SessionBoundary>
  )
}
