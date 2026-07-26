'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import { User, GraduationCap, ArrowRight, Save, BookOpen, LogOut, CheckCircle, Lock } from 'lucide-react';

const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '600', '700', '800', '900'] });

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('غير محدد');
  const [university, setUniversity] = useState('جامعة الملك سعود');
  const [mySubs, setMySubs] = useState<any[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      setEmail(data.user.email || '');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setBirthDate(profile.birth_date || '');
        setGender(profile.gender || 'غير محدد');
        setUniversity(profile.university || 'جامعة الملك سعود');
      }

      const { data: subs } = await supabase.from('subscriptions').select('*, courses(*)').eq('user_id', data.user.id);
      if (subs) setMySubs(subs.map((s) => s.courses).filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('الاسم والبريد حقلان إجباريان!');
      return;
    }

    setSaving(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        birth_date: birthDate || null,
        gender: gender || null,
        university,
        updated_at: new Date().toISOString()
      });
      setMsg('تم حفظ وتحديث البيانات الشخصية بنجاح! 🎉');
    } catch (e) {
      setMsg('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMsg('كلمة المرور يجب ألا تقل عن 6 أحرف');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg('كلمات المرور غير متطابقة');
      return;
    }

    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMsg('تم تحديث كلمة المرور بنجاح! 🔒');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg(err.message || 'فشل التحديث');
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
      <div dir="rtl" className={`${cairo.className} min-h-screen bg-slate-950 text-white flex items-center justify-center`}>
        <div className="flex items-center gap-2 animate-pulse font-bold text-sm">
          <GraduationCap className="w-6 h-6 text-[#2563EB]" /> جاري تحميل الملف الشخصي...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen bg-slate-950 text-white p-4 md:p-8`}>
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

        {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {msg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleSaveProfile} className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300">البيانات الإجبارية والاختيارية</h2>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">الاسم الكامل <span className="text-red-500">*</span></label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسمك الثلاثي" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">البريد الإلكتروني <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">رقم الجوال <span className="text-slate-500">(اختياري)</span></label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">تاريخ الميلاد <span className="text-slate-500">(اختياري)</span></label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none" />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-xs transition">
              <Save className="w-4 h-4 inline ml-1" /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات الشخصية'}
            </button>
          </form>

          <div className="space-y-6">
            <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300 flex items-center gap-1.5"><Lock className="w-4 h-4 text-amber-400" /> تغيير كلمة المرور</h2>
              {passMsg && <p className="text-[11px] font-bold text-amber-400">{passMsg}</p>}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <button type="submit" disabled={savingPass} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition">
                {savingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold pb-2 border-b border-slate-800 text-slate-300 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> المقررات المشترك بها</h2>
              {mySubs.length > 0 ? (
                <div className="space-y-2">
                  {mySubs.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <p className="font-bold text-white">{c.title}</p>
                      <span className="text-[10px] text-emerald-400 font-bold">مفعل</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">لا توجد اشتراكات حالياً.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}