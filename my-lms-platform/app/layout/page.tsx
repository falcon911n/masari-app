import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://masari.sa'),

  title: {
    default: 'Masari | مساري',
    template: '%s | Masari',
  },

  description:
    'منصة مساري التعليمية للمقررات الجامعية، الكتب، الملخصات، الاختبارات والدورات الأكاديمية.',

  keywords: [
    'Masari',
    'مساري',
    'منصة تعليمية',
    'دورات',
    'جامعات',
    'ملخصات',
    'كتب',
    'اختبارات',
    'تعليم',
  ],

  authors: [
    {
      name: 'Masari Team',
    },
  ],

  creator: 'Masari',

  publisher: 'Masari',

  applicationName: 'Masari',

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  openGraph: {
    title: 'Masari | مساري',
    description:
      'طريقك إلى +A مع أفضل المقررات الجامعية والدورات التعليمية.',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'Masari',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Masari',
    description:
      'منصة تعليمية متكاملة للمقررات والدورات الجامعية.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cairo.variable}
    >
      <body
        className="
          font-[var(--font-cairo)]
          bg-slate-950
          text-slate-100
          antialiased
          selection:bg-blue-600
          selection:text-white
          min-h-screen
          overflow-x-hidden
        "
      >
        {children}
      </body>
    </html>
  );
}