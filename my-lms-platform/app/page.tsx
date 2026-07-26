'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Search, BookOpen, PlayCircle, FileText, Lock,
  Sparkles, Heart, ShieldAlert, LogIn, LogOut, ShoppingBag,
  Trash2, Star, ChevronRight, Flame, X, Bell, Sun, Moon,
  Quote, Send, User, ClipboardList, Video, Users, Award
} from 'lucide-react';

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
  category?: string;
  image_url?: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  summary_url?: string;
  assignment_url?: string;
  is_preview?: boolean;
  is_published?: boolean;
  order_index?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target_type?: string;
  target_id?: string;
  created_at?: string;
}

interface Testimonial {
  id: string;
  name: string;
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

export default function MasariMasterApp() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(true);
  const [themeColor, setThemeColor] = useState<'blue' | 'red' | 'purple' | 'green' | 'black'>('blue');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [subscribedCourses, setSubscribedCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalLessonsCount, setTotalLessonsCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'bestseller' | 'courses' | 'summaries' | 'books' | 'quizzes'>('bestseller');
  const [activeSubFilter, setActiveSubFilter] = useState('الكل');

  const [cart, setCart] = useState<Course[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ id?: string; code?: string; type: 'percent' | 'fixed'; value: number } | null>(null);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [showAiBot, setShowAiBot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<{ role: string; text: string }[]>([]);

  const [realTestimonials, setRealTestimonials] = useState<Testimonial[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    initializeMasterApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profileData) setProfile(profileData);
        fetchUserSubscriptions(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setSubscribedCourses([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeMasterApp() {
    try {
      setLoadingAuth(true);
      setLoadingCourses(true);
      await Promise.all([
        checkActiveSession(),
        fetchMasterCourses(),
        fetchMasterNotifications(),
        fetchMasterTestimonials(),
        fetchPlatformSettings(),
        fetchStatsCounts()
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuth(false);
      setLoadingCourses(false);
    }
  }

  async function checkActiveSession() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
        if (profileData) setProfile(profileData);
        fetchUserSubscriptions(authData.user.id);
      }
    } catch (e) {}
  }

  async function fetchUserSubscriptions(userId: string) {
    try {
      const { data } = await supabase.from('subscriptions').select('course_id').eq('user_id', userId);
      if (data) setSubscribedCourses(data.map((s) => s.course_id));
    } catch (e) {}
  }

  async function fetchMasterCourses() {
    try {
      const { data } = await supabase.from('courses').select('*');
      if (data) setCourses(data.filter((c) => c.is_published !== false));
    } catch (e) {
      setCourses([]);
    }
  }

  async function fetchStatsCounts() {
    try {
      const { count: studentsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (studentsCount !== null) setTotalStudentsCount(studentsCount);

      const { count: lessonsCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
      if (lessonsCount !== null) setTotalLessonsCount(lessonsCount);
    } catch (e) {}
  }

  async function fetchMasterNotifications() {
    try {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (data) setNotifications(data);
    } catch (e) {}
  }

  async function fetchMasterTestimonials() {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(6);
      if (data && data.length > 0) {
        setRealTestimonials(data.map((c: any) => ({ id: c.id, name: c.user_name || 'طالب مساري', text: c.content, rating: c.rating || 5 })));
      }
    } catch {}
  }

  async function fetchPlatformSettings() {
    try {
      const { data } = await supabase.from('platform_settings').select('*');
      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach((s: any) => { map[s.key] = s.value === 'true'; });
        setPlatformSettings(map);
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseLessons(selectedCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCourse]);

  async function fetchCourseLessons(courseId: string) {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscribedCourses([]);
    showToast('تم تسجيل الخروج بنجاح 👋');
    router.push('/login');
  };

  const addToCart = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (subscribedCourses.includes(course.id)) {
      showToast('أنت مشترك بالفعل في هذا المقرر!');
      return;
    }
    if (!cart.some((c) => c.id === course.id)) {
      setCart([...cart, course]);
      showToast(`تمت إضافة (${course.title}) للسلة بنجاح! 🛒`);
    } else {
      showToast('المقرر موجود مسبقاً في سلة المشتريات!');
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter((c) => c.id !== courseId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  let finalCartTotal = cartTotal;
  if (discountApplied) {
    if (discountApplied.type === 'percent') finalCartTotal = cartTotal - (cartTotal * (discountApplied.value / 100));
    else finalCartTotal = Math.max(0, cartTotal - discountApplied.value);
  }

  const applyMasterCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!data) {
        showToast('رمز الكوبون غير صحيح أو غير مُفعّل');
        return;
      }

      setDiscountApplied({ id: data.id, code: data.code, type: data.discount_type, value: Number(data.discount_value) });
      showToast(`تم تطبيق الكوبون (${data.code}) بنجاح! 🎉`);
    } catch (e) {
      showToast('حدث خطأ أثناء التحقق من الكوبون');
    }
  };

  const handleCompleteCheckout = async () => {
    if (!user) {
      showToast('يرجى تسجيل الدخول لتفعيل الاشتراك!');
      router.push('/login');
      return;
    }
    if (cart.length === 0) return;
    if (platformSettings.purchase_enabled === false) {
      showToast('عملية الشراء متوقفة مؤقتاً من قبل إدارة المنصة');
      return;
    }

    try {
      const newItems = cart.filter((c) => !subscribedCourses.includes(c.id));
      for (const course of newItems) {
        await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
      }

      showToast('تمت عملية الدفع وتفعيل الاشتراكات بنجاح! 🎉');
      fetchUserSubscriptions(user.id);
      setCart([]);
      setShowCartModal(false);
      setDiscountApplied(null);
      setCouponCode('');
    } catch (e) {
      showToast('حدث خطأ أثناء معالجة الدفع');
    }
  };

  const handleAiMasterSend = async () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    const updatedHistory = [...aiResponses, { role: 'user', text: query }];
    setAiResponses(updatedHistory);
    setAiQuery('');

    let reply = 'أهلاً بك! أنا مساعد مساري الذكي. بحثت في أرشيف المقررات ولم أجد مطابقة دقيقة.';
    const q = query.toLowerCase();

    const matchedCourse = courses.find(c => c.title.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)));
    if (matchedCourse) {
      reply = `وجدت لك المقرر المطلوب: (${matchedCourse.title}) - السعر: ${matchedCourse.price ? matchedCourse.price + ' ر.س' : 'مجاني'}.`;
    }

    setAiResponses([...updatedHistory, { role: 'bot', text: reply }]);
  };

  const displayCourses = useMemo(() => {
    let list = courses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.title?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q));
    }
    if (activeSubFilter !== 'الكل') {
      list = list.filter((c) => (c.category || '').toLowerCase().includes(activeSubFilter.replace('مواد ', '').toLowerCase()) || c.title.toLowerCase().includes(activeSubFilter.replace('مواد ', '').toLowerCase()));
    }
    if (activeTabSection === 'bestseller') return list.slice(0, 6);
    return list.filter((c) => (c.section_type || 'courses') === activeTabSection);
  }, [courses, searchQuery, activeTabSection, activeSubFilter]);

  const relevantNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (!n.target_type || n.target_type === 'all') return true;
      if (n.target_type === 'course') return !!n.target_id && subscribedCourses.includes(n.target_id);
      if (n.target_type === 'student') return !!user && n.target_id === user.id;
      return true;
    });
  }, [notifications, subscribedCourses, user]);

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
    <div dir="rtl" className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#111827]'}`}>

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-[#2563EB] text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-blue-400">
            <Sparkles className="w-4 h-4 text-amber-300" /> {toastMsg}
          </div>
        </div>
      )}

      {/* الهيدر العلوي */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-4">

          <button onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }} className="flex items-center gap-3 focus:outline-none text-right group">
            <div className={`${colorThemeClasses.primary} p-2.5 rounded-2xl text-white shadow-lg group-hover:scale-105 transition-transform`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">طريقتك إلى A+</span>
              <span className={`text-lg font-black ${colorThemeClasses.text}`}>مساري | Masari</span>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-amber-400 hover:scale-105 transition">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {platformSettings.notifications_enabled !== false && (
              <button onClick={() => setShowNotifModal(true)} className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white hover:border-blue-500 transition">
                <Bell className="w-5 h-5 text-slate-400" />
                {relevantNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {relevantNotifications.length}
                  </span>
                )}
              </button>
            )}

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
                <Link href="/profile" className={`flex items-center gap-2 ${colorThemeClasses.badge} border px-3.5 py-2 rounded-xl text-xs font-bold hover:opacity-85 transition`}>
                  <User className="w-4 h-4" /> <span className="truncate max-w-[100px]">{profile?.full_name || user.email?.split('@')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="bg-red-500/10 text-red-400 border border-red-500/20 p-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition" title="تسجيل الخروج">
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
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-12">

          {/* الهيرو الرئيسي المطابق تماماً للصورة الأصلية */}
          <section className={`rounded-3xl p-8 md:p-12 text-center space-y-6 border transition relative overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#E5E7EB] shadow-xl'}`}>
            
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> طريقتك إلى A+ في جميع المقررات الأكاديمية
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              منصة <span className="text-[#2563EB]">مساري | Masari</span> التعليمية
            </h1>
            <p className="text-xs md:text-sm max-w-2xl mx-auto text-slate-400 leading-relaxed">
              شروحات وافية للمحاضرات، بنوك أسئلة متكاملة، وملخصات مركزة تمكنك من فهم المنهج وتجاوز الاختبارات بنجاح.
            </p>

            {/* شريط البحث */}
            <div className="max-w-2xl mx-auto relative pt-2">
              <Search className="w-5 h-5 text-slate-500 absolute right-4 top-6" />
              <input
                type="text"
                placeholder="ابحث باسم المادة أو رمز المقرر (مثال: ريض 101, فيز 103)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-2xl pr-12 pl-4 py-3.5 text-xs focus:outline-none transition ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              />
            </div>

            {/* التصنيفات الرئيسية */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
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
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      activeTabSection === btn.id ? `${colorThemeClasses.primary} text-white shadow-lg` : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* الفلاتر الفرعية */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {['الكل', 'مواد رياض', 'مواد فيز', 'مواد تقن', 'أمن معلومات / سايبر'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubFilter(sub)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                    activeSubFilter === sub ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </section>

          {/* البطاقات الإحصائية الأربعة تماماً مثل الصورة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-6 rounded-3xl border text-center space-y-2 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <BookOpen className="w-6 h-6 text-blue-500 mx-auto" />
              <p className="text-2xl font-black text-white">{courses.length}+</p>
              <span className="text-xs text-slate-400 font-bold">مقرر تعليمي</span>
            </div>
            <div className={`p-6 rounded-3xl border text-center space-y-2 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <Video className="w-6 h-6 text-purple-500 mx-auto" />
              <p className="text-2xl font-black text-white">{totalLessonsCount}+</p>
              <span className="text-xs text-slate-400 font-bold">درس ومحاضرة</span>
            </div>
            <div className={`p-6 rounded-3xl border text-center space-y-2 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <Users className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-2xl font-black text-white">{totalStudentsCount}+</p>
              <span className="text-xs text-slate-400 font-bold">طالب مسجل</span>
            </div>
            <div className={`p-6 rounded-3xl border text-center space-y-2 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <Award className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-2xl font-black text-white">100%</p>
              <span className="text-xs text-slate-400 font-bold">دكتور ومدرس</span>
            </div>
          </div>

          {/* أحدث الدورات */}
          {!loadingCourses && (
            <div className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Flame className={`w-5 h-5 ${colorThemeClasses.text}`} /> أحدث الدورات ({displayCourses.length})
              </h2>
              {displayCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayCourses.map((course) => (
                    <div key={course.id} onClick={() => setSelectedCourse(course)} className={`border rounded-3xl p-6 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-2xl transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                      <div className="space-y-3">
                        <span className={`${colorThemeClasses.badge} text-[11px] font-bold px-2.5 py-1 rounded-lg`}>{course.code || 'مقرر'}</span>
                        <h3 className="text-lg font-bold">{course.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{course.description || 'محتوى أكاديمي معتمد ومطور خصيصاً للطلاب.'}</p>
                      </div>
                      <div className="pt-4 border-t flex justify-between items-center border-slate-800">
                        <span className="text-base font-black text-[#22C55E]">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => addToCart(course, e)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white" title="إضافة للسلة">
                            <ShoppingBag className="w-4 h-4 text-blue-400" />
                          </button>
                          <span className={`${colorThemeClasses.badge} px-3 py-1.5 rounded-xl text-xs font-bold`}>استعراض</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-12">لا توجد مقررات مطابقة للبحث حالياً.</p>
              )}
            </div>
          )}

          {realTestimonials.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" /> آراء الطلاب الحقيقية بالمنصة
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
            <button onClick={() => setSelectedCourse(null)} className="p-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white flex items-center gap-1.5">
              <ChevronRight className="w-4 h-4" /> رجوع للمقررات
            </button>
            <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 aspect-video bg-black rounded-3xl flex items-center justify-center border border-slate-800 relative shadow-2xl overflow-hidden">
              {canAccessLesson ? (
                selectedLesson?.video_url ? (
                  <iframe src={selectedLesson.video_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <FileText className="w-10 h-10 text-blue-400 mx-auto" />
                    <p className="text-xs text-slate-400">هذا الدرس يحتوي على ملفات PDF أو ملخصات مرفقة فقط.</p>
                    {selectedLesson?.pdf_url && (
                      <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                        تحميل ملف الدرس (PDF)
                      </a>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="text-lg font-bold text-white">هذا الدرس مغلق ومحمي</h3>
                  <p className="text-xs text-slate-400">يجب عليك الاشتراك في المقرر لتشغيل المحاضرات الكاملة.</p>
                  <button onClick={() => addToCart(selectedCourse)} className={`${colorThemeClasses.primary} text-white text-xs font-bold px-5 py-2.5 rounded-xl`}>
                    اشترك بالمقرر لفتح المحتوى
                  </button>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-3xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <h3 className="font-bold text-sm">محتويات المقرر والدروس ({lessons.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lessons.map((l) => (
                  <button key={l.id} onClick={() => setSelectedLesson(l)} className={`w-full text-right p-3 rounded-xl text-xs flex justify-between items-center transition ${selectedLesson?.id === l.id ? `${colorThemeClasses.badge} font-bold` : 'hover:bg-slate-800 text-slate-300'}`}>
                    <span>{l.title} {l.is_preview && <span className="text-[10px] text-emerald-400 font-bold mr-1">(معاينة مجانية)</span>}</span>
                    {!isSubscribedToSelected && !l.is_preview && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* نوافذ الإشعارات والسلة والذكاء الاصطناعي */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> إشعارات منصة مساري</h3>
              <button onClick={() => setShowNotifModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {relevantNotifications.length > 0 ? (
                relevantNotifications.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <p className="font-bold text-blue-400">{n.title}</p>
                    <p className="text-slate-300">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">لا توجد إشعارات جديدة حالياً.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-500" /> سلة المشتريات ({cart.length})</h3>
              <button onClick={() => setShowCartModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {cart.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-800 text-xs bg-slate-950">
                      <div>
                        <span className="font-bold block text-white">{item.title}</span>
                        <span className="text-emerald-400 font-bold">{item.price ? `${item.price} ر.س` : 'مجاني'}</span>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                {platformSettings.coupons_enabled !== false && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button onClick={applyMasterCoupon} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs">
                      تطبيق
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm font-bold">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-emerald-400 text-base">{finalCartTotal} ر.س</span>
                </div>

                {platformSettings.purchase_enabled === false ? (
                  <p className="text-center text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-3">
                    عملية الشراء متوقفة مؤقتاً من قبل إدارة المنصة
                  </p>
                ) : (
                  <button onClick={handleCompleteCheckout} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg transition">
                    إتمام الدفع وتفعيل الاشتراك فورا
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-center py-8 text-slate-500">سلة المشتريات فارغة حالياً.</p>
            )}
          </div>
        </div>
      )}

      {showAiBot && (
        <div className="fixed bottom-4 left-4 z-50 w-[92vw] max-w-sm">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[30rem] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className={`${colorThemeClasses.primary} text-white p-4 flex justify-between items-center`}>
              <span className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> مساعد Masari AI الذكي</span>
              <button onClick={() => setShowAiBot(false)} className="text-white hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {aiResponses.length === 0 && (
                <p className="text-slate-400 text-center py-8">أهلاً بك! اسألني عن أي مقرر (مثل رياضيات 101) وسأبحث لك عنه فوراً.</p>
              )}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${r.role === 'user' ? `${colorThemeClasses.primary} text-white mr-auto` : 'ml-auto bg-slate-800 text-slate-100 border border-slate-700'}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2 bg-slate-950">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiMasterSend()}
                placeholder="اسأل عن مقرر أو سعر أو خدمة..."
                className="flex-1 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs bg-slate-900 text-white focus:outline-none"
              />
              <button onClick={handleAiMasterSend} className={`${colorThemeClasses.primary} text-white px-4 py-2.5 rounded-xl transition`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}