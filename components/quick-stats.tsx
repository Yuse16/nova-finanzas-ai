'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { fmt } from '@/lib/format'
import { SectionHeader } from './section-header'

function getOffsetDateISO(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysOffset)
  return d.toISOString().slice(0, 10)
}

export function QuickStats() {
  const { data } = useStore()

  const getExpensesForDays = (startOffset: number, endOffset: number) => {
    const start = getOffsetDateISO(startOffset)
    const end = getOffsetDateISO(endOffset)
    return data.movements
      .filter((m) => m.type === 'gasto' && m.date >= start && m.date <= end)
      .reduce((sum, m) => sum + m.amount, 0)
  }

  const getIncomeForDays = (startOffset: number, endOffset: number) => {
    const start = getOffsetDateISO(startOffset)
    const end = getOffsetDateISO(endOffset)
    return data.movements
      .filter((m) => m.type === 'ingreso' && m.date >= start && m.date <= end)
      .reduce((sum, m) => sum + m.amount, 0)
  }

  function getDeltaAndUp(current: number, previous: number) {
    if (previous === 0) {
      return { delta: 0, up: current > 0 }
    }
    const diff = current - previous
    const pct = Math.round((diff / previous) * 100)
    return {
      delta: Math.abs(pct),
      up: current >= previous,
    }
  }

  const todayExp = getExpensesForDays(0, 0)
  const yesterdayExp = getExpensesForDays(1, 1)
  const todayStats = getDeltaAndUp(todayExp, yesterdayExp)

  const weekExp = getExpensesForDays(6, 0)
  const lastWeekExp = getExpensesForDays(13, 7)
  const weekStats = getDeltaAndUp(weekExp, lastWeekExp)

  const monthExp = getExpensesForDays(29, 0)
  const lastMonthExp = getExpensesForDays(59, 30)
  const monthStats = getDeltaAndUp(monthExp, lastMonthExp)

  const monthInc = getIncomeForDays(29, 0)
  const lastMonthInc = getIncomeForDays(59, 30)
  const incomeStats = getDeltaAndUp(monthInc, lastMonthInc)

  const quickStats = [
    { label: 'Gastos hoy', value: todayExp, delta: todayStats.delta, up: todayStats.up },
    { label: 'Gastos semana', value: weekExp, delta: weekStats.delta, up: weekStats.up },
    { label: 'Gastos mes', value: monthExp, delta: monthStats.delta, up: monthStats.up },
    { label: 'Ingresos mes', value: monthInc, delta: incomeStats.delta, up: incomeStats.up },
  ]

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Resumen rápido" />
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat, i) => {
          const isIncome = stat.label.startsWith('Ingresos')
          // For expenses, up = bad (red); for income, up = good (green)
          const good = isIncome ? stat.up : !stat.up
          return (
            <GlassCard
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-4"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {fmt(stat.value)}
              </p>
              <div
                className="mt-2 flex items-center gap-1 text-xs font-medium"
                style={{
                  color: good ? 'var(--positive)' : 'var(--negative)',
                }}
              >
                {stat.up ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {stat.delta}%
              </div>
            </GlassCard>
          )
        })}
      </div>
    </section>
  )
}
