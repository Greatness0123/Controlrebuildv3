import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Control Web - Remote Computer Use',
  description: 'Manage and control your computers from anywhere',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
