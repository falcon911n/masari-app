'use client';

import Link from 'next/link';
import { FileText, ArrowRight, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen py-12 px-4 md:px-8 font-sans" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border mb-2 transition-all hover:scale-105" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-primary)' }}>
            <ArrowRight className="w-4 h-4" /> الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--masari-primary)' }} />
            الشروط والأحكام
          </h1>
          <p className="text-xs md:text-sm" style={{ color: 'var(--masari-text-muted)' }}>آخر تحديث: 2026</p>
        </div>

        {/* المحتوى */}
        <div className="rounded-3xl p-6 md:p-10 border space-y-8 shadow-xl" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <CheckCircle className="w-5 h-5" /> 1. القبول بالشروط
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              باستخدامك لمنصة Masari، فإنك توافق التام والكامل على الالتزام بكافة الشروط والأحكام الواردة في هذه الصفحة، والتي تهدف لتنظيم الاستخدام وضمان حقوق كافة الأطراف.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <ShieldAlert className="w-5 h-5" /> 2. حقوق الملكية الفكرية
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              جميع المحتويات والأكواد والفيديوهات والملخصات المعروضة على المنصة هي ملك حصري لمنصة مساري. يُحظر تماماً تسجيل الفيديوهات، إعادة بيع الملخصات، أو مشاركة الحساب مع أشخاص آخرين تحت طائلة المساءلة القانونية والحظر الفوري للحساب.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <FileText className="w-5 h-5" /> 3. الاشتراكات والمدفوعات
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              تتيح لك المشتريات الوصول إلى المحتوى المحدد طوال فترة الفصل الدراسي أو حسب ما هو موضح في صفحة الدورة. جميع المبالغ المدفوعة خاضعة لسياسة الاسترجاع المحددة في المنصة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--masari-primary)' }}>
              <HelpCircle className="w-5 h-5" /> 4. التعديلات على الخدمات
            </h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
              تحتفظ إدارة المنصة بالحق في تعديل أو تحديث أو تحسين أجزاء من الخدمة أو الشروط في أي وقت لتلبية متطلبات الجودة والتطوير المستمر.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}