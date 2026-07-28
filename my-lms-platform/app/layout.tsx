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

/* -------------------------------------------------------------------------- */
/*                                   الخط                                   */
/* -------------------------------------------------------------------------- */

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
  fallback: ['Tahoma', 'Segoe UI', 'system-ui', 'sans-serif'],
})

/* -------------------------------------------------------------------------- */
/*                                  الثوابت                                  */
/* -------------------------------------------------------------------------- */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://masari.sa'
const SITE_NAME = 'مسار'
const SITE_TITLE = `${SITE_NAME} | منصة تعليمية متكاملة`
const SITE_DESCRIPTION =
  'مسار منصة تعليمية عربية متكاملة تقدّم دورات ومسارات تعليمية عالية الجودة، تساعدك على تطوير مهاراتك وتحقيق أهدافك التعليمية والمهنية.'

/* -------------------------------------------------------------------------- */
/*                                  Metadata                                  */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'مسار',
    'Masari',
    'منصة تعليمية',
    'تعلم عن بعد',
    'دورات تدريبية',
    'تعليم إلكتروني',
    'كورسات اونلاين',
    'مسارات تعليمية',
    'e-learning',
    'online courses',
  ],
  authors: [{ name: 'فريق مسار', url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
    languages: { 'ar-SA': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
    site: '@masari',
    creator: '@masari',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
}

/* -------------------------------------------------------------------------- */
/*                                  Viewport                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                Root Layout                                 */
/* -------------------------------------------------------------------------- */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} scroll-smooth`}
    >
      <body
        className={`${cairo.className} min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-300 ease-in-out overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            
            <ScrollProgress />

            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:end-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
            >
              تخطي إلى المحتوى الرئيسي
            </a>

            <Navbar />

            <main id="main-content" className="flex-1 w-full flex flex-col">
              {children}
            </main>

            <Footer />

            <ScrollToTop />

            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={10}
              toastOptions={{
                duration: 4000,
                className: [
                  'rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
                  'bg-white text-zinc-900 border-zinc-200',
                  'dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800',
                ].join(' '),
                success: {
                  iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                },
              }}
            />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}