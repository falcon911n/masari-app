'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Cairo } from 'next/font/google';
import {
  GraduationCap, Search, BookOpen, PlayCircle, FileText, Lock,
  CheckCircle, Sparkles, Heart, ShieldAlert, UserCheck,
  LogIn, ShoppingBag, Trash2, Star, ChevronRight, ChevronDown,
  Flame, X, Bell, Percent, Sun, Moon, TrendingUp, Award, Gift,
  Wallet, Users, Video, ClipboardList, Quote, Globe, Share2,
  MessageCircle, Tv, MapPin, Phone, Mail, Send, Copy, ExternalLink,
  User, Palette
} from 'lucide-react';

// إعداد خط القاهرة الداعم للغة العربية
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '800', '900'],
});

interface Course {
  id: string;
  title: string;
  code?: string;
  price?: number;
  original_price?: number;
  discount_percent?: number;
  description?: string;
  university?: string;
  instructor?: string;
  is_published?: boolean;
  is_featured?: boolean;
  cover_image?: string;
  color?: string;
  rating?: number;
  reviews_count?: number;
  students_count?: number;
  sales_count?: number;
  lessons_count?: number;
  created_at?: string;
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
}

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating?: number;
  avatar_color?: string;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: 't1', name: 'سارة العتيبي', role: 'طالبة هندسة', text: 'منصة مساري ساعدتني أفهم مادة الرياضيات بطريقة مبسطة، ورفعت معدلي بشكل ملحوظ خلال فصل واحد.', rating: 5, avatar_color: '#2563EB' },
  { id: 't2', name: 'فهد القحطاني', role: 'طالب علوم حاسب', text: 'الملخصات دقيقة ومركزة، ووفرت علي وقت كبير قبل الاختبارات. تجربة احترافية فعلاً.', rating: 5, avatar_color: '#7C3AED' },
  { id: 't3', name: 'نورة الشمري', role: 'طالبة أمن معلومات', text: 'الشرح واضح والمدرسين متمكنين، وأسلوب المتابعة داخل المنصة سهل جداً.', rating: 4, avatar_color: '#22C55E' },
];

const FAQ_ITEMS = [
  { q: 'كيف أشترك في مقرر داخل المنصة؟', a: 'اختر المقرر الذي يناسبك، ثم اضغط على زر "إضافة للسلة"، وبعدها أكمل عملية الدفع من سلة المشتريات لتفعيل الاشتراك مباشرة.' },
  { q: 'هل يمكنني مشاهدة الفيديوهات أكثر من مرة؟', a: 'نعم، بعد تفعيل الاشتراك يصبح بإمكانك مشاهدة جميع محاضرات المقرر في أي وقت وبدون حد لعدد المشاهدات.' },
  { q: 'هل تتوفر خصومات وكوبونات؟', a: 'بالتأكيد، يمكنك إدخال رمز الكوبون داخل سلة المشتريات قبل إتمام الدفع للحصول على الخصم المتاح.' },
  { q: 'ماذا لو واجهت مشكلة تقنية؟', a: 'يمكنك التواصل معنا مباشرة عبر الواتساب أو البريد الإلكتروني المتاحين في أسفل الصفحة أو من خلال Masari AI.' },
];

function StarRating({ rating, size = 'w-3.5 h-3.5' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-slate-300 fill-slate-300'}`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('الكل');
  const [activeTabSection, setActiveTabSection] = useState('bestseller');
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
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [platformStats, setPlatformStats] = useState({
    coursesCount: 0,
    lessonsCount: 0,
    studentsCount: 0,
    instructorsCount: 0,
  });

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
        checkUser(),
        fetchTestimonials(),
        fetchPlatformStats()
      ]);
    } catch (e) {
      console.error('Initialization Safe Error:', e);
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCourse]);

  // فلترة المواد والبحث المطور
  useEffect(() => {
    let result = courses.filter((c) => c.is_published !== false);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    if (selectedSubject !== 'الكل') {
      const s = selectedSubject.toLowerCase();
      result = result.filter((c) => {
        const fullText = `${c.title} ${c.code}`.toLowerCase();
        if (s.includes('رياض')) return fullText.includes('ريض') || fullText.includes('رياض');
        if (s.includes('فيز')) return fullText.includes('فيز');
        if (s.includes('تقن')) return fullText.includes('تقن') || fullText.includes('عال');
        if (s.includes('سايبر')) return fullText.includes('أمن') || fullText.includes('سايبر');
        return true;
      });
    }

    setFilteredCourses(result);
  }, [searchQuery, selectedSubject, courses]);

  async function checkUser() {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchSubscriptions(data.user.id);
      }
    } catch (e) {}
  }

  async function fetchSubscriptions(userId: string) {
    try {
      const { data } = await supabase.from('subscriptions').select('course_id').eq('user_id', userId);
      if (data) setSubscribedCourses(data.map((s) => s.course_id));
    } catch (e) {}
  }

  async function fetchCourses() {
    try {
      const { data } = await supabase.from('courses').select('*');
      if (data) {
        setCourses(data);
        setFilteredCourses(data.filter((c) => c.is_published !== false));
      }
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
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

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

  async function fetchTestimonials() {
    try {
      const { data } = await supabase.from('testimonials').select('*').limit(6);
      if (data && data.length > 0) setTestimonials(data);
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

  const copyShareLink = (courseTitle?: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast(courseTitle ? `تم نسخ رابط مقرر (${courseTitle})!` : 'تم نسخ رابط منصة مساري بنجاح! 📋');
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
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setDiscountApplied({ type: data.discount_type, value: Number(data.discount_value) });
        showToast(`تم تطبيق الكوبون (${data.code}) بنجاح! 🎉`);
      } else {
        if (couponCode.toUpperCase() === 'MASARI20' || couponCode.toUpperCase() === 'A+') {
          setDiscountApplied({ type: 'percent', value: 20 });
          showToast('تم تطبيق الخصم التجريبي 20%! 🎉');
        } else {
          showToast('الكوبون غير صحيح أو منتهي الصلاحية');
        }
      }
    } catch (e) {
      showToast('خطأ في التحقق من الكوبون');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  let finalTotal = cartTotal;

  if (discountApplied) {
    if (discountApplied.type === 'percent') {
      finalTotal = cartTotal - (cartTotal * (discountApplied.value / 100));
    } else {
      finalTotal = Math.max(0, cartTotal - discountApplied.value);
    }
  }

  const handleCheckoutAndPay = async () => {
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لتتمكن من الشراء!');
      return;
    }
    if (cart.length === 0) return;

    try {
      for (const course of cart) {
        await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
      }
      showToast('تمت عملية الاشتراك بنجاح! 🎉 مبارك.');
      fetchSubscriptions(user.id);
      setCart([]);
      setShowCartModal(false);
    } catch (e) {
      showToast('حدث خطأ أثناء إتمام الاشتراك');
    }
  };

  const handleAiSend = () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    const newHistory = [...aiResponses, { role: 'user', text: query }];
    setAiResponses(newHistory);
    setAiQuery('');

    setTimeout(() => {
      let reply = 'أهلاً بك! أنا مساعد مساري الذكي. كيف يمكنني مساعدتك اليوم في مقرراتك؟';
      const q = query.toLowerCase();

      if (q.includes('سعر') || q.includes('اشتراك') || q.includes('خصم')) {
        reply = 'أسعار المقررات موضحة على كل مادة، ويمكنك استخدام كوبون (MASARI20) للحصول على خصم 20% فوراً!';
      } else if (q.includes('ريض') || q.includes('رياضيات')) {
        reply = 'لدينا شروحات ممتازة لمواد الرياضيات تشمل الفيديوهات وسلايدات الـ PDF والواجبات المحلولة.';
      } else if (q.includes('تواصل') || q.includes('دعم') || q.includes('مساعدة')) {
        reply = 'يمكنك التواصل مباشرة مع فريق الدعم عبر الواتساب على الرقم +966500000000 أو عبر البريد support@masari.sa';
      }

      setAiResponses([...newHistory, { role: 'bot', text: reply }]);
    }, 500);
  };

  const isSubscribedToSelected = selectedCourse ? subscribedCourses.includes(selectedCourse.id) : false;
  const canAccessLesson = selectedLesson ? Boolean(selectedLesson.is_preview || isSubscribedToSelected) : false;

  const bestSellers = useMemo(() => filteredCourses.slice(0, 6), [filteredCourses]);
  const freeCourses = useMemo(() => filteredCourses.filter((c) => !c.price || c.price === 0), [filteredCourses]);
  const paidCourses = useMemo(() => filteredCourses.filter((c) => (c.price || 0) > 0), [filteredCourses]);

  // أنماط الألوان المخصصة للمستخدم
  const colorThemeClasses = useMemo(() => {
    switch (themeColor) {
      case 'red': return { primary: 'bg-red-600', text: 'text-red-500', border: 'border-red-600/30', badge: 'bg-red-500/10 text-red-500' };
      case 'purple': return { primary: 'bg-purple-600', text: 'text-purple-500', border: 'border-purple-600/30', badge: 'bg-purple-500/10 text-purple-500' };
      case 'green': return { primary: 'bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-600/30', badge: 'bg-emerald-500/10 text-emerald-500' };
      case 'black': return { primary: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700', badge: 'bg-zinc-800 text-zinc-300' };
      default: return { primary: 'bg-[#2563EB]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/30', badge: 'bg-[#2563EB]/10 text-[#2563EB]' };
    }
  }, [themeColor]);

  const cardBase = `group relative border rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-[#E5E7EB] hover:border-blue-400'}`;

  function CourseCard({ course }: { course: Course }) {
    return (
      <div key={course.id} onClick={() => setSelectedCourse(course)} className={cardBase}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`${colorThemeClasses.badge} text-[11px] font-bold px-2.5 py-1 rounded-lg`}>
              {course.code || 'مقرر'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); copyShareLink(course.title); }}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              title="مشاركة المقرر"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
            {course.title}
          </h3>

          {course.instructor && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              {course.instructor}
            </p>
          )}
        </div>

        <div className={`pt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
          <div className="flex flex-col">
            <span className="text-base font-black text-[#22C55E]">
              {course.price ? `${course.price} ر.س` : 'مجاني'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => addToCart(course, e)}
              className={`p-2 border rounded-xl transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-[#2563EB] hover:text-white' : 'bg-[#F8FAFC] text-[#2563EB] border-[#E5E7EB] hover:bg-[#2563EB] hover:text-white'}`}
              title="إضافة للسلة"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className={`${colorThemeClasses.badge} group-hover:bg-[#2563EB] group-hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1`}>
              استعراض
              <ChevronRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#111827]'}`}>

      {/* التنبيهات (Toast) */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-[#2563EB] text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-400">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* الهيدر */}
      <header className={`sticky top-0 z-50 border-b transition-colors backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-4">

          <button
            onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
            className="flex items-center gap-3 focus:outline-none text-right group"
          >
            <div className={`${colorThemeClasses.primary} p-2.5 rounded-2xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xl font-black ${colorThemeClasses.text}`}>مساري</span>
                <span className="text-xs font-bold text-slate-400">| Masari</span>
              </div>
              <p className={`text-[11px] font-extrabold ${colorThemeClasses.text}`}>طريقك إلى +A</p>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            {/* اختيار اللون */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/50 p-1.5 rounded-xl border border-slate-800">
              {(['blue', 'red', 'purple', 'green', 'black'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className={`w-4 h-4 rounded-full transition transform hover:scale-125 ${c === 'blue' ? 'bg-blue-600' : c === 'red' ? 'bg-red-600' : c === 'purple' ? 'bg-purple-600' : c === 'green' ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-600'}`}
                />
              ))}
            </div>

            <button
              onClick={() => copyShareLink()}
              className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
              title="نسخ رابط المنصة"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowCartModal(true)}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
            >
              <ShoppingBag className={`w-5 h-5 ${colorThemeClasses.text}`} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowAiBot(!showAiBot)}
              className={`${colorThemeClasses.badge} border ${colorThemeClasses.border} px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Masari AI</span>
            </button>

            {user ? (
              <Link href="/profile" className={`flex items-center gap-2 ${colorThemeClasses.badge} border ${colorThemeClasses.border} px-3.5 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition`}>
                <User className="w-4 h-4" />
                <span className="truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`${colorThemeClasses.primary} text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2`}
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
            )}

            {user?.email === 'falcon911n@gmail.com' && (
              <Link
                href="/admin"
                className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 hover:bg-amber-500/20"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة الأدمن</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {!selectedCourse ? (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-16">

          {/* الهيرو والأزرار المطورة */}
          <section className={`rounded-3xl p-8 md:p-12 text-center space-y-6 border transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB] shadow-xl'}`}>
            <div className={`inline-flex items-center gap-2 ${colorThemeClasses.badge} border ${colorThemeClasses.border} px-4 py-1.5 rounded-full text-xs font-bold`}>
              <Sparkles className="w-4 h-4" />
              <span>طريقك إلى +A في جميع المقررات الأكاديمية</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              منصة <span className={colorThemeClasses.text}>مساري | Masari</span> التعليمية
            </h1>

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
                className={`w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:outline-none transition shadow-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              />
            </div>

            {/* الأزرار المطورة المطلوبة */}
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
                    onClick={() => setActiveTabSection(btn.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                      activeTabSection === btn.id
                        ? `${colorThemeClasses.primary} text-white shadow-lg`
                        : darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* تصنيفات المواد الأصغر */}
            <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-slate-800/40">
              {['الكل', 'مواد رياض', 'مواد فيز', 'مواد تقن', 'أمن معلومات / سايبر'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                    selectedSubject === sub
                      ? `${colorThemeClasses.primary} text-white`
                      : 'bg-slate-800/40 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </section>

          {/* الإحصائيات */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'مقرر تعليمي', value: platformStats.coursesCount || courses.length, icon: <BookOpen className="w-5 h-5" /> },
              { label: 'درس ومحاضرة', value: platformStats.lessonsCount, icon: <Video className="w-5 h-5" /> },
              { label: 'طالب مسجل', value: platformStats.studentsCount, icon: <Users className="w-5 h-5" /> },
              { label: 'دكتور ومدرس', value: platformStats.instructorsCount, icon: <Award className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl p-5 border text-center space-y-2 transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                <div className={`w-10 h-10 rounded-xl ${colorThemeClasses.badge} flex items-center justify-center mx-auto`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-black">{stat.value}+</div>
                <div className="text-[11px] text-slate-400 font-bold">{stat.label}</div>
              </div>
            ))}
          </section>

          {/* المقررات */}
          {!loadingCourses && (
            <div className="space-y-12">
              {bestSellers.length > 0 && (
                <section className="space-y-5">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    المقررات المتاحة ({filteredCourses.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bestSellers.map((course) => <CourseCard key={course.id} course={course} />)}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* آراء الطلاب */}
          <section className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              آراء الطلاب
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className={`rounded-3xl p-6 border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                  <Quote className="w-6 h-6 text-blue-500/30" />
                  <p className="text-sm text-slate-300 leading-relaxed">{t.text}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <p className="text-xs font-bold">{t.name}</p>
                      {t.role && <p className="text-[10px] text-slate-400">{t.role}</p>}
                    </div>
                    {typeof t.rating === 'number' && <StarRating rating={t.rating} />}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* الأسئلة الشائعة */}
          <section className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              الأسئلة الشائعة
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-right font-bold text-sm"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <p className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 pt-2">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>
      ) : (

        /* مشغل الدرس والمقرر */
        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white flex items-center gap-1 shrink-0"
              >
                رجوع
              </button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {selectedCourse.title}
                  {selectedCourse.code && <span className={`${colorThemeClasses.badge} text-xs px-2 py-0.5 rounded-md font-bold`}>{selectedCourse.code}</span>}
                </h2>
              </div>
            </div>

            <button onClick={() => copyShareLink(selectedCourse.title)} className="bg-slate-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white">
              <Copy className="w-4 h-4" />
              نسخ رابط المادة
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {selectedLesson ? (
                <>
                  <div className="bg-black rounded-3xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center relative shadow-2xl">
                    {canAccessLesson ? (
                      selectedLesson.video_url ? (
                        <iframe src={selectedLesson.video_url} className="w-full h-full" allowFullScreen />
                      ) : (
                        <p className="text-sm text-slate-500">لا يوجد فيديو لهذه المحاضرة</p>
                      )
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                        <h3 className="text-lg font-bold text-white">المحتوى محمي ومغلق</h3>
                        <button onClick={() => addToCart(selectedCourse)} className={`${colorThemeClasses.primary} text-white text-xs font-bold px-5 py-2.5 rounded-xl`}>
                          اشترك بـ ({selectedCourse?.price || 0} ر.س) لفتح المحتوى
                        </button>
                      </div>
                    )}
                  </div>

                  {/* تنزيل الملفات الثلاثة المنفصلة */}
                  <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                    <h2 className="text-xl font-bold">{selectedLesson.title}</h2>
                    <div className="flex flex-wrap gap-3">
                      {selectedLesson.pdf_url && canAccessLesson && (
                        <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="bg-blue-500/10 text-blue-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الـ PDF
                        </a>
                      )}
                      {selectedLesson.summary_url && canAccessLesson && (
                        <a href={selectedLesson.summary_url} target="_blank" rel="noreferrer" className="bg-purple-500/10 text-purple-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الملخص
                        </a>
                      )}
                      {selectedLesson.assignment_url && canAccessLesson && (
                        <a href={selectedLesson.assignment_url} target="_blank" rel="noreferrer" className="bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الواجب
                        </a>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className={`p-4 rounded-3xl border h-fit space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <h3 className="font-bold px-2 text-sm">دروس المقرر ({lessons.length})</h3>
              <div className="space-y-1.5">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-right p-3 rounded-xl text-sm flex items-center justify-between gap-2 ${selectedLesson?.id === lesson.id ? `${colorThemeClasses.badge} font-bold` : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <span>{lesson.title}</span>
                    {!isSubscribedToSelected && !lesson.is_preview && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* السلة */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                سلة المشتريات ({cart.length})
              </h3>
              <button onClick={() => setShowCartModal(false)}>✕</button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-800 text-xs bg-slate-950">
                    <div>
                      <span className="font-bold block">{item.title}</span>
                      <span className="text-emerald-400 font-bold">{item.price} ر.س</span>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="الكوبون (MASARI20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 border border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-950 text-white"
                  />
                  <button onClick={applyCoupon} className={`${colorThemeClasses.primary} text-white px-4 py-2 rounded-xl text-xs font-bold`}>تطبيق</button>
                </div>

                <div className="flex justify-between border-t border-slate-800 pt-3 font-bold text-sm">
                  <span>الإجمالي:</span>
                  <span className="text-emerald-400">{finalTotal} ر.س</span>
                </div>

                <button onClick={handleCheckoutAndPay} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-2xl text-xs">
                  إتمام الدفع وتفعيل الاشتراك الآن
                </button>
              </div>
            ) : (
              <p className="text-xs text-center py-6 text-slate-500">السلة فارغة حالياً.</p>
            )}
          </div>
        </div>
      )}

      {/* Masari AI Chat Window */}
      {showAiBot && (
        <div className="fixed bottom-4 left-4 z-50 w-[92vw] max-w-sm">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[28rem] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className={`${colorThemeClasses.primary} text-white p-4 flex justify-between items-center`}>
              <span className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Masari AI</span>
              <button onClick={() => setShowAiBot(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {aiResponses.length === 0 && (
                <p className="text-slate-400 text-center py-6">مرحباً بك! اسألني عن أية مادة وسأساعدك فوراً 👋</p>
              )}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-xl max-w-[85%] ${r.role === 'user' ? `${colorThemeClasses.primary} text-white mr-auto` : 'ml-auto bg-slate-800 text-white'}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="اسأل عن أي مقرر أو دعم..."
                className="flex-1 border border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-950 text-white"
              />
              <button onClick={handleAiSend} className={`${colorThemeClasses.primary} text-white p-2 rounded-xl`}><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* التذييل والتواصل */}
      <footer className={`mt-16 border-t ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`${colorThemeClasses.primary} p-2 rounded-xl text-white`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className={`text-lg font-black ${colorThemeClasses.text}`}>مساري | Masari</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              منصة تعليمية متكاملة تقدم شروحات ومقررات وملخصات تساعدك على التفوق الأكاديمي.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => copyShareLink()} className="hover:text-blue-400 transition">مشاركة المنصة</button></li>
              <li><button onClick={() => setShowAiBot(true)} className="hover:text-blue-400 transition">المساعد الذكي</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">التواصل المباشر مع الدعم</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="https://wa.me/966500000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-400 font-bold hover:underline">
                  <Phone className="w-3.5 h-3.5" /> محادثة الواتساب المباشرة
                </a>
              </li>
              <li>
                <a href="mailto:support@masari.sa" className="flex items-center gap-2 hover:text-blue-400">
                  <Mail className="w-3.5 h-3.5" /> support@masari.sa
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">الموقع</h4>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> الرياض، المملكة العربية السعودية
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}