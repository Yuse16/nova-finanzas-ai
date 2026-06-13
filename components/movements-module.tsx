'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { movements, fmt, type MovementType } from '@/lib/data'

const filters: { label: string; value: 'todos' | MovementType }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Gastos', value: 'gasto' },
  { label: 'Ingresos', value: 'ingreso' },
  { label: 'Transfer.', value: 'transferencia' },
  { label: 'Deudas', value: 'deuda' },
]

const groupOrder = ['Hoy', 'Ayer', 'Esta semana', 'Este mes'] as const

export function MovementsModule() {
  const [active, setActive] = useState<'todos' | MovementType>('todos')

  const grouped = useMemo(() => {
    const list =
      active === 'todos'
        ? movements
        : movements.filter((m) => m.type === active)
    return groupOrder
      .map((g) => ({ group: g, items: list.filter((m) => m.group === g) }))
      .filter((g) => g.items.length > 0)
  }, [active])

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Movimientos</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Buscar"
            className="glass-subtle grid size-9 place-items-center rounded-xl active:scale-95 transition-transform"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Filtros"
            className="glass-subtle grid size-9 place-items-center rounded-xl active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActive(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === f.value
                ? 'bg-white/85 text-[oklch(0.45_0.1_255)]'
                : 'glass-subtle text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {grouped.map((section) => (
            <motion.div
              key={section.group}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {section.group}
              </p>
              <ul className="flex flex-col">
                {section.items.map((m) => {
                  const positive = m.amount > 0
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0"
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: m.color }}
                      >
                        <m.icon className="size-4 text-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-tight">
                          {m.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.category}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className="block text-sm font-semibold tabular-nums"
                          style={{
                            color: positive
                              ? 'var(--positive)'
                              : 'var(--card-foreground)',
                          }}
                        >
                          {positive ? '+' : ''}
                          {fmt(m.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.method}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground active:text-foreground"
      >
        Ver más movimientos <ChevronRight className="size-4" />
      </button>
    </GlassCard>
  )
}
