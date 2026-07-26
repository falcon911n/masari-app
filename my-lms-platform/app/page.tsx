'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import {
  GraduationCap, Search, BookOpen, PlayCircle, FileText, Lock,
  Sparkles, Heart, ShieldAlert, UserCheck,
  LogIn, LogOut, ShoppingBag, Trash2, Star, ChevronRight, ChevronDown,
  Flame, X, Bell, Sun, Moon, Award,
  Users, Video, ClipboardList, Quote, Share2,
  MapPin, Phone, Mail, Send, Copy, User, Palette
} from 'lucide-react';

const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '600', '700', '800', '900'] });

interface Course {
  id: string;
  title: string;
  code?: string;
  price?: number;
  original_price?: number;
  description?: string;
  instructor?: string;
  is_published?: boolean;
  section_type?: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url?: string;
  pdf_url?: string;
  is_preview?: boolean;
  is_published?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-600'}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'bestseller' | 'courses' | 'summaries' | 'books' | 'quizzes'>('bestseller');

  const [cart, setCart] = useState<Course[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [darkMode, setDarkMode] = useState(true);
  const [themeColor, setThemeColor] = useState<'blue' | 'red' | 'purple' | 'green' | 'black'>('blue');
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ type: 'percent' | 'fixed'; value: number } | null>(null);

  const [user, setUser] = useState<any>(null);
  const [subscribedCourses, setSubscribedCourses] = useState<string[]>([]);
  const [showAiBot, setShowAiBot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<{ role: string; text: string }[]>([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [realTestimonials, setRealTestimonials] = useState<Testimonial[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [platformStats, setPlatformStats] = useState({ coursesCount: 0, lessonsCount: 0, studentsCount: 0, instructorsCount: 0 });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    safeInit();
  }, []);

  async function safeInit() {
    try {
      setLoadingCourses(true);
      await Promise.all([
        fetchCourses(),
        fetchNotifications(),
        checkUserAndRedirect(),
        fetchRealTestimonials(),
        fetchPlatformStats()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function checkUserAndRedirect() {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchSubscriptions(data.user.id);
      } else {
        const isGuest = sessionStorage.getItem('masari_guest_mode');
        if (!isGuest) {
          sessionStorage.setItem('masari_guest_mode', 'true');
          router.push('/login');
        }
      }
    } catch (e) {}
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSubscribedCourses([]);
    showToast('تم تسجيل الخروج بنجاح 👋');
    router.push('/login');
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCourse]);

  async function fetchSubscriptions(userId: string) {
    try {
      const { data } = await supabase.from('subscriptions').select('course_id').eq('user_id', userId);
      if (data) setSubscribedCourses(data.map((s) => s.course_id));
    } catch (e) {}
  }

  async function fetchCourses() {
    try {
      const { data } = await supabase.from('courses').select('*');
      if (data) setCourses(data.filter((c) => c.is_published !== false));
    } catch (e) {
      setCourses([]);
    }
  }

  async function fetchNotifications() {
    try {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (data) setNotifications(data);
    } catch (e) {}
  }

  async function fetchLessons(courseId: string) {
    try {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index', { ascending: true });
      if (data && data.length > 0) {
        setLessons(data);
        setSelectedLesson(data[0]);
      } else {
        setLessons([]);
        setSelectedLesson(null);
      }
    } catch (e) {
      setLessons([]);
    }
  }

  async function fetchRealTestimonials() {
    try {
      const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(6);
      if (data && data.length > 0) {
        setRealTestimonials(data.map((c: any) => ({ id: c.id, name: c.user_name || 'طالب مساري', text: c.content, rating: 5 })));
      }
    } catch {}
  }

  async function fetchPlatformStats() {
    try {
      const [coursesRes, lessonsRes, subsRes] = await Promise.all([
        supabase.from('courses').select('id, instructor', { count: 'exact' }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('user_id'),
      ]);

      const distinctInstructors = new Set((coursesRes.data || []).map((c: any) => c.instructor).filter(Boolean)).size;
      const distinctStudents = new Set((subsRes.data || []).map((s: any) => s.user_id).filter(Boolean)).size;

      setPlatformStats({
        coursesCount: coursesRes.count || (coursesRes.data || []).length || 0,
        lessonsCount: lessonsRes.count || 0,
        studentsCount: distinctStudents,
        instructorsCount: distinctInstructors,
      });
    } catch {}
  }

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      showToast('تم نسخ رابط المنصة بنجاح! 📋');
    }
  };

  const addToCart = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cart.some((c) => c.id === course.id)) {
      setCart([...cart, course]);
      showToast(`تمت إضافة (${course.title}) للسلة! 🛒`);
    } else {
      showToast('المقرر موجود بالفعل داخل السلة!');
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter((c) => c.id !== courseId));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
      if (data) {
        setDiscountApplied({ type: data.discount_type, value: Number(data.discount_value) });
        showToast(`تم تطبيق الكوبون (${data.code}) بنجاح! 🎉`);
      } else {
        if (couponCode.toUpperCase() === 'MASARI20' || couponCode.toUpperCase() === 'A+') {
          setDiscountApplied({ type: 'percent', value: 20 });
          showToast('تم تطبيق الخصم 20%! 🎉');
        } else {
          showToast('الكوبون غير صحيح أو منتهي');
        }
      }
    } catch (e) {}
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  let finalTotal = cartTotal;
  if (discountApplied) {
    if (discountApplied.type === 'percent') finalTotal = cartTotal - (cartTotal * (discountApplied.value / 100));
    else finalTotal = Math.max(0, cartTotal - discountApplied.value);
  }

  const handleCheckoutAndPay = async () => {
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً!');
      router.push('/login');
      return;
    }
    if (cart.length === 0) return;

    try {
      for (const course of cart) {
        await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
      }
      showToast('تمت عملية الاشتراك بنجاح! 🎉');
      fetchSubscriptions(user.id);
      setCart([]);
      setShowCartModal(false);
    } catch (e) {
      showToast('حدث خطأ أثناء الاشتراك');
    }
  };

  // تطوير Masari AI الحقيقي للبحث في المقررات والرد بذكاء
  const handleAiSend = async () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    const newHistory = [...aiResponses, { role: 'user', text: query }];
    setAiResponses(newHistory);
    setAiQuery('');

    let reply = 'أهلاً بك! أنا مساعد مساري الذكي. بحثت في المقررات ولم أجد مطابقة دقيقة، تواصل معنا عبر الواتساب للمساعدة.';
    const q = query.toLowerCase();

    const matched = courses.find(c => c.title.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)));
    if (matched) {
      reply = `وجدت لك مقرراً مطابقاً: (${matched.title}) - الرمز: ${matched.code || 'مقرر'} - السعر: ${matched.price ? matched.price + ' ر.س' : 'مجاني'}. يمكنك استعراضه من القائمة الرئيسية!`;
    } else if (q.includes('سعر') || q.includes('اشتراك')) {
      reply = 'أسعار المقررات موضحة أسفل كل مادة، ويمكنك استخدام كوبون الخصم داخل سلة المشتريات لتخفيض السعر!';
    } else if (q.includes('دعم') || q.includes('تواصل') || q.includes('واتس')) {
      reply = 'رقم دعم واتساب المباشر للمنصة هو: +966 55 011 8282 والبريد الإلكتروني falcon911n@gmail.com';
    }

    setAiResponses([...newHistory, { role: 'bot', text: reply }]);
  };

  const displayCourses = useMemo(() => {
    let list = courses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.title?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q));
    }
    if (activeTabSection === 'bestseller') return list.slice(0, 6);
    return list.filter((c) => c.section_type === activeTabSection || !c.section_type || c.section_type === 'courses');
  }, [courses, searchQuery, activeTabSection]);

  const isSubscribedToSelected = selectedCourse ? subscribedCourses.includes(selectedCourse.id) : false;
  const canAccessLesson = selectedLesson ? Boolean(selectedLesson.is_preview || isSubscribedToSelected) : false;

  const colorThemeClasses = useMemo(() => {
    switch (themeColor) {
      case 'red': return { primary: 'bg-red-600', text: 'text-red-500', badge: 'bg-red-500/10 text-red-500' };
      case 'purple': return { primary: 'bg-purple-600', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-500' };
      case 'green': return { primary: 'bg-emerald-600', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500' };
      case 'black': return { primary: 'bg-zinc-800', text: 'text-zinc-300', badge: 'bg-zinc-800 text-zinc-300' };
      default: return { primary: 'bg-[#2563EB]', text: 'text-[#2563EB]', badge: 'bg-[#2563EB]/10 text-[#2563EB]' };
    }
  }, [themeColor]);

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#111827]'}`}>

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-[#2563EB] text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-400">
            <Sparkles className="w-4 h-4 text-amber-300" /> {toastMsg}
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-4">
          <button onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }} className="flex items-center gap-3 focus:outline-none text-right group">
            <div className={`${colorThemeClasses.primary} p-2.5 rounded-2xl text-white shadow-lg group-hover:scale-105 transition-transform`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-black ${colorThemeClasses.text}`}>مساري</span>
              <span className="text-xs font-bold text-slate-400">| Masari</span>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            {/* اختيار الألوان الكونية */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/50 p-1.5 rounded-xl border border-slate-800">
              {(['blue', 'red', 'purple', 'green', 'black'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className={`w-4 h-4 rounded-full transition transform hover:scale-125 ${c === 'blue' ? 'bg-blue-600' : c === 'red' ? 'bg-red-600' : c === 'purple' ? 'bg-purple-600' : c === 'green' ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-600'}`}
                />
              ))}
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-amber-400">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* زر الإشعارات المفتوح والفعال */}
            <button onClick={() => setShowNotifModal(true)} className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white hover:border-blue-500 transition">
              <Bell className="w-5 h-5 text-slate-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            <button onClick={() => setShowCartModal(true)} className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white">
              <ShoppingBag className={`w-5 h-5 ${colorThemeClasses.text}`} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>

            <button onClick={() => setShowAiBot(!showAiBot)} className={`${colorThemeClasses.badge} border px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5`}>
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Masari AI</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className={`flex items-center gap-2 ${colorThemeClasses.badge} border px-3.5 py-2 rounded-xl text-xs font-bold`}>
                  <User className="w-4 h-4" /> <span className="truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="bg-red-500/10 text-red-400 border border-red-500/20 p-2 rounded-xl text-xs font-bold" title="تسجيل الخروج">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className={`${colorThemeClasses.primary} text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md`}>
                <LogIn className="w-4 h-4" /> تسجيل الدخول
              </Link>
            )}

            {user?.email === 'falcon911n@gmail.com' && (
              <Link href="/admin" className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> لوحة الأدمن
              </Link>
            )}
          </div>
        </div>
      </header>

      {!selectedCourse ? (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-16">
          <section className={`rounded-3xl p-8 md:p-12 text-center space-y-6 border transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB] shadow-xl'}`}>
            <h1 className={`text-3xl md:text-5xl font-black ${colorThemeClasses.text}`}>مساري | Masari</h1>
            <p className="text-sm md:text-base max-w-2xl mx-auto text-slate-400 leading-relaxed">
              شروحات وافية للمحاضرات، بنوك أسئلة متكاملة، وملخصات مركزة تمكنك من فهم المنهج وتجاوز الاختبارات بنجاح.
            </p>

            <div className="max-w-2xl mx-auto relative pt-2">
              <Search className="w-5 h-5 text-slate-500 absolute right-4 top-6" />
              <input
                type="text"
                placeholder="ابحث باسم المادة، رمز المقرر، أو اسم الدكتور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:outline-none transition ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              {[
                { id: 'bestseller', label: 'الأكثر مبيعاً', icon: Flame },
                { id: 'courses', label: 'الدورات', icon: PlayCircle },
                { id: 'summaries', label: 'الملخصات', icon: FileText },
                { id: 'books', label: 'الكتب', icon: BookOpen },
                { id: 'quizzes', label: 'الاختبارات', icon: ClipboardList },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setActiveTabSection(btn.id as any)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTabSection === btn.id ? `${colorThemeClasses.primary} text-white shadow-lg` : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {!loadingCourses && (
            <div className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Flame className={`w-5 h-5 ${colorThemeClasses.text}`} /> المحتوى المتاح ({displayCourses.length})
              </h2>
              {displayCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayCourses.map((course) => (
                    <div key={course.id} onClick={() => setSelectedCourse(course)} className={`border rounded-3xl p-6 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-2xl transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                      <div className="space-y-3">
                        <span className={`${colorThemeClasses.badge} text-[11px] font-bold px-2.5 py-1 rounded-lg`}>{course.code || 'مقرر'}</span>
                        <h3 className="text-lg font-bold">{course.title}</h3>
                      </div>
                      <div className="pt-4 border-t flex justify-between items-center border-slate-800">
                        <span className="text-base font-black text-[#22C55E]">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                        <span className={`${colorThemeClasses.badge} px-3 py-1.5 rounded-xl text-xs font-bold`}>استعراض</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-12">لا يوجد محتوى في هذا القسم.</p>
              )}
            </div>
          )}

          {realTestimonials.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" /> آراء الطلاب الحقيقية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {realTestimonials.map((t) => (
                  <div key={t.id} className={`rounded-3xl p-6 border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                    <Quote className="w-6 h-6 text-blue-500/30" />
                    <p className="text-sm text-slate-300 leading-relaxed">{t.text}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <p className="text-xs font-bold">{t.name}</p>
                      <StarRating rating={t.rating || 5} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className={`p-5 rounded-3xl border flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <button onClick={() => setSelectedCourse(null)} className="p-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white">رجوع</button>
            <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 aspect-video bg-black rounded-3xl flex items-center justify-center border border-slate-800 relative shadow-2xl">
              {canAccessLesson ? (
                selectedLesson?.video_url ? <iframe src={selectedLesson.video_url} className="w-full h-full" allowFullScreen /> : <p className="text-xs text-slate-500">لا يوجد فيديو لهذه المحاضرة</p>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="text-lg font-bold text-white">هذا الدرس مغلق ومحمي</h3>
                  <button onClick={() => addToCart(selectedCourse)} className={`${colorThemeClasses.primary} text-white text-xs font-bold px-5 py-2.5 rounded-xl`}>
                    اشترك بالمقرر لفتح المحتوى
                  </button>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-3xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <h3 className="font-bold text-sm">الدروس ({lessons.length})</h3>
              {lessons.map((l) => (
                <button key={l.id} onClick={() => setSelectedLesson(l)} className={`w-full text-right p-3 rounded-xl text-xs flex justify-between items-center ${selectedLesson?.id === l.id ? `${colorThemeClasses.badge} font-bold` : 'hover:bg-slate-800 text-slate-300'}`}>
                  <span>{l.title} {l.is_preview && <span className="text-[10px] text-emerald-400 font-bold mr-1">(معاينة مجانية)</span>}</span>
                  {!isSubscribedToSelected && !l.is_preview && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* مودال الإشعارات الحقيقية */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> إشعارات المنصة</h3>
              <button onClick={() => setShowNotifModal(false)}>✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <p className="font-bold text-blue-400">{n.title}</p>
                    <p className="text-slate-300">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد إشعارات حالياً.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Masari AI الحقيقي */}
      {showAiBot && (
        <div className="fixed bottom-4 left-4 z-50 w-[92vw] max-w-sm">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[28rem] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className={`${colorThemeClasses.primary} text-white p-4 flex justify-between items-center`}>
              <span className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Masari AI</span>
              <button onClick={() => setShowAiBot(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {aiResponses.length === 0 && <p className="text-slate-400 text-center py-6">أهلاً بك! اسألني عن أي مقرر (مثل 101) وسأبحث لك عنه فوراً 👋</p>}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-xl max-w-[85%] ${r.role === 'user' ? `${colorThemeClasses.primary} text-white mr-auto` : 'ml-auto bg-slate-800 text-white'}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSend()} placeholder="اسأل عن مقرر، سعر، أو رمز..." className="flex-1 border border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-950 text-white" />
              <button onClick={handleAiSend} className={`${colorThemeClasses.primary} text-white p-2 rounded-xl`}><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}