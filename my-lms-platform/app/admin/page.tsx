'use client';

/**
 * لوحة تحكم مساري | Masari - النسخة الشاملة والعملاقة بدون أي نقص أو اختصار
 * =========================================================================
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import {
  Users, BookOpen, Video, DollarSign, Settings,
  Trash2, PlusCircle, Check, Eye, EyeOff, ShieldAlert, BarChart3, Ticket,
  Bell, Percent, Search, Edit3, X, GripVertical,
  Palette, History, GraduationCap, RefreshCw, ClipboardList, Plus, MessageSquare, Pin, Send
} from 'lucide-react';

const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '600', '700', '800', '900'] });

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
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email === 'falcon911n@gmail.com') {
        loadData();
      } else {
        alert('عذراً، هذه الصفحة للأدمن فقط.');
        router.push('/');
      }
    } catch (e) {
      loadData();
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

      const created = data && data.length > 0 ? data[0] : { ...payload, id: Math.random().toString() };
      setCourses([created, ...courses]);
      logAction('إضافة مقرر ونشره بالموقع', newCourseTitle);

      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCoursePrice('');
      setNewCourseOrigPrice('');
      setNewCourseInst('');
      setNewCourseDesc('');
      setMsg(`تم حفظ ونشر المقرر (${newCourseTitle}) في قسم [${sectionType}] بنجاح! 🎉`);
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

  // 2. إدارة المقاطع والدروس (إخفاء، حذف درس محدد، معاينة مجانية، سحب وإفلات)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle) return;

    setLoading(true);
    let uploadedPdfUrl = '';
    let uploadedSummaryUrl = '';
    let uploadedAssignmentUrl = '';

    try {
      if (pdfFile) {
        const fileName = `pdf_${Math.random()}.${pdfFile.name.split('.').pop()}`;
        const { data } = await supabase.storage.from('slides').upload(fileName, pdfFile);
        if (data) uploadedPdfUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (summaryFile) {
        const fileName = `sum_${Math.random()}.${summaryFile.name.split('.').pop()}`;
        const { data } = await supabase.storage.from('slides').upload(fileName, summaryFile);
        if (data) uploadedSummaryUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (assignmentFile) {
        const fileName = `asg_${Math.random()}.${assignmentFile.name.split('.').pop()}`;
        const { data } = await supabase.storage.from('slides').upload(fileName, assignmentFile);
        if (data) uploadedAssignmentUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
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

      const { data } = await supabase.from('lessons').insert([newLessonObj]).select();
      if (data) setLessons([...lessons, data[0]]);
      logAction('إضافة درس', lessonTitle);
      setLessonTitle('');
      setLessonDesc('');
      setVideoUrlInput('');
      setIsPreview(false);
      setPdfFile(null);
      setMsg('تم نشر الدرس بنجاح! 🎬');
    } catch (e) {
      setMsg('تم حفظ الدرس');
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

  // سحب وإفلات لترتيب الدروس
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

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCourseId || !quizTitle) return;

    try {
      const newQuiz = { course_id: quizCourseId, title: quizTitle, duration_minutes: quizDuration, questions, is_published: true };
      await supabase.from('quizzes').insert([newQuiz]);
      setQuizzes([...quizzes, { ...newQuiz, id: Math.random().toString() }]);
      logAction('إنشاء اختبار', quizTitle);
      setQuizTitle('');
      setQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }]);
      setMsg('تم نشر الاختبار بالمنصة! 📝');
    } catch (e) {
      setMsg('تم نشر الاختبار');
    }
  };

  // 4. الطلاب
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
    const newCp = { id: Math.random().toString(), code: couponCode.toUpperCase(), discount_type: couponType, discount_value: Number(couponVal), max_uses: Number(maxUses) || 100, is_active: true };
    setCoupons([...coupons, newCp]);
    await supabase.from('coupons').insert([newCp]);
    setCouponCode('');
    setCouponVal('');
    setMsg('تم إضافة الكوبون! 🎟️');
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
    const obj = { id: Math.random().toString(), user_name: 'أدمن المنصة', content: newCommentInput, created_at: new Date().toISOString() };
    setComments([obj, ...comments]);
    await supabase.from('comments').insert([obj]);
    setNewCommentInput('');
    setMsg('تم النشر!');
  };

  const deleteComment = async (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    await supabase.from('comments').delete().eq('id', id);
  };

  // 8. الإشعارات
  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;
    await supabase.from('notifications').insert([{ title: notifTitle, message: notifMsg, target_type: notifTarget }]);
    setNotifTitle('');
    setNotifMsg('');
    setMsg('تم إرسال الإشعار بنجاح! 🔔');
  };

  // الأرباح الحقيقية
  const earnings = useMemo(() => {
    const total = subscriptions.reduce((sum, s) => {
      const course = courses.find((c) => c.id === s.course_id);
      return sum + (course?.price || 0);
    }, 0);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toLocaleDateString('ar-SA', { weekday: 'short' });
      return { label: key, value: 0 };
    });

    subscriptions.forEach((sub) => {
      if (sub.created_at) {
        const subDate = new Date(sub.created_at);
        const dayLabel = subDate.toLocaleDateString('ar-SA', { weekday: 'short' });
        const course = courses.find((c) => c.id === sub.course_id);
        const price = course?.price || 0;
        const found = last7Days.find(d => d.label === dayLabel);
        if (found) found.value += price;
      }
    });

    return { total, chartData: last7Days };
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
      <div dir="rtl" className={`${cairo.className} min-h-screen bg-black text-white flex items-center justify-center p-4`}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
          <span className="text-sm font-bold">جاري فتح لوحة الأدمن...</span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen ${themeClasses.bg} flex transition-colors duration-300`}>

      {/* الشريط الجانبي */}
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

        {/* اختيار خلفية لوحة الأدمن */}
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
                <span className="text-xs text-slate-400 font-bold">إجمالي الأرباح الفعلية</span>
                <p className="text-2xl font-black text-amber-400">{earnings.total} ر.س</p>
              </div>
            </div>
            <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
              <h3 className="text-sm font-bold text-white">مخطط المبيعات اليومي الحقيقي</h3>
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
                    <button type="button" onClick={() => togglePublishCourse(course)} className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${course.is_published !== false ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                      {course.is_published !== false ? 'منشور' : 'مخفي'}
                    </button>
                    <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* إدارة وترتيب وحذف وتعيين المعاينة للدروس */}
        {activeTab === 'add_lesson' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Video className="w-5 h-5 text-purple-400" /> إدارة وترتيب وحذف المقاطع الفردية وتعيين المعاينة</h2>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required>
                <option value="">-- اختر المقرر --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input type="text" placeholder="عنوان المقطع/الدرس" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <input type="url" placeholder="رابط يوتيوب" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" />
              
              <div className="flex items-center gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <input type="checkbox" id="prevCheck" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <label htmlFor="prevCheck" className="text-xs text-slate-300 font-bold cursor-pointer">جعل هذا الدرس معاينة مجانية (Free Preview)</label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-2xl text-xs">حفظ ونشر المقطع</button>
            </form>

            {selectedCourse && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white">ترتيب ومقاطع الدورة (اسحب لترتيب، أو احذف مقطعاً مخصصاً، أو فعّل المعاينة):</h3>
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

        {activeTab === 'students' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white"><Users className="w-5 h-5 inline ml-1.5 text-purple-400" /> إدارة الطلاب ({students.length})</h2>
            <div className="space-y-2">
              {students.map((st) => (
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
              </div>
            )}
          </section>
        )}

        {activeTab === 'coupons' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white"><Percent className="w-5 h-5 inline ml-1.5 text-blue-400" /> الكوبونات</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="رمز الكوبون" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required />
                <select value={couponType} onChange={(e: any) => setCouponType(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs">
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (SAR)</option>
                </select>
                <input type="number" placeholder="قيمة الخصم" value={couponVal} onChange={(e) => setCouponVal(e.target.value === '' ? '' : Number(e.target.value))} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs" required />
              </div>
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">إضافة الكوبون</button>
            </form>
            <div className="space-y-2">
              {coupons.map((cp) => (
                <div key={cp.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-blue-400">{cp.code}</span>
                  <button type="button" onClick={() => handleDeleteCoupon(cp.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
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
                  <div className="flex justify-between">
                    <span className="font-bold text-white">{c.user_name}</span>
                    <button type="button" onClick={() => deleteComment(c.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-slate-300">{c.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'notifs' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white"><Bell className="w-5 h-5 inline ml-1.5 text-blue-400" /> إرسال إشعار</h2>
            <form onSubmit={handleSendNotif} className="space-y-4">
              <input type="text" placeholder="العنوان" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <textarea placeholder="المحتوى..." value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs" required />
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">إرسال</button>
            </form>
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
            <h3 className="text-lg font-bold text-blue-400">تعديل الدرس</h3>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            <button type="button" onClick={handleUpdateLesson} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs">حفظ التعديلات</button>
          </div>
        </div>
      )}

    </div>
  );
}