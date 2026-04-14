import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CookieConsent } from '@/components/CookieConsent'
import type { Metadata } from 'next'
import { Syne, Manrope } from 'next/font/google'

const fontDisplay = Syne({
  subsets: ['latin'],
  variable: '--font-landing-display',
  display: 'swap',
})

const fontBody = Manrope({
  subsets: ['latin'],
  variable: '--font-landing-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Control — AI Computer Use That Drives Your Desktop',
  description:
    'Control is AI-powered computer use software that drives your desktop apps like you would—using voice commands, automation, and AI agents. Local execution or cloud machines. Try Control today.',
  keywords: [
    'AI computer use',
    'computer use',
    'desktop automation',
    'AI assistant',
    'voice control',
    'AI agent',
    'software automation',
    'computer use software',
    'AI desktop assistant',
    'automate desktop',
    'Windows automation',
    'Mac automation',
    'Linux automation',
    'voice assistant',
    'AI automation tool',
  ],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Control — AI Computer Use Software',
    description: 'AI computer use that drives your desktop apps using voice commands and automation.',
    type: 'website',
    siteName: 'Control',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontDisplay.variable} ${fontBody.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <CookieConsent />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

