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

type ModalState =
  | { kind: 'none' }
  | { kind: 'voice' }
  | { kind: 'transaction'; preset?: MovementType; editing?: Movement; parsed?: Partial<Movement> & { person?: string } }
  | { kind: 'transfer' }
  | { kind: 'account'; editing?: Account }
  | { kind: 'goal'; editing?: Goal }
  | { kind: 'goal-money'; goal: Goal }
  | { kind: 'reminder'; editing?: Reminder }
  | { kind: 'assistant' }
  | { kind: 'all-movements' }
  | { kind: 'all-accounts' }
  | { kind: 'settings' }

type UIValue = {
  modal: ModalState
  open: (m: ModalState) => void
  close: () => void
  tab: string
  setTab: (t: string) => void
}

const UIContext = createContext<UIValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [tab, setTab] = useState('inicio')

  const open = useCallback((m: ModalState) => setModal(m), [])
  const close = useCallback(() => setModal({ kind: 'none' }), [])

  const value = useMemo(
    () => ({ modal, open, close, tab, setTab }),
    [modal, open, close, tab],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
