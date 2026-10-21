'use client'

import LoginPage from '@/views/LoginPage'
import { LoginRoute } from '@/router/guards'

export default function Page() {
  return (
    <LoginRoute>
      <LoginPage />
    </LoginRoute>
  )
}
