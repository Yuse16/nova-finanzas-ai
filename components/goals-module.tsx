'use client'

import Image from 'next/image'
import { Plus, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { goals, fmtShort, type Goal } from '@/lib/data'

function ProgressRing({ goal }: { goal: Goal }) {
  const pct = Math.round((goal.saved / goal.target) * 100)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="oklch(1 0 0 / 18%)"
          strokeWidth="5"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={goal.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{pct}%</span>
    </div>
  )
}

export function GoalsModule() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Metas</h2>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
        >
          <Plus className="size-4" /> Nueva meta
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {goals.map((g) => (
          <li key={g.id} className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
              {g.image ? (
                <Image
                  src={g.image || '/placeholder.svg'}
                  alt={g.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="grid size-full place-items-center"
                  style={{ background: g.color }}
                >
                  <Target className="size-6 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{g.title}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {fmtShort(g.saved)} / {fmtShort(g.target)}
              </p>
              <p className="text-xs text-muted-foreground">Fecha: {g.date}</p>
            </div>
            <ProgressRing goal={g} />
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
