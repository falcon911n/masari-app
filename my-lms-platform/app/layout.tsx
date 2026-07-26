import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة مساري التعليمية | Masari',
  description: 'شروحات وافية للمحاضرات، بنوك أسئلة متكاملة، وملخصات مركزة للمقررات الأكاديمية.',
};

export const viewport: Viewport = {
  themeColor: '#070C18',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}