import type { ReactNode } from 'react'
import { PlaybookStoreProvider } from '@/components/common/playbooks/PlaybookStore'

export default function Layout({ children }: { children: ReactNode }) {
  return <PlaybookStoreProvider>{children}</PlaybookStoreProvider>
}
