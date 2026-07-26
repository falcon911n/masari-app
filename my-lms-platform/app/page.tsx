'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Cairo } from 'next/font/google';
import {
  GraduationCap, Search, BookOpen, PlayCircle, FileText, Lock, Eye,
  CheckCircle, Sparkles, Heart, ShieldAlert, UserCheck,
  LogIn, CreditCard, ArrowRight, Bot, ShoppingBag, Trash2, Tag, Star,
  ChevronRight, ChevronDown, Flame, X, Bell, Percent, Sun, Moon,
  TrendingUp, Award, Gift, Wallet, Users, Video, ClipboardList,
  Quote, Globe, Share2, MessageCircle, Tv, MapPin, Phone, Mail,
  Send
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
  { q: 'ماذا لو واجهت مشكلة تقنية؟', a: 'يمكنك التواصل معنا عبر نموذج الدعم في أسفل الصفحة أو عبر مساعد مساري الذكي المتاح في أعلى الصفحة على مدار الساعة.' },
];

function SkeletonCard({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`rounded-3xl p-6 space-y-5 border animate-pulse ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
      <div className="flex justify-between items-center">
        <div className={`h-5 w-16 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-5 w-5 rounded-md ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>
      <div className={`h-4 w-3/4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className={`h-3 w-1/2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className={`pt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
        <div className={`h-5 w-14 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-8 w-20 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
}

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
  const [favorites, setFavorites] = useState<string[]>([]);
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
  const [comingSoonNotice, setComingSoonNotice] = useState<string | null>(null);

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

  // محرك البحث والفلترة
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
    if (data) {
      setSubscribedCourses(data.map((s) => s.course_id));
    }
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
      const { data, error } = await supabase.from('testimonials').select('*').limit(6);
      if (!error && data && data.length > 0) {
        setTestimonials(data);
      }
    } catch {
      // الابقاء على الأمثلة
    }
  }

  async function fetchPlatformStats() {
    try {
      const [coursesRes, lessonsRes, subsRes] = await Promise.all([
        supabase.from('courses').select('id, instructor', { count: 'exact' }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('user_id'),
      ]);

      const distinctInstructors = new Set(
        (coursesRes.data || []).map((c: any) => c.instructor).filter(Boolean)
      ).size;
      const distinctStudents = new Set(
        (subsRes.data || []).map((s: any) => s.user_id).filter(Boolean)
      ).size;

      setPlatformStats({
        coursesCount: coursesRes.count || (coursesRes.data || []).length || 0,
        lessonsCount: lessonsRes.count || 0,
        studentsCount: distinctStudents,
        instructorsCount: distinctInstructors,
      });
    } catch {
      // الابقاء على القيم
    }
  }

  const addToCart = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cart.some((c) => c.id === course.id)) {
      setCart([...cart, course]);
      alert(`تمت إضافة (${course.title}) إلى السلة! أعد التوجه للسلة لتأكيد الاشتراك والدفع.`);
    } else {
      alert('المقرر موجود بالفعل داخل السلة!');
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
      alert(`تم تطبيق الكوبون (${data.code}) بنجاح! 🎉`);
    } else {
      if (couponCode.toUpperCase() === 'MASARI20' || couponCode.toUpperCase() === 'A+') {
        setDiscountApplied({ type: 'percent', value: 20 });
        alert('تم تطبيق الخصم التجريبي 20% بنجاح!');
      } else {
        alert('الكوبون غير صحيح أو منتهي الصلاحية.');
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
      alert('يرجى تسجيل الدخول أولاً لتتمكن من الشراء والاشتراك!');
      return;
    }
    if (cart.length === 0) return;

    for (const course of cart) {
      await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
    }

    alert('تم عملية الدفع بنجاح! 🎉 تم إرسال إشعار واشتراكك بكافة المقررات المحددة.');
    fetchSubscriptions(user.id);
    setCart([]);
    setShowCartModal(false);
  };

  const isSubscribedToSelected = selectedCourse ? subscribedCourses.includes(selectedCourse.id) : false;
  const canAccessLesson = selectedLesson ? Boolean(selectedLesson.is_preview || isSubscribedToSelected) : false;

  const bestSellers = useMemo(() => {
    return [...filteredCourses]
      .sort((a, b) => (b.sales_count ?? b.students_count ?? 0) - (a.sales_count ?? a.students_count ?? 0))
      .slice(0, 6);
  }, [filteredCourses]);

  const topRated = useMemo(() => {
    const withRating = filteredCourses.filter((c) => (c.rating ?? 0) > 0);
    const source = withRating.length > 0 ? withRating : filteredCourses;
    return [...source].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6);
  }, [filteredCourses]);

  const freeCourses = useMemo(() => filteredCourses.filter((c) => !c.price || c.price === 0), [filteredCourses]);
  const paidCourses = useMemo(() => filteredCourses.filter((c) => (c.price || 0) > 0), [filteredCourses]);
  const latestCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
  }, [filteredCourses]);

  const handleComingSoon = (label: string) => {
    setComingSoonNotice(label);
    setTimeout(() => setComingSoonNotice(null), 2800);
  };

  const cardBase = `group relative border rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#2563EB]/50' : 'bg-white border-[#E5E7EB] hover:border-[#2563EB]'}`;

  function CourseCard({ course }: { course: Course }) {
    const hasDiscount = (course.original_price && course.original_price > (course.price || 0)) || (course.discount_percent && course.discount_percent > 0);
    return (
      <div key={course.id} onClick={() => setSelectedCourse(course)} className={cardBase}>
        {hasDiscount && (
          <span className="absolute -top-2.5 -right-2.5 bg-[#EF4444] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md shadow-red-500/30 flex items-center gap-1">
            <Percent className="w-3 h-3" />
            خصم
          </span>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold px-2.5 py-1 rounded-lg">
              {course.code || 'مقرر'}
            </span>
            {typeof course.rating === 'number' && course.rating > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B]">
                <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                {course.rating.toFixed(1)}
              </div>
            )}
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

          {(course.students_count ?? 0) > 0 && (
            <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {course.students_count} مشترك
            </p>
          )}
        </div>

        <div className={`pt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
          <div className="flex flex-col">
            <span className="text-base font-black text-[#22C55E]">
              {course.price ? `${course.price} ر.س` : 'مجاني'}
            </span>
            {hasDiscount && course.original_price && (
              <span className="text-[11px] text-[#6B7280] line-through">{course.original_price} ر.س</span>
            )}
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

  function CourseRow({ title, icon, list, emptyText }: { title: string; icon: React.ReactNode; list: Course[]; emptyText: string }) {
    if (list.length === 0) return null;
    return (
      <section className="space-y-5 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-[#6B7280]'}`}>{list.length} مقرر</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </section>
    );
  }

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#111827]'}`}>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out both;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.25s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-scale-in { animation: none !important; }
        }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #2563EB55; border-radius: 999px; }
      `}</style>

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
              <Bell className="w-5 h-5 text-[#6B7280]" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

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

            <button
              onClick={() => setShowAiBot(!showAiBot)}
              className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/20 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Masari AI</span>
            </button>

            {user?.email === 'falcon911n@gmail.com' && (
              <Link
                href="/admin"
                className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 hover:bg-[#F59E0B]/20"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة الأدمن</span>
              </Link>
            )}

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

      {comingSoonNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-scale-in">
          <div className="bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            قسم "{comingSoonNotice}" قيد التجهيز وسيتوفر قريباً
          </div>
        </div>
      )}

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

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                { label: 'الأكثر مبيعاً', icon: <Flame className="w-3.5 h-3.5" />, action: () => document.getElementById('best-sellers')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'الدورات', icon: <PlayCircle className="w-3.5 h-3.5" />, action: () => document.getElementById('all-courses')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'الملخصات', icon: <FileText className="w-3.5 h-3.5" />, action: () => handleComingSoon('الملخصات') },
                { label: 'الكتب', icon: <BookOpen className="w-3.5 h-3.5" />, action: () => handleComingSoon('الكتب') },
                { label: 'الاختبارات', icon: <ClipboardList className="w-3.5 h-3.5" />, action: () => handleComingSoon('الاختبارات') },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]' : 'bg-[#F8FAFC] text-[#374151] border border-[#E5E7EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]'}`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>

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

          {/* إحصائيات المنصة */}
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

          {/* حالة التحميل - Skeleton */}
          {loadingCourses && (
            <section className="space-y-5">
              <div className={`h-6 w-40 rounded-lg animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} darkMode={darkMode} />)}
              </div>
            </section>
          )}

          {!loadingCourses && (
            <>
              {/* الأكثر مبيعاً */}
              <div id="best-sellers">
                <CourseRow
                  title="الأكثر مبيعاً"
                  icon={<Flame className="w-5 h-5 text-[#EF4444]" />}
                  list={bestSellers}
                  emptyText="لا توجد بيانات مبيعات بعد"
                />
              </div>

              {/* الأعلى تقييماً */}
              <CourseRow
                title="الأعلى تقييماً"
                icon={<Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />}
                list={topRated}
                emptyText="لا توجد تقييمات بعد"
              />

              {/* الدورات المجانية */}
              <CourseRow
                title="الدورات المجانية"
                icon={<Gift className="w-5 h-5 text-[#22C55E]" />}
                list={freeCourses}
                emptyText="لا توجد دورات مجانية حالياً"
              />

              {/* الدورات المدفوعة */}
              <CourseRow
                title="الدورات المدفوعة"
                icon={<Wallet className="w-5 h-5 text-[#2563EB]" />}
                list={paidCourses}
                emptyText="لا توجد دورات مدفوعة حالياً"
              />

              {/* جميع المقررات / أحدث الدورات */}
              <section id="all-courses" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                    أحدث الدورات
                  </h2>
                  <span className="text-xs text-[#6B7280]">المقررات المتاحة: {filteredCourses.length}</span>
                </div>

                {latestCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestCourses.map((course) => <CourseCard key={course.id} course={course} />)}
                  </div>
                ) : (
                  <div className={`p-12 rounded-3xl border text-center text-[#6B7280] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                    لا توجد مقررات مطابقة للبحث حالياً.
                  </div>
                )}
              </section>
            </>
          )}

          {/* آراء الطلاب */}
          <section className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#EF4444]" />
              آراء الطلاب
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className={`rounded-3xl p-6 border space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                  <Quote className="w-6 h-6 text-[#2563EB]/30" />
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-[#374151]'}`}>{t.text}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{ backgroundColor: t.avatar_color || '#2563EB' }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{t.name}</p>
                        {t.role && <p className="text-[10px] text-[#6B7280]">{t.role}</p>}
                      </div>
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
                  <div
                    className="grid transition-all duration-300 ease-in-out"
                    style={{ gridTemplateRows: openFaqIndex === idx ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className={`px-4 pb-4 text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      ) : (

        /* داخل المقرر المشغل التشغيلي */
        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">

          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center gap-1 shrink-0 hover:scale-105 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              >
                <ArrowRight className="w-4 h-4" />
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
                  <p className="text-xs text-[#6B7280] mt-1">الدكتور: {selectedCourse.instructor}</p>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-2xl border shrink-0 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-[#E5E7EB]'}`}>
              <div className="text-right">
                <span className="text-[10px] text-[#6B7280] block">قيمة الاشتراك:</span>
                <span className="text-sm font-black text-[#22C55E]">
                  {selectedCourse.price ? `${selectedCourse.price} ر.س` : 'مجاني'}
                </span>
              </div>
              {isSubscribedToSelected ? (
                <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  الاشتراك مفعل
                </span>
              ) : (
                <button
                  onClick={() => addToCart(selectedCourse)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95"
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
                  {/* مشغل الفيديو الشغال */}
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
                        <div className="text-center p-6 text-slate-500">
                          <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">لا يوجد فيديو لهذه المحاضرة</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-6 space-y-3 bg-slate-950/95 w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-[#F59E0B]/10 p-3.5 rounded-2xl border border-[#F59E0B]/20 text-[#F59E0B]">
                          <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white">المحتوى محمي ومغلق</h3>
                        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                          أضف المقرر للسلة واكمل عملية الدفع لفتح كافة الفيديوهات والملفات.
                        </p>
                        <button
                          onClick={() => addToCart(selectedCourse)}
                          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          إضافة للسلة بـ ({selectedCourse?.price || 0} ر.س)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* الملفات الثلاثة المنفصلة */}
                  <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {selectedLesson.title}
                    </h2>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {selectedLesson.pdf_url && (
                        canAccessLesson ? (
                          <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="bg-[#2563EB]/10 text-[#2563EB] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 hover:bg-[#2563EB] hover:text-white">
                            <FileText className="w-4 h-4" /> تحميل الـ PDF
                          </a>
                        ) : null
                      )}

                      {selectedLesson.summary_url && (
                        canAccessLesson ? (
                          <a href={selectedLesson.summary_url} target="_blank" rel="noreferrer" className="bg-[#7C3AED]/10 text-[#7C3AED] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 hover:bg-[#7C3AED] hover:text-white">
                            <FileText className="w-4 h-4" /> تحميل الملخص
                          </a>
                        ) : null
                      )}

                      {selectedLesson.assignment_url && (
                        canAccessLesson ? (
                          <a href={selectedLesson.assignment_url} target="_blank" rel="noreferrer" className="bg-[#22C55E]/10 text-[#22C55E] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 hover:bg-[#22C55E] hover:text-white">
                            <FileText className="w-4 h-4" /> تحميل الواجب
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className={`p-4 rounded-3xl border h-fit space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
              <h3 className="font-bold px-2 text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-[#2563EB]" />
                دروس المقرر ({lessons.length})
              </h3>
              <div className="space-y-1.5">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-right p-3 rounded-xl text-sm transition-all duration-300 flex items-center justify-between gap-2 ${
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

      {/* مودال السلة وإتمام عملية الدفع */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-in ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
                سلة المشتريات ({cart.length})
              </h3>
              <button onClick={() => setShowCartModal(false)} className="text-[#6B7280] text-sm font-bold hover:text-[#EF4444] transition-colors">✕</button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className={`flex justify-between items-center p-3 rounded-2xl border text-xs transition-all duration-300 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-[#E5E7EB]'}`}>
                      <div>
                        <span className="font-bold block">{item.title}</span>
                        <span className="text-[#22C55E] font-bold">{item.price} ر.س</span>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[#EF4444] p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="رمز الكوبون (مثال: MASARI20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-[#E5E7EB] text-[#111827]'}`}
                  />
                  <button onClick={applyCoupon} className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:bg-[#1D4ED8] active:scale-95">
                    تطبيق
                  </button>
                </div>

                <div className={`border-t pt-3 space-y-1.5 text-xs ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>الإجمالي:</span>
                    <span className="text-[#22C55E] font-bold text-sm">{finalTotal} ر.س</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutAndPay}
                  className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-xs transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  إتمام الدفع واشتراك بالمواد الآن
                </button>
              </div>
            ) : (
              <p className="text-xs text-center text-[#6B7280] py-6">السلة فارغة حالياً.</p>
            )}
          </div>
        </div>
      )}

      {/* مودال الإشعارات */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in max-h-[80vh] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#2563EB]" />
                الإشعارات ({notifications.length})
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-[#6B7280] text-sm font-bold hover:text-[#EF4444] transition-colors">✕</button>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {notifications.length > 0 ? notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-2xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-[#E5E7EB]'}`}>
                  <p className="font-bold mb-1">{n.title || 'إشعار جديد'}</p>
                  <p className="text-[#6B7280]">{n.message || n.content}</p>
                </div>
              )) : (
                <p className="text-xs text-center text-[#6B7280] py-6">لا توجد إشعارات حالياً.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* مساعد Masari AI - نافذة عائمة */}
      {showAiBot && (
        <div className="fixed bottom-4 left-4 z-50 w-[92vw] max-w-sm animate-scale-in">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[28rem] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="bg-[#2563EB] text-white p-4 flex justify-between items-center shrink-0">
              <span className="font-bold text-sm flex items-center gap-2"><Bot className="w-4 h-4" /> Masari AI</span>
              <button onClick={() => setShowAiBot(false)} className="hover:opacity-80"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {aiResponses.length === 0 && (
                <p className="text-[#6B7280] text-center py-6">اسألني عن أي مقرر أو مادة وسأساعدك 👋</p>
              )}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-xl max-w-[85%] ${r.role === 'user' ? 'bg-[#2563EB] text-white mr-auto' : `ml-auto ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-[#111827]'}`}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className={`p-3 border-t flex gap-2 shrink-0 ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-[#E5E7EB]'}`}
              />
              <button
                onClick={() => {
                  if (!aiQuery.trim()) return;
                  setAiResponses([...aiResponses, { role: 'user', text: aiQuery }, { role: 'bot', text: 'هذه الميزة قيد التطوير حالياً، سيتم ربطها قريباً بمساعد ذكي كامل.' }]);
                  setAiQuery('');
                }}
                className="bg-[#2563EB] text-white p-2 rounded-xl active:scale-90 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* التذييل (Footer) */}
      <footer className={`mt-16 border-t transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#2563EB] p-2 rounded-xl text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-[#2563EB]">مساري | Masari</span>
            </div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
              منصة تعليمية متكاملة تقدم شروحات ومقررات وملخصات تساعدك على التفوق الأكاديمي.
            </p>
            <div className="flex gap-2">
              {[Globe, Share2, MessageCircle, Tv].map((Icon, i) => (
                <a key={i} href="#" className={`p-2 rounded-lg border transition-all duration-300 hover:bg-[#2563EB] hover:text-white ${darkMode ? 'border-slate-800 text-slate-400' : 'border-[#E5E7EB] text-[#6B7280]'}`}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">روابط سريعة</h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
              <li><button onClick={() => document.getElementById('all-courses')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2563EB] transition-colors">الدورات</button></li>
              <li><button onClick={() => handleComingSoon('الملخصات')} className="hover:text-[#2563EB] transition-colors">الملخصات</button></li>
              <li><button onClick={() => handleComingSoon('الكتب')} className="hover:text-[#2563EB] transition-colors">الكتب</button></li>
              <li><button onClick={() => handleComingSoon('الاختبارات')} className="hover:text-[#2563EB] transition-colors">الاختبارات</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">الدعم</h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
              <li><button onClick={() => setShowAiBot(true)} className="hover:text-[#2563EB] transition-colors">تواصل معنا</button></li>
              <li><button className="hover:text-[#2563EB] transition-colors">سياسة الخصوصية</button></li>
              <li><button className="hover:text-[#2563EB] transition-colors">الشروط والأحكام</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">تواصل معنا</h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-slate-400' : 'text-[#6B7280]'}`}>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@masari.sa</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> 966+ XX XXX XXXX</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>
        <div className={`border-t py-5 text-center text-[11px] ${darkMode ? 'border-slate-800 text-slate-500' : 'border-[#E5E7EB] text-[#6B7280]'}`}>
          © {new Date().getFullYear()} منصة مساري | Masari. جميع الحقوق محفوظة.
        </div>
      </footer>

    </div>
  );
}