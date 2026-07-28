export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'royal-blue', name: 'أزرق ملكي', hex: '#2563EB' },
  { id: 'sky-blue', name: 'أزرق سماوي', hex: '#0EA5E9' },
  { id: 'indigo', name: 'نيلي', hex: '#4F46E5' },
  { id: 'violet', name: 'بنفسجي', hex: '#7C3AED' },
  { id: 'purple', name: 'أرجواني', hex: '#9333EA' },
  { id: 'fuchsia', name: 'فوشيا', hex: '#C026D3' },
  { id: 'pink', name: 'وردي', hex: '#DB2777' },
  { id: 'rose', name: 'وردي غامق', hex: '#E11D48' },
  { id: 'red', name: 'أحمر', hex: '#DC2626' },
  { id: 'orange', name: 'برتقالي', hex: '#EA580C' },
  { id: 'amber', name: 'كهرماني', hex: '#D97706' },
  { id: 'gold', name: 'أصفر ذهبي', hex: '#CA8A04' },
  { id: 'lime', name: 'ليموني', hex: '#65A30D' },
  { id: 'green', name: 'أخضر', hex: '#16A34A' },
  { id: 'emerald', name: 'زمردي', hex: '#059669' },
  { id: 'teal', name: 'تركواز', hex: '#0D9488' },
  { id: 'cyan', name: 'سماوي فاتح', hex: '#0891B2' },
  { id: 'slate-blue', name: 'أزرق رمادي', hex: '#475569' },
  { id: 'stone', name: 'بني حجري', hex: '#78716C' },
  { id: 'brown', name: 'بني ذهبي', hex: '#92400E' },
  { id: 'charcoal', name: 'أسود أنيق', hex: '#27272A' },
  { id: 'navy', name: 'كحلي داكن', hex: '#1E3A8A' },
  { id: 'forest', name: 'أخضر غامق', hex: '#14532D' },
  { id: 'maroon', name: 'عنابي', hex: '#7F1D1D' },
];

export const DEFAULT_THEME_COLOR = '#2563EB';