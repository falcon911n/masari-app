'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type ThemeMode = 'dark' | 'light' | 'auto';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  color: string;
  setMode: (m: ThemeMode) => void;
  setColor: (hex: string) => void;
  ready: boolean;
}

const STORAGE_KEY_MODE = 'masari_theme_mode';
const STORAGE_KEY_COLOR = 'masari_theme_color';
const DEFAULT_COLOR = '#2563EB';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme يجب أن يُستخدم داخل <ThemeProvider>');
  return ctx;
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function shiftLightness(hex: string, deltaPercent: number) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + deltaPercent)));
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SEMANTIC_BASE: Record<'dark' | 'light', { bg: string; surface: string; surfaceElevated: string; border: string; text: string; textMuted: string }> = {
  dark: { bg: '#020617', surface: '#0f172a', surfaceElevated: '#0f172a', border: '#1e293b', text: '#f1f5f9', textMuted: '#94a3b8' },
  light: { bg: '#F8FAFC', surface: '#FFFFFF', surfaceElevated: '#FFFFFF', border: '#E5E7EB', text: '#111827', textMuted: '#6B7280' },
};

function applyThemeVars(color: string, resolvedMode: 'dark' | 'light') {
  const root = document.documentElement;
  const base = SEMANTIC_BASE[resolvedMode];
  const { r, g, b } = hexToRgb(color);
  const { l } = rgbToHsl(r, g, b);
  const onPrimary = l > 75 ? '#111827' : '#ffffff';

  root.style.setProperty('--masari-primary', color);
  root.style.setProperty('--masari-primary-hover', shiftLightness(color, resolvedMode === 'dark' ? 8 : -8));
  root.style.setProperty('--masari-primary-soft', withAlpha(color, 0.12));
  root.style.setProperty('--masari-primary-border', withAlpha(color, 0.3));
  root.style.setProperty('--masari-on-primary', onPrimary);
  root.style.setProperty('--masari-bg', base.bg);
  root.style.setProperty('--masari-surface', base.surface);
  root.style.setProperty('--masari-surface-elevated', base.surfaceElevated);
  root.style.setProperty('--masari-border', base.border);
  root.style.setProperty('--masari-text', base.text);
  root.style.setProperty('--masari-text-muted', base.textMuted);
  root.setAttribute('data-theme', resolvedMode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [color, setColorState] = useState<string>(DEFAULT_COLOR);
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>('dark');
  const [ready, setReady] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const storedMode = (localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null) || 'dark';
    const storedColor = localStorage.getItem(STORAGE_KEY_COLOR) || DEFAULT_COLOR;
    setModeState(storedMode);
    setColorState(storedColor);

    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authData?.user) {
          userIdRef.current = authData.user.id;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('theme_color, theme_mode')
            .eq('id', authData.user.id)
            .maybeSingle();
          if (!cancelled && profileData) {
            if (profileData.theme_mode) setModeState(profileData.theme_mode as ThemeMode);
            if (profileData.theme_color) setColorState(profileData.theme_color);
          }
        }
      } catch {
        // تجاهل الخطأ مؤقتاً عند عدم تسجيل الدخول
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mode !== 'auto') {
      setResolvedMode(mode);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setResolvedMode(mq.matches ? 'dark' : 'light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mode]);

  useEffect(() => {
    applyThemeVars(color, resolvedMode);
  }, [color, resolvedMode]);

  const persist = useCallback(async (nextMode: ThemeMode, nextColor: string) => {
    localStorage.setItem(STORAGE_KEY_MODE, nextMode);
    localStorage.setItem(STORAGE_KEY_COLOR, nextColor);
    if (userIdRef.current) {
      await supabase.from('profiles').update({ theme_mode: nextMode, theme_color: nextColor }).eq('id', userIdRef.current);
    }
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    persist(m, color);
  }, [color, persist]);

  const setColor = useCallback((hex: string) => {
    setColorState(hex);
    persist(mode, hex);
  }, [mode, persist]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, color, setMode, setColor, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}