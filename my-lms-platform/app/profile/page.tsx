'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, ArrowRight, Save,
  BookOpen, LogOut, CheckCircle, Lock, 
  ShieldCheck, RefreshCw, AlertCircle, Camera, Calendar, Phone, GraduationCap,
  ChevronRight, Palette
} from 'lucide-react';
import PlatformCustomization from '@/components/profile/PlatformCustomization';

const THEME_COLORS = [
  { name: 'blue', hex: '#2563EB' }, { name: 'red', hex: '#DC2626' }, { name: 'purple', hex: '#9333EA' },
  { name: 'green', hex: '#16A34A' }, { name: 'orange', hex: '#EA580C' }, { name: 'pink', hex: '#DB2777' },
  { name: 'cyan', hex: '#0891B2' }, { name: 'indigo', hex: '#4F46E5' }, { name: 'emerald', hex: '#059669' },
  { name: 'slate', hex: '#475569' }, { name: 'gray', hex: '#4B5563' }, { name: 'amber', hex: '#D97706' }
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('غير محدد');
  const [university, setUniversity] = useState('جامعة الملك سعود');
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [lastLogin, setLastLogin] = useState<string>('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passStatus, setPassStatus] = useState<'success' | 'error' | ''>('');

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
      setLastLogin(authData.user.last_sign_in_at ? new Date(authData.user.last_sign_in_at).toLocaleDateString('ar-SA') : 'غير متوفر');

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();

      if (profileData) {
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setBirthDate(profileData.birth_date || '');
        setGender(profileData.gender || 'غير محدد');
        setUniversity(profileData.university || 'جامعة الملك سعود');
        setAvatarUrl(profileData.avatar_url || '');
      }

      const { data: subsData } = await supabase.from('subscriptions').select('*, courses(*)').eq('user_id', authData.user.id);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: data.publicUrl, updated_at: new Date().toISOString() });
    } catch (error: any) {
      alert('فشل رفع الصورة: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setMsg('الاسم والبريد حقول إجبارية!');
      setMsgStatus('error');
      return;
    }
    setSaving(true); setMsg('');
    try {
      const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
      if (emailChanged) await supabase.auth.updateUser({ email: email.trim() });

      const payload = {
        id: user.id, full_name: fullName.trim(), email: email.trim(), phone: phone ? phone.trim() : null,
        birth_date: birthDate || null, gender: gender || 'غير محدد', university: university.trim() || 'لا شيء',
        avatar_url: avatarUrl, updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;
      setMsg(emailChanged ? 'تحقق من بريدك لتأكيد التغيير. 📧' : 'تم تحديث بياناتك بنجاح! 🎉');
      setMsgStatus('success');
    } catch (err: any) {
      setMsg(`فشل الحفظ: ${err.message}`); setMsgStatus('error'); setEmail(originalEmail);
    } finally {
      setSaving(false); setTimeout(() => setMsg(''), 5000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setPassMsg('يجب ألا تقل عن 6 أحرف'); setPassStatus('error'); return; }
    if (newPassword !== confirmPassword) { setPassMsg('غير متطابقة'); setPassStatus('error'); return; }
    setSavingPass(true); setPassMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMsg('تم تحديث كلمة المرور بنجاح! 🔒'); setPassStatus('success');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setPassMsg('فشل تحديث كلمة المرور'); setPassStatus('error');
    } finally {
      setSavingPass(false); setTimeout(() => setPassMsg(''), 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin border-primary" />
          <span className="font-bold text-lg text-primary">جاري تجهيز لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen pb-16 font-sans bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 space-y-8">
        <div className="relative rounded-3xl p-6 md:p-10 shadow-xl overflow-hidden flex flex-col md:flex-row items-center md:items-end gap-6 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Link href="/" className="absolute top-6 left-6 p-2.5 rounded-2xl border transition-all hover:scale-105 bg-muted">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="relative group cursor-pointer z-10" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950 shadow-xl">
              {uploadingAvatar ? <RefreshCw className="w-8 h-8 animate-spin text-primary" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-slate-400" />}
            </div>
            <div className="absolute bottom-2 right-2 p-2.5 rounded-full shadow-lg bg-primary text-white"><Camera className="w-4 h-4" /></div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
          <div className="flex-1 text-center md:text-right z-10 space-y-2">
            <h1 className="text-2xl md:text-4xl font-black">{fullName || 'طالب مساري'}</h1>
            <p className="text-sm font-medium flex items-center justify-center md:justify-start gap-2 text-slate-500"><Mail className="w-4 h-4" /> {user?.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-primary" /> {university}</span>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> دخول: {lastLogin}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="z-10 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-500 hover:text-white w-full md:w-auto justify-center">
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border shadow-xl ${msgStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
            {msgStatus === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />} {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSaveProfile} className="rounded-3xl p-6 md:p-8 space-y-6 shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-black pb-4 border-b flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> الإعدادات الشخصية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold ml-1 text-slate-500">الاسم الكامل <span className="text-red-500">*</span></label>
                  <div className="relative"><User className="absolute right-4 top-3.5 w-5 h-5 opacity-40" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أدخل اسمك" className="w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" required /></div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold ml-1 text-slate-500">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <div className="relative"><Mail className="absolute left-4 top-3.5 w-5 h-5 opacity-40" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm text-left focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" dir="ltr" required /></div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1 text-slate-500">رقم الجوال</label>
                  <div className="relative"><Phone className="absolute left-4 top-3.5 w-4 h-4 opacity-40" /><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" className="w-full border rounded-2xl pl-10 pr-4 py-3.5 text-sm text-left focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" dir="ltr" /></div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold ml-1 text-slate-500">تاريخ الميلاد</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full border rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full font-bold py-4 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-6 bg-primary text-white hover:opacity-90">
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </form>
            <PlatformCustomization />
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl p-6 shadow-xl border flex flex-col h-[400px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center pb-4 border-b mb-4">
                <h2 className="text-base font-black flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> اشتراكاتي</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{mySubs.length} دورات</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {mySubs.length > 0 ? (
                  mySubs.map((c, index) => (
                    <Link href="/#courses-section" key={index} className="p-4 rounded-2xl border flex justify-between items-center group hover:scale-[1.02] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-5 h-5" /></div>
                        <span className="font-bold text-sm truncate max-w-[120px]">{c.title || 'مقرر مجهول'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60 space-y-3">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                    <p className="text-sm font-bold">لا توجد اشتراكات</p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="rounded-3xl p-6 shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-black pb-4 border-b flex items-center gap-2 mb-5"><Lock className="w-5 h-5 text-amber-500" /> تغيير كلمة المرور</h2>
              {passMsg && <p className={`text-xs font-bold mb-4 p-3 rounded-xl flex items-center gap-2 ${passStatus === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}><AlertCircle className="w-4 h-4" /> {passMsg}</p>}
              <div className="space-y-5">
                <div className="relative"><Lock className="absolute left-4 top-3.5 w-4 h-4 opacity-40" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="الكلمة الجديدة" className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left" dir="ltr" /></div>
                <div className="relative"><Lock className="absolute left-4 top-3.5 w-4 h-4 opacity-40" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد الكلمة" className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left" dir="ltr" /></div>
                <button type="submit" disabled={savingPass} className="w-full border font-bold py-3.5 rounded-xl text-sm hover:bg-amber-500 hover:text-white flex justify-center items-center gap-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  {savingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}