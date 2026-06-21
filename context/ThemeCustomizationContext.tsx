'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { CustomizationSettings, ThemeMode } from '@/lib/customization-types'
import {
  DEFAULT_CUSTOMIZATION,
  loadCustomization,
  saveCustomization,
  SHADOW_MAP,
  DARK_SHADOW_MAP,
  FONT_WEIGHT_MAP,
  LETTER_SPACING_MAP,
  SPACING_MAP,
  WIDGET_SIZE_MAP,
} from '@/lib/customization-types'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'

interface ThemeCustomizationValue {
  settings: CustomizationSettings
  updateAppearance: <K extends keyof CustomizationSettings['appearance']>(key: K, value: CustomizationSettings['appearance'][K]) => void
  updateTypography: <K extends keyof CustomizationSettings['typography']>(key: K, value: CustomizationSettings['typography'][K]) => void
  updateDashboard: <K extends keyof CustomizationSettings['dashboard']>(key: K, value: CustomizationSettings['dashboard'][K]) => void
  updateCards: <K extends keyof CustomizationSettings['cards']>(key: K, value: CustomizationSettings['cards'][K]) => void
  updateLayout: <K extends keyof CustomizationSettings['layout']>(key: K, value: CustomizationSettings['layout'][K]) => void
  updateAccessibility: <K extends keyof CustomizationSettings['accessibility']>(key: K, value: CustomizationSettings['accessibility'][K]) => void
  resetAll: () => void
}

const ThemeCustomizationCtx = createContext<ThemeCustomizationValue | null>(null)

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function applyCSSVariables(settings: CustomizationSettings, resolvedTheme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  const { appearance, typography, cards, layout, accessibility } = settings

  root.style.setProperty('--custom-radius', `${cards.borderRadius}px`)
  root.style.setProperty('--custom-shadow', resolvedTheme === 'dark' ? DARK_SHADOW_MAP[cards.shadowIntensity] : SHADOW_MAP[cards.shadowIntensity])
  root.style.setProperty('--custom-border-width', `${cards.borderWidth}px`)
  root.style.setProperty('--custom-glass-opacity', String(cards.glassIntensity / 100))
  root.style.setProperty('--custom-font-size-scale', accessibility.largeText ? '1.15' : '1')
  root.style.setProperty('--custom-font-weight', FONT_WEIGHT_MAP[typography.fontWeight])
  root.style.setProperty('--custom-letter-spacing', LETTER_SPACING_MAP[typography.letterSpacing])
  root.style.setProperty('--custom-spacing', SPACING_MAP[layout.spacing])
  root.style.setProperty('--custom-widget-scale', WIDGET_SIZE_MAP[layout.widgetSize])

  const glassOpacity = cards.glassIntensity / 100
  const glassBgLight = `rgba(255,255,255,${Math.min(0.9, 0.3 + glassOpacity * 0.6)})`
  const glassBgDark = `rgba(17,24,39,${Math.min(0.85, 0.4 + glassOpacity * 0.45)})`
  root.style.setProperty('--custom-glass-bg-light', glassBgLight)
  root.style.setProperty('--custom-glass-bg-dark', glassBgDark)

  if (accessibility.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  if (accessibility.reduceAnimations) {
    root.classList.add('reduce-animations')
  } else {
    root.classList.remove('reduce-animations')
  }

  if (layout.layoutMode === 'compact') {
    root.classList.add('layout-compact')
  } else {
    root.classList.remove('layout-compact')
  }

  if (layout.layoutMode === 'wide') {
    root.classList.add('layout-wide')
  } else {
    root.classList.remove('layout-wide')
  }
}

export function ThemeCustomizationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOMIZATION)
  const [ready, setReady] = useState(false)
  const { theme, setTheme } = useUI()
  const { updateSelectedFont } = useStore()

  useEffect(() => {
    const loaded = loadCustomization()
    setSettings(loaded)
    setReady(true)
  }, [])

  const activeResolved = useMemo(() => resolveTheme(settings.appearance.theme), [settings.appearance.theme])

  useEffect(() => {
    if (!ready) return
    if (settings.appearance.theme !== 'system' && settings.appearance.theme !== theme) {
      setTheme(settings.appearance.theme)
    }
  }, [ready, settings.appearance.theme])

  useEffect(() => {
    if (!ready) return
    applyCSSVariables(settings, activeResolved)
  }, [settings, activeResolved, ready])

  useEffect(() => {
    if (!ready) return
    if (settings.typography.fontFamily !== 'system') {
      updateSelectedFont(settings.typography.fontFamily)
    }
  }, [ready, settings.typography.fontFamily])

  const persist = useCallback((next: CustomizationSettings) => {
    setSettings(next)
    saveCustomization(next)
  }, [])

  const updateAppearance = useCallback(<K extends keyof CustomizationSettings['appearance']>(key: K, value: CustomizationSettings['appearance'][K]) => {
    setSettings(prev => {
      const next = { ...prev, appearance: { ...prev.appearance, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const updateTypography = useCallback(<K extends keyof CustomizationSettings['typography']>(key: K, value: CustomizationSettings['typography'][K]) => {
    setSettings(prev => {
      const next = { ...prev, typography: { ...prev.typography, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const updateDashboard = useCallback(<K extends keyof CustomizationSettings['dashboard']>(key: K, value: CustomizationSettings['dashboard'][K]) => {
    setSettings(prev => {
      const next = { ...prev, dashboard: { ...prev.dashboard, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const updateCards = useCallback(<K extends keyof CustomizationSettings['cards']>(key: K, value: CustomizationSettings['cards'][K]) => {
    setSettings(prev => {
      const next = { ...prev, cards: { ...prev.cards, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const updateLayout = useCallback(<K extends keyof CustomizationSettings['layout']>(key: K, value: CustomizationSettings['layout'][K]) => {
    setSettings(prev => {
      const next = { ...prev, layout: { ...prev.layout, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const updateAccessibility = useCallback(<K extends keyof CustomizationSettings['accessibility']>(key: K, value: CustomizationSettings['accessibility'][K]) => {
    setSettings(prev => {
      const next = { ...prev, accessibility: { ...prev.accessibility, [key]: value } }
      saveCustomization(next)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    const defaults = { ...DEFAULT_CUSTOMIZATION }
    setSettings(defaults)
    saveCustomization(defaults)
    setTheme('light')
    updateSelectedFont('system')
  }, [setTheme, updateSelectedFont])

  const value = useMemo(() => ({
    settings,
    updateAppearance,
    updateTypography,
    updateDashboard,
    updateCards,
    updateLayout,
    updateAccessibility,
    resetAll,
  }), [settings, updateAppearance, updateTypography, updateDashboard, updateCards, updateLayout, updateAccessibility, resetAll])

  return (
    <ThemeCustomizationCtx.Provider value={value}>
      {children}
    </ThemeCustomizationCtx.Provider>
  )
}

export function useCustomization() {
  const ctx = useContext(ThemeCustomizationCtx)
  if (!ctx) throw new Error('useCustomization must be used within ThemeCustomizationProvider')
  return ctx
}
