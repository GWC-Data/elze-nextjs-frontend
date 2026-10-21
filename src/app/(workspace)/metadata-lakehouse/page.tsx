'use client'

import { Navigate } from '@/lib/router'

export default function Page() {
  return <Navigate to="/metadata-lakehouse/drafts" replace />
}
