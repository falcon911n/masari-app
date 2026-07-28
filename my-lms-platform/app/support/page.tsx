'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Headset, Mail, MessageCircle, Send, Upload, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, PhoneCall } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SupportPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState('استفسار عام');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !description) {
      setMsg('يرجى ملء جميع الحقول المطلوبة');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setMsg('');

    try {
      let fileUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('slides').upload(`support/${fileName}`, file);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('slides').getPublicUrl(`support/${fileName}`);
          fileUrl = data.publicUrl;
        }
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('support_messages').insert([
        {
          user_id: userData?.user?.id || null,
          subject: `[${issueType}] - ${fullName}`,
          message: `${description} \n\n البريد: ${email} \n الصورة: ${fileUrl || 'لا يوجد'}`,
          status: 'open',
        },
      ]);

      if (error) throw error;

      setMsg('تم إرسال تذكرتك بنجاح! سيتواصل معك فريق الدعم في أسرع وقت. 🚀');
      setStatus('success');
      setFullName('');
      setEmail('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      setMsg(err.message || 'حدث خطأ أثناء إرسال التذكرة');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen py-12 px-4 md:px-8 font-sans" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border mb-2 transition-all hover:scale-105" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-primary)' }}>
            <ArrowRight className="w-4 h-4" /> الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3">
            <Headset className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--masari-primary)' }} />
            الدعم الفني والمساندة
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--masari-text-muted)' }}>
            هل تواجه مشكلة أو لديك استفسار؟ فريق منصة مساري متواجد دائماً لخدمتك.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* نموذج الدعم */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-3xl p-6 md:p-8 space-y-6 shadow-xl border" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h2 className="text-lg font-black border-b pb-4 flex items-center gap-2" style={{ borderColor: 'var(--masari-border)' }}>
                <Send className="w-5 h-5" style={{ color: 'var(--masari-primary)' }} /> فتح تذكرة دعم جديدة
              </h2>

              {msg && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                  {status === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {msg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>الاسم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none transition-all"
                    style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none transition-all text-left"
                    style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>نوع المشكلة / الاستفسار</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                >
                  <option value="استفسار عام">استفسار عام</option>
                  <option value="مشكلة في التسجيل/الدخول">مشكلة في التسجيل / الدخول</option>
                  <option value="مشكلة في الدفع أو الاشتراك">مشكلة في الدفع أو الاشتراك</option>
                  <option value="خطأ في تشغيل الفيديوهات">خطأ في تشغيل الفيديوهات أو الملفات</option>
                  <option value="اقتراح أو شكوى">اقتراح أو شكوى</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>وصف المشكلة <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل لمساعدتك بشكل أسرع..."
                  className="w-full border rounded-2xl p-3.5 text-sm focus:outline-none transition-all"
                  style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>مرفق صورة توضيحية (اختياري)</label>
                <div className="relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all hover:opacity-80" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="flex items-center justify-center gap-2 text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>
                    <Upload className="w-4 h-4" />
                    <span>{file ? file.name : 'اضغط هنا لرفع صورة للمشكلة'}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full font-bold py-4 rounded-2xl text-sm transition-all shadow-lg disabled:opacity-60 flex justify-center items-center gap-2"
                style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}
              >
                {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'جاري إرسال التذكرة...' : 'إرسال التذكرة للدعم'}
              </button>
            </form>
          </div>

          {/* وسائل التواصل المباشرة */}
          <div className="space-y-6">
            <div className="rounded-3xl p-6 border space-y-6 shadow-xl" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <h3 className="text-base font-black border-b pb-3 flex items-center gap-2" style={{ borderColor: 'var(--masari-border)' }}>
                <PhoneCall className="w-5 h-5" style={{ color: 'var(--masari-primary)' }} /> قنوات التواصل المباشر
              </h3>

              <div className="space-y-4">
                <a href="https://wa.me/966000000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">واتساب الدعم (WhatsApp)</span>
                    <span className="text-[11px]" style={{ color: 'var(--masari-text-muted)' }}>رد سريع خلال دقائق</span>
                  </div>
                </a>

                <a href="https://t.me/masari_support" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                  <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">تيليجرام (Telegram)</span>
                    <span className="text-[11px]" style={{ color: 'var(--masari-text-muted)' }}>قناة الدعم الفني</span>
                  </div>
                </a>

                <a href="mailto:support@masari.sa" className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">البريد الإلكتروني</span>
                    <span className="text-[11px]" style={{ color: 'var(--masari-text-muted)' }}>support@masari.sa</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="rounded-3xl p-6 border space-y-3 shadow-md" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> أوقات عمل الدعم الفني
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
                فريقنا متواجد لخدمتكم طوال أيام الأسبوع من الساعة 9:00 صباحاً وحتى 11:00 مساءً.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}