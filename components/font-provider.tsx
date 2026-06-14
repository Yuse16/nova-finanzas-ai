'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function FontProvider({ children }: { children: React.ReactNode }) {
  const { data: { profile } } = useStore()
  const selectedFont = profile?.selectedFont || 'system'

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body
      // Remove all font-related classes first to ensure only the selected one applies
      body.classList.remove('font-system', 'font-inter', 'font-roboto-mono')
      // Apply the new font class
      body.classList.add(`font-${selectedFont.replace('var(--font-', '').replace(')', '')}`)
    }
  }, [selectedFont])

  return <>{children}</>
}
