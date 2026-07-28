'use client';

/**
 * صفحة الملف الشخصي للطالب | Masari Profile Dashboard
 * =========================================================
 * تم تحويل الصفحة إلى Dashboard احترافي بالكامل:
 * - Avatar كبير وتصميم Glassmorphism.
 * - دعم كامل لجميع الشاشات (Responsive 100%).
 * - الاعتماد على متغيرات CSS الديناميكية (--masari-*).
 * - عدم حذف أي دالة أو كود برمجي أساسي.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, ArrowRight, Save,
  BookOpen, LogOut, CheckCircle, Lock, 
  ShieldCheck, RefreshCw, AlertCircle, Camera, Calendar, Phone, MapPin, GraduationCap,
  ChevronRight
} from 'lucide-react';
import PlatformCustomization from '@/components/profile/PlatformCustomization';

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
  const [lastLogin, setLastLogin] = useState<string>('');
  
  // الصورة الشخصية
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setLastLogin(authData.user.last_sign_in_at ? new Date(authData.user.last_sign_in_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر');

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
        setAvatarUrl(profileData.avatar_url || '');
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString()
      });

    } catch (error: any) {
      alert('فشل رفع الصورة: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMsg('الاسم حقل إجباري!');
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
        university: university.trim() || 'لا شيء',
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      if (emailChanged) {
        setMsg('تم حفظ بياناتك! تحقق من بريدك الإلكتروني لتأكيد التغيير. 📧');
      } else {
        setMsg('تم حفظ وتحديث بياناتك الشخصية بنجاح! 🎉');
      }
      setMsgStatus('success');
    } catch (err: any) {
      setMsg(`فشل الحفظ: ${err.message}`);
      setMsgStatus('error');
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
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--masari-primary)', borderTopColor: 'transparent' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--masari-primary)' }}>جاري تجهيز لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen pb-16 font-sans selection:bg-primary/30" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
      
      {/* خلفية جمالية ضبابية */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30 mix-blend-multiply" style={{ backgroundColor: 'var(--masari-text-muted)' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 space-y-8">

        {/* 1. الهيدر و Avatar (Overview) */}
        <div className="relative rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center md:items-end gap-6 border backdrop-blur-xl transition-all duration-300" style={{ backgroundColor: 'var(--masari-surface-elevated)', borderColor: 'var(--masari-border)' }}>
          <div className="absolute top-0 right-0 w-full h-24" style={{ background: 'linear-gradient(to right, var(--masari-primary-soft), var(--masari-primary))', opacity: 0.2 }}></div>
          
          <Link href="/" className="absolute top-6 left-6 p-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg bg-background" style={{ borderColor: 'var(--masari-border)' }}>
            <ArrowRight className="w-5 h-5" style={{ color: 'var(--masari-text)' }} />
          </Link>

          <div className="relative group cursor-pointer z-10" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all duration-500 shadow-xl group-hover:shadow-primary/50" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-surface)' }}>
              {uploadingAvatar ? (
                <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--masari-primary)' }} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <User className="w-12 h-12" style={{ color: 'var(--masari-text-muted)' }} />
              )}
            </div>
            <div className="absolute bottom-2 right-2 p-2.5 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
              <Camera className="w-4 h-4" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 text-center md:text-right z-10 space-y-2">
            <h1 className="text-2xl md:text-4xl font-black">{fullName || 'طالب مساري'}</h1>
            <p className="text-sm font-medium flex items-center justify-center md:justify-start gap-2" style={{ color: 'var(--masari-text-muted)' }}>
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                <GraduationCap className="w-4 h-4" style={{ color: 'var(--masari-primary)' }} /> {university}
              </span>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                <Calendar className="w-4 h-4" style={{ color: 'var(--masari-primary)' }} /> آخر دخول: {lastLogin}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className="z-10 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all w-full md:w-auto justify-center shadow-sm">
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border shadow-xl animate-in slide-in-from-top-4 ${msgStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
            {msgStatus === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />} {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* العمود الأيمن (البيانات وتخصيص المنصة) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* نموذج البيانات الأساسية */}
            <form onSubmit={handleSaveProfile} className="rounded-3xl p-6 md:p-8 space-y-6 shadow-xl border backdrop-blur-md" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black pb-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--masari-border)' }}>
                <ShieldCheck className="w-6 h-6" style={{ color: 'var(--masari-primary)' }} /> الإعدادات الشخصية
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>الاسم الكامل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 opacity-40" style={{ color: 'var(--masari-text)' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك"
                      className="w-full border rounded-2xl pr-12 pl-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 opacity-40" style={{ color: 'var(--masari-text)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left"
                      style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                      dir="ltr"
                      required
                    />
                  </div>
                  {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                    <p className="text-[11px] text-amber-500 font-bold flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> سيتطلب هذا التغيير تأكيداً عبر بريدك
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>رقم الجوال <span className="font-normal opacity-60">(اختياري)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 opacity-40" style={{ color: 'var(--masari-text)' }} />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full border rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left"
                      style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>تاريخ الميلاد <span className="font-normal opacity-60">(اختياري)</span></label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    onClick={(e) => 'showPicker' in HTMLInputElement.prototype && (e.target as HTMLInputElement).showPicker()}
                    className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50"
                    style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>الجنس <span className="font-normal opacity-60">(اختياري)</span></label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer bg-no-repeat bg-[position:left_1rem_center] bg-[length:1em]"
                    style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                  >
                    <option value="غير محدد">تفضيل عدم الإفصاح</option>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>الجامعة <span className="font-normal opacity-60">(اختياري)</span></label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer bg-no-repeat bg-[position:left_1rem_center] bg-[length:1em]"
                    style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                  >
                    <option value="لا شيء">لا شيء</option>
                    <option value="جامعة الملك سعود">جامعة الملك سعود</option>
                    <option value="جامعة الإمام">جامعة الإمام</option>
                    <option value="جامعة الأميرة نورة">جامعة الأميرة نورة</option>
                    <option value="جامعة سطام">جامعة سطام</option>
                    <option value="جامعة الملك عبد العزيز">جامعة الملك عبد العزيز</option>
                    <option value="جامعة أم القرى">جامعة أم القرى</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving} 
                className="w-full font-bold py-4 rounded-2xl text-sm transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-2 mt-6"
                style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات الشخصية'}
              </button>
            </form>

            {/* قسم تخصيص ألوان ومظهر المنصة */}
            <PlatformCustomization />
          </div>

          {/* العمود الأيسر (كلمات المرور والمقررات) */}
          <div className="space-y-8">

            {/* بطاقة المقررات المشترك بها */}
            <div className="rounded-3xl p-6 shadow-xl border flex flex-col h-[400px] backdrop-blur-md" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <div className="flex justify-between items-center pb-4 border-b mb-4" style={{ borderColor: 'var(--masari-border)' }}>
                <h2 className="text-base font-black flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: 'var(--masari-primary)' }} /> اشتراكاتي
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10" style={{ color: 'var(--masari-primary)' }}>{mySubs.length} دورات</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {mySubs.length > 0 ? (
                  mySubs.map((c, index) => (
                    <Link href="/courses" key={index} className="p-4 rounded-2xl border flex justify-between items-center group transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                          <BookOpen className="w-5 h-5" style={{ color: 'var(--masari-primary)' }} />
                        </div>
                        <span className="font-bold text-sm truncate max-w-[120px] md:max-w-[160px]">{c.title || 'مقرر مجهول'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                      <BookOpen className="w-8 h-8" style={{ color: 'var(--masari-text-muted)' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--masari-text)' }}>لا توجد اشتراكات حالياً</p>
                    <Link href="/" className="text-xs font-bold underline" style={{ color: 'var(--masari-primary)' }}>تصفح المقررات</Link>
                  </div>
                )}
              </div>
            </div>

            {/* نموذج تغيير كلمة المرور */}
            <form onSubmit={handleUpdatePassword} className="rounded-3xl p-6 shadow-xl border backdrop-blur-md" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-base font-black pb-4 border-b flex items-center gap-2 mb-5" style={{ borderColor: 'var(--masari-border)' }}>
                <Lock className="w-5 h-5 text-amber-500" /> الأمان وكلمة المرور
              </h2>

              {passMsg && (
                <p className={`text-xs font-bold mb-4 p-3 rounded-xl flex items-center gap-2 ${passStatus === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {passStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />} {passMsg}
                </p>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>كلمة المرور الجديدة</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 opacity-40" style={{ color: 'var(--masari-text)' }} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-left"
                      style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: 'var(--masari-text-muted)' }}>تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 opacity-40" style={{ color: 'var(--masari-text)' }} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-left"
                      style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={savingPass} 
                  className="w-full border font-bold py-3.5 rounded-xl text-sm transition-all hover:bg-amber-500 hover:text-white hover:border-amber-500 disabled:opacity-60 flex justify-center items-center gap-2 mt-2"
                  style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                >
                  {savingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {savingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}