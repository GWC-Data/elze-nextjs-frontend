'use client'

import type { ReactNode } from 'react'
import { PlatformShell } from '@/layouts/AppShell'

export default function Layout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
