import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/index.css'
import { Providers } from '@/app/providers'

export const metadata: Metadata = {
  title: 'ELZE | Enterprise Analytics Platform',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden antialiased">
        <div id="root" className="h-full w-full overflow-hidden">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
