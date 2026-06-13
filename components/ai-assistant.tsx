'use client'

import { useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { spendingBreakdown, fmt } from '@/lib/data'

const prompts = [
  '¿Dónde estoy gastando más este mes?',
  '¿Cuánto me queda para terminar el mes?',
  '¿Cómo puedo ahorrar más?',
  '¿Cuáles son mis gastos hormiga?',
]

export function AiAssistant() {
  const [active, setActive] = useState(0)

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-[oklch(0.8_0.15_290)]" />
        <h2 className="text-lg font-semibold tracking-tight">Asistente IA</h2>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {prompts.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-2xl px-4 py-2 text-left text-sm font-medium transition-colors ${
              active === i
                ? 'bg-[oklch(0.6_0.17_290)] text-white'
                : 'glass-subtle'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="glass-subtle mt-4 rounded-2xl p-4"
        >
          <p className="text-sm text-muted-foreground">
            Este mes has gastado más en:
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {spendingBreakdown.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="flex-1 text-sm font-medium">{s.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(s.amount)}
                </span>
                <span className="glass w-12 rounded-lg py-0.5 text-center text-xs font-medium tabular-nums">
                  {s.percent}%
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground active:text-foreground"
      >
        Ver conversación <ChevronRight className="size-4" />
      </button>
    </GlassCard>
  )
}
