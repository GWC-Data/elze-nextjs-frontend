'use client'

import type { ReactNode } from 'react'
import { WorkspaceShell } from '@/layouts/AppShell'

export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
