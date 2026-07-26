'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, GraduationCap, Calculator, BookOpen, PenTool, Compass, Award, Bookmark, ArrowRight } from 'lucide-react';
import { Cairo } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '600', '700', '800', '900'] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'حدث خطأ أثناء عملية التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  };

  const handleGuestEnter = () => {
    sessionStorage.setItem('masari_guest_mode', 'true');
    router.push('/');
  };

  return (
    <div dir="rtl" className={`${cairo.className} min-h-screen bg-[#070C18] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden`}>
      
      {/* الأشكال والأيقونات التجريدية التعليمية بالخلفية بدلاً من الشخبطات */}
      <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-wrap justify-between p-12 overflow-hidden">
        <Calculator className="w-24 h-24 text-blue-400 absolute top-10 right-10 rotate-12" />
        <BookOpen className="w-32 h-32 text-purple-400 absolute bottom-12 left-10 -rotate-12" />
        <PenTool className="w-20 h-20 text-emerald-400 absolute top-1/3 left-16 rotate-45" />
        <Compass className="w-28 h-28 text-amber-400 absolute bottom-1/3 right-16 -rotate-6" />
        <Award className="w-20 h-20 text-[#2563EB] absolute top-12 left-1/3" />
        <Bookmark className="w-16 h-16 text-red-400 absolute bottom-10 right-1/3" />
      </div>

      <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl relative z-10">
        
        {/* الشعار والحجم الصافي */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#2563EB] rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              مساري | <span className="text-[#2563EB]">Masari</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp ? 'أنشئ حسابك للوصول إلى الشروحات والملخصات' : 'سجل دخولك لمتابعة دروسك واختباراتك'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* زر قوقل */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 font-bold py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          متابعة باستخدام Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] font-bold text-slate-500">أو عبر البريد الإلكتروني</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">البريد الإلكتروني</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3">
              <Mail className="w-4 h-4 text-slate-500 ml-2.5 shrink-0" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">كلمة السر</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3">
              <Lock className="w-4 h-4 text-slate-500 ml-2.5 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'جاري التحقق...' : isSignUp ? 'إنشاء الحساب' : 'الدخول للمنصة'}
          </button>
        </form>

        <div className="text-center space-y-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-slate-400 hover:text-[#2563EB] transition block mx-auto"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>

          {/* الخيار المطلوب: الدخول كزائر بدلاً من العودة للمنصة */}
          <button
            type="button"
            onClick={handleGuestEnter}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition flex items-center justify-center gap-1 mx-auto pt-1"
          >
            الدخول كزائر لاستكشاف المقررات
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
}