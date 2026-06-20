'use client'

import {
  Mic,
  PenLine,
  ScanLine,
  ArrowDownToLine,
  ArrowLeftRight,
  Target,
  AlarmClock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { useUI, type ModalState } from '@/lib/ui-context'

const actions: { label: string; sub: string; icon: LucideIcon; kind: string | null; initialData?: any; color: string }[] =
  [
    { label: 'Registrar', sub: 'por voz', icon: Mic, kind: null, color: 'oklch(0.7 0.18 295)' },
    { label: 'Registrar', sub: 'por texto', icon: PenLine, kind: 'transaction', color: 'oklch(0.74 0.15 235)' },
    { label: 'Escanear', sub: 'ticket', icon: ScanLine, kind: 'transaction', color: 'oklch(0.74 0.15 175)' },
    { label: 'Nuevo', sub: 'ingreso', icon: ArrowDownToLine, kind: 'transaction', initialData: { type: 'ingreso' }, color: 'oklch(0.72 0.16 150)' },
    { label: 'Transfe-', sub: 'rencia', icon: ArrowLeftRight, kind: 'transfer', color: 'oklch(0.78 0.16 70)' },
    { label: 'Nueva', sub: 'meta', icon: Target, kind: 'goal', color: 'oklch(0.68 0.18 25)' },
    { label: 'Nuevo', sub: 'recordatorio', icon: AlarmClock, kind: 'reminder', color: 'oklch(0.72 0.15 255)' },
  ]

export function QuickActions({
  onVoice,
}: {
  onVoice?: () => void
}) {
  const { open } = useUI() // Usar el hook useUI

  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
      {actions.map((a, i) => (
        <GlassCard
          key={a.label + a.sub}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={
            a.kind === null
              ? onVoice
              : () => open((a.initialData ? { kind: a.kind, initialData: a.initialData } : { kind: a.kind }) as ModalState)
          }
          className="flex w-28 shrink-0 cursor-pointer flex-col gap-3 p-4"
        >
          <span
            className="grid size-11 place-items-center rounded-2xl"
            style={{ background: a.color }}
          >
            <a.icon className="size-5 text-white" />
          </span>
          <span className="text-sm font-medium leading-tight">
            {a.label}
            <br />
            {a.sub}
          </span>
        </GlassCard>
      ))}
    </div>
  )
}

