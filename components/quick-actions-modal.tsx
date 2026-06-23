'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import {
  TrendingDown,
  TrendingUp,
  Plus,
  Target,
  Sparkles,
  MessageSquare,
} from 'lucide-react'

export function QuickActionsModal() {
  const { modal, open, close } = useUI()
  const isOpen = modal.kind === 'quick-actions'

  const options = [
    {
      label: 'Nova AI Chat',
      icon: MessageSquare,
      color: 'oklch(0.68 0.18 295)',
      onClick: () => open({ kind: 'nova-ai' }),
    },
    {
      label: 'Registrar gasto',
      icon: TrendingDown,
      color: 'oklch(0.68 0.19 25)',
      onClick: () => open({ kind: 'transaction', preset: 'gasto' }),
    },
    {
      label: 'Registrar ingreso',
      icon: TrendingUp,
      color: 'oklch(0.72 0.16 150)',
      onClick: () => open({ kind: 'transaction', preset: 'ingreso' }),
    },
    {
      label: 'Agregar cuenta',
      icon: Plus,
      color: 'oklch(0.72 0.15 235)',
      onClick: () => open({ kind: 'account' }),
    },
    {
      label: 'Crear meta',
      icon: Target,
      color: 'oklch(0.78 0.16 120)',
      onClick: () => open({ kind: 'goal' }),
    },
  ]

  return (
    <GlassSheet open={isOpen} onClose={close} title="Abrir Nova">
      <div className="flex flex-col gap-3 pb-6">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => {
              opt.onClick()
            }}
            className="flex items-center gap-4 rounded-2xl p-4 text-left transition-colors glass-subtle active:scale-[0.98]"
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: opt.color }}
            >
              <opt.icon className="size-5 text-white" />
            </span>
            <span className="text-sm font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>
    </GlassSheet>
  )
}
