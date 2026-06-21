'use client'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppearanceSettings {
  theme: ThemeMode
  primaryColor: string
  secondaryColor: string
  cardTransparency: number
  customBackground: 'mountain' | 'solid' | 'gradient'
}

export interface TypographySettings {
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
  letterSpacing: 'tight' | 'normal' | 'wide'
}

export interface DashboardSettings {
  showGreeting: boolean
  showBalance: boolean
  showIncome: boolean
  showExpenses: boolean
  showGoals: boolean
  showQuickActions: boolean
}

export interface CardSettings {
  borderRadius: number
  shadowIntensity: 'none' | 'low' | 'medium' | 'high'
  glassIntensity: number
  borderWidth: number
}

export interface LayoutSettings {
  spacing: 'compact' | 'normal' | 'wide'
  widgetSize: 'small' | 'medium' | 'large'
  layoutMode: 'compact' | 'normal' | 'wide'
}

export interface AccessibilitySettings {
  highContrast: boolean
  reduceAnimations: boolean
  largeText: boolean
}

export interface CustomizationSettings {
  appearance: AppearanceSettings
  typography: TypographySettings
  dashboard: DashboardSettings
  cards: CardSettings
  layout: LayoutSettings
  accessibility: AccessibilitySettings
}

export type CustomizationSection =
  | 'appearance'
  | 'typography'
  | 'dashboard'
  | 'cards'
  | 'layout'
  | 'accessibility'

export const CUSTOMIZATION_STORAGE_KEY = 'nova-finanzas:customization'

export const SHADOW_MAP: Record<CardSettings['shadowIntensity'], string> = {
  none: 'none',
  low: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  medium: '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  high: '0 10px 30px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)',
}

export const DARK_SHADOW_MAP: Record<CardSettings['shadowIntensity'], string> = {
  none: 'none',
  low: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  medium: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
  high: '0 10px 30px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)',
}

export const FONT_WEIGHT_MAP: Record<TypographySettings['fontWeight'], string> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

export const LETTER_SPACING_MAP: Record<TypographySettings['letterSpacing'], string> = {
  tight: '-0.025em',
  normal: '0em',
  wide: '0.05em',
}

export const SPACING_MAP: Record<LayoutSettings['spacing'], string> = {
  compact: '0.75rem',
  normal: '1rem',
  wide: '1.5rem',
}

export const WIDGET_SIZE_MAP: Record<LayoutSettings['widgetSize'], string> = {
  small: '0.85',
  medium: '1',
  large: '1.15',
}

export const DEFAULT_CUSTOMIZATION: CustomizationSettings = {
  appearance: {
    theme: 'system',
    primaryColor: 'oklch(0.6 0.14 260)',
    secondaryColor: 'oklch(0.6 0.1 260)',
    cardTransparency: 72,
    customBackground: 'mountain',
  },
  typography: {
    fontSize: 16,
    fontFamily: 'system',
    fontWeight: 'normal',
    letterSpacing: 'normal',
  },
  dashboard: {
    showGreeting: true,
    showBalance: true,
    showIncome: true,
    showExpenses: true,
    showGoals: true,
    showQuickActions: true,
  },
  cards: {
    borderRadius: 20,
    shadowIntensity: 'medium',
    glassIntensity: 50,
    borderWidth: 1,
  },
  layout: {
    spacing: 'normal',
    widgetSize: 'medium',
    layoutMode: 'normal',
  },
  accessibility: {
    highContrast: false,
    reduceAnimations: false,
    largeText: false,
  },
}

export function loadCustomization(): CustomizationSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_CUSTOMIZATION }
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CUSTOMIZATION }
    return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CUSTOMIZATION }
  }
}

export function saveCustomization(settings: CustomizationSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(settings))
  } catch { /* quota exceeded */ }
}
