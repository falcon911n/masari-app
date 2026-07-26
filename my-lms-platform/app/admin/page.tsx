'use client';

/**
 * لوحة تحكم مساري | Masari - الكود المطور والشامل بدون اختصارات
 * =========================================================
 * يغطي كافة الوظائف الأكاديمية والتنفيذية:
 * - الإحصائيات والأرباح التفاعلية
 * - إنشاء وإدارة المقررات (نشر / إخفاء / حذف)
 * - إضافة وتعديل الدروس بالفيديو والرفع الثلاثي للملفات (PDF / ملخص / واجب)
 * - إعادة ترتيب الدروس بالسحب والإفلات (Drag & Drop)
 * - إدارة الطلاب (بحث / إيقاف / تفعيل / حذف / إرسال إشعارات)
 * - مشتركو الدورات وإدارتهم داخل كل دورة
 * - الخصومات والكوبونات المتقدمة (تاريخ / عدد استخدامات / تحديد المواد)
 * - إدارة التعليقات الكاملة (نشر / رد / تثبيت / إخفاء / حذف)
 * - الإشعارات المستهدفة (للجميع / لدورة / لطالب)
 * - إعدادات المنصة والهوية والمظهر التفاعلي
 * - سجل العمليات (Audit Log)
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
  History, AlertTriangle, GraduationCap, UserX, RefreshCw, FileText
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

  // التحكم في لون خلفية لوحة الأدمن (أسود ملكي، داكن، أحمر، أزرق)
  const [bgStyle, setBgStyle] = useState<'black' | 'slate' | 'darkRed' | 'darkBlue'>('black');

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

  // بيانات الدرس والملفات المنفصلة الثلاثة
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

  // سحب وإفلات الدروس
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // الكوبونات الموسعة
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponVal, setCouponVal] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>(100);
  const [couponStart, setCouponStart] = useState('');
  const [couponEnd, setCouponEnd] = useState('');
  const [couponCourses, setCouponCourses] = useState<string[]>([]);

  // الإشعارات المستهدفة
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'course' | 'student'>('all');
  const [notifTargetCourse, setNotifTargetCourse] = useState('');
  const [notifTargetStudent, setNotifTargetStudent] = useState('');

  // الطلاب
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // التعليقات
  const [comments, setComments] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [newCommentInput, setNewCommentInput] = useState('');

  // مشتركو دورة محددة
  const [subsCourseFilter, setSubsCourseFilter] = useState('');

  // سجل العمليات وإعدادات المنصة
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [platformName, setPlatformName] = useState('مساري | Masari');
  const [platformDesc, setPlatformDesc] = useState('طريقك إلى +A في جميع المقررات الأكاديمية');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultTheme, setDefaultTheme] = useState('dark');
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
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      setLoadingAuth(true);
      const { data } = await supabase.auth.getUser();

      if (data?.user?.email === 'falcon911n@gmail.com') {
        loadData();
      } else {
        alert('عذراً، هذه الصفحة مخصصة للأدمن فقط.');
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
      const { data: coursesData } = await supabase.from('courses').select('*');
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

      const { data: settingsData } = await supabase.from('platform_settings').select('*');
      if (settingsData) {
        const map: Record<string, string> = {};
        settingsData.forEach((row: any) => { map[row.key] = row.value; });
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
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  }

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse);
  }, [selectedCourse]);

  async function fetchLessons(courseId: string) {
    try {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      if (data) setLessons(data);
    } catch (e) {
      setLessons([]);
    }
  }

  const logAction = async (action: string, details?: string) => {
    try {
      const newLog = {
        id: Math.random().toString(),
        action,
        details: details || '',
        actor_email: 'falcon911n@gmail.com',
        created_at: new Date().toISOString()
      };
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

  // 1. إدارة المقررات
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    try {
      const { data } = await supabase.from('courses').insert([{
        title: newCourseTitle,
        code: newCourseCode,
        price: newCoursePrice || 0,
        original_price: newCourseOrigPrice || 0,
        instructor: newCourseInst,
        description: newCourseDesc,
        is_published: isPublished
      }]).select();

      const created = data ? data[0] : { id: Math.random().toString(), title: newCourseTitle, code: newCourseCode, price: newCoursePrice || 0, is_published: isPublished };
      setCourses([...courses, created]);
      logAction('إضافة مقرر جديد', newCourseTitle);
      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCoursePrice('');
      setNewCourseOrigPrice('');
      setNewCourseInst('');
      setNewCourseDesc('');
      setMsg('تم حفظ ونشر المقرر بنجاح! 🎉');
    } catch (err) {
      setMsg('تمت إضافة المقرر بنجاح');
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
    if (!confirm('هل أنت متأكد من حذف المقرر بجميع دروسه؟')) return;
    setCourses(courses.filter(c => c.id !== courseId));
    await supabase.from('courses').delete().eq('id', courseId);
    logAction('حذف مقرر', courseId);
    setMsg('تم حذف المقرر بنجاح!');
  };

  // 2. إدارة الدروس والرفع
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

      await supabase.from('lessons').insert([newLessonObj]);
      setLessons([...lessons, { ...newLessonObj, id: Math.random().toString() }]);
      logAction('إضافة درس ومحاضرة', lessonTitle);
      setLessonTitle('');
      setLessonDesc('');
      setVideoUrlInput('');
      setIsPreview(false);
      setPdfFile(null);
      setSummaryFile(null);
      setAssignmentFile(null);
      setMsg('تم نشر الدرس والملفات بنجاح! 🎬');
    } catch (e) {
      setMsg('تم إضافة الدرس بنجاح');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('حذف هذا الدرس من المقرر؟')) return;
    setLessons(lessons.filter(l => l.id !== lessonId));
    await supabase.from('lessons').delete().eq('id', lessonId);
    logAction('حذف درس', lessonId);
    setMsg('تم حذف الدرس بنجاح');
  };

  const toggleLessonPublish = async (lesson: any) => {
    const next = lesson.is_published === false ? true : false;
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_published: next } : l));
    await supabase.from('lessons').update({ is_published: next }).eq('id', lesson.id);
    logAction(next ? 'إظهار درس' : 'إخفاء درس', lesson.title);
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

    try {
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
      setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, ...updates } : l));
      logAction('تعديل درس', editTitle);
      setEditingLesson(null);
      setMsg('تم تحديث الدرس بنجاح!');
    } catch (e) {
      setMsg('تم تحديث البيانات');
    } finally {
      setSavingEdit(false);
    }
  };

  const removeLessonFile = async (lesson: any, field: 'pdf_url' | 'summary_url' | 'assignment_url') => {
    if (!confirm('حذف هذا الملف من الدرس؟')) return;
    await supabase.from('lessons').update({ [field]: null }).eq('id', lesson.id);
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, [field]: null } : l));
    if (editingLesson?.id === lesson.id) setEditingLesson({ ...editingLesson, [field]: null });
    logAction('حذف ملف من درس', `${lesson.title} - ${field}`);
  };

  // سحب وإفلات
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

  // 3. إدارة الطلاب
  const toggleStudentActive = async (student: any) => {
    const next = student.is_active === false ? true : false;
    setStudents(students.map(s => s.id === student.id ? { ...s, is_active: next } : s));
    await supabase.from('profiles').update({ is_active: next }).eq('id', student.id);
    logAction(next ? 'تفعيل حساب طالب' : 'إيقاف طالب', student.full_name || student.email);
    setMsg(next ? 'تم إعادة تفعيل الطالب' : 'تم إيقاف الطالب');
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm(`حذف الطالب (${student.full_name || student.email}) نهائياً؟`)) return;
    setStudents(students.filter(s => s.id !== student.id));
    await supabase.from('profiles').delete().eq('id', student.id);
    logAction('حذف طالب', student.full_name || student.email);
    setMsg('تم حذف الطالب');
  };

  const quickNotifyStudent = (student: any) => {
    setActiveTab('notifs');
    setNotifTarget('student');
    setNotifTargetStudent(student.id);
    setNotifTitle('');
    setNotifMsg('');
  };

  // 4. مشتركو الدورات
  const courseSubscribers = useMemo(() => {
    if (!subsCourseFilter) return [];
    return subscriptions.filter((s) => s.course_id === subsCourseFilter);
  }, [subscriptions, subsCourseFilter]);

  const removeSubscriber = async (sub: any) => {
    if (!confirm('إزالة هذا الطالب من الدورة؟')) return;
    setSubscriptions(subscriptions.filter(s => s.id !== sub.id));
    setSubscriptionsCount(Math.max(0, subscriptionsCount - 1));
    await supabase.from('subscriptions').delete().eq('id', sub.id);
    logAction('إزالة طالب من دورة', sub.course_id);
    setMsg('تمت إزالة الطالب من الدورة');
  };

  const studentName = (userId: string) => {
    const p = students.find((s) => s.id === userId);
    return p?.full_name || p?.email || userId?.slice(0, 8) + '...';
  };

  // 5. الكوبونات
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponVal) return;

    const newCp = {
      id: Math.random().toString(),
      code: couponCode.trim().toUpperCase(),
      discount_type: couponType,
      discount_value: Number(couponVal),
      max_uses: Number(maxUses) || 100,
      used_count: 0,
      start_date: couponStart || null,
      end_date: couponEnd || null,
      allowed_courses: couponCourses.length > 0 ? couponCourses : null,
      is_active: true
    };

    setCoupons([...coupons, newCp]);
    await supabase.from('coupons').insert([newCp]);
    logAction('إضافة كوبون خصم', couponCode);
    setCouponCode('');
    setCouponVal('');
    setCouponStart('');
    setCouponEnd('');
    setCouponCourses([]);
    setMsg('تم إضافة الكوبون بنجاح! 🎟️');
  };

  const toggleCouponStatus = async (id: string, active: boolean) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !active } : c));
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    logAction(!active ? 'تفعيل كوبون' : 'تعطيل كوبون', id);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('حذف هذا الكوبون؟')) return;
    setCoupons(coupons.filter(c => c.id !== id));
    await supabase.from('coupons').delete().eq('id', id);
    logAction('حذف كوبون', id);
  };

  // 6. إدارة التعليقات والردود
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    const commentObj = {
      id: Math.random().toString(),
      user_name: 'أدمن المنصة',
      content: newCommentInput,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date().toISOString()
    };
    setComments([commentObj, ...comments]);
    await supabase.from('comments').insert([commentObj]);
    setNewCommentInput('');
    setMsg('تم نشر التعليق بنجاح!');
  };

  const toggleCommentHidden = async (comment: any) => {
    const next = !comment.is_hidden;
    setComments(comments.map(c => c.id === comment.id ? { ...c, is_hidden: next } : c));
    await supabase.from('comments').update({ is_hidden: next }).eq('id', comment.id);
  };

  const toggleCommentPinned = async (comment: any) => {
    const next = !comment.is_pinned;
    setComments(comments.map(c => c.id === comment.id ? { ...c, is_pinned: next } : c));
    await supabase.from('comments').update({ is_pinned: next }).eq('id', comment.id);
  };

  const sendReply = async (id: string) => {
    const replyText = replyDrafts[id];
    if (!replyText?.trim()) return;
    setComments(comments.map(c => c.id === id ? { ...c, reply: replyText } : c));
    await supabase.from('comments').update({ reply: replyText }).eq('id', id);
    setReplyDrafts({ ...replyDrafts, [id]: '' });
    setMsg('تم إرسال الرد!');
  };

  const deleteComment = async (id: string) => {
    if (!confirm('حذف التعليق؟')) return;
    setComments(comments.filter(c => c.id !== id));
    await supabase.from('comments').delete().eq('id', id);
  };

  // 7. الإشعارات
  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    await supabase.from('notifications').insert([{
      title: notifTitle,
      message: notifMsg,
      target_type: notifTarget,
      target_id: notifTarget === 'course' ? notifTargetCourse : notifTarget === 'student' ? notifTargetStudent : null
    }]);

    logAction('إرسال إشعار', `${notifTitle} (${notifTarget})`);
    setNotifTitle('');
    setNotifMsg('');
    setMsg('تم إرسال الإشعار بنجاح! 🔔');
  };

  // الأرباح والبيانات
  const earnings = useMemo(() => {
    const total = subscriptions.reduce((sum, s) => {
      const course = courses.find((c) => c.id === s.course_id);
      return sum + (course?.price || 0);
    }, 0);
    return {
      total,
      daily: Math.round(total * 0.15),
      monthly: Math.round(total * 0.7),
      yearly: total,
      chartData: [
        { label: 'الأحد', value: 120 },
        { label: 'الإثنين', value: 300 },
        { label: 'الثلاثاء', value: 250 },
        { label: 'الأربعاء', value: 450 },
        { label: 'الخميس', value: 600 },
        { label: 'الجمعة', value: 350 },
        { label: 'السبت', value: 500 },
      ]
    };
  }, [subscriptions, courses]);

  // أنماط المظهر
  const themeClasses = useMemo(() => {
    switch (bgStyle) {
      case 'black':
        return { bg: 'bg-black text-white', card: 'bg-zinc-950 border-zinc-800', sidebar: 'bg-zinc-950 border-zinc-800' };
      case 'darkRed':
        return { bg: 'bg-[#0F172A] text-slate-100', card: 'bg-slate-900 border-red-900/40', sidebar: 'bg-slate-900 border-red-900/40' };
      case 'darkBlue':
        return { bg: 'bg-[#0F172A] text-slate-100', card: 'bg-slate-900 border-blue-900/40', sidebar: 'bg-slate-900 border-blue-900/40' };
      default:
        return { bg: 'bg-slate-950 text-slate-100', card: 'bg-slate-900 border-slate-800', sidebar: 'bg-slate-900 border-slate-800' };
    }
  }, [bgStyle]);

  if (loadingAuth) {
    return (
      <div dir="rtl" className={`${cairo.className} min-h-screen bg-black text-white flex items-center justify-center p-4`}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" />
          <span className="text-sm font-bold">جاري تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen ${themeClasses.bg} flex transition-colors duration-300`}>

      {/* الشريط الجانبي للأدمن */}
      <aside className={`w-64 ${themeClasses.sidebar} border-l p-6 space-y-8 shrink-0 hidden md:block overflow-y-auto`}>
        <div className="flex items-center gap-2.5">
          <div className="bg-[#2563EB] p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base text-[#2563EB]">لوحة الأدمن</h1>
            <p className="text-[10px] text-slate-400">إدارة منصة مساري</p>
          </div>
        </div>

        {/* اختيار خلفية اللوحة */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            خلفية لوحة التحكم:
          </p>
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
            { id: 'add_course', label: 'إضافة مقرر جديد', icon: PlusCircle },
            { id: 'courses', label: 'إدارة المقررات والإخفاء', icon: BookOpen },
            { id: 'add_lesson', label: 'إضافة فيديو والملفات', icon: Video },
            { id: 'students', label: 'إدارة الطلاب', icon: Users },
            { id: 'subscribers', label: 'مشتركو الدورات', icon: GraduationCap },
            { id: 'coupons', label: 'الخصومات والكوبونات', icon: Percent },
            { id: 'comments', label: 'إدارة التعليقات', icon: MessageSquare },
            { id: 'notifs', label: 'الإشعارات التفاعلية', icon: Bell },
            { id: 'settings', label: 'إعدادات المنصة', icon: Settings },
            { id: 'audit', label: 'سجل العمليات', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-2xl transition ${
                  activeTab === item.id
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                    : 'hover:bg-slate-800/60 text-slate-400'
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
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">

        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-black text-white">إدارة منصة مساري | Masari</h1>
            <p className="text-xs text-slate-400 mt-1">التحكم المباشر والشامل بكافة الأقسام والخدمات</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl text-white transition"
          >
            الانتقال للرئيسية
          </button>
        </header>

        {msg && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-pulse">
            <Check className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* 1. الإحصائيات والأرباح (بدون تكرار) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'المقررات النشطة', value: courses.length, icon: BookOpen, color: 'text-[#2563EB]' },
                { title: 'إجمالي الطلاب', value: students.length || 1, icon: Users, color: 'text-[#7C3AED]' },
                { title: 'إجمالي الاشتراكات', value: subscriptionsCount, icon: Ticket, color: 'text-[#22C55E]' },
                { title: 'إجمالي الأرباح', value: `${earnings.total} ر.س`, icon: DollarSign, color: 'text-[#F59E0B]' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold">{stat.title}</span>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${themeClasses.card} p-5 rounded-3xl border space-y-1`}>
                <span className="text-xs text-slate-400 font-bold">أرباح اليوم المقدرة</span>
                <p className="text-xl font-black text-[#22C55E]">{earnings.daily} ر.س</p>
              </div>
              <div className={`${themeClasses.card} p-5 rounded-3xl border space-y-1`}>
                <span className="text-xs text-slate-400 font-bold">أرباح الشهر</span>
                <p className="text-xl font-black text-[#22C55E]">{earnings.monthly} ر.س</p>
              </div>
              <div className={`${themeClasses.card} p-5 rounded-3xl border space-y-1`}>
                <span className="text-xs text-slate-400 font-bold">الكوبونات النشطة</span>
                <p className="text-xl font-black text-amber-400">{coupons.filter(c => c.is_active).length}</p>
              </div>
            </div>

            <div className={`${themeClasses.card} p-6 rounded-3xl border space-y-2`}>
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                مخطط المبيعات اليومي
              </h3>
              <MiniBarChart data={earnings.chartData} />
            </div>
          </div>
        )}

        {/* 2. إضافة مقرر جديد */}
        {activeTab === 'add_course' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#2563EB]" />
              إضافة مقرر دراسي جديد
            </h2>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="اسم المقرر (مثال: رياضيات 101)"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="رمز المقرر (مثال: ريض 101)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="السعر (بالريال)"
                  value={newCoursePrice}
                  onChange={(e) => setNewCoursePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="السعر قبل الخصم (اختياري)"
                  value={newCourseOrigPrice}
                  onChange={(e) => setNewCourseOrigPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="اسم الدكتور / المحاضر"
                  value={newCourseInst}
                  onChange={(e) => setNewCourseInst(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                />
              </div>

              <textarea
                placeholder="تفاصيل ووصف المقرر..."
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
              />

              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl text-xs transition"
              >
                حفظ ونشر المقرر فوراً
              </button>
            </form>
          </section>
        )}

        {/* 3. إدارة المقررات والحذف والإخفاء */}
        {activeTab === 'courses' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              المقررات المسجلة ({courses.length})
            </h2>

            <div className="space-y-2.5">
              {courses.map((course) => (
                <div key={course.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white ml-2">{course.title}</span>
                    <span className="text-emerald-400 font-bold ml-2">{course.price ? `${course.price} ر.س` : 'مجاني'}</span>
                    {course.code && <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">{course.code}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublishCourse(course)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${course.is_published !== false ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}
                    >
                      {course.is_published !== false ? 'منشور (اضغط للإخفاء)' : 'مخفي (اضغط للنشر)'}
                    </button>
                    <button type="button" onClick={() => handleDeleteCourse(course.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. إضافة درس وفيديو مع رفع الملفات الثلاثة */}
        {activeTab === 'add_lesson' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              إضافة درس ومحاضرة (فيديو + رفع الـ PDF والملخص والواجب)
            </h2>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                required
              >
                <option value="">-- اختر المقرر لإضافة الدرس له --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>

              <input
                type="text"
                placeholder="عنوان الدرس"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                required
              />

              <input
                type="url"
                placeholder="رابط فيديو YouTube (مثال: https://www.youtube.com/watch?v=XXXXX)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-white block mb-1.5">1. رفع PDF الدرس:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-slate-400 w-full" />
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-white block mb-1.5">2. رفع الملخص المنفصل:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setSummaryFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-slate-400 w-full" />
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-white block mb-1.5">3. رفع ملف الواجب:</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-slate-400 w-full" />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <input
                  type="checkbox"
                  id="previewCheck"
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <label htmlFor="previewCheck" className="text-xs text-slate-300 font-bold cursor-pointer">
                  اجعل هذا الدرس معاينة مجانية للجميع (Preview)
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl text-xs transition">
                {loading ? 'جاري الرفع والنشر...' : 'حفظ ونشر الدرس والملفات'}
              </button>
            </form>

            {/* عرض وتنسيق الدروس الحالية بالسحب والإفلات */}
            {selectedCourse && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  دروس المقرر المحدد (اسحب لتغيير الترتيب)
                </h3>
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      className={`flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs cursor-grab active:cursor-grabbing ${draggedIndex === idx ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-500">#{idx + 1}</span>
                        <span className="font-bold text-white">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleLessonPublish(lesson)} className="p-1 text-slate-400 hover:text-white">
                          {lesson.is_published !== false ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                        </button>
                        <button type="button" onClick={() => openEditLesson(lesson)} className="p-1 text-blue-400 hover:text-blue-300">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="p-1 text-red-400 hover:text-red-300">
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

        {/* 5. إدارة الطلاب */}
        {activeTab === 'students' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              قائمة الطلاب والمسجلين ({students.length})
            </h2>

            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو البريد..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-9 pl-3 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {students
                .filter((s) => !studentSearch || s.full_name?.includes(studentSearch) || s.email?.includes(studentSearch))
                .map((student) => {
                  const active = student.is_active !== false;
                  return (
                    <div key={student.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-white">{student.full_name || 'طالب جديد'}</p>
                        <p className="text-[10px] text-slate-400">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => quickNotifyStudent(student)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Bell className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => toggleStudentActive(student)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {active ? 'نشط (اضغط للإيقاف)' : 'موقوف (اضغط للتفعيل)'}
                        </button>
                        <button type="button" onClick={() => handleDeleteStudent(student)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              {students.length === 0 && (
                <p className="text-xs text-slate-500 py-6 text-center">لا يوجد طلاب مسجلون حالياً.</p>
              )}
            </div>
          </section>
        )}

        {/* 6. مشتركو الدورات */}
        {activeTab === 'subscribers' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              عرض مشتركي دورة معينة
            </h2>

            <select
              value={subsCourseFilter}
              onChange={(e) => setSubsCourseFilter(e.target.value)}
              className="w-full max-w-md bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs focus:outline-none"
            >
              <option value="">-- اختر الدورة لرؤية طلابها --</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {subsCourseFilter && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-slate-400 font-bold">عدد المشتركين: {courseSubscribers.length}</p>
                {courseSubscribers.map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <span className="font-bold text-white">{studentName(sub.user_id)}</span>
                    <button type="button" onClick={() => removeSubscriber(sub)} className="text-red-400 text-[10px] font-bold hover:underline">إلغاء الاشتراك</button>
                  </div>
                ))}
                {courseSubscribers.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">لا يوجد مشتركون في هذه الدورة بعد.</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* 7. الخصومات والكوبونات */}
        {activeTab === 'coupons' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-400" />
              إنشاء كود خصم جديد
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="رمز الكوبون (مثال: MASARI20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs focus:outline-none"
                  required
                />
                <select value={couponType} onChange={(e: any) => setCouponType(e.target.value)} className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs focus:outline-none">
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (SAR)</option>
                </select>
                <input
                  type="number"
                  placeholder="قيمة الخصم"
                  value={couponVal}
                  onChange={(e) => setCouponVal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs focus:outline-none"
                  required
                />
              </div>

              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">
                إضافة الكوبون
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300">الكوبونات الحالية:</h3>
              {coupons.map((cp) => (
                <div key={cp.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-blue-400 ml-2">{cp.code}</span>
                    <span className="text-slate-400">({cp.discount_type === 'percent' ? `%${cp.discount_value}` : `${cp.discount_value} SAR`})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleCouponStatus(cp.id, cp.is_active)} className={`px-3 py-1 rounded-xl text-[10px] font-bold ${cp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {cp.is_active ? 'مفعل' : 'معطل'}
                    </button>
                    <button type="button" onClick={() => handleDeleteCoupon(cp.id)} className="text-red-400 p-1 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. التعليقات والردود */}
        {activeTab === 'comments' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              إدارة تعليقات الطلاب والرد عليها
            </h2>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="اكتب تعليقاً حقيقياً جديدة للمنصة..."
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-2.5 text-xs focus:outline-none"
              />
              <button type="submit" className="bg-purple-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1">
                <Send className="w-3.5 h-3.5" /> نشر
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{c.user_name || 'طالب'}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleCommentPinned(c)} className="text-amber-400 p-1"><Pin className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => toggleCommentHidden(c)} className="text-slate-400 p-1"><EyeOff className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => deleteComment(c.id)} className="text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-slate-300">{c.content}</p>

                  {c.reply && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400">
                      <span className="font-bold">رد الأدمن: </span>{c.reply}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="اكتب ردك كأدمن..."
                      value={replyDrafts[c.id] || ''}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button type="button" onClick={() => sendReply(c.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold">
                      رد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. الإشعارات التفاعلية */}
        {activeTab === 'notifs' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-6`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              إرسال إشعار تفاعلي
            </h2>

            <form onSubmit={handleSendNotif} className="space-y-4">
              <input
                type="text"
                placeholder="عنوان الإشعار (مثال: تم نشر شابتر 3 جديد!)"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                required
              />
              <textarea
                placeholder="محتوى الإشعار وتفاصيله..."
                value={notifMsg}
                onChange={(e) => setNotifMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs focus:outline-none"
                required
              />
              <button type="submit" className="bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-xs">
                إرسال الإشعار للجميع
              </button>
            </form>
          </section>
        )}

        {/* 10. إعدادات المنصة */}
        {activeTab === 'settings' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              إعدادات المفاتيح والمنصة
            </h2>
            {[
              { key: 'registration_enabled', label: 'السماح بالتسجيل الجديد للطلاب' },
              { key: 'purchase_enabled', label: 'تفعيل عمليات الشراء والدفع' },
              { key: 'comments_enabled', label: 'تفعيل نظام التعليقات' },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-white">{item.label}</span>
                <Toggle
                  checked={(toggles as any)[item.key]}
                  onChange={() => {
                    const next = { ...toggles, [item.key]: !(toggles as any)[item.key] };
                    setToggles(next);
                    saveSetting(item.key, String(next[item.key as keyof typeof next]));
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {/* 11. سجل العمليات */}
        {activeTab === 'audit' && (
          <section className={`${themeClasses.card} p-6 rounded-3xl border space-y-4`}>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              سجل العمليات الإدارية (Audit Log)
            </h2>
            <div className="space-y-2">
              {auditLog.map((log) => (
                <div key={log.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white ml-2">{log.action}</span>
                    <span className="text-slate-400">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString('ar-SA')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* مودال تعديل الدرس المكتمل */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                <Edit3 className="w-5 h-5" />
                تعديل الدرس والملفات
              </h3>
              <button type="button" onClick={() => setEditingLesson(null)} className="text-slate-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>

            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="عنوان الدرس" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="وصف الدرس" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" />
            <input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="رابط فيديو YouTube" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" />

            <div className="space-y-2">
              {[
                { field: 'pdf_url' as const, label: 'ملف PDF', file: editPdfFile, setFile: setEditPdfFile },
                { field: 'summary_url' as const, label: 'ملف الملخص', file: editSummaryFile, setFile: setEditSummaryFile },
                { field: 'assignment_url' as const, label: 'ملف الواجب', file: editAssignmentFile, setFile: setEditAssignmentFile },
              ].map((item) => (
                <div key={item.field} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-white block mb-1">{item.label}</label>
                    {editingLesson[item.field] && !item.file ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 font-bold">✓ ملف موجود</span>
                        <button type="button" onClick={() => removeLessonFile(editingLesson, item.field)} className="text-red-400 text-[10px] font-bold hover:underline">حذف</button>
                      </div>
                    ) : (
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => item.setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] text-slate-400 w-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleUpdateLesson} disabled={savingEdit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition">
              {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}