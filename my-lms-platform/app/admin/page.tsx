'use client';

/**
 * لوحة تحكم مساري | Masari - الكود الكامل المصحح
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import {
  Users, BookOpen, Video, DollarSign, Settings,
  Trash2, PlusCircle, Check, Eye, EyeOff, ShieldAlert, BarChart3, Ticket,
  Bell, Percent, Database, RotateCcw,
  Search, Pause, Play, Send, MessageSquare, Pin, PinOff, Edit3, X, GripVertical,
  Calendar, TrendingUp, TrendingDown, Award, Image as ImageIcon, Palette,
  History, AlertTriangle, GraduationCap, UserX,
} from 'lucide-react';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '800', '900'],
});

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${checked ? 'bg-[#22C55E]' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'right-0.5' : 'right-5'}`} />
    </button>
  );
}

function MissingTableNotice({ table }: { table: string }) {
  return (
    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#B45309] p-4 rounded-2xl text-xs flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        هذه الميزة تحتاج جدول <code className="bg-[#F59E0B]/20 px-1.5 py-0.5 rounded font-bold">{table}</code> في قاعدة البيانات وهو غير موجود بعد.
      </span>
    </div>
  );
}

function MiniBarChart({ data, valuePrefix = '' }: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <span className="text-[10px] font-bold text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity">
            {valuePrefix}{d.value}
          </span>
          <div className="w-full bg-slate-100 rounded-lg overflow-hidden flex items-end h-32">
            <div
              className="w-full bg-gradient-to-t from-[#2563EB] to-[#60A5FA] rounded-t-lg transition-all duration-500"
              style={{ height: `${Math.max((d.value / max) * 100, 3)}%` }}
            />
          </div>
          <span className="text-[9px] text-[#6B7280] font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
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
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editSummaryFile, setEditSummaryFile] = useState<File | null>(null);
  const [editAssignmentFile, setEditAssignmentFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // سحب وإفلات
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // الكوبونات
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponVal, setCouponVal] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>(100);
  const [couponStart, setCouponStart] = useState('');
  const [couponEnd, setCouponEnd] = useState('');
  const [couponCourses, setCouponCourses] = useState<string[]>([]);

  // الإشعارات
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'course' | 'student'>('all');
  const [notifTargetCourse, setNotifTargetCourse] = useState('');
  const [notifTargetStudent, setNotifTargetStudent] = useState('');

  // الطلاب
  const [students, setStudents] = useState<any[]>([]);
  const [studentsAvailable, setStudentsAvailable] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  // التعليقات
  const [comments, setComments] = useState<any[]>([]);
  const [commentsAvailable, setCommentsAvailable] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // سجل العمليات
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditAvailable, setAuditAvailable] = useState(true);

  // إعدادات المنصة
  const [settingsAvailable, setSettingsAvailable] = useState(true);
  const [platformName, setPlatformName] = useState('مساري | Masari');
  const [platformDesc, setPlatformDesc] = useState('طريقك إلى +A في جميع المقررات الأكاديمية');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultTheme, setDefaultTheme] = useState('light');
  const [defaultColor, setDefaultColor] = useState('blue');
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
    checkAdmin();
    fetchStats();
    fetchCoupons();
    fetchStudents();
    fetchComments();
    fetchAuditLog();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    if (msg) {
      const t = setTimeout(() => setMsg(''), 3500);
      return () => clearTimeout(t);
    }
  }, [msg]);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email !== 'falcon911n@gmail.com') {
      alert('عذراً، هذه الصفحة مخصصة للأدمن فقط.');
      router.push('/');
    }
  }

  async function logAction(action: string, details?: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('audit_log').insert([{
        action,
        details: details || '',
        actor_email: userData?.user?.email || 'admin',
      }]);
      if (!error) fetchAuditLog();
    } catch {
      // إغفال الخطأ إن لم تكن الطاولة موجودة
    }
  }

  async function fetchStats() {
    const { data: coursesData } = await supabase.from('courses').select('*');
    if (coursesData) setCourses(coursesData);

    const { data: subsData } = await supabase.from('subscriptions').select('*');
    if (subsData) {
      setSubscriptions(subsData);
      setSubscriptionsCount(subsData.length);
    }
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

  async function fetchStudents() {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) return setStudentsAvailable(false);
      setStudentsAvailable(true);
      setStudents(data || []);
    } catch {
      setStudentsAvailable(false);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
      if (error) return setCommentsAvailable(false);
      setCommentsAvailable(true);
      setComments(data || []);
    } catch {
      setCommentsAvailable(false);
    }
  }

  async function fetchAuditLog() {
    try {
      const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) return setAuditAvailable(false);
      setAuditAvailable(true);
      setAuditLog(data || []);
    } catch {
      setAuditAvailable(false);
    }
  }

  async function fetchSettings() {
    try {
      const { data, error } = await supabase.from('platform_settings').select('*');
      if (error) return setSettingsAvailable(false);
      setSettingsAvailable(true);
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => { map[row.key] = row.value; });
      if (map.platform_name) setPlatformName(map.platform_name);
      if (map.platform_description) setPlatformDesc(map.platform_description);
      if (map.logo_url) setLogoUrl(map.logo_url);
      if (map.default_theme) setDefaultTheme(map.default_theme);
      if (map.default_color) setDefaultColor(map.default_color);
      setToggles({
        registration_enabled: map.registration_enabled !== 'false',
        purchase_enabled: map.purchase_enabled !== 'false',
        comments_enabled: map.comments_enabled !== 'false',
        notifications_enabled: map.notifications_enabled !== 'false',
        coupons_enabled: map.coupons_enabled !== 'false',
      });
    } catch {
      setSettingsAvailable(false);
    }
  }

  async function saveSetting(key: string, value: string) {
    try {
      await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' });
    } catch {
      // إغفال الخطأ
    }
  }

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

    logAction('إضافة مقرر', newCourseTitle);
    setNewCourseTitle('');
    setNewCourseCode('');
    setNewCoursePrice('');
    setNewCourseOrigPrice('');
    setNewCourseInst('');
    setNewCourseDesc('');
    fetchStats();
    setMsg('تم حفظ المقرر بنجاح!');
  };

  const togglePublishCourse = async (course: any) => {
    const nextStatus = course.is_published === false ? true : false;
    await supabase.from('courses').update({ is_published: nextStatus }).eq('id', course.id);
    logAction(nextStatus ? 'نشر مقرر' : 'إخفاء مقرر', course.title);
    fetchStats();
    setMsg(nextStatus ? `تم تحويل المقرر (${course.title}) إلى: منشور ✅` : `تم تحويل المقرر (${course.title}) إلى: مخفي 👁️‍🗨️`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!confirm('هل أنت متأكد من حذف هذا المقرر بجميع دروسه؟')) return;
    await supabase.from('courses').delete().eq('id', courseId);
    logAction('حذف مقرر', course?.title);
    fetchStats();
    setMsg('تم حذف المقرر بنجاح!');
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle) return;

    setLoading(true);
    let uploadedPdfUrl = '';
    let uploadedSummaryUrl = '';
    let uploadedAssignmentUrl = '';

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

    await supabase.from('lessons').insert([{
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
    }]);

    logAction('إضافة درس', lessonTitle);
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
    logAction('حذف درس', lessonId);
    if (selectedCourse) fetchLessons(selectedCourse);
    setMsg('تم حذف الدرس بنجاح!');
  };

  const toggleLessonPublish = async (lesson: any) => {
    const next = lesson.is_published === false ? true : false;
    await supabase.from('lessons').update({ is_published: next }).eq('id', lesson.id);
    logAction(next ? 'إظهار درس' : 'إخفاء درس', lesson.title);
    fetchLessons(selectedCourse);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title || '');
    setEditDesc(lesson.description || '');
    setEditVideoUrl(lesson.video_url || '');
    setEditPdfFile(null);
    setEditSummaryFile(null);
    setEditAssignmentFile(null);
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    setSavingEdit(true);

    const updates: any = {
      title: editTitle,
      description: editDesc,
      video_url: formatYoutubeEmbed(editVideoUrl),
    };

    if (editPdfFile) {
      const fileName = `pdf_${Math.random()}.${editPdfFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, editPdfFile);
      if (data) updates.pdf_url = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
    }
    if (editSummaryFile) {
      const fileName = `sum_${Math.random()}.${editSummaryFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, editSummaryFile);
      if (data) updates.summary_url = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
    }
    if (editAssignmentFile) {
      const fileName = `asg_${Math.random()}.${editAssignmentFile.name.split('.').pop()}`;
      const { data } = await supabase.storage.from('slides').upload(fileName, editAssignmentFile);
      if (data) updates.assignment_url = supabase.storage.from('slides').getPublicUrl(fileName).data.publicUrl;
    }

    await supabase.from('lessons').update(updates).eq('id', editingLesson.id);
    logAction('تعديل درس', editTitle);
    setSavingEdit(false);
    setEditingLesson(null);
    fetchLessons(selectedCourse);
    setMsg('تم تحديث الدرس بنجاح!');
  };

  const removeLessonFile = async (lesson: any, field: 'pdf_url' | 'summary_url' | 'assignment_url') => {
    if (!confirm('حذف هذا الملف من الدرس؟')) return;
    await supabase.from('lessons').update({ [field]: null }).eq('id', lesson.id);
    logAction('حذف ملف من درس', `${lesson.title} - ${field}`);
    fetchLessons(selectedCourse);
    if (editingLesson?.id === lesson.id) setEditingLesson({ ...editingLesson, [field]: null });
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
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponVal) return;

    await supabase.from('coupons').insert([{
      code: couponCode.trim().toUpperCase(),
      discount_type: couponType,
      discount_value: Number(couponVal),
      max_uses: Number(maxUses) || 100,
      used_count: 0,
      start_date: couponStart || null,
      end_date: couponEnd || null,
      allowed_courses: couponCourses.length > 0 ? couponCourses : null,
      is_active: true
    }]);

    logAction('إضافة كوبون', couponCode);
    setCouponCode('');
    setCouponVal('');
    setCouponStart('');
    setCouponEnd('');
    setCouponCourses([]);
    fetchCoupons();
    setMsg('تم إضافة الكوبون بنجاح!');
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
    logAction(!currentStatus ? 'تفعيل كوبون' : 'تعطيل كوبون', id);
    fetchCoupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('حذف هذا الكوبون نهائياً؟')) return;
    await supabase.from('coupons').delete().eq('id', id);
    logAction('حذف كوبون', id);
    fetchCoupons();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    await supabase.from('notifications').insert([{
      title: notifTitle,
      message: notifMsg,
      target_type: notifTarget,
      target_id: notifTarget === 'course' ? notifTargetCourse : notifTarget === 'student' ? notifTargetStudent : null,
    }]);

    logAction('إرسال إشعار', `${notifTitle} (${notifTarget})`);
    setNotifTitle('');
    setNotifMsg('');
    setMsg('تم إرسال الإشعار بنجاح!');
  };

  const toggleStudentActive = async (student: any) => {
    const next = student.is_active === false ? true : false;
    try {
      await supabase.from('profiles').update({ is_active: next }).eq('id', student.id);
      logAction(next ? 'إعادة تفعيل طالب' : 'إيقاف طالب', student.full_name || student.email);
      fetchStudents();
      setMsg(next ? 'تم إعادة تفعيل الطالب' : 'تم إيقاف الطالب');
    } catch {
      setMsg('تعذر تنفيذ العملية');
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm(`حذف الطالب (${student.full_name || student.email})؟`)) return;
    try {
      await supabase.from('profiles').delete().eq('id', student.id);
      logAction('حذف طالب', student.full_name || student.email);
      fetchStudents();
      setMsg('تم حذف الطالب');
    } catch {
      setMsg('تعذر تنفيذ العملية');
    }
  };

  const quickNotifyStudent = (student: any) => {
    setActiveTab('notifs');
    setNotifTarget('student');
    setNotifTargetStudent(student.id);
    setNotifTitle('');
    setNotifMsg('');
  };

  const toggleCommentHidden = async (comment: any) => {
    await supabase.from('comments').update({ is_hidden: !comment.is_hidden }).eq('id', comment.id);
    logAction(!comment.is_hidden ? 'إخفاء تعليق' : 'إظهار تعليق', comment.content?.slice(0, 30));
    fetchComments();
  };

  const toggleCommentPinned = async (comment: any) => {
    await supabase.from('comments').update({ is_pinned: !comment.is_pinned }).eq('id', comment.id);
    logAction(!comment.is_pinned ? 'تثبيت تعليق' : 'إلغاء تثبيت تعليق', comment.content?.slice(0, 30));
    fetchComments();
  };

  const deleteComment = async (comment: any) => {
    if (!confirm('حذف هذا التعليق؟')) return;
    await supabase.from('comments').delete().eq('id', comment.id);
    logAction('حذف تعليق', comment.content?.slice(0, 30));
    fetchComments();
  };

  const sendReply = async (comment: any) => {
    const reply = replyDrafts[comment.id];
    if (!reply?.trim()) return;
    await supabase.from('comments').update({ reply }).eq('id', comment.id);
    logAction('رد على تعليق', comment.content?.slice(0, 30));
    setReplyDrafts({ ...replyDrafts, [comment.id]: '' });
    fetchComments();
  };

  const [subsCourseFilter, setSubsCourseFilter] = useState('');
  const courseSubscribers = useMemo(() => {
    if (!subsCourseFilter) return [];
    return subscriptions.filter((s) => s.course_id === subsCourseFilter);
  }, [subscriptions, subsCourseFilter]);

  const removeSubscriber = async (sub: any) => {
    if (!confirm('إزالة هذا الطالب من الدورة؟')) return;
    await supabase.from('subscriptions').delete().eq('id', sub.id);
    logAction('إزالة طالب من دورة', sub.course_id);
    fetchStats();
    setMsg('تمت إزالة الطالب من الدورة');
  };

  const studentName = (userId: string) => {
    const p = students.find((s) => s.id === userId);
    return p?.full_name || p?.email || userId?.slice(0, 8) + '...';
  };

  const earnings = useMemo(() => {
    const withPrice = subscriptions.map((s) => {
      const course = courses.find((c) => c.id === s.course_id);
      return { ...s, price: course?.price || 0, courseTitle: course?.title || '—' };
    });

    const total = withPrice.reduce((sum, s) => sum + s.price, 0);

    const now = new Date();
    const daily = withPrice.filter((s) => s.created_at && new Date(s.created_at).toDateString() === now.toDateString())
      .reduce((sum, s) => sum + s.price, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthly = withPrice.filter((s) => s.created_at && new Date(s.created_at) >= startOfMonth)
      .reduce((sum, s) => sum + s.price, 0);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearly = withPrice.filter((s) => s.created_at && new Date(s.created_at) >= startOfYear)
      .reduce((sum, s) => sum + s.price, 0);

    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const value = withPrice
        .filter((s) => s.created_at && new Date(s.created_at).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.price, 0);
      return { label: d.toLocaleDateString('ar-SA', { weekday: 'short' }), value };
    });

    const perCourse: Record<string, { title: string; count: number; revenue: number }> = {};
    withPrice.forEach((s) => {
      if (!perCourse[s.course_id]) perCourse[s.course_id] = { title: s.courseTitle, count: 0, revenue: 0 };
      perCourse[s.course_id].count += 1;
      perCourse[s.course_id].revenue += s.price;
    });
    const perCourseArr = Object.values(perCourse).sort((a, b) => b.count - a.count);
    const bestCourse = perCourseArr[0];
    const worstCourse = perCourseArr[perCourseArr.length - 1];

    return { total, daily, monthly, yearly, last7, bestCourse, worstCourse, hasDates: withPrice.some((s) => s.created_at) };
  }, [subscriptions, courses]);

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen bg-white text-[#111827] flex`}>

      {/* القائمة الجانبية للأدمن */}
      <aside className="w-64 bg-white border-l border-[#E5E7EB] p-6 space-y-8 shrink-0 hidden md:block overflow-y-auto">
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
            { id: 'students', label: 'إدارة الطلاب', icon: Users },
            { id: 'subscribers', label: 'مشتركو الدورات', icon: GraduationCap },
            { id: 'earnings', label: 'الأرباح التفصيلية', icon: DollarSign },
            { id: 'coupons', label: 'الخصومات والكوبونات', icon: Percent },
            { id: 'comments', label: 'إدارة التعليقات', icon: MessageSquare },
            { id: 'notifs', label: 'الإشعارات', icon: Bell },
            { id: 'settings', label: 'إعدادات المنصة', icon: Settings },
            { id: 'audit', label: 'سجل العمليات', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 ${
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

      {/* المحتوى الرئيسي */}
      <main className="flex-1 bg-white p-6 md:p-10 space-y-8 overflow-y-auto">

        <header className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">لوحة إدارة منصة مساري | Masari</h1>
            <p className="text-xs text-[#6B7280] mt-1">إدارة شاملة للمقررات، الطلاب، الأرباح، التعليقات والإعدادات</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-slate-50 border border-[#E5E7EB] text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition-all duration-300 text-[#111827]"
          >
            الانتقال للواجهة الرئيسية
          </button>
        </header>

        {msg && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-pulse">
            <Check className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* 1. الإحصائيات والأرباح */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'المقررات النشطة', value: courses.filter((c) => c.is_published !== false).length, icon: BookOpen, color: 'text-[#2563EB]' },
                { title: 'إجمالي الطلاب', value: studentsAvailable ? students.length : subscriptionsCount, icon: Users, color: 'text-[#7C3AED]' },
                { title: 'إجمالي المشتركين', value: subscriptionsCount, icon: Ticket, color: 'text-[#22C55E]' },
                { title: 'إجمالي الأرباح', value: `${earnings.total} ر.س`, icon: DollarSign, color: 'text-[#F59E0B]' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6B7280]">{stat.title}</span>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-black text-[#111827]">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'أرباح اليوم', value: `${earnings.daily} ر.س`, icon: TrendingUp },
                { title: 'أرباح الشهر', value: `${earnings.monthly} ر.س`, icon: Calendar },
                { title: 'أرباح السنة', value: `${earnings.yearly} ر.س`, icon: BarChart3 },
                { title: 'الكوبونات المفعلة', value: coupons.filter((c) => c.is_active).length, icon: Percent },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-[#E5E7EB] space-y-1.5">
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{stat.title}</span>
                    </div>
                    <p className="text-lg font-black">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                الإيرادات خلال آخر 7 أيام
              </h3>
              {earnings.hasDates ? (
                <MiniBarChart data={earnings.last7} />
              ) : (
                <p className="text-xs text-[#6B7280] py-6 text-center">
                  أضف عمود created_at لجدول subscriptions لعرض الرسم البياني الزمني.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 2. إدارة المقررات */}
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
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB] transition"
                  required
                />
                <input
                  type="text"
                  placeholder="رمز المقرر (مثال: ريض 101)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB] transition"
                />
                <input
                  type="number"
                  placeholder="السعر (بالريال)"
                  value={newCoursePrice}
                  onChange={(e) => setNewCoursePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563EB] transition"
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

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold">حالة المقرر عند الإنشاء:</span>
                <button type="button" onClick={() => setIsPublished(true)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${isPublished ? 'bg-[#22C55E] text-white' : 'bg-slate-100 text-[#6B7280]'}`}>منشور</button>
                <button type="button" onClick={() => setIsPublished(false)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${!isPublished ? 'bg-slate-500 text-white' : 'bg-slate-100 text-[#6B7280]'}`}>مسودة / مخفي</button>
              </div>

              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all duration-300 shadow-md shadow-blue-500/20"
              >
                حفظ ونشر المقرر
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              <h3 className="text-xs font-bold text-[#111827]">المقررات المسجلة (حالة النشر والتحكم):</h3>
              <div className="space-y-2">
                {courses.map((course) => {
                  const isVisible = course.is_published !== false;
                  return (
                    <div key={course.id} className="flex flex-wrap justify-between items-center gap-2 bg-slate-50 p-3.5 rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <span className="font-bold text-xs ml-2 text-[#111827]">{course.title}</span>
                        {course.code && <span className="bg-slate-200 text-[#6B7280] text-[10px] px-2 py-0.5 rounded ml-2">{course.code}</span>}
                        <span className="text-[#22C55E] text-xs font-bold ml-2">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setSubsCourseFilter(course.id); setActiveTab('subscribers'); }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB] flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          المشتركون
                        </button>

                        <button
                          type="button"
                          onClick={() => togglePublishCourse(course)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center gap-1.5 ${
                            isVisible
                              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isVisible ? 'منشور (اضغط للإخفاء)' : 'مخفي (اضغط للنشر)'}</span>
                        </button>

                        <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-[#EF4444] p-2 hover:bg-red-50 rounded-xl transition-colors" title="حذف المقرر">
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

        {/* 3. إدارة الدروس */}
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

              <textarea
                placeholder="وصف مختصر للدرس (اختياري)"
                value={lessonDesc}
                onChange={(e) => setLessonDesc(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
              />

              <input
                type="url"
                placeholder="رابط فيديو YouTube (مثال: https://www.youtube.com/watch?v=XXXXX)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full bg-slate-50 border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs focus:outline-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">1. رفع ملف الـ PDF الأساسي:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-[#6B7280] w-full" />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">2. رفع ملف الملخص المنفصل:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setSummaryFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-[#6B7280] w-full" />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB]">
                  <label className="text-xs font-bold text-[#111827] block mb-1.5">3. رفع ملف الواجب / التكليف:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-[#6B7280] w-full" />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-[#E5E7EB]">
                <input type="checkbox" id="previewCheck" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="w-4 h-4 accent-[#2563EB] rounded" />
                <label htmlFor="previewCheck" className="text-xs font-semibold cursor-pointer text-[#111827]">
                  اجعل هذا الدرس مجاني كمعاينة (Preview) قبل الاشتراك
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition-all duration-300 shadow-md shadow-purple-500/20">
                {loading ? 'جاري الرفع والنشر...' : 'نشر الدرس والملفات'}
              </button>
            </form>

            {selectedCourse && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <h3 className="text-xs font-bold text-[#111827] flex items-center gap-2">
                  دروس المقرر المحدد
                  <span className="text-[10px] font-normal text-[#6B7280]">(اسحب <GripVertical className="w-3 h-3 inline" /> لإعادة الترتيب)</span>
                </h3>
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const lessonVisible = lesson.is_published !== false;
                    return (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className={`flex flex-wrap justify-between items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB] text-xs cursor-grab active:cursor-grabbing transition-all duration-200 ${draggedIndex === idx ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-[#111827]">{lesson.title}</span>
                          {!lessonVisible && <span className="bg-red-50 text-red-500 text-[9px] px-1.5 py-0.5 rounded font-bold">مخفي</span>}
                          {lesson.is_preview && <span className="bg-[#22C55E]/10 text-[#22C55E] text-[9px] px-1.5 py-0.5 rounded font-bold">معاينة مجانية</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => toggleLessonPublish(lesson)} className={`p-1.5 rounded-lg transition-colors ${lessonVisible ? 'text-[#22C55E] hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title={lessonVisible ? 'إخفاء الدرس' : 'إظهار الدرس'}>
                            {lessonVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button type="button" onClick={() => openEditLesson(lesson)} className="text-[#2563EB] p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل الدرس">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="text-[#EF4444] p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="حذف الدرس">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      {/* مودال تعديل الدرس */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#2563EB]">
                <Edit3 className="w-5 h-5" />
                تعديل الدرس
              </h3>
              <button type="button" onClick={() => setEditingLesson(null)} className="text-[#6B7280] hover:text-[#EF4444] transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="عنوان الدرس" className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3 text-xs focus:outline-none" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="وصف الدرس" className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3 text-xs focus:outline-none" />
            <input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="رابط فيديو YouTube" className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3 text-xs focus:outline-none" />

            <div className="space-y-2">
              {[
                { field: 'pdf_url' as const, label: 'ملف PDF', file: editPdfFile, setFile: setEditPdfFile },
                { field: 'summary_url' as const, label: 'ملف الملخص', file: editSummaryFile, setFile: setEditSummaryFile },
                { field: 'assignment_url' as const, label: 'ملف الواجب', file: editAssignmentFile, setFile: setEditAssignmentFile },
              ].map((item) => (
                <div key={item.field} className="bg-slate-50 p-3 rounded-2xl border border-[#E5E7EB] flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[#111827] block mb-1">{item.label}</label>
                    {editingLesson[item.field] && !item.file ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#22C55E] font-bold">✓ ملف موجود حالياً</span>
                        <button type="button" onClick={() => removeLessonFile(editingLesson, item.field)} className="text-[#EF4444] text-[10px] font-bold hover:underline">حذف</button>
                      </div>
                    ) : (
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => item.setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] text-[#6B7280] w-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleUpdateLesson} disabled={savingEdit} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 rounded-xl text-xs transition-all duration-300">
              {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}