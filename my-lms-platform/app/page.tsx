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
  MessageCircle, Tv, MapPin, Phone, Mail, Send, Copy, ExternalLink
} from 'lucide-react';

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
  const [cart, setCart] = useState<Course[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [darkMode, setDarkMode] = useState(false);
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
    fetchCourses();
    fetchNotifications();
    checkUser();
    fetchTestimonials();
    fetchPlatformStats();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCourse]);

  // فلترة المواد
  useEffect(() => {
    let result = courses.filter((c) => c.is_published !== false);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q)
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
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      fetchSubscriptions(data.user.id);
    }
  }

  async function fetchSubscriptions(userId: string) {
    const { data } = await supabase.from('subscriptions').select('course_id').eq('user_id', userId);
    if (data) setSubscribedCourses(data.map((s) => s.course_id));
  }

  async function fetchCourses() {
    setLoadingCourses(true);
    const { data } = await supabase.from('courses').select('*');
    if (data) {
      setCourses(data);
      setFilteredCourses(data.filter((c) => c.is_published !== false));
    }
    setLoadingCourses(false);
  }

  async function fetchNotifications() {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (data) setNotifications(data);
  }

  async function fetchLessons(courseId: string) {
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

  // تفعيل نسخ رابط المنصة أو المقرر
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

    for (const course of cart) {
      await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
    }

    showToast('تمت عملية الاشتراك بنجاح! 🎉 مبارك.');
    fetchSubscriptions(user.id);
    setCart([]);
    setShowCartModal(false);
  };

  // المساعد الذكي التفاعلي
  const handleAiSend = () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    const newHistory = [...aiResponses, { role: 'user', text: query }];
    setAiResponses(newHistory);
    setAiQuery('');

    // الردود الذكية التفاعلية بناءً على النص
    setTimeout(() => {
      let reply = 'أهلاً بك! أنا مساعد مساري الذكي. كيف يمكنني مساعدتك اليوم في مقرراتك؟';
      const q = query.toLowerCase();

      if (q.includes('سعر') || q.includes('اشتراك') || q.includes('خصم')) {
        reply = 'أسعار المقررات موضحة على كل مادة، ويمكنك استخدام كوبون (MASARI20) للحصول على خصم 20% فوراً!';
      } else if (q.includes('ريض') || q.includes('رياضيات')) {
        reply = 'لدينا شروحات ممتازة لمواد الرياضيات تشمل الفيديوهات وسلايدات الـ PDF والواجبات المحلولة.';
      } else if (q.includes('تواصل') || q.includes('دعم') || q.includes('مساعدة')) {
        reply = 'يمكنك التواصل مباشرة مع فريق الدعم عبر الواتساب على الرقم 966500000000+ أو عبر البريد support@masari.sa';
      }

      setAiResponses([...newHistory, { role: 'bot', text: reply }]);
    }, 600);
  };

  const isSubscribedToSelected = selectedCourse ? subscribedCourses.includes(selectedCourse.id) : false;
  const canAccessLesson = selectedLesson ? Boolean(selectedLesson.is_preview || isSubscribedToSelected) : false;

  const bestSellers = useMemo(() => filteredCourses.slice(0, 6), [filteredCourses]);
  const freeCourses = useMemo(() => filteredCourses.filter((c) => !c.price || c.price === 0), [filteredCourses]);
  const paidCourses = useMemo(() => filteredCourses.filter((c) => (c.price || 0) > 0), [filteredCourses]);

  const cardBase = `group relative border rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#2563EB]/50' : 'bg-white border-[#E5E7EB] hover:border-[#2563EB]'}`;

  function CourseCard({ course }: { course: Course }) {
    return (
      <div key={course.id} onClick={() => setSelectedCourse(course)} className={cardBase}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold px-2.5 py-1 rounded-lg">
              {course.code || 'مقرر'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); copyShareLink(course.title); }}
              className="text-slate-400 hover:text-[#2563EB] p-1 rounded-lg transition-colors"
              title="مشاركة المقرر"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="text-lg font-bold group-hover:text-[#2563EB] transition-colors duration-300 line-clamp-2">
            {course.title}
          </h3>

          {course.instructor && (
            <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
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
              className={`p-2 border rounded-xl transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 text-[#2563EB] border-slate-700 hover:bg-[#2563EB] hover:text-white' : 'bg-[#F8FAFC] text-[#2563EB] border-[#E5E7EB] hover:bg-[#2563EB] hover:text-white'}`}
              title="إضافة للسلة"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className="bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1">
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

      {/* التنبيهات المنبثقة (Toast) */}
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
            <div className="bg-[#2563EB] p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#2563EB]">مساري</span>
                <span className="text-xs font-bold text-[#6B7280]">| Masari</span>
              </div>
              <p className="text-[11px] font-extrabold text-[#2563EB] tracking-wide">طريقك إلى +A</p>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            {/* زر مشاركة المنصة */}
            <button
              onClick={() => copyShareLink()}
              className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
              title="نسخ رابط المنصة"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* الوضع الليلي */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* الإشعارات */}
            <button
              onClick={() => setShowNotifModal(true)}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
            >
              <Bell className="w-5 h-5 text-[#6B7280]" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* السلة */}
            <button
              onClick={() => setShowCartModal(true)}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 active:scale-90 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
            >
              <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Masari AI */}
            <button
              onClick={() => setShowAiBot(!showAiBot)}
              className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/20 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span className="hidden sm:inline">Masari AI</span>
            </button>

            {/* زر الأدمن الحقيقي */}
            {user?.email === 'falcon911n@gmail.com' && (
              <Link
                href="/admin"
                className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 hover:bg-[#F59E0B]/20"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة الأدمن</span>
              </Link>
            )}

            {/* حالة الدخول */}
            {user ? (
              <div className="flex items-center gap-2 bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] px-3.5 py-2 rounded-xl text-xs font-bold">
                <UserCheck className="w-4 h-4" />
                <span className="truncate max-w-[100px]">{user.email}</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      {!selectedCourse ? (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-16">

          {/* الهيرو */}
          <section className={`rounded-3xl p-8 md:p-12 text-center space-y-6 border transition ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB] shadow-xl shadow-slate-200/50'}`}>
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 px-4 py-1.5 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>طريقك إلى +A في جميع المقررات الأكاديمية</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              منصة <span className="text-[#2563EB]">مساري | Masari</span> التعليمية
            </h1>

            <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
              شروحات وافية للمحاضرات، بنوك أسئلة متكاملة، وملخصات مركزة تمكنك من فهم المنهج وتجاوز الاختبارات بنجاح.
            </p>

            <div className="max-w-2xl mx-auto relative pt-2">
              <Search className="w-5 h-5 text-[#6B7280] absolute right-4 top-6" />
              <input
                type="text"
                placeholder="ابحث باسم المادة أو رمز المقرر (مثال: ريض 101، فيز 103)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all duration-300 shadow-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              />
            </div>

            {/* الفلاتر السريعة */}
            <div className="flex flex-wrap justify-center gap-2">
              {['الكل', 'مواد رياض', 'مواد فيز', 'مواد تقن', 'أمن معلومات / سايبر'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                    selectedSubject === sub
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                      : darkMode ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </section>

          {/* الإحصائيات الحقيقية */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'مقرر تعليمي', value: platformStats.coursesCount || courses.length, icon: <BookOpen className="w-5 h-5" /> },
              { label: 'درس ومحاضرة', value: platformStats.lessonsCount, icon: <Video className="w-5 h-5" /> },
              { label: 'طالب مسجل', value: platformStats.studentsCount, icon: <Users className="w-5 h-5" /> },
              { label: 'دكتور ومدرس', value: platformStats.instructorsCount, icon: <Award className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl p-5 border text-center space-y-2 transition-all duration-300 hover:-translate-y-0.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB] shadow-sm'}`}>
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mx-auto">
                  {stat.icon}
                </div>
                <div className="text-2xl font-black">{stat.value}+</div>
                <div className="text-[11px] text-[#6B7280] font-bold">{stat.label}</div>
              </div>
            ))}
          </section>

          {/* الأقسام والمقررات */}
          {!loadingCourses && (
            <div className="space-y-12">
              {bestSellers.length > 0 && (
                <section className="space-y-5">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#EF4444]" />
                    المقررات المتاحة
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bestSellers.map((course) => <CourseCard key={course.id} course={course} />)}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* الأسئلة الشائعة التفاعلية */}
          <section className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              الأسئلة الشائعة
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-right"
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-[#2563EB] transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <p className={`px-4 pb-4 text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>
      ) : (

        /* المشغل الداخلي للمقرر والدروس */
        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center gap-1 shrink-0 hover:scale-105 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              >
                رجوع
              </button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {selectedCourse.title}
                  {selectedCourse.code && (
                    <span className="bg-[#2563EB]/10 text-[#2563EB] text-xs px-2 py-0.5 rounded-md font-bold">
                      {selectedCourse.code}
                    </span>
                  )}
                </h2>
                {selectedCourse.instructor && (
                  <p className="text-xs text-[#6B7280] mt-1">المدرس: {selectedCourse.instructor}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyShareLink(selectedCourse.title)}
                className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                نسخ رابط المادة
              </button>

              {!isSubscribedToSelected && (
                <button
                  onClick={() => addToCart(selectedCourse)}
                  className="bg-[#2563EB] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  إضافة للسلة والدفع
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-6">
              {selectedLesson ? (
                <>
                  <div className={`bg-black rounded-3xl overflow-hidden border aspect-video flex items-center justify-center relative shadow-2xl ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
                    {canAccessLesson ? (
                      selectedLesson.video_url ? (
                        <iframe
                          src={selectedLesson.video_url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <p className="text-sm text-slate-500">لا يوجد فيديو لهذه المحاضرة</p>
                      )
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                        <h3 className="text-lg font-bold text-white">المحتوى محمي ومغلق</h3>
                        <button
                          onClick={() => addToCart(selectedCourse)}
                          className="bg-[#2563EB] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                        >
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
                        <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="bg-[#2563EB]/10 text-[#2563EB] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الـ PDF
                        </a>
                      )}
                      {selectedLesson.summary_url && canAccessLesson && (
                        <a href={selectedLesson.summary_url} target="_blank" rel="noreferrer" className="bg-[#7C3AED]/10 text-[#7C3AED] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الملخص
                        </a>
                      )}
                      {selectedLesson.assignment_url && canAccessLesson && (
                        <a href={selectedLesson.assignment_url} target="_blank" rel="noreferrer" className="bg-[#22C55E]/10 text-[#22C55E] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> تحميل الواجب
                        </a>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* قائمة دروس المقرر */}
            <div className={`p-4 rounded-3xl border h-fit space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <h3 className="font-bold px-2 text-sm">دروس المقرر ({lessons.length})</h3>
              <div className="space-y-1.5">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-right p-3 rounded-xl text-sm flex items-center justify-between gap-2 ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold'
                        : darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-[#6B7280]'
                    }`}
                  >
                    <span>{lesson.title}</span>
                    {!isSubscribedToSelected && !lesson.is_preview && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* مودال السلة */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
                سلة المشتريات ({cart.length})
              </h3>
              <button onClick={() => setShowCartModal(false)}>✕</button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl border text-xs bg-slate-50 dark:bg-slate-950">
                    <div>
                      <span className="font-bold block">{item.title}</span>
                      <span className="text-[#22C55E] font-bold">{item.price} ر.س</span>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-[#EF4444] p-1.5"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="رمز الكوبون (مثال: MASARI20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 border rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950"
                  />
                  <button onClick={applyCoupon} className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs font-bold">تطبيق</button>
                </div>

                <div className="flex justify-between border-t pt-3 font-bold text-sm">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-[#22C55E]">{finalTotal} ر.س</span>
                </div>

                <button onClick={handleCheckoutAndPay} className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-2xl text-xs">
                  إتمام الدفع وتفعيل الاشتراك الآن
                </button>
              </div>
            ) : (
              <p className="text-xs text-center py-6 text-[#6B7280]">السلة فارغة حالياً.</p>
            )}
          </div>
        </div>
      )}

      {/* Masari AI Chat Window */}
      {showAiBot && (
        <div className="fixed bottom-4 left-4 z-50 w-[92vw] max-w-sm">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[28rem] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="bg-[#2563EB] text-white p-4 flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Masari AI</span>
              <button onClick={() => setShowAiBot(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {aiResponses.length === 0 && (
                <p className="text-[#6B7280] text-center py-6">مرحباً بك! كيف يمكنني مساعدتك اليوم في منصة مساري؟ 👋</p>
              )}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-xl max-w-[85%] ${r.role === 'user' ? 'bg-[#2563EB] text-white mr-auto' : `ml-auto ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-[#111827]'}`}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="اسأل عن أي مقرر أو استفسار..."
                className="flex-1 border rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950"
              />
              <button onClick={handleAiSend} className="bg-[#2563EB] text-white p-2 rounded-xl"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* التذييل والتواصل الحقيقي */}
      <footer className={`mt-16 border-t ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#2563EB] p-2 rounded-xl text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-[#2563EB]">مساري | Masari</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              منصة تعليمية متكاملة تقدم شروحات ومقررات وملخصات تساعدك على التفوق الأكاديمي.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li><button onClick={() => copyShareLink()} className="hover:text-[#2563EB] transition-colors">مشاركة المنصة</button></li>
              <li><button onClick={() => setShowAiBot(true)} className="hover:text-[#2563EB] transition-colors">المساعد الذكي</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">التواصل المباشر مع الدعم</h4>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li>
                <a href="https://wa.me/966500000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#22C55E] font-bold hover:underline">
                  <Phone className="w-3.5 h-3.5" /> محادثة الواتساب المباشرة
                </a>
              </li>
              <li>
                <a href="mailto:support@masari.sa" className="flex items-center gap-2 hover:text-[#2563EB]">
                  <Mail className="w-3.5 h-3.5" /> support@masari.sa
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">الموقع</h4>
            <p className="text-xs text-[#6B7280] flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> الرياض، المملكة العربية السعودية
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}