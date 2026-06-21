'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Account, Goal, Movement, Reminder, MovementType } from './types'

export type ModalState =
  | { kind: 'none' }
  | { kind: 'voice' }
  | { kind: 'transaction'; preset?: MovementType; editing?: Movement; parsed?: Partial<Movement> & { person?: string } }
  | { kind: 'transfer' }
  | { kind: 'account'; editing?: Account }
  | { kind: 'account-detail'; account: Account }
  | { kind: 'goal'; editing?: Goal }
  | { kind: 'goal-money'; goal: Goal }
  | { kind: 'reminder'; editing?: Reminder }
  | { kind: 'assistant' }
  | { kind: 'all-movements' }
  | { kind: 'all-accounts' }
  | { kind: 'settings' }
  | { kind: 'search' }
  | { kind: 'filters' }
  | { kind: 'notifications' } // NUEVO: Tipo de modal para notificaciones
  | { kind: 'quick-actions' }
  | { kind: 'more-options' }
  | { kind: 'balance-detail' }
  | { kind: 'reset-financial' }

type UIValue = {
  modal: ModalState
  open: (m: ModalState) => void
  close: () => void
  tab: string
  setTab: (t: string) => void
  voiceOpen: boolean
  openVoice: () => void
  closeVoice: () => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
}

const UIContext = createContext<UIValue | null>(null)

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('nova-finanzas:theme')
  if (stored === 'dark' || stored === 'light') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function applyTheme(t: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', t)
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [tab, setTab] = useState('inicio')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme)

  // Apply data-theme on mount and on change
  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t)
    applyTheme(t)
    localStorage.setItem('nova-finanzas:theme', t)
  }, [])

  const open = useCallback((m: ModalState) => setModal(m), [])
  const close = useCallback(() => setModal({ kind: 'none' }), [])
  const openVoice = useCallback(() => setVoiceOpen(true), [])
  const closeVoice = useCallback(() => setVoiceOpen(false), [])

  const value = useMemo(
    () => ({ modal, open, close, tab, setTab, voiceOpen, openVoice, closeVoice, theme, setTheme }),
    [modal, open, close, tab, voiceOpen, openVoice, closeVoice, theme, setTheme],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
