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
  title: 'Control — AI that drives your desktop',
  description:
    'Describe what you need. Control sees your screen and operates your apps like you would—locally on the desktop, or in the cloud on managed machines.',
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

