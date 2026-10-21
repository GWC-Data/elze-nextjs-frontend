'use client'

import { Suspense } from 'react'
import ActivatePage from '@/views/ActivatePage'

export default function Page() {
  return (
    <Suspense>
      <ActivatePage />
    </Suspense>
  )
}
