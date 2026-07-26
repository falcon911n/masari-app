'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Cairo } from 'next/font/google';
import { 
  GraduationCap, Search, BookOpen, PlayCircle, FileText, Lock, Eye, 
  CheckCircle, Sparkles, Heart, ShieldAlert, UserCheck, 
  LogIn, CreditCard, ArrowRight, Bot, ShoppingBag, Trash2, Tag, Star, 
  ChevronRight, Flame, X, Bell, Percent, Sun, Moon
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

  useEffect(() => {
    fetchCourses();
    fetchNotifications();
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
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
    const { data } = await supabase.from('courses').select('*');
    if (data) {
      setCourses(data);
      setFilteredCourses(data.filter((c) => c.is_published !== false));
    }
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

  // العملية الفعلية لإتمام الدفع واشتراك كافة المواد في السلة
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

  const offersCourses = filteredCourses.filter((c) => (c.original_price && c.original_price > (c.price || 0)) || (c.discount_percent && c.discount_percent > 0));
  const featuredCourses = filteredCourses.filter((c) => c.is_featured);

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#111827]'}`}>
      
      {/* الهيدر */}
      <header className={`sticky top-0 z-50 border-b transition-colors backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-4">
          
          <button 
            onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
            className="flex items-center gap-3 focus:outline-none text-right group"
          >
            <div className="bg-[#2563EB] p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
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
              className={`p-2.5 rounded-xl border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className={`relative p-2.5 rounded-xl border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
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
              className={`relative p-2.5 rounded-xl border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}
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
              className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/20 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Masari AI</span>
            </button>

            {user?.email === 'falcon911n@gmail.com' && (
              <Link
                href="/admin"
                className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
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
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      {!selectedCourse ? (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-12">
          
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
                className={`w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:outline-none focus:border-[#2563EB] transition shadow-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {['الكل', 'مواد رياض', 'مواد فيز', 'مواد تقن', 'أمن معلومات / سايبر'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedSubject === sub
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                      : darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </section>

          {/* 3. المقررات */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#2563EB]" />
                أحدث المقررات
              </h2>
              <span className="text-xs text-[#6B7280]">المقررات المتاحة: {filteredCourses.length}</span>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`group border rounded-3xl p-6 transition cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#2563EB]/50' : 'bg-white border-[#E5E7EB] hover:border-[#2563EB]'}`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          {course.code || 'مقرر'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold group-hover:text-[#2563EB] transition">
                        {course.title}
                      </h3>

                      {course.instructor && (
                        <p className="text-xs text-[#6B7280]">الدكتور: {course.instructor}</p>
                      )}
                    </div>

                    <div className={`pt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
                      <span className="text-base font-black text-[#22C55E]">
                        {course.price ? `${course.price} ر.س` : 'مجاني'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => addToCart(course, e)}
                          className={`p-2 border rounded-xl transition ${darkMode ? 'bg-slate-800 text-[#2563EB] border-slate-700 hover:bg-[#2563EB] hover:text-white' : 'bg-[#F8FAFC] text-[#2563EB] border-[#E5E7EB] hover:bg-[#2563EB] hover:text-white'}`}
                          title="إضافة للسلة"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <span className="bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1">
                          استعراض
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-12 rounded-3xl border text-center text-[#6B7280] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
                لا توجد مقررات مطابقة للبحث حالياً.
              </div>
            )}
          </section>

        </main>
      ) : (
        
        /* داخل المقرر المشغل التشغيلي */
        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          
          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E7EB]'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]'}`}
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
                  className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
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
                          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
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
                          <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="bg-[#2563EB]/10 text-[#2563EB] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <FileText className="w-4 h-4" /> تحميل الـ PDF
                          </a>
                        ) : null
                      )}

                      {selectedLesson.summary_url && (
                        canAccessLesson ? (
                          <a href={selectedLesson.summary_url} target="_blank" rel="noreferrer" className="bg-[#7C3AED]/10 text-[#7C3AED] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <FileText className="w-4 h-4" /> تحميل الملخص
                          </a>
                        ) : null
                      )}

                      {selectedLesson.assignment_url && (
                        canAccessLesson ? (
                          <a href={selectedLesson.assignment_url} target="_blank" rel="noreferrer" className="bg-[#22C55E]/10 text-[#22C55E] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
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
              <h3 className="font-bold px-2 text-sm">دروس المقرر</h3>
              <div className="space-y-1.5">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-right p-3 rounded-xl text-sm transition flex items-center justify-between gap-2 ${
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
          <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-[#E5E7EB]'}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
                سلة المشتريات ({cart.length})
              </h3>
              <button onClick={() => setShowCartModal(false)} className="text-[#6B7280] text-sm font-bold">✕</button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className={`flex justify-between items-center p-3 rounded-2xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-[#E5E7EB]'}`}>
                      <div>
                        <span className="font-bold block">{item.title}</span>
                        <span className="text-[#22C55E] font-bold">{item.price} ر.س</span>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[#EF4444] p-1.5 hover:bg-red-500/10 rounded-lg">
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
                    className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-[#E5E7EB] text-[#111827]'}`}
                  />
                  <button onClick={applyCoupon} className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs font-bold">
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
                  className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20"
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

    </div>
  );
}