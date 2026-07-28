'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Search, BookOpen, PlayCircle, FileText, Lock,
  Sparkles, Heart, ShoppingBag, Trash2, Star, ChevronRight, 
  Flame, X, Bell, Quote, Send, ClipboardList, Target, 
  Award, Zap, CheckCircle2, Users, Layout, Clock, ChevronDown
} from 'lucide-react';

interface Course {
  id: string; title: string; code?: string; price?: number; original_price?: number; description?: string; instructor?: string; is_published?: boolean; section_type?: string; category?: string; image_url?: string;
}
interface Lesson {
  id: string; course_id: string; title: string; description?: string; video_url?: string; pdf_url?: string; summary_url?: string; assignment_url?: string; is_preview?: boolean; is_published?: boolean; order_index?: number;
}
interface NotificationItem {
  id: string; title: string; message: string; target_type?: string; target_id?: string; created_at?: string;
}
interface Testimonial {
  id: string; name: string; text: string; rating?: number;
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

const BackgroundDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.02] z-0">
    <svg className="absolute top-20 right-10 w-64 h-64 blur-sm transform rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
    <svg className="absolute top-96 left-10 w-48 h-48 blur-sm transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/>
    </svg>
    <svg className="absolute bottom-40 right-1/4 w-72 h-72 blur-md transform rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
    <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
  </div>
);

export default function MasariMasterApp() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [subscribedCourses, setSubscribedCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'bestseller' | 'courses' | 'summaries' | 'books' | 'quizzes'>('bestseller');

  const [cart, setCart] = useState<Course[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ id?: string; code?: string; type: 'percent' | 'fixed'; value: number } | null>(null);

  const [showAiBot, setShowAiBot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<{ role: string; text: string }[]>([]);

  const [realTestimonials, setRealTestimonials] = useState<Testimonial[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => { initializeMasterApp(); }, []);

  async function initializeMasterApp() {
    try {
      setLoadingCourses(true);
      await Promise.all([ checkActiveSession(), fetchMasterCourses(), fetchMasterTestimonials(), fetchPlatformSettings() ]);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function checkActiveSession() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        fetchUserSubscriptions(authData.user.id);
      }
    } catch (e) { console.error('Session error:', e); }
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
    } catch (e) { setCourses([]); }
  }

  async function fetchMasterTestimonials() {
    try {
      const { data } = await supabase.from('comments').select('*').eq('is_hidden', false).order('created_at', { ascending: false }).limit(6);
      if (data && data.length > 0) setRealTestimonials(data.map((c: any) => ({ id: c.id, name: c.user_name || 'طالب مساري', text: c.content, rating: c.rating || 5 })));
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
        setLessons([]); setSelectedLesson(null);
      }
    } catch (e) { setLessons([]); }
  }

  const addToCart = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (subscribedCourses.includes(course.id)) { showToast('أنت مشترك بالفعل في هذا المقرر!'); return; }
    if (!cart.some((c) => c.id === course.id)) {
      setCart([...cart, course]);
      showToast(`تمت إضافة (${course.title}) للسلة بنجاح! 🛒`);
    } else {
      showToast('المقرر موجود مسبقاً في سلة المشتريات!');
    }
  };

  const removeFromCart = (courseId: string) => setCart(cart.filter((c) => c.id !== courseId));

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  let finalCartTotal = cartTotal;
  if (discountApplied) {
    if (discountApplied.type === 'percent') finalCartTotal = cartTotal - (cartTotal * (discountApplied.value / 100));
    else finalCartTotal = Math.max(0, cartTotal - discountApplied.value);
  }

  const applyMasterCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
      if (!data) { showToast('رمز الكوبون غير صحيح أو غير مُفعّل'); return; }
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) { showToast('كوبون الخصم لم يبدأ سريانه بعد'); return; }
      if (data.end_date && new Date(data.end_date) < now) { showToast('انتهت صلاحية هذا الكوبون'); return; }
      if (data.max_uses && (data.used_count || 0) >= data.max_uses) { showToast('تم استنفاد عدد مرات استخدام هذا الكوبون'); return; }
      if (data.allowed_courses && Array.isArray(data.allowed_courses) && data.allowed_courses.length > 0) {
        const hasAllowedCourse = cart.some((c) => data.allowed_courses.includes(c.id));
        if (!hasAllowedCourse) { showToast('هذا الكوبون غير صالح على المقررات الموجودة في سلتك'); return; }
      }
      setDiscountApplied({ id: data.id, code: data.code, type: data.discount_type, value: Number(data.discount_value) });
      showToast(`تم تطبيق الكوبون (${data.code}) بنجاح! 🎉`);
    } catch (e) { showToast('حدث خطأ أثناء التحقق من الكوبون'); }
  };

  const handleCompleteCheckout = async () => {
    if (!user) { showToast('يرجى تسجيل الدخول لتفعيل الاشتراك!'); router.push('/login'); return; }
    if (cart.length === 0) return;
    if (platformSettings.purchase_enabled === false) { showToast('عملية الشراء متوقفة مؤقتاً من قبل إدارة المنصة'); return; }
    try {
      const newItems = cart.filter((c) => !subscribedCourses.includes(c.id));
      for (const course of newItems) await supabase.from('subscriptions').insert([{ user_id: user.id, course_id: course.id }]);
      if (discountApplied?.id) {
        const { data: cpData } = await supabase.from('coupons').select('used_count').eq('id', discountApplied.id).maybeSingle();
        await supabase.from('coupons').update({ used_count: (cpData?.used_count || 0) + 1 }).eq('id', discountApplied.id);
      }
      showToast('تمت عملية الدفع وتفعيل الاشتراكات بنجاح! 🎉');
      fetchUserSubscriptions(user.id);
      setCart([]); setShowCartModal(false); setDiscountApplied(null); setCouponCode('');
    } catch (e) { showToast('حدث خطأ أثناء معالجة الدفع'); }
  };

  const handleAiMasterSend = async () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    setAiResponses([...aiResponses, { role: 'user', text: query }]);
    setAiQuery('');
    let reply = 'أهلاً بك! بحثت في أرشيف المقررات ولم أجد مطابقة دقيقة. يمكنك تصفح الأقسام الرئيسية.';
    const q = query.toLowerCase();
    const matchedCourse = courses.find(c => c.title.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)));
    if (matchedCourse) reply = `وجدت لك المقرر المطلوب: (${matchedCourse.title}) - السعر: ${matchedCourse.price ? matchedCourse.price + ' ر.س' : 'مجاني'}.`;
    else if (q.includes('سعر')) reply = 'أسعار المقررات مبينة أسفل كل مادة، ويمكنك استخدام كوبونات الخصم.';
    else if (q.includes('دعم')) reply = 'للتواصل مع فريق الدعم الفني: البريد الإلكتروني أو الواتساب المباشر بالأسفل.';
    setAiResponses(prev => [...prev, { role: 'bot', text: reply }]);
  };

  const displayCourses = useMemo(() => {
    let list = courses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.title?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q));
    }
    if (activeTabSection === 'bestseller') return list.slice(0, 6);
    return list.filter((c) => (c.section_type || 'courses') === activeTabSection);
  }, [courses, searchQuery, activeTabSection]);

  const isSubscribedToSelected = selectedCourse ? subscribedCourses.includes(selectedCourse.id) : false;
  const canAccessLesson = selectedLesson ? Boolean(selectedLesson.is_preview || isSubscribedToSelected) : false;

  const faqs = [
    { q: 'ما هي منصة Masari؟', a: 'منصة مساري هي وجهتك الشاملة للتعلم الجامعي والمدرسي، تقدم مقررات مشروحة، ملخصات، وبنوك أسئلة بطريقة تفاعلية.' },
    { q: 'كيف أستطيع التسجيل في المنصة؟', a: 'يمكنك التسجيل بسهولة عبر النقر على زر "تسجيل الدخول" في الأعلى واختيار "إنشاء حساب جديد" باستخدام بريدك الإلكتروني.' },
    { q: 'هل يمكنني استرجاع المبلغ بعد الدفع؟', a: 'نعم، نوفر سياسة استرجاع مرنة خلال 48 ساعة من الدفع في حال عدم مشاهدة أكثر من 10% من محتوى المقرر.' },
    { q: 'كيف أستخدم كوبون الخصم؟', a: 'بعد إضافة المقررات للسلة، ستجد حقلاً مخصصاً لإدخال كوبون الخصم. أدخل الرمز واضغط تطبيق.' }
  ];

  return (
    <div dir="rtl" className="relative transition-colors duration-300 overflow-hidden bg-[var(--masari-bg)] text-[var(--masari-text)]">
      
      <BackgroundDecorations />

      {toastMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#2563EB] text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-blue-400">
            <Sparkles className="w-4 h-4 text-amber-300" /> {toastMsg}
          </div>
        </div>
      )}

      {/* الأزرار العائمة الثابتة بالأسفل (الذكاء الاصطناعي والسلة) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button onClick={() => setShowAiBot(!showAiBot)} className="w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
          <Sparkles className="w-5 h-5" />
        </button>
        <button onClick={() => setShowCartModal(true)} className="w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 relative bg-background border border-border text-foreground">
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {!selectedCourse ? (
        <main className="relative z-10 space-y-16 pb-20">
          <section className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-8 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20">
              <Sparkles className="w-4 h-4" /> <span>مرحباً بك في مستقبل التعليم الرقمي</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
              تعلم بذكاء، وتفوق <br className="hidden md:block"/> 
              <span className="bg-clip-text text-transparent bg-gradient-to-l from-blue-500 to-emerald-500">
                بجدارة مع مساري
              </span>
            </h1>
            <p className="text-sm md:text-base lg:text-lg max-w-2xl mx-auto text-muted-foreground leading-relaxed">
              شروحات وافية، بنوك أسئلة متكاملة، وملخصات مركزة. كل ما تحتاجه لتجاوز اختباراتك الأكاديمية بنجاح باهر وفي مكان واحد.
            </p>
            <div className="max-w-3xl mx-auto relative pt-6 z-20">
              <div className="absolute inset-0 -z-10 blur-xl opacity-20 rounded-full bg-primary/30"></div>
              <Search className="w-5 h-5 text-muted-foreground absolute right-6 top-10" />
              <input
                type="text"
                placeholder="ابحث باسم المادة، رمز المقرر، أو اسم الدكتور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 rounded-full pr-14 pl-6 py-4 text-sm focus:outline-none focus:border-primary transition-all shadow-xl bg-background border-border text-foreground"
              />
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl border shadow-sm backdrop-blur-sm bg-surface border-border">
              {[
                { label: 'طالب مسجل', value: '+12,000', icon: Users },
                { label: 'مقرر دراسي', value: '+350', icon: BookOpen },
                { label: 'ساعة شرح', value: '+1,500', icon: Clock },
                { label: 'نسبة نجاح', value: '98%', icon: Award },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <stat.icon className="w-6 h-6 mx-auto text-primary opacity-80" />
                  <h4 className="text-2xl font-black">{stat.value}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 pt-8">
            <div className="text-center mb-10 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black">أقسام المنصة الشاملة</h2>
              <p className="text-sm text-muted-foreground">اختر القسم الذي يناسب احتياجك التعليمي اليوم</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { id: 'bestseller', label: 'الأكثر مبيعاً', icon: Flame },
                { id: 'courses', label: 'الدورات الأساسية', icon: PlayCircle },
                { id: 'summaries', label: 'الملخصات المركزة', icon: FileText },
                { id: 'books', label: 'الكتب والمراجع', icon: BookOpen },
                { id: 'quizzes', label: 'الاختبارات التفاعلية', icon: ClipboardList },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setActiveTabSection(btn.id as any)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                      activeTabSection === btn.id 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border-primary' 
                        : 'bg-background hover:bg-muted border-border text-muted-foreground hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 min-h-[400px]">
            {!loadingCourses && (
              <div className="space-y-6">
                <h2 className="text-xl font-black flex items-center gap-2 border-b border-border pb-4">
                  <Target className="w-5 h-5 text-primary" /> 
                  نتائج القسم المختار ({displayCourses.length})
                </h2>
                {displayCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayCourses.map((course) => (
                      <div key={course.id} onClick={() => setSelectedCourse(course)} className="group border rounded-3xl p-5 cursor-pointer flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-surface border-border">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-lg">{course.code || 'مقرر'}</span>
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{course.description || 'محتوى أكاديمي معتمد ومطور خصيصاً للطلاب.'}</p>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-center border-border">
                          <span className="text-lg font-black text-emerald-500">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                          <button onClick={(e) => addToCart(course, e)} className="p-2.5 rounded-xl bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="إضافة للسلة">
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-sm text-muted-foreground">لا توجد مقررات في هذا القسم حالياً.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black">لماذا تختار منصة مساري؟</h2>
              <p className="text-sm text-muted-foreground">صممنا المنصة لتكون شريكك الأقوى في رحلة التفوق</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'شروحات مبسطة ووافية', desc: 'تفكيك لأعقد المسائل والمناهج بأسلوب يسهل استيعابه وبأعلى جودة تصوير.', icon: PlayCircle },
                { title: 'ملخصات ذكية', desc: 'نجمع لك الزبدة في ملفات PDF منسقة ومرتبة لتراجعها ليلة الاختبار بثقة.', icon: FileText },
                { title: 'اختبارات محاكية', desc: 'تدرب على أسئلة سابقة ومشابهة للاختبارات الحقيقية مع تصحيح فوري.', icon: CheckCircle2 },
              ].map((feat, i) => (
                <div key={i} className="p-6 rounded-3xl border text-center space-y-4 hover:border-primary transition-colors bg-surface border-border">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {realTestimonials.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" /> قالوا عن مساري
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {realTestimonials.map((t) => (
                  <div key={t.id} className="rounded-3xl p-6 border space-y-4 hover:shadow-xl transition-shadow bg-surface border-border">
                    <Quote className="w-8 h-8 text-primary/20" />
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{t.text}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {t.name.charAt(0)}
                        </div>
                        <p className="text-xs font-bold">{t.name}</p>
                      </div>
                      <StarRating rating={t.rating || 5} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="max-w-3xl mx-auto px-4 pb-20">
            <div className="text-center mb-10 space-y-2">
              <h2 className="text-2xl font-black">الأسئلة الشائعة</h2>
              <p className="text-sm text-muted-foreground">كل ما تود معرفته عن المنصة</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border rounded-2xl overflow-hidden transition-all duration-300 bg-surface border-border">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-right px-6 py-4 flex justify-between items-center focus:outline-none">
                    <span className="font-bold text-sm">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      ) : (
        <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 space-y-6 min-h-screen">
          <div className="p-4 md:p-5 rounded-3xl border flex justify-between items-center backdrop-blur-md shadow-sm bg-surface border-border">
            <button onClick={() => setSelectedCourse(null)} className="p-2 md:p-2.5 rounded-xl bg-muted text-xs font-bold flex items-center gap-1.5 hover:text-primary transition-colors">
              <ChevronRight className="w-4 h-4" /> رجوع
            </button>
            <h2 className="text-sm md:text-lg font-bold truncate max-w-[60%]">{selectedCourse.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 aspect-video bg-black rounded-3xl flex items-center justify-center border border-border relative shadow-2xl overflow-hidden group">
              {canAccessLesson ? (
                selectedLesson?.video_url ? (
                  <iframe src={selectedLesson.video_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300">هذا الدرس يحتوي على ملفات PDF أو ملخصات مرفقة فقط.</p>
                    {selectedLesson?.pdf_url && (
                      <a href={selectedLesson.pdf_url} target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition">
                        تحميل ملف الدرس (PDF)
                      </a>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                    <Lock className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">هذا الدرس مغلق ومحمي</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">يجب عليك الاشتراك في المقرر لتتمكن من تشغيل المحاضرات الكاملة وعرض المرفقات.</p>
                  <button onClick={() => addToCart(selectedCourse)} className="bg-primary text-primary-foreground text-xs font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition">
                    اشترك بالمقرر لفتح المحتوى
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl border space-y-4 shadow-sm bg-surface border-border">
              <h3 className="font-bold text-sm flex items-center gap-2 border-b border-border pb-3">
                <Layout className="w-4 h-4 text-primary"/> محتويات المقرر ({lessons.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {lessons.map((l) => (
                  <button key={l.id} onClick={() => setSelectedLesson(l)} className={`w-full text-right p-3.5 rounded-2xl text-xs flex justify-between items-center transition-all ${selectedLesson?.id === l.id ? 'bg-primary/10 font-bold border border-primary/20 text-primary' : 'hover:bg-muted border border-transparent text-muted-foreground'}`}>
                    <span className="flex-1 truncate ml-2">
                      {l.title} {l.is_preview && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold mr-2">مفتوح</span>}
                    </span>
                    {!isSubscribedToSelected && !l.is_preview && <Lock className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                    {(isSubscribedToSelected || l.is_preview) && <PlayCircle className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl bg-surface border-border text-foreground">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> سلة المشتريات ({cart.length})</h3>
              <button onClick={() => setShowCartModal(false)} className="text-muted-foreground hover:text-foreground bg-muted p-1.5 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            {cart.length > 0 ? (
              <div className="space-y-5">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-border text-xs bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary"/>
                        </div>
                        <div>
                          <span className="font-bold block mb-1">{item.title}</span>
                          <span className="text-emerald-500 font-bold">{item.price ? `${item.price} ر.س` : 'مجاني'}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                {platformSettings.coupons_enabled !== false && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="كود الخصم (إن وجد)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors"
                    />
                    <button onClick={applyMasterCoupon} className="bg-muted hover:bg-primary/10 text-foreground font-bold px-5 py-3 rounded-xl text-xs transition-colors">تطبيق</button>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-2xl space-y-2 border border-border">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>المجموع الفرعي:</span>
                    <span>{cartTotal} ر.س</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between items-center text-xs text-emerald-500">
                      <span>الخصم ({discountApplied.code}):</span>
                      <span>- {discountApplied.type === 'percent' ? `${discountApplied.value}%` : `${discountApplied.value} ر.س`}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-black">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-primary text-lg">{finalCartTotal} ر.س</span>
                  </div>
                </div>

                {platformSettings.purchase_enabled === false ? (
                  <p className="text-center text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-4">
                    عذراً، عملية الشراء متوقفة مؤقتاً من قبل إدارة المنصة
                  </p>
                ) : (
                  <button onClick={handleCompleteCheckout} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1">
                    إتمام الدفع وتفعيل الاشتراك فوراً
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-20 mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">سلة المشتريات فارغة حالياً.</p>
                <button onClick={() => setShowCartModal(false)} className="text-xs text-primary font-bold hover:underline">تصفح المقررات</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAiBot && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[360px] max-w-sm animate-in slide-in-from-bottom-4">
          <div className="rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[28rem] sm:h-[32rem] bg-surface border-border">
            <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md z-10">
              <span className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Masari AI</span>
              <button onClick={() => setShowAiBot(false)} className="text-primary-foreground hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-muted/10">
              {aiResponses.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-muted-foreground">أهلاً بك! أنا مساعدك الذكي.<br/>اسألني عن أي مقرر وسأبحث لك عنه فوراً.</p>
                </div>
              )}
              {aiResponses.map((r, i) => (
                <div key={i} className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${r.role === 'user' ? 'bg-primary text-primary-foreground mr-auto rounded-tr-sm' : 'ml-auto bg-background text-foreground border border-border rounded-tl-sm'}`}>
                  {r.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2 bg-background">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiMasterSend()}
                placeholder="اسأل هنا..."
                className="flex-1 border border-border rounded-xl px-4 py-3 text-xs bg-muted/50 focus:bg-background focus:outline-none focus:border-primary transition-colors"
              />
              <button onClick={handleAiMasterSend} className="bg-primary text-primary-foreground px-4 py-3 rounded-xl transition-transform hover:scale-105 shadow-md">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}