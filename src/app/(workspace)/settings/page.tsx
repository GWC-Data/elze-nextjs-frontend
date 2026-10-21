'use client'

import { Navigate } from '@/lib/router'

export default function Page() {
  return <Navigate to="/settings/profile" replace />
}
