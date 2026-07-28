'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu, X, Search, Bell, User, LogOut,
  ChevronDown, GraduationCap, LayoutDashboard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useModal } from '@/components/providers/ModalProvider'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                   ثوابت                                   */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/#courses', label: 'المقررات' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/support', label: 'تواصل معنا' },
] as const

const ICON_BUTTON_CLASS =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary focus-visible:outline-none'

function isActiveLink(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
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
/*                                   Navbar                                  */
/* -------------------------------------------------------------------------- */

export function Navbar() {
  const pathname = usePathname()
  const { openModal } = useModal()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  
  // حالة تسجيل الدخول الحقيقية
  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<any>(null)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // التحقق من الجلسة الحالية
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
        setIsAdmin(data.user.email === 'falcon911n@gmail.com')
        supabase.from('profiles').select('full_name').eq('id', data.user.id).single().then(res => {
          if (res.data) setProfile(res.data)
        })
      }
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-500',
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

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button onClick={() => openModal(<SearchModalContent />, { size: 'lg' })} className={ICON_BUTTON_CLASS}>
              <Search className="h-5 w-5" />
            </button>

            {/* أيقونة القائمة الجانبية (Hamburger) */}
            <button onClick={() => setMobileOpen(true)} className={cn(ICON_BUTTON_CLASS, 'bg-muted/50')}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* القائمة الجانبية (Drawer) المرتبة */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[100] h-full w-[280px] bg-background border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <span className="font-black text-xl text-primary flex items-center gap-2">
                  <GraduationCap className="h-6 w-6"/> القائمة
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
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {profile?.full_name?.charAt(0) || 'م'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{profile?.full_name || 'طالب مساري'}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" className="flex w-full items-center gap-2 justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-500 hover:bg-amber-500 hover:text-white transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> لوحة الإدارة
                      </Link>
                    )}
                    <Link href="/profile" className="flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg">
                      الملف الشخصي
                    </Link>
                    <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                      <LogOut className="w-4 h-4" /> تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="flex w-full justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-muted">
                      تسجيل الدخول
                    </Link>
                    <Link href="/register" className="flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                      إنشاء حساب جديد
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar