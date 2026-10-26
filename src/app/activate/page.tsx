import { Suspense } from 'react'
import ActivatePage from '@/views/ActivatePage'
import { SessionBoundary } from '@/server/SessionBoundary'

export default function Page() {
  return (
    <SessionBoundary>
      <Suspense>
        <ActivatePage />
      </Suspense>
    </SessionBoundary>
  )
}
