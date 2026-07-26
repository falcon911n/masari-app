import './globals.css';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'مساري | Masari - طريقك إلى +A',
  description: 'منصة تعليمية متكاملة تقدم شروحات ومقررات وملخصات أكاديمية للتفوق.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}