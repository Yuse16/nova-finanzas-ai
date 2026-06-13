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

const actions: { label: string; sub: string; icon: LucideIcon; color: string }[] =
  [
    { label: 'Registrar', sub: 'por voz', icon: Mic, color: 'oklch(0.7 0.18 295)' },
    { label: 'Registrar', sub: 'por texto', icon: PenLine, color: 'oklch(0.74 0.15 235)' },
    { label: 'Escanear', sub: 'ticket', icon: ScanLine, color: 'oklch(0.74 0.15 175)' },
    { label: 'Nuevo', sub: 'ingreso', icon: ArrowDownToLine, color: 'oklch(0.72 0.16 150)' },
    { label: 'Transfe-', sub: 'rencia', icon: ArrowLeftRight, color: 'oklch(0.78 0.16 70)' },
    { label: 'Nueva', sub: 'meta', icon: Target, color: 'oklch(0.68 0.18 25)' },
    { label: 'Nuevo', sub: 'recordatorio', icon: AlarmClock, color: 'oklch(0.72 0.15 255)' },
  ]

export function QuickActions({
  onVoice,
}: {
  onVoice?: () => void
}) {
  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
      {actions.map((a, i) => (
        <GlassCard
          key={a.label + a.sub}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={i === 0 ? onVoice : undefined}
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
