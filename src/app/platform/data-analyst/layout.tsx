import type { ReactNode } from 'react'
import { ContextQueryProvider } from '@/context/QueryProvider'

export default function Layout({ children }: { children: ReactNode }) {
  return <ContextQueryProvider>{children}</ContextQueryProvider>
}
