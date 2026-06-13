'use client'

import {
  Lightbulb,
  TrendingUp,
  TriangleAlert,
  HeartPulse,
  Sparkles,
  PiggyBank,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import {
  insights,
  healthScore,
  povertyZero,
  reminders,
  fmtShort,
  fmt,
} from '@/lib/data'
import { SectionHeader } from './section-header'

const toneMap = {
  warn: { color: 'oklch(0.78 0.16 70)', Icon: TriangleAlert },
  good: { color: 'oklch(0.78 0.17 155)', Icon: TrendingUp },
  info: { color: 'oklch(0.74 0.15 235)', Icon: Lightbulb },
}

export function SmartInsights() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Insights inteligentes" />
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {insights.map((ins, i) => {
          const t = toneMap[ins.tone]
          return (
            <GlassCard
              key={ins.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex w-60 shrink-0 flex-col gap-3 p-4"
            >
              <span
                className="grid size-9 place-items-center rounded-xl"
                style={{ background: t.color }}
              >
                <t.Icon className="size-4 text-white" />
              </span>
              <p className="text-sm leading-snug text-pretty">{ins.text}</p>
            </GlassCard>
          )
        })}
      </div>
    </section>
  )
}

export function HealthScore() {
  const { score, factors } = healthScore
  const r = 52
  const c = 2 * Math.PI * r
  const ring =
    score >= 75
      ? 'oklch(0.78 0.17 155)'
      : score >= 50
        ? 'oklch(0.78 0.16 70)'
        : 'oklch(0.7 0.2 25)'

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-5 text-[oklch(0.78_0.17_155)]" />
        <h2 className="text-lg font-semibold tracking-tight">Salud financiera</h2>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative grid size-32 shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="oklch(1 0 0 / 16%)"
              strokeWidth="9"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={ring}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c - (c * score) / 100 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute text-center">
            <span className="block text-3xl font-semibold tabular-nums">
              {score}
            </span>
            <span className="text-xs text-muted-foreground">de 100</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {factors.map((f) => (
            <li key={f.label}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium tabular-nums">{f.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ring }}
                  initial={{ width: 0 }}
                  animate={{ width: `${f.value}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  )
}

export function PovertyZero() {
  return (
    <GlassCard
      variant="strong"
      className="overflow-hidden p-5"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-[oklch(0.82_0.16_90)]" />
        <h2 className="text-lg font-semibold tracking-tight">Modo Cero Pobreza</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        La IA detectó gastos recuperables este mes:
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-[oklch(0.82_0.17_155)]">
        + {fmtShort(povertyZero.total)}
      </p>

      <ul className="mt-4 flex flex-col">
        {povertyZero.items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm last:border-0"
          >
            <span className="text-pretty pr-3">{item.label}</span>
            <span className="font-semibold tabular-nums text-[oklch(0.82_0.17_155)]">
              {fmtShort(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}

export function RemindersModule() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recordatorios</h2>
        <span className="glass-subtle rounded-full px-3 py-1 text-xs text-muted-foreground">
          Pronto en WhatsApp
        </span>
      </div>
      <ul className="mt-4 flex flex-col">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0"
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ background: r.color }}
            >
              <r.icon className="size-5 text-white" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-tight">
                {r.title}
              </span>
              <span className="text-xs text-muted-foreground">{r.due}</span>
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {fmt(r.amount)}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
