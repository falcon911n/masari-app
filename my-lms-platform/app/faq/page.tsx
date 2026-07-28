'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, Search, ArrowRight, MessageCircle, Mail } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FaqItem[] = [
  { question: 'ما هي منصة Masari؟', answer: 'منصة مساري هي بيئة تعليمية متكاملة تقدم دورات، ملخصات مركزة، واختبارات تفاعلية مساعدة لطلاب الجامعات والمدارس للتفوق الأكاديمي.', category: 'عام' },
  { question: 'ما أهداف المنصة؟', answer: 'تهدف المنصة إلى تبسيط المناهج المعقدة، توفير وقت الطالب عبر الملخصات المركزية، وتوفير تجربة تعلم ذكية ومتاحة في أي وقت ومن أي مكان.', category: 'عام' },
  { question: 'كيف أسجل في المنصة؟', answer: 'اضغط على زر "تسجيل الدخول" في الأعلى، ثم اختر "إنشاء حساب جديد"، وأدخل اسمك وبريدك الإلكتروني وكلمة المرور لتفعيل حسابك فوراً.', category: 'الحساب' },
  { question: 'كيف أشترك في الدورة أو المقرر؟', answer: 'تصفح المقررات، اختر المقرر المناسب، اضغط على زر "إضافة للسلة"، ثم توجه للسلة واضغط على "إتمام الدفع وتفعيل الاشتراك".', category: 'الاشتراكات' },
  { question: 'كيف أشتري مقرر أو ملخص؟', answer: 'يمكنك شراء أي مقرر أو ملخص فردي من خلال إضافة المادة لسلة المشتريات والدفع إلكترونياً لفتح المحتوى مباشرة في حسابك.', category: 'الاشتراكات' },
  { question: 'كيف أشاهد المحاضرات والدروس؟', answer: 'بعد الاشتراك، توجه إلى صفحة المقرر أو ملفك الشخصي، واضغط على أي درس في القائمة الجانبية لعرض الفيديوهات وملفات PDF المرفقة.', category: 'المحتوى' },
  { question: 'هل يوجد سياسة استرجاع؟', answer: 'نعم، نوفر سياسة استرجاع مرنة خلال 48 ساعة من الدفع بشرط عدم مشاهدة أكثر من 10% من محتوى الدورة. يمكنك التواصل مع الدعم لتقديم الطلب.', category: 'الاشتراكات' },
  { question: 'كيف أتواصل مع الدعم الفني؟', answer: 'يمكنك التواصل معنا مباشرة عبر صفحة "الدعم الفني"، أو عبر الواتساب، أو التيليجرام، أو البريد الإلكتروني المخصص للدعم.', category: 'الدعم' },
  { question: 'هل المنصة تعمل على الجوال؟', answer: 'نعم، المنصة مصممة ومطورة بالكامل لتعمل بسلاسة عالية على جميع الأجهزة والجوالات والشاشات بمختلف مقاساتها.', category: 'عام' },
  { question: 'كيف أغير كلمة المرور؟', answer: 'توجه إلى صفحة "الملف الشخصي"، وستجد قسماً خاصاً بإعدادات الأمان وكلمة المرور لتحديثها في أي وقت.', category: 'الحساب' },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const categories = ['الكل', 'عام', 'الحساب', 'الاشتراكات', 'المحتوى', 'الدعم'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div dir="rtl" className="min-h-screen py-12 px-4 md:px-8 font-sans" style={{ backgroundColor: 'var(--masari-bg)', color: 'var(--masari-text)' }}>
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border mb-2 transition-all hover:scale-105" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-primary)' }}>
            <ArrowRight className="w-4 h-4" /> الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--masari-primary)' }} />
            الأسئلة الشائعة
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--masari-text-muted)' }}>
            إليك إجابات لأكثر الأسئلة شيوعاً حول منصة مساري وكيفية الاستفادة من الخدمات والمقررات.
          </p>
        </div>

        {/* البحث والتصنيفات */}
        <div className="space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute right-4 top-4 w-5 h-5 opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن سؤالك هنا..."
              className="w-full border rounded-2xl pr-12 pl-4 py-4 text-sm focus:outline-none transition-all shadow-md"
              style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                style={
                  selectedCategory === cat
                    ? { backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)', borderColor: 'var(--masari-primary)' }
                    : { backgroundColor: 'var(--masari-surface)', color: 'var(--masari-text-muted)', borderColor: 'var(--masari-border)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة الأسئلة */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border shadow-sm overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-right p-5 font-bold text-sm md:text-base flex justify-between items-center gap-4 focus:outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--masari-primary)' }} />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--masari-primary)' }} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-xs md:text-sm leading-relaxed border-t" style={{ color: 'var(--masari-text-muted)', borderColor: 'var(--masari-border)' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <HelpCircle className="w-12 h-12 mx-auto opacity-20" />
              <p className="text-sm font-bold" style={{ color: 'var(--masari-text-muted)' }}>لم نجد أسئلة تطابق بحثك.</p>
            </div>
          )}
        </div>

        {/* التواصل */}
        <div className="p-8 rounded-3xl border text-center space-y-4 shadow-xl" style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}>
          <h3 className="text-lg font-black">لم تجد إجابة لسؤالك؟</h3>
          <p className="text-xs md:text-sm max-w-md mx-auto" style={{ color: 'var(--masari-text-muted)' }}>
            فريق الدعم الفني متواجد لمساعدتك والإجابة على أي استفسارات على مدار الساعة.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/support" className="px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
              <Mail className="w-4 h-4" /> تواصل مع الدعم الفني
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}