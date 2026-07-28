'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, Mail, MessageCircle, ChevronLeft,
  PhoneCall, ShieldCheck, BookOpen
} from 'lucide-react'
import {
  FaXTwitter, FaInstagram, FaYoutube, FaTelegram
} from 'react-icons/fa6'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                               إعدادات التواصل                             */
/* -------------------------------------------------------------------------- */
const CONTACT_EMAIL = 'falcon702n@gmail.com'
const CONTACT_PHONE = '0550118282'

interface FooterLink {
  readonly href: string
  readonly label: string
}

const QUICK_LINKS: readonly FooterLink[] = [
  { href: '/', label: 'الرئيسية' },
  { href: '/#courses-section', label: 'المقررات' },
  { href: '/profile', label: 'الملف الشخصي' },
]

const SUPPORT_LINKS: readonly FooterLink[] = [
  { href: '/support', label: 'الدعم الفني' },
  { href: '/faq', label: 'الأسئلة الشائعة (FAQ)' },
]

const LEGAL_LINKS: readonly FooterLink[] = [
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'الشروط والأحكام' },
  { href: '/terms', label: 'سياسة الاسترجاع' }, // مربوطة بالشروط حالياً لمنع الخطأ
]

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/masari', label: 'Instagram', Icon: FaInstagram, color: 'hover:text-pink-500' },
  { href: 'https://x.com/masari', label: 'X', Icon: FaXTwitter, color: 'hover:text-gray-500' },
  { href: 'https://youtube.com/@masari', label: 'YouTube', Icon: FaYoutube, color: 'hover:text-red-500' },
  { href: 'https://t.me/masari', label: 'Telegram', Icon: FaTelegram, color: 'hover:text-blue-400' },
] as const

const CONTACT_LINKS = [
  // استبدال الصفر الأول بمفتاح السعودية 966 ليفتح الواتساب مباشرة
  { href: `https://wa.me/${CONTACT_PHONE.replace(/^0/, '966')}`, label: 'واتساب', Icon: MessageCircle },
  { href: 'https://t.me/masari_support', label: 'تيليجرام', Icon: FaTelegram },
  { href: `mailto:${CONTACT_EMAIL}`, label: 'البريد', Icon: Mail },
] as const

function FooterColumn({ title, links, icon: Icon }: { title: string; links: readonly FooterLink[]; icon?: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />} {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="group flex items-center gap-2 text-sm text-muted-foreground transition-all hover:text-primary hover:translate-x-1">
              <ChevronLeft className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const pathname = usePathname()

  // إخفاء الفوتر في صفحات تسجيل الدخول، إنشاء الحساب، ولوحة الأدمن
  if (pathname.includes('/login') || pathname.includes('/register') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer dir="rtl" className="relative mt-24 overflow-hidden border-t border-border bg-background/50 backdrop-blur-3xl">
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          <div className="space-y-6 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">Masari</h2>
                <p className="text-xs font-bold text-primary">منصة مساري التعليمية</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              الوجهة الأولى للتميز الأكاديمي. نقدم حلولاً تعليمية متكاملة تضمن لك التفوق في مسيرتك الجامعية.
            </p>
          </div>

          <FooterColumn title="روابط سريعة" links={QUICK_LINKS} icon={BookOpen} />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-primary" /> الدعم الفني
            </h3>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary transition">{l.label}</Link>
                </li>
              ))}
              <li className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  {CONTACT_LINKS.map((c, i) => (
                    <a key={i} href={c.href} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition" title={c.label}>
                      <c.Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <Link href={`mailto:${CONTACT_EMAIL}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white">
                  <Mail className="w-4 h-4" /> تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          <FooterColumn title="السياسات" links={LEGAL_LINKS} icon={ShieldCheck} />

        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/50 pt-8 lg:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">تابعنا:</span>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ href, label, Icon, color }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" title={label} className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-background", color)}>
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="text-center lg:text-left space-y-1">
            <p className="text-sm font-bold text-foreground">© 2026 منصة Masari التعليمية</p>
            <p className="text-xs text-muted-foreground">جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer