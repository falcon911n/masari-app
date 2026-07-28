'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

// إعداد سياق الألوان المخصصة لدعم 20 لون مختلف
type ThemeColorContextType = {
  themeColor: string
  setThemeColor: (color: string) => void
}

const ThemeColorContext = React.createContext<ThemeColorContextType | undefined>(undefined)

export function useThemeColor() {
  const context = React.useContext(ThemeColorContext)
  if (!context) {
    throw new Error('useThemeColor must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [themeColor, setThemeColor] = React.useState('blue')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // استرجاع اللون المحفوظ من المتصفح إن وجد
    const savedColor = localStorage.getItem('masari-theme-color')
    if (savedColor) {
      setThemeColor(savedColor)
      document.documentElement.setAttribute('data-theme-color', savedColor)
    }
  }, [])

  const updateThemeColor = (color: string) => {
    setThemeColor(color)
    localStorage.setItem('masari-theme-color', color)
    document.documentElement.setAttribute('data-theme-color', color)
  }

  // تجنب أخطاء Hydration
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider {...props}>
      <ThemeColorContext.Provider value={{ themeColor, setThemeColor: updateThemeColor }}>
        {children}
      </ThemeColorContext.Provider>
    </NextThemesProvider>
  )
}

export default ThemeProvider