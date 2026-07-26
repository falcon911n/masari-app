'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Globe } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // تسجيل بواسطة الإيميل وكلمة السر
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('تم إنشاء الحساب بنجاح!');
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

  // تسجيل بواسطة قوقل
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 dir-rtl" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="bg-blue-600/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-blue-400 border border-blue-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">{isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h1>
          <p className="text-sm text-slate-400">مرحباً بك في المنصة التعليمية</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* زر تسجيل قوقل بأيقونة SVG أصلية ومباشرة */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-3 rounded-xl text-sm transition flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          متابعة باستخدام Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs text-slate-500">أو عبر البريد</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* نموذج البريد وكلمة السر */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">البريد الإلكتروني</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">كلمة السر</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Lock className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/20"
          >
            {loading ? 'جاري التحقق...' : isSignUp ? 'إنشاء الحساب' : 'الدخول للمنصة'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-blue-400 transition"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>
        </div>

      </div>
    </div>
  );
}