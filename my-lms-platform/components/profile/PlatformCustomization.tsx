'use client';

import { useState } from 'react';
import { Sun, Moon, Monitor, Check, Palette, Sparkles, LayoutGrid } from 'lucide-react';
import { useTheme, ThemeMode } from '@/lib/theme/theme-context';
import { COLOR_PRESETS } from '@/lib/theme/color-presets';

const DEFAULT_FALLBACK = '#2563EB';

export default function PlatformCustomization() {
  const { mode, color, setMode, setColor } = useTheme();
  const [customHex, setCustomHex] = useState(color);
  const [savedFlash, setSavedFlash] = useState(false);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleModeChange = (m: ThemeMode) => { setMode(m); flashSaved(); };
  const handlePresetClick = (hex: string) => { setColor(hex); setCustomHex(hex); flashSaved(); };
  const handleCustomChange = (hex: string) => { setCustomHex(hex); setColor(hex); flashSaved(); };

  const modes: { id: ThemeMode; label: string; icon: typeof Moon }[] = [
    { id: 'dark', label: 'الوضع الداكن', icon: Moon },
    { id: 'light', label: 'الوضع الفاتح', icon: Sun },
    { id: 'auto', label: 'حسب الجهاز', icon: Monitor },
  ];

  return (
    <div
      className="rounded-3xl p-6 md:p-8 space-y-8 shadow-xl border backdrop-blur-md transition-all duration-300"
      style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)' }}
    >
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--masari-border)' }}>
        <h2 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--masari-text)' }}>
          <Palette className="w-6 h-6" style={{ color: 'var(--masari-primary)' }} /> مظهر المنصة
        </h2>
        {savedFlash && (
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
            <Check className="w-4 h-4" /> تم الحفظ تلقائياً
          </span>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--masari-text-muted)' }}>
          <LayoutGrid className="w-4 h-4" /> وضع الشاشة
        </p>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border text-xs font-bold transition-all duration-300 hover:scale-105"
                style={
                  active
                    ? { borderColor: 'var(--masari-primary)', backgroundColor: 'var(--masari-primary-soft)', color: 'var(--masari-primary)', boxShadow: '0 4px 12px var(--masari-primary-soft)' }
                    : { borderColor: 'var(--masari-border)', color: 'var(--masari-text-muted)', backgroundColor: 'var(--masari-bg)' }
                }
              >
                <Icon className={`w-6 h-6 ${active ? 'animate-pulse' : ''}`} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--masari-border)' }}>
        <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--masari-text-muted)' }}>
          <Sparkles className="w-4 h-4" /> اللون الأساسي (Theme Color)
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const active = color.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.name}
                onClick={() => handlePresetClick(preset.hex)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl relative transition-all duration-300 hover:scale-110 hover:-translate-y-1 focus:outline-none"
                style={{
                  backgroundColor: preset.hex,
                  boxShadow: active ? `0 0 0 3px var(--masari-surface), 0 0 0 6px ${preset.hex}` : `0 4px 10px ${preset.hex}40`,
                  transform: active ? 'scale(1.1)' : 'none'
                }}
              >
                {active && <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md animate-in zoom-in" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6">
          <label className="text-xs font-bold" style={{ color: 'var(--masari-text-muted)' }}>استخدام لون مخصص (Hex):</label>
          <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl border" style={{ borderColor: 'var(--masari-border)' }}>
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : DEFAULT_FALLBACK}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-8 h-8 rounded-xl border-none cursor-pointer bg-transparent overflow-hidden"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              onBlur={() => /^#[0-9A-Fa-f]{6}$/.test(customHex) && handleCustomChange(customHex)}
              dir="ltr"
              className="bg-transparent border-none w-24 text-sm font-bold focus:outline-none text-center"
              style={{ color: 'var(--masari-text)' }}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t space-y-4" style={{ borderColor: 'var(--masari-border)' }}>
        <p className="text-sm font-bold flex items-center justify-between" style={{ color: 'var(--masari-text-muted)' }}>
          <span>معاينة حية للتغييرات</span>
        </p>
        
        {/* صندوق المعاينة الحية */}
        <div className="p-5 rounded-2xl border space-y-4 shadow-inner" style={{ backgroundColor: 'var(--masari-bg)', borderColor: 'var(--masari-border)' }}>
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold" style={{ color: 'var(--masari-text)' }}>عنوان تجريبي للمنصة</h4>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'var(--masari-primary-soft)', color: 'var(--masari-primary)' }}>
              نشط الآن
            </span>
          </div>
          
          <p className="text-xs leading-relaxed" style={{ color: 'var(--masari-text-muted)' }}>
            هذا النص يستخدم لإظهار كيف ستبدو المنصة بالألوان والوضع الذي قمت باختياره. 
          </p>
          
          <div className="flex items-center gap-3 pt-2">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: 'var(--masari-primary)', color: 'var(--masari-on-primary)' }}>
              زر أساسي
            </button>
            <button className="px-5 py-2.5 rounded-xl border text-xs font-bold transition-colors" style={{ borderColor: 'var(--masari-primary)', color: 'var(--masari-primary)', backgroundColor: 'transparent' }}>
              زر ثانوي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}