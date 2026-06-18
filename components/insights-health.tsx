'use client'

import {
  Lightbulb,
  TrendingUp,
  TriangleAlert,
  HeartPulse,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { isAccountLiability } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { nextDueDate, daysUntil, predictiveMessages } from '@/lib/calendar'
import { fmt, fmtShort } from '@/lib/format'
import type { Reminder } from '@/lib/types'
import { SectionHeader } from './section-header'

const toneMap = {
  warn: { color: 'oklch(0.78 0.16 70)', Icon: TriangleAlert },
  good: { color: 'oklch(0.78 0.17 155)', Icon: TrendingUp },
  info: { color: 'oklch(0.74 0.15 235)', Icon: Lightbulb },
}

export function SmartInsights() {
  const { data } = useStore()

  // Dynamic Insight Calculations
  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthMovements = data.movements.filter((m) =>
    m.date && m.date.startsWith(currentYearMonth)
  )

  const incomeThisMonth = thisMonthMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0)

  const expenseThisMonth = thisMonthMovements
    .filter((m) => m.type === 'gasto')
    .reduce((sum, m) => sum + m.amount, 0)

  const assets = data.accounts
    .filter((a) => !isAccountLiability(a))
    .reduce((sum, a) => sum + a.balance, 0)

  const debts = Math.abs(
    data.accounts
      .filter((a) => isAccountLiability(a))
      .reduce((sum, a) => sum + a.balance, 0)
  )

  const insightsList = []

  if (incomeThisMonth > 0) {
    const rate = Math.round(((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100)
    if (rate > 0) {
      insightsList.push({
        id: 'i1',
        text: `¡Buen trabajo! Estás ahorrando el ${rate}% de tus ingresos este mes.`,
        tone: 'good' as const,
      })
    } else {
      insightsList.push({
        id: 'i1',
        text: `Tus gastos superan tus ingresos este mes por ${fmtShort(Math.abs(incomeThisMonth - expenseThisMonth))}.`,
        tone: 'warn' as const,
      })
    }
  } else {
    insightsList.push({
      id: 'i1',
      text: 'Registra tus ingresos y gastos para ver análisis de ahorro detallados.',
      tone: 'info' as const,
    })
  }

  if (debts > 0 && assets > 0) {
    const ratio = Math.round((debts / assets) * 100)
    if (ratio > 40) {
      insightsList.push({
        id: 'i2',
        text: `Cuidado: Tu nivel de deuda representa el ${ratio}% de tus activos disponibles.`,
        tone: 'warn' as const,
      })
    }
  }

  const topCategoryMap = thisMonthMovements
    .filter((m) => m.type === 'gasto')
    .reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.amount
      return acc
    }, {} as Record<string, number>)

  const sortedCategories = Object.entries(topCategoryMap).sort((a, b) => b[1] - a[1])
  if (sortedCategories.length > 0) {
    insightsList.push({
      id: 'i3',
      text: `Tu gasto más alto este mes es en ${sortedCategories[0][0]} (${fmtShort(sortedCategories[0][1])}).`,
      tone: 'info' as const,
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Insights inteligentes" />
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {insightsList.map((ins, i) => {
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
  const { data } = useStore()

  // Calculate dynamic health score
  const assets = data.accounts
    .filter((a) => !isAccountLiability(a))
    .reduce((sum, a) => sum + a.balance, 0)

  const debts = Math.abs(
    data.accounts
      .filter((a) => isAccountLiability(a))
      .reduce((sum, a) => sum + a.balance, 0)
  )

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthMovements = data.movements.filter((m) =>
    m.date && m.date.startsWith(currentYearMonth)
  )

  const income = thisMonthMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0)

  const expenses = thisMonthMovements
    .filter((m) => m.type === 'gasto')
    .reduce((sum, m) => sum + m.amount, 0)

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const debtRatio = assets > 0 ? (debts / assets) * 100 : debts > 0 ? 100 : 0
  const emergencyFundWeeks = expenses > 0 ? (assets / (expenses / 4)) : 12 // assume 12 weeks default

  // Factors (0 to 100)
  const savingsFactor = Math.max(0, Math.min(100, Math.round(income > 0 ? savingsRate : 50)))
  const debtFactor = Math.max(0, Math.min(100, Math.round(Math.max(0, 100 - debtRatio))))
  const spendingFactor = Math.max(0, Math.min(100, Math.round(100 - (income > 0 ? (expenses / income) * 100 : 40))))
  const emergencyFactor = Math.max(0, Math.min(100, Math.round((emergencyFundWeeks / 12) * 100))) // 12 weeks (3 months) = 100%

  const score = Math.round((savingsFactor + debtFactor + spendingFactor + emergencyFactor) / 4)

  const factors = [
    { label: 'Tasa de ahorro', value: savingsFactor },
    { label: 'Salud de deuda', value: debtFactor },
    { label: 'Hábitos de gasto', value: spendingFactor },
    { label: 'Fondo de emergencia', value: emergencyFactor },
  ]

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
              r={52}
              fill="none"
              stroke="oklch(1 0 0 / 16%)"
              strokeWidth="9"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={52}
              fill="none"
              stroke={ring}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 52 - (2 * Math.PI * 52 * score) / 100 }}
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
  const { data } = useStore()

  // Calculate dynamic avoidable spending
  const cafe = data.movements
    .filter((m) => m.type === 'gasto' && m.category === 'Café')
    .reduce((sum, m) => sum + m.amount, 0)

  const compras = data.movements
    .filter((m) => m.type === 'gasto' && m.category === 'Compras')
    .reduce((sum, m) => sum + m.amount, 0)

  const ent = data.movements
    .filter((m) => m.type === 'gasto' && m.category === 'Entretenimiento')
    .reduce((sum, m) => sum + m.amount, 0)

  const items = []
  if (cafe > 0) items.push({ label: 'Café fuera de casa', amount: cafe })
  if (ent > 0) items.push({ label: 'Servicios de streaming redundantes', amount: ent })
  if (compras > 0) items.push({ label: 'Compras impulsivas evitables', amount: Math.round(compras * 0.2) })

  const total = items.reduce((sum, item) => sum + item.amount, 0)

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
        + {fmtShort(total)}
      </p>

      {items.length > 0 ? (
        <ul className="mt-4 flex flex-col">
          {items.map((item) => (
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
      ) : (
        <p className="mt-4 text-sm text-muted-foreground text-center py-2">
          ¡Felicidades! No se detectaron fugas de capital este mes.
        </p>
      )}
    </GlassCard>
  )
}

export function RemindersModule() {
  const { data } = useStore()
  const { open } = useUI()

  const messages = predictiveMessages(data.reminders, data.profile?.name)

  function recLabel(r: Reminder): string {
    if (r.recurring === 'monthly') {
      const day = new Date(r.dueDate + 'T00:00:00').getDate()
      return `Cada día ${day}`
    }
    if (r.recurring === 'yearly') {
      const d = new Date(r.dueDate + 'T00:00:00')
      const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
      return `Cada ${months[d.getMonth()]} ${d.getDate()}`
    }
    if (r.recurring === 'weekly') {
      const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
      return `Cada ${dias[new Date(r.dueDate + 'T00:00:00').getDay()]}`
    }
    return ''
  }

  function displayDue(r: Reminder): string {
    const next = nextDueDate(r)
    const days = daysUntil(next)
    const rec = recLabel(r)

    if (days < 0) {
      return rec ? `${rec} · Venció hace ${Math.abs(days)} días` : `Venció hace ${Math.abs(days)} días`
    }
    if (days === 0) return rec ? `${rec} · Vence hoy` : 'Vence hoy'
    if (days === 1) return rec ? `${rec} · Vence mañana` : 'Vence mañana'
    return rec ? `${rec} · Vence en ${days} días` : `Vence en ${days} días`
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recordatorios</h2>
        <button
          type="button"
          onClick={() => open({ kind: 'reminder' })}
          className="glass-subtle rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground active:text-foreground transition-colors"
        >
          Agregar
        </button>
      </div>

      {messages.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[oklch(0.68_0.19_25/20%)] px-4 py-3 text-sm font-medium text-[oklch(0.9_0.06_25)]"
            >
              {msg}
            </div>
          ))}
        </div>
      )}

      <ul className="mt-4 flex flex-col">
        {data.reminders.map((r) => {
          const Icon = getIcon(r.icon)
          const dueStr = displayDue(r)

          return (
            <li
              key={r.id}
              onClick={() => open({ kind: 'reminder', editing: r })}
              className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0 cursor-pointer hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl"
                style={{ background: r.color }}
              >
                <Icon className="size-5 text-white" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-tight">
                  {r.title}
                </span>
                <span className="text-xs text-muted-foreground">{dueStr}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {fmt(r.amount)}
              </span>
            </li>
          )
        })}
        {data.reminders.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tienes recordatorios creados.
          </p>
        )}
      </ul>
    </GlassCard>
  )
}
