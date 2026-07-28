'use client';

/**
 * لوحة تحكم مساري | Masari Admin Dashboard
 * =========================================================================
 * تم تحديث الواجهة لتتوافق بشكل كامل مع الثيم الجديد لمنصة مساري (متغيرات CSS).
 * إضافة إمكانيات النشر والإخفاء الذكية (Draft Mode).
 * تطوير منشئ الاختبارات ليدعم الصور والأسئلة الطويلة.
 * تحسين مشغل روابط اليوتيوب ليدعم الفيديوهات غير المدرجة (Unlisted).
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Users, BookOpen, Video, DollarSign, Settings,
  Trash2, PlusCircle, Check, Eye, EyeOff, ShieldAlert, BarChart3, Ticket,
  Bell, Percent, Search, Edit3, X, GripVertical,
  History, GraduationCap, RefreshCw, ClipboardList, Plus, MessageSquare, Pin, Send,
  ChevronRight, LogOut, Image as ImageIcon,
  CheckCircle
} from 'lucide-react';

interface Question {
  question: string;
  image_url: string;
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
      className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 border ${checked ? 'border-transparent' : ''}`}
      style={{ backgroundColor: checked ? 'var(--masari-primary)' : 'var(--masari-bg)', borderColor: checked ? 'transparent' : 'var(--masari-border)' }}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'right-0.5 translate-x-0' : 'right-[22px]'}`} />
    </button>
  );
}

function MiniBarChart({ data, valuePrefix = '' }: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--masari-text-muted)' }}>
            {valuePrefix}{d.value}
          </span>
          <div className="w-full rounded-lg overflow-hidden flex items-end h-32 border" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, backgroundColor: 'var(--masari-primary)' }}
            />
          </div>
          <span className="text-[9px] font-bold" style={{ color: 'var(--masari-text-muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingAuth, setLoadingAuth] = useState(true);

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
  const [isPublished, setIsPublished] = useState(false);

  // بيانات الدرس والملفات
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isLessonPublished, setIsLessonPublished] = useState(false);
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

  // منشئ الاختبارات
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState<number>(30);
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', image_url: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }
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
    showToast('تم تحديث الإعداد بنجاح');
  };

  const formatYoutubeEmbed = (url: string) => {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else if (url.includes('shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : url;
  };

  const showToast = (message: string) => {
    setMsg(message);
    setTimeout(() => setMsg(''), 3000);
  }

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
      logAction(isPublished ? 'إضافة مقرر ونشره بالموقع' : 'إضافة مقرر كمسودة', newCourseTitle);

      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCoursePrice('');
      setNewCourseOrigPrice('');
      setNewCourseInst('');
      setNewCourseDesc('');
      setIsPublished(false);
      showToast(isPublished ? `تم نشر المقرر (${newCourseTitle}) بنجاح! 🎉` : `تم حفظ المقرر (${newCourseTitle}) كمسودة.`);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const togglePublishCourse = async (course: any) => {
    const nextStatus = course.is_published === false ? true : false;
    setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: nextStatus } : c));
    await supabase.from('courses').update({ is_published: nextStatus }).eq('id', course.id);
    logAction(nextStatus ? 'نشر مقرر' : 'إخفاء مقرر', course.title);
    showToast(nextStatus ? 'تم نشر المقرر وهو الآن متاح للطلاب ✅' : 'تم إخفاء المقرر عن الطلاب 👁️‍🗨️');
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقرر نهائياً؟ سيتم حذف جميع والفيديوهات المرتبطة به أيضاً.')) return;
    setCourses(courses.filter(c => c.id !== courseId));
    await supabase.from('courses').delete().eq('id', courseId);
    logAction('حذف مقرر', courseId);
    showToast('تم حذف المقرر بنجاح!');
  };

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
        if (upErr) showToast(`تعذر رفع ملف PDF: ${upErr.message}`);
        else uploadedPdfUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (summaryFile) {
        const fileName = `sum_${Date.now()}_${Math.random().toString(36).slice(2)}.${summaryFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('slides').upload(fileName, summaryFile);
        if (upErr) showToast(`تعذر رفع ملف الملخص: ${upErr.message}`);
        else uploadedSummaryUrl = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
      }
      if (assignmentFile) {
        const fileName = `asg_${Date.now()}_${Math.random().toString(36).slice(2)}.${assignmentFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('slides').upload(fileName, assignmentFile);
        if (upErr) showToast(`تعذر رفع المرفق: ${upErr.message}`);
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
        is_published: isLessonPublished,
        order_index: lessons.length + 1
      };

      const { data, error } = await supabase.from('lessons').insert([newLessonObj]).select();
      if (error) {
        showToast(`تعذر حفظ الدرس: ${error.message}`);
        return;
      }
      if (data) setLessons([...lessons, data[0]]);
      logAction('إضافة مقطع فيديو', lessonTitle);
      
      setLessonTitle('');
      setLessonDesc('');
      setVideoUrlInput('');
      setIsPreview(false);
      setIsLessonPublished(false);
      setPdfFile(null);
      setSummaryFile(null);
      setAssignmentFile(null);
      setFileInputKey((k) => k + 1);
      
      showToast(isLessonPublished ? 'تم نشر الدرس بنجاح! 🎬' : 'تم حفظ الدرس كمسودة مخفية.');
    } catch (e: any) {
      showToast(`حدث خطأ أثناء حفظ الدرس: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('حذف هذا المقطع المحدد فقط؟')) return;
    setLessons(lessons.filter(l => l.id !== lessonId));
    await supabase.from('lessons').delete().eq('id', lessonId);
    logAction('حذف درس', lessonId);
    showToast('تم حذف المقطع المحدد بنجاح');
  };

  const toggleLessonPublish = async (lesson: any) => {
    const next = lesson.is_published === false ? true : false;
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_published: next } : l));
    await supabase.from('lessons').update({ is_published: next }).eq('id', lesson.id);
    logAction(next ? 'إظهار درس' : 'إخفاء درس', lesson.title);
    showToast(next ? 'تم إظهار المقطع للطلاب' : 'تم إخفاء المقطع');
  };

  const toggleLessonPreview = async (lesson: any) => {
    const next = !lesson.is_preview;
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_preview: next } : l));
    await supabase.from('lessons').update({ is_preview: next }).eq('id', lesson.id);
    logAction('تعديل معاينة درس', lesson.title);
    showToast(next ? 'تم تفعيل المعاينة المجانية لهذا المقطع' : 'تم إلغاء المعاينة المجانية');
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
      showToast('تم تحديث بيانات الدرس بنجاح!');
    } catch (e) {
      showToast('خطأ أثناء التحديث');
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
    showToast('تم تحديث ترتيب الدروس بنجاح!');
  };

  const addQuestionField = () => {
    setQuestions([...questions, { question: '', image_url: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }]);
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
      setQuestions([{ question: '', image_url: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A' }]);
      showToast('تم نشر الاختبار بالمنصة! 📝');
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('حذف هذا الاختبار نهائياً؟')) return;
    setQuizzes(quizzes.filter((q) => q.id !== id));
    await supabase.from('quizzes').delete().eq('id', id);
    logAction('حذف اختبار', id);
    showToast('تم حذف الاختبار');
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase().trim();
    return students.filter((s) => (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }, [students, studentSearch]);

  const toggleStudentActive = async (student: any) => {
    const next = student.is_active === false ? true : false;
    setStudents(students.map(s => s.id === student.id ? { ...s, is_active: next } : s));
    await supabase.from('profiles').update({ is_active: next }).eq('id', student.id);
    showToast(next ? 'تم تفعيل حساب الطالب' : 'تم إيقاف حساب الطالب');
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm('حذف الطالب؟')) return;
    setStudents(students.filter(s => s.id !== student.id));
    await supabase.from('profiles').delete().eq('id', student.id);
    showToast('تم حذف الطالب من قاعدة البيانات');
  };

  const quickNotifyStudent = (student: any) => {
    setActiveTab('notifs');
    setNotifTarget('student');
    setNotifTargetStudent(student.id);
  };

  const courseSubscribers = useMemo(() => {
    if (!subsCourseFilter) return [];
    return subscriptions.filter((s) => s.course_id === subsCourseFilter);
  }, [subscriptions, subsCourseFilter]);

  const removeSubscriber = async (sub: any) => {
    if (!confirm('هل تريد إزالة هذا الطالب من الدورة؟ سيفقد إمكانية الوصول لها.')) return;
    setSubscriptions(subscriptions.filter(s => s.id !== sub.id));
    setSubscriptionsCount(Math.max(0, subscriptionsCount - 1));
    await supabase.from('subscriptions').delete().eq('id', sub.id);
    showToast('تمت إزالة الطالب من الدورة');
  };

  const studentName = (userId: string) => {
    const p = students.find((s) => s.id === userId);
    return p?.full_name || p?.email || userId?.slice(0, 8) + '...';
  };

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
      showToast('تم تفعيل الكوبون للطلاب! 🎟️');
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
      showToast('تم النشر بنجاح!');
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
    showToast(next ? 'تم إخفاء التعليق عن الرئيسية' : 'التعليق ظاهر الآن بالرئيسية');
  };

  const sendCommentReply = async (c: any) => {
    const replyText = (replyDrafts[c.id] || '').trim();
    if (!replyText) return;
    setComments(comments.map((x) => x.id === c.id ? { ...x, reply: replyText } : x));
    await supabase.from('comments').update({ reply: replyText }).eq('id', c.id);
    setReplyDrafts({ ...replyDrafts, [c.id]: '' });
    showToast('تم إرسال الرد بنجاح للطلاب');
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;
    const targetId = notifTarget === 'course' ? notifTargetCourse : notifTarget === 'student' ? notifTargetStudent : null;
    if (notifTarget !== 'all' && !targetId) {
      showToast('يرجى تحديد الدورة أو الطالب المستهدف أولاً');
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
      showToast('تم إرسال الإشعار بنجاح! 🔔');
    } catch (err: any) {
      showToast('حدث خطأ أثناء إرسال الإشعار');
    }
  };

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

  if (loadingAuth) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--masari-primary)' }} />
          <span className="text-sm font-bold text-muted-foreground">جاري فتح لوحة القيادة...</span>
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: 'var(--masari-bg)',
    borderColor: 'var(--masari-border)',
    color: 'var(--masari-text)'
  };

  return (
    <div dir="rtl" className="min-h-screen flex transition-colors duration-300 font-sans" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>

      <aside className="w-64 border-l p-6 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-2xl shadow-lg flex items-center justify-center" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base" style={{ color: 'var(--masari-text)' }}>إدارة المنصة</h1>
            <p className="text-[10px]" style={{ color: 'var(--masari-text-muted)' }}>لوحة تحكم مساري</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {[
            { id: 'dashboard', label: 'الإحصائيات والأرباح', icon: BarChart3 },
            { id: 'add_course', label: 'إضافة دورة/مقرر', icon: PlusCircle },
            { id: 'courses', label: 'إدارة المقررات', icon: BookOpen },
            { id: 'add_lesson', label: 'إدارة الفيديوهات والمقاطع', icon: Video },
            { id: 'quizzes', label: 'منشئ الاختبارات', icon: ClipboardList },
            { id: 'students', label: 'الطلاب', icon: Users },
            { id: 'subscribers', label: 'الاشتراكات', icon: GraduationCap },
            { id: 'coupons', label: 'الكوبونات', icon: Percent },
            { id: 'comments', label: 'التعليقات', icon: MessageSquare },
            { id: 'notifs', label: 'الإشعارات', icon: Bell },
            { id: 'settings', label: 'الإعدادات', icon: Settings },
            { id: 'audit', label: 'سجل العمليات', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs"
                style={{
                  backgroundColor: isActive ? 'var(--masari-primary)' : 'transparent',
                  color: isActive ? 'var(--masari-on-primary)' : 'var(--masari-text-muted)',
                  boxShadow: isActive ? '0 4px 14px var(--masari-primary-soft)' : 'none'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 mr-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="pt-6 mt-auto border-t" style={{ borderColor: 'var(--masari-border)' }}>
          <button onClick={() => router.push('/')} className="w-full flex justify-center items-center gap-2 border px-4 py-3 rounded-2xl text-xs font-bold transition-colors hover:bg-muted" style={{ borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}>
            <LogOut className="w-4 h-4" /> العودة للمنصة
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar relative">
        {msg && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
            <div className="px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xl border" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-primary)' }}>
              <Check className="w-4 h-4" /> <span>{msg}</span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--masari-border)' }}>
            <div>
              <h2 className="text-2xl font-black">غرفة العمليات</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--masari-text-muted)' }}>إدارة المنصة والتحكم الدقيق بالمحتوى</p>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl border space-y-3 shadow-sm" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><BookOpen className="w-5 h-5"/></div>
                  <span className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>المقررات النشطة</span>
                  <p className="text-3xl font-black">{courses.length}</p>
                </div>
                <div className="p-6 rounded-3xl border space-y-3 shadow-sm" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Users className="w-5 h-5"/></div>
                  <span className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>إجمالي الاشتراكات</span>
                  <p className="text-3xl font-black">{subscriptionsCount}</p>
                </div>
                <div className="p-6 rounded-3xl border space-y-3 shadow-sm" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><DollarSign className="w-5 h-5"/></div>
                  <span className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>الأرباح الفعلية</span>
                  <p className="text-3xl font-black text-amber-500">{earnings.total} <span className="text-sm">ر.س</span></p>
                </div>
              </div>
              <div className="p-6 rounded-3xl border space-y-4 shadow-sm" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
                <h3 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: 'var(--masari-primary)' }}/> مخطط المبيعات لآخر 7 أيام</h3>
                <MiniBarChart data={earnings.chartData} />
              </div>
            </div>
          )}

          {activeTab === 'add_course' && (
            <section className="p-6 md:p-8 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black flex items-center gap-2">
                <PlusCircle className="w-5 h-5" style={{ color: 'var(--masari-primary)' }} /> تجهيز دورة / مقرر جديد
              </h2>
              <form onSubmit={handleSaveCourse} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>القسم المستهدف:</label>
                    <select value={sectionType} onChange={(e: any) => setSectionType(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle}>
                      <option value="courses">قسم الدورات الأساسي</option>
                      <option value="bestseller">قسم الأكثر مبيعاً</option>
                      <option value="summaries">قسم الملخصات</option>
                      <option value="books">قسم الكتب</option>
                      <option value="quizzes">قسم الاختبارات</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>اسم المادة:</label>
                    <input type="text" placeholder="مثال: رياضيات 101" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="رمز المقرر (اختياري)" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                  <input type="number" placeholder="السعر (اتركه فارغاً للمجاني)" value={newCoursePrice} onChange={(e) => setNewCoursePrice(e.target.value === '' ? '' : Number(e.target.value))} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                  <input type="text" placeholder="اسم المحاضر (اختياري)" value={newCourseInst} onChange={(e) => setNewCourseInst(e.target.value)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                </div>
                <textarea placeholder="اكتب وصفاً مفصلاً للمقرر يجذب الطلاب..." rows={4} value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />

                <div className="flex items-center justify-between border rounded-2xl p-4" style={{ borderColor: 'var(--masari-border)', backgroundColor: 'var(--masari-bg)' }}>
                  <div>
                    <span className="text-sm font-bold block mb-1" style={{ color: 'var(--masari-text)' }}>حالة النشر: {isPublished ? 'منشور ومرئي للطلاب' : 'مسودة (مخفي)'}</span>
                    <span className="text-[10px]" style={{ color: 'var(--masari-text-muted)' }}>اتركها مسودة إذا كنت تريد تجهيز المقاطع والفيديوهات لاحقاً.</span>
                  </div>
                  <Toggle checked={isPublished} onChange={() => setIsPublished(!isPublished)} />
                </div>

                <button type="submit" className="w-full font-bold py-4 rounded-2xl text-xs transition-transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
                  <Check className="w-4 h-4"/> 
                  {isPublished ? 'حفظ ونشر المقرر فوراً' : 'حفظ المقرر كمسودة'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'courses' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black flex items-center gap-2"><BookOpen className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> إدارة جميع المقررات ({courses.length})</h2>
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className={`flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 rounded-2xl border text-xs transition-all ${course.is_published === false ? 'opacity-70' : ''}`} style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--masari-text)' }}>{course.title}</span>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-emerald-500 font-bold">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                        <span className="px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--masari-primary-soft)', color: 'var(--masari-primary)', borderColor: 'var(--masari-primary-border)' }}>{course.section_type}</span>
                        {course.is_published === false && <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">مسودة (مخفي)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button type="button" onClick={() => togglePublishCourse(course)} className={`px-3 py-2 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${course.is_published !== false ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white' : 'border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors'}`}>
                        {course.is_published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {course.is_published !== false ? 'إخفاء الدورة' : 'نشر الدورة'}
                      </button>
                      <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'add_lesson' && (
            <section className="p-6 md:p-8 rounded-3xl border space-y-8 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><Video className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> إدارة المقاطع والفيديوهات</h2>
                <p className="text-xs mt-2" style={{ color: 'var(--masari-text-muted)' }}>قم برفع روابط اليوتيوب (العادية أو غير المدرجة) وسيتم تحويلها ليعمل كمشغل سينمائي محمي داخل المنصة.</p>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-5 border-b pb-8" style={{ borderColor: 'var(--masari-border)' }}>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs font-bold focus:outline-none" style={inputStyle} required>
                  <option value="">-- اختر الدورة التي تريد إضافة المقطع لها --</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title} {c.is_published === false ? '(مسودة)' : ''}</option>)}
                </select>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="عنوان المقطع" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} required />
                  <input type="url" placeholder="رابط يوتيوب (العادي أو Unlisted)" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                </div>
                <textarea placeholder="اكتب نبذة أو ملاحظات للطلاب تحت هذا الفيديو..." rows={3} value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)} className="w-full border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-2xl border" style={{ borderColor: 'var(--masari-border)' }}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold" style={{ color: 'var(--masari-text-muted)' }}>ملف PDF للدرس</label>
                    <input key={`pdf-${fileInputKey}`} type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="w-full text-[11px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold" style={{ color: 'var(--masari-text-muted)' }}>ملف الملخص</label>
                    <input key={`sum-${fileInputKey}`} type="file" onChange={(e) => setSummaryFile(e.target.files?.[0] || null)} className="w-full text-[11px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold" style={{ color: 'var(--masari-text-muted)' }}>مرفق إضافي</label>
                    <input key={`asg-${fileInputKey}`} type="file" onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)} className="w-full text-[11px]" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex items-center justify-between border rounded-2xl p-4" style={{ borderColor: 'var(--masari-border)', backgroundColor: 'var(--masari-bg)' }}>
                    <div>
                      <span className="text-xs font-bold block" style={{ color: 'var(--masari-text)' }}>مقطع مجاني (للمعاينة)</span>
                      <span className="text-[9px]" style={{ color: 'var(--masari-text-muted)' }}>يسمح للطلاب بمشاهدته قبل الاشتراك</span>
                    </div>
                    <Toggle checked={isPreview} onChange={() => setIsPreview(!isPreview)} />
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between border rounded-2xl p-4" style={{ borderColor: 'var(--masari-border)', backgroundColor: 'var(--masari-bg)' }}>
                    <div>
                      <span className="text-xs font-bold block" style={{ color: 'var(--masari-text)' }}>حالة النشر: {isLessonPublished ? 'منشور' : 'مسودة (مخفي)'}</span>
                      <span className="text-[9px]" style={{ color: 'var(--masari-text-muted)' }}>اخفه إذا لم تكن مستعداً لعرضه الآن</span>
                    </div>
                    <Toggle checked={isLessonPublished} onChange={() => setIsLessonPublished(!isLessonPublished)} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full font-bold py-4 rounded-2xl text-xs transition-transform hover:-translate-y-1 shadow-lg disabled:opacity-60 flex justify-center gap-2 items-center" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
                  <Video className="w-4 h-4"/>
                  {loading ? 'جاري الرفع والحفظ...' : 'حفظ المقطع'}
                </button>
              </form>

              {selectedCourse && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2"><GripVertical className="w-4 h-4"/> ترتيب ومقاطع الدورة الحالية ({lessons.length}):</h3>
                  <div className="space-y-2.5">
                    {lessons.map((l, idx) => (
                      <div
                        key={l.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)}
                        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 rounded-2xl border text-xs cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${l.is_published === false ? 'opacity-60' : ''}`}
                        style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 opacity-50" />
                          <span className="font-bold opacity-50">#{idx + 1}</span>
                          <span className="font-bold text-sm" style={{ color: 'var(--masari-text)' }}>{l.title}</span>
                          {l.is_preview && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">معاينة مفتوحة</span>}
                          {l.is_published === false && <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">مسودة</span>}
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button type="button" onClick={() => toggleLessonPreview(l)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${l.is_preview ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {l.is_preview ? 'إلغاء المعاينة' : 'جعلها معاينة'}
                          </button>
                          <button type="button" onClick={() => toggleLessonPublish(l)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${l.is_published !== false ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                            {l.is_published !== false ? 'إخفاء المقطع' : 'نشر المقطع'}
                          </button>
                          <button type="button" onClick={() => openEditLesson(l)} className="text-blue-500 p-1.5 hover:bg-blue-500/10 rounded-xl" title="تعديل"><Edit3 className="w-4 h-4" /></button>
                          <button type="button" onClick={() => handleDeleteLesson(l.id)} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded-xl" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    {lessons.length === 0 && <p className="text-xs text-center py-6 opacity-50 font-bold">لا توجد مقاطع مضافة لهذه الدورة حتى الآن.</p>}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'quizzes' && (
            <section className="p-6 md:p-8 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><ClipboardList className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> منشئ الاختبارات المتقدم</h2>
                <p className="text-xs mt-2" style={{ color: 'var(--masari-text-muted)' }}>أضف أسئلة طويلة، صور توضيحية، وخيارات متعددة لاختبارات الطلاب.</p>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select value={quizCourseId} onChange={(e) => setQuizCourseId(e.target.value)} className="border rounded-2xl p-3.5 text-xs font-bold focus:outline-none" style={inputStyle} required>
                    <option value="">-- اختر المقرر للاختبار --</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <input type="text" placeholder="عنوان الاختبار (مثال: اختبار الميدتيرم)" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} required />
                  <input type="number" placeholder="مدة الاختبار بالدقائق (مثال: 30)" value={quizDuration} onChange={(e) => setQuizDuration(Number(e.target.value) || 30)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                </div>

                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={idx} className="border rounded-3xl p-6 space-y-5 relative shadow-sm" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--masari-primary-soft)', color: 'var(--masari-primary)' }}>السؤال #{idx + 1}</span>
                        {questions.length > 1 && (
                          <button type="button" onClick={() => removeQuestionField(idx)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                      
                      <textarea placeholder="اكتب نص السؤال هنا (يدعم الأسئلة الطويلة أو المسائل)..." rows={3} value={q.question} onChange={(e) => updateQuestionField(idx, 'question', e.target.value)} className="w-full border rounded-xl p-4 text-sm focus:outline-none" style={inputStyle} required />
                      
                      <div className="relative">
                        <ImageIcon className="absolute right-4 top-3.5 w-4 h-4 opacity-40" />
                        <input type="url" placeholder="رابط صورة توضيحية للسؤال (اختياري)" value={q.image_url} onChange={(e) => updateQuestionField(idx, 'image_url', e.target.value)} className="w-full border rounded-xl pr-10 pl-4 py-3 text-xs focus:outline-none" style={inputStyle} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2"><span className="font-bold text-xs w-6">A)</span> <input type="text" placeholder="الخيار الأول" value={q.optionA} onChange={(e) => updateQuestionField(idx, 'optionA', e.target.value)} className="w-full border rounded-xl p-3 text-xs focus:outline-none" style={inputStyle} required /></div>
                        <div className="flex items-center gap-2"><span className="font-bold text-xs w-6">B)</span> <input type="text" placeholder="الخيار الثاني" value={q.optionB} onChange={(e) => updateQuestionField(idx, 'optionB', e.target.value)} className="w-full border rounded-xl p-3 text-xs focus:outline-none" style={inputStyle} required /></div>
                        <div className="flex items-center gap-2"><span className="font-bold text-xs w-6">C)</span> <input type="text" placeholder="الخيار الثالث" value={q.optionC} onChange={(e) => updateQuestionField(idx, 'optionC', e.target.value)} className="w-full border rounded-xl p-3 text-xs focus:outline-none" style={inputStyle} /></div>
                        <div className="flex items-center gap-2"><span className="font-bold text-xs w-6">D)</span> <input type="text" placeholder="الخيار الرابع" value={q.optionD} onChange={(e) => updateQuestionField(idx, 'optionD', e.target.value)} className="w-full border rounded-xl p-3 text-xs focus:outline-none" style={inputStyle} /></div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--masari-border)' }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>أين الإجابة الصحيحة؟</span>
                        <select value={q.correct} onChange={(e) => updateQuestionField(idx, 'correct', e.target.value)} className="border rounded-xl p-2.5 text-xs font-bold focus:outline-none" style={inputStyle}>
                          <option value="A">الخيار A هو الصحيح</option>
                          <option value="B">الخيار B هو الصحيح</option>
                          <option value="C">الخيار C هو الصحيح</option>
                          <option value="D">الخيار D هو الصحيح</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={addQuestionField} className="flex-1 border font-bold py-4 rounded-2xl text-xs flex justify-center items-center gap-2 transition-colors hover:bg-muted" style={{ borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}>
                    <Plus className="w-4 h-4" /> إضافة سؤال جديد
                  </button>
                  <button type="submit" className="flex-1 font-bold py-4 rounded-2xl text-xs shadow-lg transition-transform hover:-translate-y-1 flex justify-center items-center gap-2" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
                    <Check className="w-4 h-4"/> حفظ ونشر الاختبار
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'students' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><Users className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> إدارة الطلاب ({filteredStudents.length})</h2>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input type="text" placeholder="ابحث بالاسم أو البريد..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full border rounded-2xl pr-10 pl-4 py-3 text-xs focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="space-y-3">
                {filteredStudents.map((st) => (
                  <div key={st.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-2xl border text-xs" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold" style={{ borderColor: 'var(--masari-primary)', color: 'var(--masari-primary)' }}>{st.full_name?.charAt(0) || 'م'}</div>
                      <div>
                        <p className="font-bold text-sm">{st.full_name || 'طالب جديد'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--masari-text-muted)' }}>{st.email} {st.phone ? ` | ${st.phone}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end md:self-auto">
                      <button type="button" onClick={() => quickNotifyStudent(st)} className="bg-blue-500/10 text-blue-500 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold hover:bg-blue-500 hover:text-white transition-colors"><Bell className="w-3.5 h-3.5"/> إشعار</button>
                      <button type="button" onClick={() => toggleStudentActive(st)} className={`px-3 py-2 rounded-xl font-bold transition-colors ${st.is_active !== false ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                        {st.is_active !== false ? 'حساب نشط' : 'موقوف'}
                      </button>
                      <button type="button" onClick={() => handleDeleteStudent(st)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'subscribers' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><GraduationCap className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> المشتركون في الدورات</h2>
                <p className="text-xs mt-2" style={{ color: 'var(--masari-text-muted)' }}>اختر الدورة لاستعراض أو إزالة الطلاب المشتركين بها.</p>
              </div>
              <select value={subsCourseFilter} onChange={(e) => setSubsCourseFilter(e.target.value)} className="w-full border rounded-2xl p-4 text-sm font-bold focus:outline-none" style={inputStyle}>
                <option value="">-- اضغط هنا لاختيار الدورة --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {subsCourseFilter && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold mb-3" style={{ color: 'var(--masari-primary)' }}>المشتركون الحاليون: {courseSubscribers.length} طالب</div>
                  {courseSubscribers.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-4 rounded-2xl border text-sm" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                      <span className="font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> {studentName(sub.user_id)}</span>
                      <button type="button" onClick={() => removeSubscriber(sub)} className="text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors px-4 py-2 rounded-xl text-xs font-bold">إزالة من الدورة</button>
                    </div>
                  ))}
                  {courseSubscribers.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--masari-border)' }}>
                      <p className="text-sm font-bold opacity-50">لا يوجد مشتركون في هذه الدورة حتى الآن.</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === 'coupons' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black flex items-center gap-2"><Ticket className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> الكوبونات والخصومات</h2>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="رمز الكوبون (مثال: MASARI20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} required />
                  <select value={couponType} onChange={(e: any) => setCouponType(e.target.value)} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle}>
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ر.س)</option>
                  </select>
                  <input type="number" placeholder="قيمة الخصم" value={couponVal} onChange={(e) => setCouponVal(e.target.value === '' ? '' : Number(e.target.value))} className="border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} required />
                </div>
                <div className="flex gap-4">
                  <input type="number" placeholder="الحد الأقصى للاستخدام (الافتراضي 100)" value={maxUses} onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} className="flex-1 border rounded-2xl p-3.5 text-xs focus:outline-none" style={inputStyle} />
                  <button type="submit" className="font-bold px-8 py-3.5 rounded-2xl text-xs transition-transform hover:-translate-y-1 shadow-md" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>إضافة الكوبون</button>
                </div>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--masari-border)' }}>
                {coupons.map((cp) => (
                  <div key={cp.id} className="flex justify-between items-center p-4 rounded-2xl border text-xs shadow-sm" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                    <div>
                      <span className="font-black text-lg block mb-1" style={{ color: 'var(--masari-primary)' }}>{cp.code}</span>
                      <span className="text-[10px]" style={{ color: 'var(--masari-text-muted)' }}>استخدم {cp.used_count || 0} مرات من أصل {cp.max_uses}</span>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Toggle checked={cp.is_active} onChange={() => toggleCouponStatus(cp.id, cp.is_active)} />
                      <button type="button" onClick={() => handleDeleteCoupon(cp.id)} className="text-red-500 text-[10px] font-bold flex items-center gap-1 hover:underline"><Trash2 className="w-3 h-3"/> حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'comments' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black flex items-center gap-2"><MessageSquare className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> التقييمات والآراء</h2>
              <form onSubmit={handleAddComment} className="flex gap-3 bg-background p-2 rounded-2xl border" style={{ borderColor: 'var(--masari-border)' }}>
                <input type="text" placeholder="اكتب تقييماً أو رأياً باسم الإدارة يُنشر في الصفحة الرئيسية..." value={newCommentInput} onChange={(e) => setNewCommentInput(e.target.value)} className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:outline-none" />
                <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-90" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>نشر</button>
              </form>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="p-5 rounded-3xl border text-sm space-y-4 shadow-sm" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold">
                        {c.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--masari-primary-soft)', color: 'var(--masari-primary)' }}>{c.user_name.charAt(0)}</div>
                        {c.user_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleCommentPin(c)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${c.is_pinned ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground hover:bg-background'}`}>{c.is_pinned ? 'مثبت' : 'تثبيت بالرئيسية'}</button>
                        <button type="button" onClick={() => toggleCommentHidden(c)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${c.is_hidden ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{c.is_hidden ? 'مخفي' : 'ظاهر للكل'}</button>
                        <button type="button" onClick={() => deleteComment(c.id)} className="text-red-500 p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="leading-relaxed bg-muted/20 p-3 rounded-xl border border-transparent">{c.content}</p>
                    {c.reply && (
                      <div className="p-3 rounded-2xl border border-l-4 bg-muted/30" style={{ borderLeftColor: 'var(--masari-primary)', borderColor: 'var(--masari-border)' }}>
                        <span className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--masari-primary)' }}>رد الإدارة:</span>
                        <p className="text-xs">{c.reply}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--masari-border)' }}>
                      <input type="text" placeholder="اكتب رداً على هذا التعليق يراه الطالب..." value={replyDrafts[c.id] || ''} onChange={(e) => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })} className="flex-1 border rounded-xl px-4 py-2 text-xs focus:outline-none" style={inputStyle} />
                      <button type="button" onClick={() => sendCommentReply(c)} className="border px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted" style={{ borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}><Send className="w-3.5 h-3.5 inline mr-1"/> إرسال الرد</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'notifs' && (
            <section className="p-6 md:p-8 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><Bell className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> نظام الإشعارات الذكي</h2>
                <p className="text-xs mt-2" style={{ color: 'var(--masari-text-muted)' }}>أرسل تنبيهات مخصصة لجميع الطلاب، أو لمشتركي دورة محددة، أو لطالب بعينه.</p>
              </div>
              <form onSubmit={handleSendNotif} className="space-y-6">
                <div className="flex bg-background p-1.5 rounded-2xl border shadow-inner" style={{ borderColor: 'var(--masari-border)' }}>
                  {(['all', 'course', 'student'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setNotifTarget(t)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${notifTarget === t ? 'shadow-md scale-[1.02]' : 'text-muted-foreground hover:bg-muted'}`} style={notifTarget === t ? { backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' } : {}}>
                      {t === 'all' ? 'لكل المنصة (عام)' : t === 'course' ? 'لمشتركي دورة معينة' : 'لطالب محدد فقط'}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-4 p-5 rounded-2xl border bg-muted/10" style={{ borderColor: 'var(--masari-border)' }}>
                  {notifTarget === 'course' && (
                    <select value={notifTargetCourse} onChange={(e) => setNotifTargetCourse(e.target.value)} className="w-full border rounded-2xl p-4 text-xs font-bold focus:outline-none" style={inputStyle} required>
                      <option value="">-- حدد الدورة المستهدفة --</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  )}
                  {notifTarget === 'student' && (
                    <select value={notifTargetStudent} onChange={(e) => setNotifTargetStudent(e.target.value)} className="w-full border rounded-2xl p-4 text-xs font-bold focus:outline-none" style={inputStyle} required>
                      <option value="">-- حدد الطالب المستهدف --</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                    </select>
                  )}
                  
                  <input type="text" placeholder="عنوان الإشعار (مثال: تنبيه هام، تحديث للمقرر، خصم جديد!)" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full border rounded-2xl p-4 text-sm font-bold focus:outline-none shadow-sm" style={inputStyle} required />
                  <textarea placeholder="اكتب تفاصيل ومحتوى الإشعار هنا..." rows={4} value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} className="w-full border rounded-2xl p-4 text-sm focus:outline-none shadow-sm" style={inputStyle} required />
                </div>
                
                <button type="submit" className="w-full font-bold py-4 rounded-2xl text-sm shadow-lg flex justify-center items-center gap-2 hover:-translate-y-1 transition-transform" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
                  <Send className="w-5 h-5"/> إرسال الإشعار الآن
                </button>
              </form>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><Settings className="w-6 h-6" style={{ color: 'var(--masari-primary)' }}/> إعدادات المنصة المتقدمة</h2>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>إيقاف أي ميزة من هنا سيتم تطبيقه فوراً على كافة صفحات المنصة، وسيمنع الطلاب من استخدامها. استخدمها للطوارئ.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'registration_enabled', label: 'تفعيل السماح بالتسجيل (إنشاء حسابات)', icon: Users },
                  { key: 'purchase_enabled', label: 'تفعيل سلة المشتريات وعمليات الدفع', icon: DollarSign },
                  { key: 'comments_enabled', label: 'تفعيل إضافة التعليقات من قبل الطلاب', icon: MessageSquare },
                  { key: 'notifications_enabled', label: 'إظهار أيقونة ونظام الإشعارات', icon: Bell },
                  { key: 'coupons_enabled', label: 'إظهار حقل إدخال الكوبونات في السلة', icon: Ticket },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex justify-between items-center p-5 rounded-3xl border shadow-sm transition-colors hover:border-primary/50" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" style={{ color: 'var(--masari-text)' }}><Icon className="w-5 h-5"/></div>
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                      <Toggle checked={(toggles as any)[item.key]} onChange={() => handleToggleSetting(item.key as any)} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section className="p-6 rounded-3xl border space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-lg font-black flex items-center gap-2"><History className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> سجل العمليات (Audit Log)</h2>
                <p className="text-xs mt-2" style={{ color: 'var(--masari-text-muted)' }}>يتتبع هذا السجل جميع الإجراءات التي تقوم بها داخل لوحة الإدارة للرجوع إليها لاحقاً.</p>
              </div>
              <div className="space-y-3">
                {auditLog.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl border flex justify-between items-center text-xs shadow-sm transition-colors hover:bg-muted/50" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                    <div>
                      <span className="font-bold block text-sm mb-1" style={{ color: 'var(--masari-text)' }}>{log.action}</span>
                      <span className="opacity-70 font-mono">{log.details}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold" style={{ color: 'var(--masari-primary)' }}>{new Date(log.created_at).toLocaleDateString('ar-SA')}</span>
                      <span className="opacity-50">{new Date(log.created_at).toLocaleTimeString('ar-SA')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-3xl border max-w-xl w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--masari-border)' }}>
              <h3 className="text-lg font-black flex items-center gap-2"><Edit3 className="w-5 h-5" style={{ color: 'var(--masari-primary)' }}/> تعديل الدرس / المقطع</h3>
              <button type="button" onClick={() => setEditingLesson(null)} className="p-2 rounded-xl bg-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">عنوان المقطع</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="عنوان الدرس" className="w-full border rounded-2xl p-4 text-sm focus:outline-none font-bold" style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الرابط (YouTube)</label>
                <input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="رابط يوتيوب (Unlisted مسموح)" className="w-full border rounded-2xl p-4 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الوصف / الملاحظات</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} placeholder="الوصف" className="w-full border rounded-2xl p-4 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--masari-border)' }}>
              <button type="button" onClick={() => setEditingLesson(null)} className="flex-1 border font-bold py-4 rounded-2xl text-sm transition-colors hover:bg-muted" style={{ borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}>إلغاء الأمر</button>
              <button type="button" onClick={handleUpdateLesson} disabled={savingEdit} className="flex-1 font-bold py-4 rounded-2xl text-sm shadow-lg disabled:opacity-60 flex justify-center items-center gap-2 hover:-translate-y-1 transition-transform" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
                {savingEdit ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {savingEdit ? 'جاري التحديث...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}