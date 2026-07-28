'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  ChevronDown,
  GraduationCap,
  Sparkles
} from 'lucide-react'

import { useModal } from '@/components/providers/ModalProvider'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   ثوابت                                   */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/courses', label: 'المقررات' },
  { href: '/paths', label: 'المسارات' },
  { href: '/about', label: 'من نحن' },
  { href: '/contact', label: 'تواصل معنا' },
] as const

type NotificationItem = {
  id: string
  title: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'تم قبول طلبك في دورة "أساسيات البرمجة"', time: 'منذ ساعتين', read: false },
  { id: '2', title: 'تذكير: موعد اختبار الوحدة الثالثة غداً', time: 'منذ يوم', read: false },
]

const ICON_BUTTON_CLASS =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/* -------------------------------------------------------------------------- */
/*                                   أدوات                                   */
/* -------------------------------------------------------------------------- */

function isActiveLink(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  React.useEffect(() => {
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

/* -------------------------------------------------------------------------- */
/*                               زر تبديل الوضع                               */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="تبديل الوضع الليلي والنهاري"
      className={ICON_BUTTON_CLASS}
    >
      {mounted ? (
        resolvedTheme === 'dark' ? (
          <Sun className="h-5 w-5 hover:rotate-90 transition-transform duration-500" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5 hover:-rotate-12 transition-transform duration-500" aria-hidden="true" />
        )
      ) : (
        <span className="block h-5 w-5" />
      )}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                             محتوى نافذة البحث                             */
/* -------------------------------------------------------------------------- */

function SearchModalContent() {
  const [query, setQuery] = React.useState('')
  return (
    <div className="p-6 space-y-4">
      <h2 id="search-modal-title" className="text-lg font-bold flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" /> ابحث في مساري
      </h2>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/20 bg-background px-4 py-3 focus-within:border-primary transition-colors">
        <Search className="h-5 w-5 shrink-0 text-primary/50" aria-hidden="true" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث عن دورة، مسار، أو مقال..."
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground pt-4">
        {query ? `جاري البحث عن "${query}"...` : 'ابدأ الكتابة لعرض النتائج الفورية'}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 الإشعارات                                 */
/* -------------------------------------------------------------------------- */

function NotificationsMenu() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={ICON_BUTTON_CLASS}
      >
        <Bell className="h-5 w-5 hover:animate-pulse" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute end-1.5 top-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 border border-background" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute end-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex justify-between items-center">
              <p className="text-sm font-bold flex items-center gap-2">الإشعارات <Bell className="w-4 h-4 text-primary"/></p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} جديد</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className={cn('flex flex-col gap-1 rounded-xl px-4 py-3 text-sm hover:bg-muted/60 transition-colors', !n.read && 'bg-primary/5')}>
                  <span className="font-semibold">{n.title}</span>
                  <span className="text-[11px] text-muted-foreground">{n.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                قائمة المستخدم                               */
/* -------------------------------------------------------------------------- */

function UserMenu() {
  const isAuthenticated = false // اجعلها تعتمد على الـ context الخاص بك
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))

  if (!isAuthenticated) {
    return (
      <div className="hidden items-center gap-3 sm:flex ml-2">
        <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
          دخول
        </Link>
        <Link href="/register" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
          <User className="w-4 h-4"/> حساب جديد
        </Link>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-muted border border-transparent hover:border-border">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">م</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute end-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-2 space-y-1"
          >
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <User className="h-4 w-4" /> الملف الشخصي
            </Link>
            <div className="h-px bg-border my-1" />
            <button onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-start text-sm text-red-500 hover:bg-red-500/10 transition-colors font-medium">
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Navbar                                  */
/* -------------------------------------------------------------------------- */

export function Navbar() {
  const pathname = usePathname()
  const { openModal } = useModal()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-500',
          isScrolled
            ? 'border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent py-2'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          <Link href="/" className="flex shrink-0 items-center gap-3 text-lg font-black group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/70">مساري</span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-2 bg-muted/30 px-2 py-1.5 rounded-2xl border border-border/50">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300',
                    active ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => openModal(<SearchModalContent />, { size: 'lg' })} className={cn(ICON_BUTTON_CLASS, 'hidden sm:inline-flex')}>
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <NotificationsMenu />
            <UserMenu />

            <button onClick={() => setMobileOpen(true)} className={cn(ICON_BUTTON_CLASS, 'md:hidden bg-muted/50')}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Slide in from Right) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-[280px] bg-background border-l border-border shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <span className="font-black text-xl text-primary flex items-center gap-2">
                  <GraduationCap className="h-6 w-6"/> مساري
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {NAV_LINKS.map((link) => {
                  const active = isActiveLink(pathname, link.href)
                  return (
                    <Link
                      key={link.href} href={link.href}
                      className={cn('block rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>

              <div className="p-6 border-t border-border/50 space-y-3 bg-muted/10">
                <Link href="/login" className="flex w-full justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-muted">
                  تسجيل الدخول
                </Link>
                <Link href="/register" className="flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  إنشاء حساب جديد
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar