'use client'

import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { Settings, AlarmClock, Target, Sparkles } from 'lucide-react'

export function MoreOptionsModal() {
  const { modal, open, close } = useUI()
  const isOpen = modal.kind === 'more-options'

  const options = [
    {
      label: 'Configuración',
      icon: Settings,
      color: 'oklch(0.72 0.15 255)',
      action: () => {
        close()
        open({ kind: 'settings' })
      },
    },
    {
      label: 'Recordatorios',
      icon: AlarmClock,
      color: 'oklch(0.78 0.16 70)',
      action: () => open({ kind: 'reminder' }), // Re-use existing ReminderModal
    },
    {
      label: 'Metas',
      icon: Target,
      color: 'oklch(0.7 0.18 295)',
      action: () => open({ kind: 'goal' }), // Re-use existing GoalModal
    },
    {
      label: 'Asistente IA',
      icon: Sparkles,
      color: 'oklch(0.82 0.16 90)',
      action: () => {
        close()
        open({ kind: 'assistant' })
      },
    },
  ]

  return (
    <GlassSheet open={isOpen} onClose={close} title="Más Opciones">
      <div className="flex flex-col gap-3 pb-6">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={opt.action}
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

