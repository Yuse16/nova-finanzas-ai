'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export function GlassSheet({
  open,
  onClose,
  title,
  children,
  footer,
  fullScreen,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  /** @deprecated No longer used — all sheets are bottom sheets by default. */
  fullScreen?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="absolute inset-0 cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/[0.04] backdrop-blur-[2px] dark:bg-black/30 dark:backdrop-blur-sm" />
            </button>
          </motion.div>

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0, y: '100%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white/[0.72] pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] backdrop-blur-[24px] dark:bg-gray-900/[0.78] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="sticky top-0 z-10 flex items-center justify-between px-6 pb-2 pt-5">
                {title && (
                  <h2 className="truncate text-lg font-semibold tracking-tight text-balance text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className={`grid size-9 shrink-0 place-items-center rounded-full bg-white/50 text-gray-600 backdrop-blur-xl transition-colors hover:bg-white/70 active:scale-95 dark:bg-white/15 dark:text-white/70 dark:hover:bg-white/25 ${title ? 'ml-auto' : ''}`}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-2">{children}</div>

              {footer && (
                <div className="border-t border-white/30 px-6 pt-4 dark:border-white/10">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
