'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard } from './glass-card'
import { quickStats, fmt } from '@/lib/data'
import { SectionHeader } from './section-header'

export function QuickStats() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Resumen rápido" action="Ver todo" />
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
