'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, Eye, Database, Server } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen py-12 px-4 md:px-8 font-sans" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border mb-2 transition-all hover:scale-105" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-primary)' }}>
            <ArrowRight className="w-4 h-4" /> الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3">
            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--masari-primary)' }} />
            سياسة الخصوصية
          </h1>
          <p className="text-xs md:text-sm" style={{ color: 'var(--masari-text-muted)' }}>آخر تحديث: 2026</p>
        </div>

        {/* المحتوى */}
        <div className="rounded-3xl p-6 md:p-10 border space-y-8 shadow-xl" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <Eye className="w-5 h-5" /> 1. البيانات التي نجمعها
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              نحن في منصة مساري نولي خصوصيتك أهمية بالغة. نجمع البيانات الأساسية لتوفير الخدمة مثل: الاسم، البريد الإلكتروني، رقم الجوال، وتفاصيل الاشتراكات والمقررات لضمان تجربة تعليمية مخصصة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <Database className="w-5 h-5" /> 2. كيف نستخدم معلوماتك؟
            </h2>
            <ul className="list-disc list-inside text-xs md:text-sm space-y-2 leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              <li>تفعيل اشتراكاتك في المقررات وتتبع تقدمك الدراسي.</li>
              <li>إرسال الإشعارات والتحديثات المهمة المتعلقة باختباراتك أو دروسك.</li>
              <li>تحسين جودة المنصة وحل المشكلات الفنية التي قد تواجهك.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <Lock className="w-5 h-5" /> 3. حماية البيانات والأمان
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              نطبق أعلى معايير الأمان والتشفير (SSL) لحماية بياناتك من الوصول غير المصرح به. لن نبيع أو نؤجر معلوماتك الشخصية لأي طرف ثالث تحت أي ظرف من الظروف.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <Server className="w-5 h-5" /> 4. ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              نستخدم ملفات الكوكيز لحفظ جلسة الدخول وتفضيلات الثيم والألوان الخاصة بك لتوفير تجربة استخدام تصفح سريعة وسلسة.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}