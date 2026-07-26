'use client';

/**
 * لوحة تحكم مساري | Masari Admin
 * =========================================================================
 * قائمة الإصلاحات الحقيقية في هذه النسخة (مقارنة بالملف الذي تم رفعه):
 *
 * 1) ثغرة أمنية في التحقق من صلاحية الأدمن (الأخطر):
 *    عند فشل استدعاء supabase.auth.getUser() لأي سبب (مشكلة شبكة مثلاً)،
 *    كان الكود القديم في catch يستدعي loadData() ويحمّل كل بيانات لوحة
 *    التحكم بدون أي تحقق من الهوية! تم تصحيحها بحيث يُعاد التوجيه للرئيسية
 *    في أي حالة فشل، بدلاً من تحميل البيانات.
 *
 * 2) إدراج معرّفات (id) غير صالحة يدوياً (Math.random().toString()) عند
 *    إنشاء كوبون أو تعليق جديد، رغم أن عمود id في قاعدة البيانات من نوع
 *    uuid ولا يقبل هذه القيمة. هذا كان على الأغلب يجعل عمليات إنشاء
 *    الكوبونات/التعليقات تفشل بصمت في قاعدة البيانات فعلياً (وتظهر فقط
 *    محلياً في المتصفح فتبدو وكأنها نجحت). تم تصحيحها لترك القاعدة تولّد
 *    الـ id تلقائياً واستخدام النتيجة الحقيقية العائدة من الخادم.
 *
 * 3) تبويب "منشئ الاختبارات (Quiz)" وتبويب "إعدادات المنصة والهوية" كانا
 *    موجودين في القائمة الجانبية، ولهما State وحقول بيانات جاهزة، لكن لا
 *    يوجد أي واجهة فعلية تُعرض عند الضغط عليهما — أي أن الضغط عليهما كان
 *    يعرض صفحة فارغة تماماً. تمت إضافة الواجهتين الكاملتين.
 *
 * 4) نموذج "إدارة وترتيب المقاطع" لم يكن يحتوي إطلاقاً على حقول رفع
 *    PDF/الملخص/المرفقات ولا على حقل وصف الدرس رغم وجود كل منطق الرفع
 *    والحقول جاهزة في الكود. تمت إضافتها.
 *
 * 5) زر "تعديل" لأي درس لم يكن موجوداً في قائمة الدروس رغم وجود المودال
 *    الكامل والدوال الخاصة به (openEditLesson / handleUpdateLesson) —
 *    تمت إضافة الزر ليصبح المودال قابلاً للفتح فعلياً.
 *
 * 6) التعليقات: كانت تدعم فقط "حذف"، رغم وجود أعمدة is_pinned / is_hidden
 *    / reply جاهزة بقاعدة البيانات. تمت إضافة تثبيت/إخفاء/رد.
 *
 * 7) الإشعارات المستهدفة: كان النموذج يرسل target_type فقط بدون target_id
 *    (فلا يُحفظ أبداً أي تحديد لدورة أو طالب بعينه، فيصل الإشعار للجميع في
 *    الواجهة الرئيسية بغض النظر عن الاستهداف المختار). تمت إضافة اختيار
 *    الدورة/الطالب المستهدف وحفظه فعلياً.
 *
 * 8) خانة بحث الطلاب (studentSearch) كانت معرّفة في الكود لكن لا يوجد حقل
 *    بحث فعلي في الواجهة ولا فلترة تستخدمها. تمت إضافتها.
 *
 * 9) مخطط "المبيعات اليومي" كان يجمع كل الاشتراكات القديمة حسب اسم اليوم
 *    (الأحد، الاثنين...) فقط، فتُجمع كل أيام الأحد من كل التاريخ في عمود
 *    واحد بدل آخر 7 أيام فعلية فقط. تم تصحيحها لتقارن التاريخ الفعلي.
 *
 * 10) تمت إزالة استيراد خط Cairo المكرر (موروث الآن من app/layout.tsx).
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Users, BookOpen, Video, DollarSign, Settings,
  Trash2, PlusCircle, Check, Eye, EyeOff, ShieldAlert, BarChart3, Ticket,
  Bell, Percent, Search, Edit3, X, GripVertical,
  Palette, History, GraduationCap, RefreshCw, ClipboardList, Plus, MessageSquare, Pin, Send
} from 'lucide-react';

interface Question {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${checked ? 'bg-[#22C55E]' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'right-0.5' : 'right-5'}`} />
    </button>
  );
}

function MiniBarChart({ data, valuePrefix = '' }: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {valuePrefix}{d.value}
          </span>
          <div className="w-full bg-slate-800/80 rounded-lg overflow-hidden flex items-end h-32">
            <div
              className="w-full bg-gradient-to-t from-[#2563EB] to-[#60A5FA] rounded-t-lg transition-all duration-500"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [bgStyle, setBgStyle] = useState<'black' | 'slate' | 'darkRed' | 'darkBlue'>('black');

  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  // بيانات المقرر الجديد
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState<number | ''>('');
  const [newCourseOrigPrice, setNewCourseOrigPrice] = useState<number | ''>('');
  const [newCourseInst, setNewCourseInst] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [sectionType, setSectionType] = useState<'bestseller' | 'courses' | 'summaries' | 'books' | 'quizzes'>('courses');
  const [isPublished, setIsPublished] = useState(true);

  // بيانات الدرس والملفات
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // تعديل الدرس
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // السحب والإفلات للدروس
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // منشئ الاختبارات (Quiz Builder)
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState<number>(30);
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }
  ]);

  // الكوبونات
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponVal, setCouponVal] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>(100);

  // الإشعارات والطلاب
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'course' | 'student'>('all');
  const [notifTargetCourse, setNotifTargetCourse] = useState('');
  const [notifTargetStudent, setNotifTargetStudent] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [newCommentInput, setNewCommentInput] = useState('');
  const [subsCourseFilter, setSubsCourseFilter] = useState('');

  // سجل العمليات والإعدادات
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [toggles, setToggles] = useState({
    registration_enabled: true,
    purchase_enabled: true,
    comments_enabled: true,
    notifications_enabled: true,
    coupons_enabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      setLoadingAuth(true);
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.email === 'falcon911n@gmail.com') {
        await loadData();
      } else {
        alert('عذراً، هذه الصفحة للأدمن فقط.');
        router.push('/');
      }
    } catch (e) {
      // أي فشل في التحقق (شبكة، جلسة منتهية...) يجب أن يمنع الدخول
      // ولا يُحمّل بيانات لوحة التحكم أبداً بدون تحقق فعلي من الهوية.
      alert('تعذر التحقق من صلاحيات الدخول، حاول مرة أخرى.');
      router.push('/');
    } finally {
      setLoadingAuth(false);
    }
  }

  async function loadData() {
    try {
      const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (coursesData) setCourses(coursesData);

      const { data: subsData } = await supabase.from('subscriptions').select('*');
      if (subsData) {
        setSubscriptions(subsData);
        setSubscriptionsCount(subsData.length);
      }

      const { data: couponsData } = await supabase.from('coupons').select('*');
      if (couponsData) setCoupons(couponsData);

      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesData) setStudents(profilesData);

      const { data: commentsData } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
      if (commentsData) setComments(commentsData);

      const { data: auditData } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
      if (auditData) setAuditLog(auditData);

      const { data: quizzesData } = await supabase.from('quizzes').select('*');
      if (quizzesData) setQuizzes(quizzesData);

      const { data: settingsData } = await supabase.from('platform_settings').select('*');
      if (settingsData && settingsData.length > 0) {
        const map: any = {};
        settingsData.forEach((s: any) => { map[s.key] = s.value === 'true'; });
        setToggles((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse);
  }, [selectedCourse]);

  async function fetchLessons(courseId: string) {
    try {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
      if (data) setLessons(data);
    } catch (e) {
      setLessons([]);
    }
  }

  const logAction = async (action: string, details?: string) => {
    try {
      const newLog = { id: Math.random().toString(), action, details: details || '', actor_email: 'falcon911n@gmail.com', created_at: new Date().toISOString() };
      setAuditLog([newLog, ...auditLog]);
      await supabase.from('audit_log').insert([{ action, details: details || '', actor_email: 'falcon911n@gmail.com' }]);
    } catch (e) {}
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' });
    } catch (e) {}
  };

  const handleToggleSetting = async (key: keyof typeof toggles) => {
    const next = !toggles[key];
    setToggles({ ...toggles, [key]: next });
    await saveSetting(key, String(next));
    logAction('تعديل إعداد عام', `${key} = ${next}`);
    setMsg('تم تحديث الإعداد بنجاح');
  };

  const formatYoutubeEmbed = (url: string) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
    else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0];
    else if (url.includes('embed/')) return url;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  // 1. الحفظ الآمن للمقرر
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    try {
      const payload = {
        title: newCourseTitle.trim(),
        code: newCourseCode ? newCourseCode.trim() : null,
        price: Number(newCoursePrice) || 0,
        original_price: Number(newCourseOrigPrice) || 0,
        instructor: newCourseInst ? newCourseInst.trim() : null,
        description: newCourseDesc ? newCourseDesc.trim() : null,
        section_type: sectionType,
        is_published: isPublished
      };

      const { data, error } = await supabase.from('courses').insert([payload]).select();

      if (error) {
        alert(`خطأ في الحفظ بقاعدة البيانات: ${error.message}`);
        return;
      }

      const created = data && data.length > 0 ? data[0] : payload;
      setCourses([created, ...courses]);
      logAction('إضافة مقرر ونشره بالموقع', newCourseTitle);

      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCoursePrice('');
      setNewCourseOrigPrice('');
      setNewCourseInst('');
      setNewCourseDesc('');
      setMsg(`تم حفظ المقرر (${newCourseTitle}) في قسم [${sectionType}] بنجاح! 🎉`);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const togglePublishCourse = async (course: any) => {
    const nextStatus = course.is_published === false ? true : false;
    setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: nextStatus } : c));
    await supabase.from('courses').update({ is_published: nextStatus }).eq('id', course.id);
    logAction(nextStatus ? 'نشر مقرر' : 'إخفاء مقرر', course.title);
    setMsg(nextStatus ? 'تم نشر المقرر ✅' : 'تم إخفاء المقرر 👁️‍🗨️');
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('حذف هذا المقرر نهائياً؟')) return;
    setCourses(courses.filter(c => c.id !== courseId));
    await supabase.from('courses').delete().eq('id', courseId);
    logAction('حذف مقرر', courseId);
    setMsg('تم حذف المقرر بنجاح!');
  };

  // 2. إدارة المقاطع والدروس
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle) return;

    setLoading(true);
    let uploadedPdfUrl = '';
    let uploadedSummaryUrl = '';
    let uploadedAssignmentUrl = '';

    try {
      if (pdfFile) {
        const fileName = `pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.${pdfFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('slides').upload(fileName, pdfFile);
        if (upErr) setMsg(`تعذر رفع ملف PDF: ${upErr.message}`);
        else uploadedPdfUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (summaryFile) {
        const fileName = `sum_${Date.now()}_${Math.random().toString(36).slice(2)}.${summaryFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('slides').upload(fileName, summaryFile);
        if (upErr) setMsg(`تعذر رفع ملف الملخص: ${upErr.message}`);
        else uploadedSummaryUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (assignmentFile) {
        const fileName = `asg_${Date.now()}_${Math.random().toString(36).slice(2)}.${assignmentFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('slides').upload(fileName, assignmentFile);
        if (upErr) setMsg(`تعذر رفع المرفق: ${upErr.message}`);
        else uploadedAssignmentUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }

      const newLessonObj = {
        course_id: selectedCourse,
        title: lessonTitle,
        description: lessonDesc,
        video_url: formatYoutubeEmbed(videoUrlInput),
        pdf_url: uploadedPdfUrl,
        summary_url: uploadedSummaryUrl,
        assignment_url: uploadedAssignmentUrl,
        is_preview: isPreview,
        is_published: true,
        order_index: lessons.length + 1
      };

      const { data, error } = await supabase.from('lessons').insert([newLessonObj]).select();
      if (error) {
        setMsg(`تعذر حفظ الدرس: ${error.message}`);
        return;
      }
      if (data) setLessons([...lessons, data[0]]);
      logAction('إضافة درس', lessonTitle);
      setLessonTitle('');
      setLessonDesc('');
      setVideoUrlInput('');
      setIsPreview(false);
      setPdfFile(null);
      setSummaryFile(null);
      setAssignmentFile(null);
      setFileInputKey((k) => k + 1);
      setMsg('تم نشر الدرس بنجاح! 🎬');
    } catch (e: any) {
      setMsg(`حدث خطأ أثناء حفظ الدرس: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('حذف هذا المقطع المحدد فقط؟')) return;
    setLessons(lessons.filter(l => l.id !== lessonId));
    await supabase.from('lessons').delete().eq('id', lessonId);
    logAction('حذف درس', lessonId);
    setMsg('تم حذف المقطع المحدد بنجاح');
  };

  const toggleLessonPublish = async (lesson: any) => {
    const next = lesson.is_published === false ? true : false;
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_published: next } : l));
    await supabase.from('lessons').update({ is_published: next }).eq('id', lesson.id);
    logAction(next ? 'إظهار درس' : 'إخفاء درس', lesson.title);
    setMsg(next ? 'تم إظهار المقطع للطلاب' : 'تم إخفاء المقطع');
  };

  const toggleLessonPreview = async (lesson: any) => {
    const next = !lesson.is_preview;
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_preview: next } : l));
    await supabase.from('lessons').update({ is_preview: next }).eq('id', lesson.id);
    logAction('تعديل معاينة درس', lesson.title);
    setMsg(next ? 'تم تفعيل المعاينة المجانية لهذا المقطع' : 'تم إلغاء المعاينة');
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title || '');
    setEditDesc(lesson.description || '');
    setEditVideoUrl(lesson.video_url || '');
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    setSavingEdit(true);
    try {
      const updates = { title: editTitle, description: editDesc, video_url: formatYoutubeEmbed(editVideoUrl) };
      await supabase.from('lessons').update(updates).eq('id', editingLesson.id);
      setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, ...updates } : l));
      setEditingLesson(null);
      setMsg('تم تحديث الدرس بنجاح!');
    } catch (e) {
      setMsg('تم التحديث');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...lessons];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);
    setLessons(reordered);
    setDraggedIndex(null);

    await Promise.all(
      reordered.map((lesson, i) => supabase.from('lessons').update({ order_index: i + 1 }).eq('id', lesson.id))
    );
    logAction('إعادة ترتيب الدروس', selectedCourse);
    setMsg('تم تحديث ترتيب الدروس بنجاح!');
  };

  // 3. منشئ الاختبارات التفاعلية
  const addQuestionField = () => {
    setQuestions([...questions, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }]);
  };

  const updateQuestionField = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestionField = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCourseId || !quizTitle) return;

    try {
      const payload = { course_id: quizCourseId, title: quizTitle, duration_minutes: quizDuration, questions, is_published: true };
      const { data, error } = await supabase.from('quizzes').insert([payload]).select();
      if (error) {
        alert(`تعذر نشر الاختبار: ${error.message}`);
        return;
      }
      const created = data && data.length > 0 ? data[0] : payload;
      setQuizzes([...quizzes, created]);
      logAction('إنشاء اختبار', quizTitle);
      setQuizTitle('');
      setQuizCourseId('');
      setQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }]);
      setMsg('تم نشر الاختبار بالمنصة! 📝');
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('حذف هذا الاختبار؟')) return;
    setQuizzes(quizzes.filter((q) => q.id !== id));
    await supabase.from('quizzes').delete().eq('id', id);
    logAction('حذف اختبار', id);
    setMsg('تم حذف الاختبار');
  };

  // 4. الطلاب
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase().trim();
    return students.filter((s) => (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }, [students, studentSearch]);

  const toggleStudentActive = async (student: any) => {
    const next = student.is_active === false ? true : false;
    setStudents(students.map(s => s.id === student.id ? { ...s, is_active: next } : s));
    await supabase.from('profiles').update({ is_active: next }).eq('id', student.id);
    setMsg(next ? 'تم تفعيل الطالب' : 'تم إيقاف الطالب');
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm('حذف الطالب؟')) return;
    setStudents(students.filter(s => s.id !== student.id));
    await supabase.from('profiles').delete().eq('id', student.id);
    setMsg('تم حذف الطالب');
  };

  const quickNotifyStudent = (student: any) => {
    setActiveTab('notifs');
    setNotifTarget('student');
    setNotifTargetStudent(student.id);
  };

  // 5. المشتركين
  const courseSubscribers = useMemo(() => {
    if (!subsCourseFilter) return [];
    return subscriptions.filter((s) => s.course_id === subsCourseFilter);
  }, [subscriptions, subsCourseFilter]);

  const removeSubscriber = async (sub: any) => {
    if (!confirm('إزالة الطالب من الدورة؟')) return;
    setSubscriptions(subscriptions.filter(s => s.id !== sub.id));
    setSubscriptionsCount(Math.max(0, subscriptionsCount - 1));
    await supabase.from('subscriptions').delete().eq('id', sub.id);
    setMsg('تمت إزالة الطالب');
  };

  const studentName = (userId: string) => {
    const p = students.find((s) => s.id === userId);
    return p?.full_name || p?.email || userId?.slice(0, 8) + '...';
  };

  // 6. الكوبونات
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponVal) return;
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        discount_value: Number(couponVal),
        max_uses: Number(maxUses) || 100,
        is_active: true
      };
      const { data, error } = await supabase.from('coupons').insert([payload]).select();
      if (error) {
        alert(`تعذر إضافة الكوبون: ${error.message}`);
        return;
      }
      const created = data && data.length > 0 ? data[0] : payload;
      setCoupons([...coupons, created]);
      logAction('إضافة كوبون خصم', payload.code);
      setCouponCode('');
      setCouponVal('');
      setMsg('تم إضافة الكوبون! 🎟️');
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const toggleCouponStatus = async (id: string, active: boolean) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !active } : c));
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
  };

  const handleDeleteCoupon = async (id: string) => {
    setCoupons(coupons.filter(c => c.id !== id));
    await supabase.from('coupons').delete().eq('id', id);
  };

  // 7. التعليقات
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    try {
      const payload = { user_name: 'أدمن المنصة', content: newCommentInput.trim(), rating: 5, is_hidden: false, is_pinned: false };
      const { data, error } = await supabase.from('comments').insert([payload]).select();
      if (error) {
        alert(`تعذر نشر التعليق: ${error.message}`);
        return;
      }
      const created = data && data.length > 0 ? data[0] : payload;
      setComments([created, ...comments]);
      setNewCommentInput('');
      setMsg('تم النشر!');
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const deleteComment = async (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    await supabase.from('comments').delete().eq('id', id);
  };

  const toggleCommentPin = async (c: any) => {
    const next = !c.is_pinned;
    setComments(comments.map((x) => x.id === c.id ? { ...x, is_pinned: next } : x));
    await supabase.from('comments').update({ is_pinned: next }).eq('id', c.id);
  };

  const toggleCommentHidden = async (c: any) => {
    const next = !c.is_hidden;
    setComments(comments.map((x) => x.id === c.id ? { ...x, is_hidden: next } : x));
    await supabase.from('comments').update({ is_hidden: next }).eq('id', c.id);
    setMsg(next ? 'تم إخفاء التعليق عن الرئيسية' : 'التعليق ظاهر الآن بالرئيسية');
  };

  const sendCommentReply = async (c: any) => {
    const replyText = (replyDrafts[c.id] || '').trim();
    if (!replyText) return;
    setComments(comments.map((x) => x.id === c.id ? { ...x, reply: replyText } : x));
    await supabase.from('comments').update({ reply: replyText }).eq('id', c.id);
    setReplyDrafts({ ...replyDrafts, [c.id]: '' });
    setMsg('تم إرسال الرد بنجاح');
  };

  // 8. الإشعارات
  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;
    const targetId = notifTarget === 'course' ? notifTargetCourse : notifTarget === 'student' ? notifTargetStudent : null;
    if (notifTarget !== 'all' && !targetId) {
      setMsg('يرجى اختيار الدورة أو الطالب المستهدف أولاً');
      return;
    }
    try {
      await supabase.from('notifications').insert([{
        title: notifTitle,
        message: notifMsg,
        target_type: notifTarget,
        target_id: targetId,
        is_global: notifTarget === 'all'
      }]);
      logAction('إرسال إشعار', `${notifTarget}: ${notifTitle}`);
      setNotifTitle('');
      setNotifMsg('');
      setNotifTarget('all');
      setNotifTargetCourse('');
      setNotifTargetStudent('');
      setMsg('تم إرسال الإشعار بنجاح! 🔔');
    } catch (err: any) {
      setMsg('حدث خطأ أثناء إرسال الإشعار');
    }
  };

  // الأرباح الحقيقية — تمت إعادة بناء مخطط آخر 7 أيام بمقارنة تاريخ فعلي
  // بدلاً من مطابقة اسم اليوم فقط (كانت تخلط كل تاريخ الاشتراكات في 7 خانات)
  const earnings = useMemo(() => {
    const total = subscriptions.reduce((sum, s) => {
      const course = courses.find((c) => c.id === s.course_id);
      return sum + (course?.price || 0);
    }, 0);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('ar-SA', { weekday: 'short' });
      return { dateKey, label, value: 0 };
    });

    subscriptions.forEach((sub) => {
      if (sub.created_at) {
        const subDateKey = new Date(sub.created_at).toISOString().slice(0, 10);
        const course = courses.find((c) => c.id === sub.course_id);
        const price = course?.price || 0;
        const found = last7Days.find((d) => d.dateKey === subDateKey);
        if (found) found.value += price;
      }
    });

    return { total, chartData: last7Days.map(({ label, value }) => ({ label, value })) };
  }, [subscriptions, courses]);

  const themeClasses = useMemo(() => {
    switch (bgStyle) {
      case 'black': return { bg: 'bg-black text-white', card: 'bg-zinc-950 border-zinc-800', sidebar: 'bg-zinc-950 border-zinc-800' };
      case 'darkRed': return { bg: 'bg-[#0F172A] text-slate-100', card: 'bg-slate-900 border-red-900/40', sidebar: 'bg-slate-900 border-red-900/40' };
      case 'darkBlue': return { bg: 'bg-[#0F172A] text-slate-100', card: 'bg-slate-900 border-blue-900/40', sidebar: 'bg-slate-900 border-blue-900/40' };
      default: return { bg: 'bg-slate-950 text-slate-100', card: 'bg-slate-900 border-slate-800', sidebar: 'bg-slate-900 border-slate-800' };
    }
  }, [bgStyle]);

  if (loadingAuth) {
    return (
      <div dir="rtl" className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
          <span className="text-sm font-bold">جاري فتح لوحة الأدمن...</span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`min-h-screen ${themeClasses.bg} flex transition-colors duration-300`}>

      <aside className={`w-64 ${themeClasses.sidebar} border-l p-6 space-y-8 shrink-0 hidden md:block overflow-y-auto`}>
        <div className="flex items-center gap-2.5">
          <div className="bg-[#2563EB] p-2.5 rounded-2xl text-white shadow-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base text-[#2563EB]">لوحة الأدمن</h1>
            <p className="text-[10px] text-slate-400">إدارة منصة مساري</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-amber-400" /> خلفية اللوحة:</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
            <button type="button" onClick={() => setBgStyle('black')} className={`p-2 rounded-xl border ${bgStyle === 'black' ? 'border-white bg-white/10 text-white' : 'border-slate-800 text-slate-400'}`}>أسود فاخر</button>
            <button type="button" onClick={() => setBgStyle('slate')} className={`p-2 rounded-xl border ${bgStyle === 'slate' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-400'}`}>داكن Slate</button>
            <button type="button" onClick={() => setBgStyle('darkRed')} className={`p-2 rounded-xl border ${bgStyle === 'darkRed' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 text-slate-400'}`}>أحمر</button>
            <button type="button" onClick={() => setBgStyle('darkBlue')} className={`p-2 rounded-xl border ${bgStyle === 'darkBlue' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 text-slate-400'}`}>أزرق</button>
          </div>
        </div>

        <nav className="space-y-1 text-xs font-bold text-slate-400">
          {[
            { id: 'dashboard', label: 'الإحصائيات والأرباح', icon: BarChart3 },
            { id: 'add_course', label: 'إضافة مقرر / كتاب / ملخص', icon: PlusCircle },
            { id: 'courses', label: 'إدارة المقررات والإخفاء', icon: BookOpen },
            { id: 'add_lesson', label: 'إدارة وترتيب وحذف المقاطع', icon: Video },
            { id: 'quizzes', label: 'منشئ الاختبارات (Quiz)', icon: ClipboardList },
            { id: 'students', label: 'إدارة الطلاب', icon: Users },
            { id: 'subscribers', label: 'مشتركو الدورات', icon: GraduationCap },
            { id: 'coupons', label: 'الخصومات والكوبونات', icon: Percent },
            { id: 'comments', label: 'إدارة التعليقات والردود', icon: MessageSquare },
            { id: 'notifs', label: 'الإشعارات التفاعلية', icon: Bell },
            { id: 'settings', label: 'إعدادات المنصة والهوية', icon: Settings },
            { id: 'audit', label: 'سجل العمليات', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-2xl transition ${
                  activeTab === item.id ? 'bg-[#2563EB] text-white shadow-lg' : 'hover:bg-slate-800/60 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-black text-white">إدارة منصة مساري | Masari</h1>
            <p className="text-xs text-slate-400 mt-1">التحكم المباشر والمحفوظ بكافة الأقسام والمحتوى</p>
          </div>
          <button onClick={() => router.push('/')} className="bg-slate-800 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl text-white">
            الانتقال للرئيسية
          </button>
        </header>

        {msg && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <Check className="w-4 h-4" /> <span>{msg}</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
                <span className="text-xs text-slate-400 font-bold">المقررات النشطة</span>
                <p className="text-2xl font-black text-white">{courses.length}</p>
              </div>
              <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
                <span className="text-xs text-slate-400 font-bold">إجمالي الاشتراكات الحقيقية</span>
                <p className="text-2xl font-black text-emerald-400">{subscriptionsCount}</p>
              </div>
              <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> إجمالي الأرباح الفعلية</span>
                <p className="text-2xl font-black text-amber-400">{earnings.total} ر.س</p>
              </div>
            </div>
            <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
              <h3 className="text-sm font-bold text-white">مخطط المبيعات لآخر 7 أيام</h3>
              <MiniBarChart data={earnings.chartData} />
            </div>
          </div>
        )}

        {activeTab === 'add_course' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#2563EB]" /> إضافة محتوى جديد وتحديد القسم
            </h2>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">القسم:</label>
                  <select value={sectionType} onChange={(e: any) => setSectionType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs">
                    <option value="courses">قسم الدورات الأساسي</option>
                    <option value="bestseller">قسم الأكثر مبيعاً</option>
                    <option value="summaries">قسم الملخصات</option>
                    <option value="books">قسم الكتب</option>
                    <option value="quizzes">قسم الاختبارات</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">اسم المادة:</label>
                  <input type="text" placeholder="مثال: رياضيات 101" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="رمز المقرر" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />
                <input type="number" placeholder="السعر" value={newCoursePrice} onChange={(e) => setNewCoursePrice(e.target.value === '' ? '' : Number(e.target.value))} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />
                <input type="text" placeholder="اسم المحاضر" value={newCourseInst} onChange={(e) => setNewCourseInst(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />
              </div>
              <textarea placeholder="الوصف..." value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-xs font-bold text-slate-300">نشر المقرر مباشرة بعد الحفظ (إيقافه يحفظه كمسودة مخفية)</span>
                <Toggle checked={isPublished} onChange={() => setIsPublished(!isPublished)} />
              </div>

              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3.5 rounded-2xl text-xs">حفظ ونشر المقرر</button>
            </form>
          </section>
        )}

        {activeTab === 'courses' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" /> المقررات المسجلة ({courses.length})</h2>
            <div className="space-y-2.5">
              {courses.map((course) => (
                <div key={course.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white ml-2">{course.title}</span>
                    <span className="text-emerald-400 font-bold ml-2">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] ml-2">قسم: {course.section_type || 'دورات'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => togglePublishCourse(course)} className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 ${course.is_published !== false ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                      {course.is_published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {course.is_published !== false ? 'منشور' : 'مخفي'}
                    </button>
                    <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'add_lesson' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Video className="w-5 h-5 text-purple-400" /> إدارة وترتيب وحذف المقاطع الفردية وتعيين المعاينة</h2>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required>
                <option value="">-- اختر المقرر --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input type="text" placeholder="عنوان المقطع/الدرس" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <textarea placeholder="وصف الدرس (اختياري)" value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />
              <input type="url" placeholder="رابط يوتيوب" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">ملف PDF للدرس</label>
                  <input key={`pdf-${fileInputKey}`} type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl p-2 text-[11px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">ملف الملخص</label>
                  <input key={`sum-${fileInputKey}`} type="file" onChange={(e) => setSummaryFile(e.target.files?.[0] || null)} className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl p-2 text-[11px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">ملف الواجب/المرفق</label>
                  <input key={`asg-${fileInputKey}`} type="file" onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)} className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl p-2 text-[11px]" />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <input type="checkbox" id="prevCheck" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <label htmlFor="prevCheck" className="text-xs text-slate-300 font-bold cursor-pointer">جعل هذا الدرس معاينة مجانية (Free Preview)</label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-2xl text-xs disabled:opacity-60">{loading ? 'جاري الحفظ...' : 'حفظ ونشر المقطع'}</button>
            </form>

            {selectedCourse && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white">ترتيب ومقاطع الدورة (اسحب لترتيب، أو عدّل/احذف مقطعاً مخصصاً):</h3>
                <div className="space-y-2">
                  {lessons.map((l, idx) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-500">#{idx + 1}</span>
                        <span className="font-bold text-white">{l.title}</span>
                        {l.is_preview && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold mr-2">معاينة مجانية</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleLessonPreview(l)} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${l.is_preview ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          {l.is_preview ? 'إلغاء المعاينة' : 'جعلها معاينة'}
                        </button>
                        <button type="button" onClick={() => toggleLessonPublish(l)} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${l.is_published !== false ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                          {l.is_published !== false ? 'منشور (إخفاء)' : 'مخفي (إظهار)'}
                        </button>
                        <button type="button" onClick={() => openEditLesson(l)} className="text-blue-400 p-1.5 hover:bg-blue-500/10 rounded-xl" title="تعديل الدرس">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteLesson(l.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl" title="حذف هذا المقطع المحدد فقط">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'quizzes' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-400" /> منشئ الاختبارات التفاعلية
            </h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={quizCourseId} onChange={(e) => setQuizCourseId(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required>
                  <option value="">-- اختر المقرر --</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input type="text" placeholder="عنوان الاختبار" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required />
                <input type="number" placeholder="مدة الاختبار (دقيقة)" value={quizDuration} onChange={(e) => setQuizDuration(Number(e.target.value) || 30)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" />
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400">السؤال #{idx + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestionField(idx)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <input type="text" placeholder="نص السؤال" value={q.question} onChange={(e) => updateQuestionField(idx, 'question', e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input type="text" placeholder="الخيار A" value={q.optionA} onChange={(e) => updateQuestionField(idx, 'optionA', e.target.value)} className="bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs" />
                      <input type="text" placeholder="الخيار B" value={q.optionB} onChange={(e) => updateQuestionField(idx, 'optionB', e.target.value)} className="bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs" />
                      <input type="text" placeholder="الخيار C" value={q.optionC} onChange={(e) => updateQuestionField(idx, 'optionC', e.target.value)} className="bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs" />
                      <input type="text" placeholder="الخيار D" value={q.optionD} onChange={(e) => updateQuestionField(idx, 'optionD', e.target.value)} className="bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs" />
                    </div>
                    <select value={q.correct} onChange={(e) => updateQuestionField(idx, 'correct', e.target.value)} className="bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs">
                      <option value="A">الإجابة الصحيحة: A</option>
                      <option value="B">الإجابة الصحيحة: B</option>
                      <option value="C">الإجابة الصحيحة: C</option>
                      <option value="D">الإجابة الصحيحة: D</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={addQuestionField} className="bg-slate-800 border border-slate-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> إضافة سؤال
                </button>
                <button type="submit" className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-2xl text-xs">نشر الاختبار</button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300">الاختبارات المنشورة ({quizzes.length})</h3>
              {quizzes.map((qz) => (
                <div key={qz.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white ml-2">{qz.title}</span>
                    <span className="text-slate-400">{Array.isArray(qz.questions) ? qz.questions.length : 0} سؤال - {qz.duration_minutes} دقيقة</span>
                  </div>
                  <button type="button" onClick={() => handleDeleteQuiz(qz.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'students' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <h2 className="text-base font-bold text-white"><Users className="w-5 h-5 inline ml-1.5 text-purple-400" /> إدارة الطلاب ({filteredStudents.length})</h2>
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pr-8 pl-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredStudents.map((st) => (
                <div key={st.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-white">{st.full_name || 'طالب'}</p>
                    <p className="text-[10px] text-slate-400">{st.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => quickNotifyStudent(st)} className="text-blue-400 p-1.5"><Bell className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => toggleStudentActive(st)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${st.is_active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {st.is_active !== false ? 'نشط' : 'موقوف'}
                    </button>
                    <button type="button" onClick={() => handleDeleteStudent(st)} className="text-red-400 p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">لا توجد نتائج مطابقة للبحث.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'subscribers' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white"><GraduationCap className="w-5 h-5 inline ml-1.5 text-blue-400" /> مشتركو الدورات</h2>
            <select value={subsCourseFilter} onChange={(e) => setSubsCourseFilter(e.target.value)} className="w-full max-w-md bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs">
              <option value="">-- اختر الدورة --</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {subsCourseFilter && (
              <div className="space-y-2 pt-2">
                {courseSubscribers.map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <span className="font-bold text-white">{studentName(sub.user_id)}</span>
                    <button type="button" onClick={() => removeSubscriber(sub)} className="text-red-400 text-[10px] font-bold">إلغاء الاشتراك</button>
                  </div>
                ))}
                {courseSubscribers.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">لا يوجد مشتركون في هذه الدورة بعد.</p>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'coupons' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white"><Ticket className="w-5 h-5 inline ml-1.5 text-blue-400" /> الكوبونات</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="رمز الكوبون" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required />
                <select value={couponType} onChange={(e: any) => setCouponType(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs">
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (SAR)</option>
                </select>
                <input type="number" placeholder="قيمة الخصم" value={couponVal} onChange={(e) => setCouponVal(e.target.value === '' ? '' : Number(e.target.value))} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required />
              </div>
              <input type="number" placeholder="الحد الأقصى لعدد مرات الاستخدام" value={maxUses} onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" />
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">إضافة الكوبون</button>
            </form>
            <div className="space-y-2">
              {coupons.map((cp) => (
                <div key={cp.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-blue-400 ml-2">{cp.code}</span>
                    <span className="text-slate-400">{cp.used_count || 0} / {cp.max_uses} استخدام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleCouponStatus(cp.id, cp.is_active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${cp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {cp.is_active ? 'مفعّل' : 'موقوف'}
                    </button>
                    <button type="button" onClick={() => handleDeleteCoupon(cp.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'comments' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white"><MessageSquare className="w-5 h-5 inline ml-1.5 text-purple-400" /> التعليقات</h2>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" placeholder="تعليق جديد..." value={newCommentInput} onChange={(e) => setNewCommentInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-2 text-xs" />
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-2xl text-xs font-bold">نشر</button>
            </form>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {c.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400" />} {c.user_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => toggleCommentPin(c)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${c.is_pinned ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        {c.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                      </button>
                      <button type="button" onClick={() => toggleCommentHidden(c)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${c.is_hidden ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {c.is_hidden ? 'مخفي' : 'ظاهر'}
                      </button>
                      <button type="button" onClick={() => deleteComment(c.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-slate-300">{c.content}</p>
                  {c.reply && <p className="text-blue-400 border-r-2 border-blue-500 pr-2">رد الإدارة: {c.reply}</p>}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="اكتب رداً..."
                      value={replyDrafts[c.id] || ''}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-[11px]"
                    />
                    <button type="button" onClick={() => sendCommentReply(c)} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
                      <Send className="w-3 h-3" /> رد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'notifs' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white"><Bell className="w-5 h-5 inline ml-1.5 text-blue-400" /> إرسال إشعار</h2>
            <form onSubmit={handleSendNotif} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'course', 'student'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNotifTarget(t)}
                    className={`p-2.5 rounded-xl text-[11px] font-bold border ${notifTarget === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {t === 'all' ? 'كل الطلاب' : t === 'course' ? 'طلاب دورة معينة' : 'طالب معين'}
                  </button>
                ))}
              </div>

              {notifTarget === 'course' && (
                <select value={notifTargetCourse} onChange={(e) => setNotifTargetCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required>
                  <option value="">-- اختر الدورة المستهدفة --</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
              {notifTarget === 'student' && (
                <select value={notifTargetStudent} onChange={(e) => setNotifTargetStudent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required>
                  <option value="">-- اختر الطالب المستهدف --</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                </select>
              )}

              <input type="text" placeholder="العنوان" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <textarea placeholder="المحتوى..." value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">إرسال</button>
            </form>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-300" /> الإعدادات العامة للمنصة
            </h2>
            <div className="space-y-3">
              {[
                { key: 'registration_enabled', label: 'تفعيل التسجيل للطلاب الجدد' },
                { key: 'purchase_enabled', label: 'تفعيل الشراء والاشتراكات' },
                { key: 'comments_enabled', label: 'تفعيل التعليقات على المنصة' },
                { key: 'notifications_enabled', label: 'تفعيل الإشعارات' },
                { key: 'coupons_enabled', label: 'تفعيل كوبونات الخصم' },
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  <Toggle checked={(toggles as any)[item.key]} onChange={() => handleToggleSetting(item.key as any)} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              هذه الإعدادات تُقرأ فعلياً من الصفحة الرئيسية وصفحة الدخول (إخفاء زر الإشعارات، تعطيل الدفع، تعطيل التسجيل...) وتُحفظ في جدول platform_settings.
            </p>
          </section>
        )}

        {activeTab === 'audit' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white"><History className="w-5 h-5 inline ml-1.5 text-slate-400" /> سجل العمليات</h2>
            <div className="space-y-2">
              {auditLog.map((log) => (
                <div key={log.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                  <div><span className="font-bold text-white ml-2">{log.action}</span><span className="text-slate-400">{log.details}</span></div>
                  <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString('ar-SA')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {editingLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-400">تعديل الدرس</h3>
              <button type="button" onClick={() => setEditingLesson(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="عنوان الدرس" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="الوصف" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="رابط يوتيوب" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingLesson(null)} className="flex-1 bg-slate-800 border border-slate-700 text-white font-bold py-3 rounded-xl text-xs">إلغاء</button>
              <button type="button" onClick={handleUpdateLesson} disabled={savingEdit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-xs disabled:opacity-60">
                {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}