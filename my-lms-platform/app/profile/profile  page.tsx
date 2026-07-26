'use client';

/**
 * صفحة الملف الشخصي للطالب | Masari Profile
 * =========================================================
 * الإصلاح الرئيسي في هذه النسخة:
 * كانت الصفحة تحفظ البريد الإلكتروني الجديد في جدول profiles فقط، دون تحديث
 * البريد الفعلي في نظام المصادقة (auth.users). النتيجة: الطالب يغيّر بريده
 * من صفحة "الملف الشخصي"، فيظهر البريد الجديد في الواجهة، لكن تسجيل الدخول
 * يستمر يعمل بالبريد القديم فقط — وهذا على الأغلب أحد أسباب مشاكل "الدخول"
 * التي ذُكرت. الآن أي تغيير على البريد يُرسل أيضاً إلى supabase.auth.updateUser
 * مع توضيح أن Supabase قد يطلب تأكيد البريد الجديد عبر رسالة إلكترونية.
 *
 * كما تمت إزالة استيراد خط Cairo المكرر (موروث الآن من app/layout.tsx).
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  User, Mail, GraduationCap, ArrowRight, Save,
  BookOpen, LogOut, CheckCircle, Lock, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [user, setUser] = useState<any>(null);

  // الحقول الشخصية الأساسية
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('غير محدد');
  const [university, setUniversity] = useState('جامعة الملك سعود');
  const [mySubs, setMySubs] = useState<any[]>([]);

  // حقول تغيير كلمة المرور
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passStatus, setPassStatus] = useState<'success' | 'error' | ''>('');

  // رسائل الحفظ العام
  const [msg, setMsg] = useState('');
  const [msgStatus, setMsgStatus] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);
      setEmail(authData.user.email || '');
      setOriginalEmail(authData.user.email || '');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileData) {
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setBirthDate(profileData.birth_date || '');
        setGender(profileData.gender || 'غير محدد');
        setUniversity(profileData.university || 'جامعة الملك سعود');
      }

      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*, courses(*)')
        .eq('user_id', authData.user.id);

      if (subsData) {
        const coursesList = subsData.map((s: any) => s.courses).filter(Boolean);
        setMySubs(coursesList);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMsg('الاسم الكامل حقل إجباري!');
      setMsgStatus('error');
      return;
    }
    if (!email.trim()) {
      setMsg('البريد الإلكتروني حقل إجباري!');
      setMsgStatus('error');
      return;
    }

    setSaving(true);
    setMsg('');
    try {
      const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

      // إذا تغيّر البريد، حدّثه أولاً في نظام المصادقة نفسه (auth.users)
      // وليس فقط في جدول profiles، وإلا يبقى تسجيل الدخول يعمل بالبريد القديم.
      if (emailChanged) {
        const { error: authUpdateError } = await supabase.auth.updateUser({ email: email.trim() });
        if (authUpdateError) throw authUpdateError;
      }

      const payload = {
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : null,
        birth_date: birthDate || null,
        gender: gender || 'غير محدد',
        university: university.trim() || 'جامعة الملك سعود',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      if (emailChanged) {
        setMsg('تم حفظ بياناتك! تحقق من بريدك الإلكتروني الجديد (والقديم أحياناً) لتأكيد تغيير البريد. 📧');
      } else {
        setMsg('تم حفظ وتحديث بياناتك الشخصية بنجاح! 🎉');
      }
      setMsgStatus('success');
    } catch (err: any) {
      setMsg(`فشل الحفظ: ${err.message}`);
      setMsgStatus('error');
      // نرجع حقل البريد المعروض لآخر بريد فعلي مؤكد إذا فشل تحديث المصادقة
      setEmail(originalEmail);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMsg('كلمة المرور يجب ألا تقل عن 6 أحرف');
      setPassStatus('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg('كلمات المرور المدخلة غير متطابقة');
      setPassStatus('error');
      return;
    }

    setSavingPass(true);
    setPassMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPassMsg('تم تحديث كلمة المرور بنجاح! 🔒');
      setPassStatus('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg(err.message || 'فشل تحديث كلمة المرور');
      setPassStatus('error');
    } finally {
      setSavingPass(false);
      setTimeout(() => setPassMsg(''), 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 animate-pulse font-bold text-sm">
          <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin" /> جاري تحميل الملف الشخصي وجلسة الطالب...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2"><User className="w-5 h-5 text-[#2563EB]" /> الملف الشخصي للطالب</h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-red-500 hover:text-white transition">
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${msgStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {msgStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />} {msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <form onSubmit={handleSaveProfile} className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> بيانات الحساب والملف الشخصي
            </h2>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">الاسم الكامل <span className="text-red-500">* (إجباري)</span></label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الثلاثي"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">البريد الإلكتروني <span className="text-red-500">* (إجباري)</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
              {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1 pt-0.5">
                  <Mail className="w-3 h-3" /> سيتطلب هذا التغيير تأكيداً عبر بريدك الإلكتروني
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">رقم الجوال <span className="text-slate-500">(اختياري)</span></label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">تاريخ الميلاد <span className="text-slate-500">(اختياري)</span></label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">الجنس <span className="text-slate-500">(اختياري)</span></label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="غير محدد">تفضيل عدم الإفصاح</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">الجامعة</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-lg shadow-blue-500/20 disabled:opacity-60">
              <Save className="w-4 h-4 inline ml-1" /> {saving ? 'جاري الحفظ في القاعدة...' : 'حفظ التعديلات الشخصية'}
            </button>
          </form>

          <div className="space-y-6">

            <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" /> تغيير كلمة المرور
              </h2>

              {passMsg && (
                <p className={`text-[11px] font-bold ${passStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {passMsg}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button type="submit" disabled={savingPass} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-60">
                {savingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> المقررات المشترك بها
              </h2>
              {mySubs.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mySubs.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                      <span className="font-bold text-white truncate max-w-[140px]">{c.title}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">مفعل</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">لا توجد اشتراكات لدورات حالياً.</p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}