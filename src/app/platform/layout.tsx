import type { ReactNode } from 'react'
import { ShellGate } from '@/server/ShellGate'

export default function Layout({ children }: { children: ReactNode }) {
  return <ShellGate shell="platform">{children}</ShellGate>
}
