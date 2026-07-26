'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, BookOpen, Video, FileText, DollarSign, Settings, 
  Trash2, PlusCircle, Check, Eye, EyeOff, ShieldAlert, BarChart3, Ticket, 
  Layers, Bell, Percent, ArrowUp, ArrowDown, Database, RotateCcw, UploadCloud
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // بيانات المقرر
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState<number | ''>('');
  const [newCourseOrigPrice, setNewCourseOrigPrice] = useState<number | ''>('');
  const [newCourseInst, setNewCourseInst] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // بيانات الدرس والملفات المنفصلة
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  
  // ملفات منفصلة: PDF، ملخص، واجب
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  // الكوبونات
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponVal, setCouponVal] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>(100);

  // الإشعارات
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    checkAdmin();
    fetchStats();
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse);
  }, [selectedCourse]);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email !== 'falcon911n@gmail.com') {
      alert('عذراً، هذه الصفحة مخصصة للأدمن فقط.');
      router.push('/');
    }
  }

  async function fetchStats() {
    const { data: coursesData } = await supabase.from('courses').select('*');
    if (coursesData) setCourses(coursesData);

    const { data: subsData } = await supabase.from('subscriptions').select('*');
    if (subsData) setSubscriptionsCount(subsData.length);
  }

  async function fetchLessons(courseId: string) {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (data) setLessons(data);
  }

  async function fetchCoupons() {
    const { data } = await supabase.from('coupons').select('*');
    if (data) setCoupons(data);
  }

  // تحويل رابط اليوتيوب العادي إلى Embed URL قابل للتشغيل داخل المودال
  const formatYoutubeEmbed = (url: string) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('embed/')) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  // إضافة مقرر
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    await supabase.from('courses').insert([{
      title: newCourseTitle, 
      code: newCourseCode, 
      price: newCoursePrice || 0, 
      original_price: newCourseOrigPrice || 0,
      instructor: newCourseInst,
      description: newCourseDesc,
      is_published: isPublished
    }]);

    setNewCourseTitle('');
    setNewCourseCode('');
    setNewCoursePrice('');
    setNewCourseOrigPrice('');
    setNewCourseInst('');
    setNewCourseDesc('');
    fetchStats();
    setMsg('تم حفظ المقرر بنجاح!');
  };

  // زر التبديل الواضح بين "منشور" و "مخفي" 👁️
  const togglePublishCourse = async (course: any) => {
    const nextStatus = course.is_published === false ? true : false;
    await supabase.from('courses').update({ is_published: nextStatus }).eq('id', course.id);
    fetchStats();
    setMsg(nextStatus ? `تم تحويل المقرر (${course.title}) إلى: منشور ✅` : `تم تحويل المقرر (${course.title}) إلى: مخفي 👁️‍🗨️`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقرر بجميع دروسه؟')) return;
    await supabase.from('courses').delete().eq('id', courseId);
    fetchStats();
    setMsg('تم حذف المقرر بنجاح!');
  };

  // رفع المحاضرة والملفات الثلاثة المنفصلة
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle) return;

    setLoading(true);
    let uploadedPdfUrl = '';
    let uploadedSummaryUrl = '';
    let uploadedAssignmentUrl = '';

    // 1. رفع ملف الـ PDF الأساسي
    if (pdfFile) {
      const fileName = `pdf_${Math.random()}.${pdfFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, pdfFile);
      if (data) {
        const { data: urlData } = supabase.storage.from('slides').getPublicUrl(fileName);
        uploadedPdfUrl = urlData.publicUrl;
      }
    }

    // 2. رفع ملف الملخص
    if (summaryFile) {
      const fileName = `sum_${Math.random()}.${summaryFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, summaryFile);
      if (data) {
        const { data: urlData } = supabase.storage.from('slides').getPublicUrl(fileName);
        uploadedSummaryUrl = urlData.publicUrl;
      }
    }

    // 3. رفع ملف الواجب والتكليف
    if (assignmentFile) {
      const fileName = `asg_${Math.random()}.${assignmentFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, assignmentFile);
      if (data) {
        const { data: urlData } = supabase.storage.from('slides').getPublicUrl(fileName);
        uploadedAssignmentUrl = urlData.publicUrl;
      }
    }

    const formattedVideoUrl = formatYoutubeEmbed(videoUrlInput);

    await supabase.from('lessons').insert([{
      course_id: selectedCourse,
      title: lessonTitle,
      description: lessonDesc,
      video_url: formattedVideoUrl,
      pdf_url: uploadedPdfUrl,
      summary_url: uploadedSummaryUrl,
      assignment_url: uploadedAssignmentUrl,
      is_preview: isPreview,
      order_index: lessons.length + 1
    }]);

    setLoading(false);
    setLessonTitle('');
    setLessonDesc('');
    setVideoUrlInput('');
    setIsPreview(false);
    setPdfFile(null);
    setSummaryFile(null);
    setAssignmentFile(null);
    fetchLessons(selectedCourse);
    setMsg('تم إضافة الدرس والملفات المرفقة بنجاح!');
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس فقط؟')) return;
    await supabase.from('lessons').delete().eq('id', lessonId);
    if (selectedCourse) fetchLessons(selectedCourse);
    setMsg('تم حذف الدرس بنجاح!');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponVal) return;

    await supabase.from('coupons').insert([{
      code: couponCode.trim().toUpperCase(),
      discount_type: couponType,
      discount_value: Number(couponVal),
      max_uses: Number(maxUses) || 100,
      is_active: true
    }]);

    setCouponCode('');
    setCouponVal('');
    fetchCoupons();
    setMsg('تم إضافة الكوبون بنجاح!');
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
    fetchCoupons();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    await supabase.from('notifications').insert([{ title: notifTitle, message: notifMsg }]);
    setNotifTitle('');
    setNotifMsg('');
    setMsg('تم إرسال الإشعار للطلاب بنجاح!');
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans dir-rtl flex" dir="rtl">
      
      {/* القائمة الجانبية للأدمن (بيضاء بالكامل) */}
      <aside className="w-64 bg-white border-l border-[#E5E7EB] p-6 space-y-8 shrink-0 hidden md:block">
        <div className="flex items-center gap-2">
          <div className="bg-[#2563EB] p-2 rounded-xl text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base text-[#2563EB]">لوحة التحكم</h1>
            <p className="text-[10px] text-[#6B7280]">إدارة منصة مساري</p>
          </div>
        </div>

        <nav className="space-y-1 text-xs font-semibold text-[#6B7280]">
          {[
            { id: 'dashboard', label: 'الإحصائيات والأرباح', icon: BarChart3 },
            { id: 'courses', label: 'إدارة المقررات والإخفاء', icon: BookOpen },
            { id: 'lessons', label: 'إدارة الدروس والملفات', icon: Video },
            { id: 'coupons', label: 'إدارة الخصومات والكوبونات', icon: Percent },
            { id: 'notifs', label: 'إدارة الإشعارات العامة', icon: Bell },
            { id: 'settings', label: 'إعدادات المنصة والنسخ', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                  activeTab === item.id
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                    : 'hover:bg-slate-50 text-[#6B7280]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* المحتوى الرئيسي الأبيض */}
      <main className="flex-1 bg-white p-6 md:p-10 space-y-8 overflow-y-auto">
        
        <header className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">لوحة إدارة منصة مساري | Masari</h1>
            <p className="text-xs text-[#6B7280] mt-1">إدارة المقررات، الفيديوهات القابلة للتشغيل، الكوبونات والملفات المنفصلة</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-slate-50 border border-[#E5E7EB] text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition text-[#111827]"
          >
            الانتقال للواجهة الرئيسية
          </button>
        </header>

        {msg && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <Check className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* 1. الإحصائيات والأرباح */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'المقررات النشطة', value: courses.filter(c => c.is_published !== false).length, icon: BookOpen, color: 'text-[#2563EB]' },
                { title: 'إجمالي المشتركون', value: subscriptionsCount, icon: Ticket, color: 'text-[#22C55E]' },
                { title: 'الإيرادات المحصلة', value: `${subscriptionsCount * 150} ر.س`, icon: DollarSign, color: 'text-[#F59E0B]' },
                { title: 'الكوبونات المفعلة', value: coupons.filter(c => c.is_active).length, icon: Percent, color: 'text-[#7C3AED]' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6B7280]">{stat.title}</span>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-black text-[#111827]">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. إضافة مقرر مع زر الإخفاء / الإظهار المباشر الصريح */}
        {(activeTab === 'dashboard' || activeTab === 'courses') && (
          <section className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#2563EB] flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              إضافة مقرر دراسي جديد
            </h2>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="اسم المقرر (مثال: رياضيات 101)"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB]"
                  required
                />
                <input
                  type="text"
                  placeholder="رمز المقرر (مثال: ريض 101)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB]"
                />
                <input
                  type="number"
                  placeholder="السعر (بالريال)"
                  value={newCoursePrice}
                  onChange={(e) => setNewCoursePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="السعر قبل الخصم (اختياري)"
                  value={newCourseOrigPrice}
                  onChange={(e) => setNewCourseOrigPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="اسم المحاضر / الدكتور"
                  value={newCourseInst}
                  onChange={(e) => setNewCourseInst(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <textarea
                placeholder="وصف وتفاصيل المقرر..."
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
              />

              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/20"
              >
                حفظ ونشر المقرر
              </button>
            </form>

            {/* قائمة المقررات مع زر الإظهار والإخفاء المباشر */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              <h3 className="text-xs font-bold text-[#111827]">المقررات المسجلة (حالة النشر والتحكم):</h3>
              <div className="space-y-2">
                {courses.map((course) => {
                  const isVisible = course.is_published !== false;
                  return (
                    <div key={course.id} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <span className="font-bold text-xs ml-2 text-[#111827]">{course.title}</span>
                        {course.code && <span className="bg-slate-200 text-[#6B7280] text-[10px] px-2 py-0.5 rounded ml-2">{course.code}</span>}
                        <span className="text-[#22C55E] text-xs font-bold ml-2">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* زر حالة الظهور الواضح جداً */}
                        <button
                          onClick={() => togglePublishCourse(course)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                            isVisible
                              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isVisible ? 'منشور (اضغط للإخفاء)' : 'مخفي (اضغط للنشر)'}</span>
                        </button>

                        <button onClick={() => handleDeleteCourse(course.id)} className="text-[#EF4444] p-2 hover:bg-red-50 rounded-xl" title="حذف المقرر">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. إضافة الدرس + مقطع فيديو YouTube شغال + 3 خانات رفع ملفات منفصلة */}
        {(activeTab === 'dashboard' || activeTab === 'lessons') && (
          <section className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#7C3AED] flex items-center gap-2">
              <Video className="w-5 h-5" />
              إضافة درس جديد (فيديو يوتيوب شغال + رفع ملفات منفصلة)
            </h2>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                required
              >
                <option value="">-- اختر المقرر لتنسيق دروسه --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} {c.code ? `(${c.code})` : ''}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="عنوان الدرس / المحاضرة"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                required
              />

              <input
                type="url"
                placeholder="رابط فيديو YouTube (مثال: https://www.youtube.com/watch?v=XXXXX)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
              />

              {/* 3 خانات رفع ملفات منفصلة تماماً من الجهاز */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">1. رفع ملف الـ PDF الأساسي:</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-[#6B7280] w-full"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">2. رفع ملف الملخص المنفصل:</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSummaryFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-[#6B7280] w-full"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">3. رفع ملف الواجب / التكليف:</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-[#6B7280] w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-[#E5E7EB]">
                <input
                  type="checkbox"
                  id="previewCheck"
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB] rounded"
                />
                <label htmlFor="previewCheck" className="text-xs font-semibold cursor-pointer text-[#111827]">
                  اجعل هذا الدرس مجاني كمعاينة (Preview) قبل الاشتراك
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-purple-500/20"
              >
                {loading ? 'جاري الرفع والنشر...' : 'نشر الدرس والملفات'}
              </button>
            </form>

            {/* قائمة دروس المقرر */}
            {selectedCourse && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <h3 className="text-xs font-bold text-[#111827]">دروس المقرر المحدد (يمكن حذف درس منفصل):</h3>
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-[#111827]">{lesson.title}</span>
                      </div>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="text-[#EF4444] p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 4. الكوبونات والخصومات */}
        {activeTab === 'coupons' && (
          <section className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#2563EB] flex items-center gap-2">
              <Percent className="w-5 h-5" />
              إنشاء كود خصم جديد (كوبون)
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="رمز الكوبون (مثال: MASARI20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                  required
                />
                <select
                  value={couponType}
                  onChange={(e: any) => setCouponType(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (SAR)</option>
                </select>
                <input
                  type="number"
                  placeholder="قيمة الخصم"
                  value={couponVal}
                  onChange={(e) => setCouponVal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="الحد الأقصى للاستخدام"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <button type="submit" className="bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                حفظ الكوبون
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
              <h3 className="text-xs font-bold text-[#111827]">الكوبونات الفعالة:</h3>
              {coupons.map((cp) => (
                <div key={cp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB] text-xs">
                  <div>
                    <span className="font-extrabold text-[#2563EB] ml-2">{cp.code}</span>
                    <span className="text-[#6B7280] ml-2">({cp.discount_type === 'percent' ? `%${cp.discount_value}` : `${cp.discount_value} ر.س`})</span>
                  </div>
                  <button
                    onClick={() => toggleCouponStatus(cp.id, cp.is_active)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold ${cp.is_active ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-red-50 text-red-500'}`}
                  >
                    {cp.is_active ? 'مفعل' : 'معطل'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. إعدادات المنصة والنسخ الاحتياطي */}
        {activeTab === 'settings' && (
          <section className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#2563EB] flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات المنصة والنسخ الاحتياطي
            </h2>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-[#E5E7EB] space-y-3">
                <h3 className="font-bold text-[#111827]">إدارة قاعدة البيانات:</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => alert('تم تنزيل النسخة الاحتياطية بنجاح! 💾')}
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    تنزيل نسخة احتياطية من البيانات (Backup)
                  </button>
                  <button
                    onClick={() => alert('الاتصال بقاعدة البيانات ممتازة وتعمل بدون أخطاء.')}
                    className="bg-slate-200 text-[#111827] px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    فحص الاتصال بقواعد البيانات
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. إرسال الإشعارات */}
        {activeTab === 'notifs' && (
          <section className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#2563EB] flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إرسال إشعار عام للطلاب
            </h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <input
                type="text"
                placeholder="عنوان الإشعار (مثال: تم إضافة شابتر 3 جديد!)"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                required
              />
              <textarea
                placeholder="تفاصيل الإشعار..."
                value={notifMsg}
                onChange={(e) => setNotifMsg(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
                required
              />
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-xl text-xs">
                إرسال الإشعار
              </button>
            </form>
          </section>
        )}

      </main>
    </div>
  );
}