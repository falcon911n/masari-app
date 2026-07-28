'use client'

/**
 * ModalProvider — نظام نوافذ منبثقة عام وقابل لإعادة الاستخدام.
 * تم تحسينه بحركات ناعمة (Framer Motion Spring Physics) وتحكم أفضل.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

type ModalOptions = {
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  size?: ModalSize
  labelledBy?: string
}

type ModalContextValue = {
  openModal: (content: React.ReactNode, options?: ModalOptions) => void
  closeModal: () => void
  isOpen: boolean
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = React.useState<React.ReactNode>(null)
  const [options, setOptions] = React.useState<ModalOptions>({})
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const lastFocusedRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => setMounted(true), [])

  const openModal = React.useCallback((node: React.ReactNode, opts: ModalOptions = {}) => {
    lastFocusedRef.current = document.activeElement as HTMLElement
    setContent(node)
    setOptions(opts)
    setIsOpen(true)
  }, [])

  const closeModal = React.useCallback(() => {
    setIsOpen(false)
    window.setTimeout(() => {
      setContent(null)
      lastFocusedRef.current?.focus?.()
    }, 300) // يتوافق مع مدة الحركة
  }, [])

  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (options.closeOnEsc ?? true)) {
        closeModal()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden' // منع التمرير في الخلفية

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, options.closeOnEsc, closeModal])

  const value = React.useMemo(() => ({ openModal, closeModal, isOpen }), [openModal, closeModal, isOpen])

  return (
    <ModalContext.Provider value={value}>
      {children}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* الخلفية الضبابية */}
                <motion.div
                  className="absolute inset-0 backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  onClick={() => (options.closeOnOverlayClick ?? true) && closeModal()}
                  aria-hidden="true"
                />

                {/* نافذة المحتوى */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={options.labelledBy}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`relative w-full rounded-3xl border shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${SIZE_CLASSES[options.size ?? 'md']}`}
                  style={{ backgroundColor: 'var(--masari-surface)', borderColor: 'var(--masari-border)', color: 'var(--masari-text)' }}
                >
                  {(options.showCloseButton ?? true) && (
                    <button
                      type="button"
                      onClick={closeModal}
                      aria-label="إغلاق"
                      className="absolute end-4 top-4 z-10 rounded-xl p-2 transition-colors hover:bg-red-500/10 hover:text-red-500 focus:outline-none"
                      style={{ color: 'var(--masari-text-muted)' }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}

                  {content}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = React.useContext(ModalContext)
  if (!ctx) {
    throw new Error('useModal يجب أن يُستخدم داخل ModalProvider')
  }
  return ctx
}

export default ModalProvider