/**
 * ============================================================================
 * Masari — Root Layout (app/layout.tsx)
 * ============================================================================
 */

import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ModalProvider } from '@/components/providers/ModalProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { ScrollProgress } from '@/components/ui/ScrollProgress'

import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
  fallback: ['Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://masari.sa'
const SITE_NAME = 'مسار'
const SITE_TITLE = `${SITE_NAME} | منصة تعليمية متكاملة`
const SITE_DESCRIPTION = 'مسار منصة تعليمية عربية متكاملة تقدّم دورات ومسارات تعليمية عالية الجودة.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${cairo.variable} scroll-smooth`}>
      <body className={`${cairo.className} min-h-screen flex flex-col bg-background text-foreground antialiased transition-colors duration-300 ease-in-out overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ModalProvider>
            
            <ScrollProgress />
            <Navbar />

            <main id="main-content" className="flex-1 w-full flex flex-col">
              {children}
            </main>

            <Footer />
            <ScrollToTop />

            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: 'rounded-xl border px-4 py-3 text-sm font-bold shadow-lg bg-surface text-foreground border-border',
                success: { iconTheme: { primary: '#22c55e', secondary: '#ffffff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
              }}
            />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}