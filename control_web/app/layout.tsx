import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Control Workspace — AI-powered Remote Access',
  description: 'Your AI-powered workspace for remote computer control. Access local systems and virtual machines with AI assistance.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
