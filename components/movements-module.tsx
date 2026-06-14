'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import { fmt, dateGroup } from '@/lib/format'
import type { Movement, MovementType } from '@/lib/types'

const filters: { label: string; value: 'todos' | MovementType }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Gastos', value: 'gasto' },
  { label: 'Ingresos', value: 'ingreso' },
  { label: 'Transfer.', value: 'transferencia' },
  { label: 'Deudas', value: 'deuda' },
]

export function MovementsModule() {
  const { data } = useStore()
  const { open } = useUI()
  const [active, setActive] = useState<'todos' | MovementType>('todos')

  const grouped = useMemo(() => {
    const list = active === 'todos'
      ? data.movements
      : data.movements.filter((m) => {
          if (active === 'deuda') return m.type === 'deuda' || m.type === 'prestamo'
          return m.type === active
        })

    // Sort by date descending, then by creation time
    const sorted = [...list].sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      if (dateB !== dateA) return dateB.localeCompare(dateA)
      return b.createdAt - a.createdAt
    })

    const groups: { group: string; items: Movement[] }[] = []
    sorted.forEach((m) => {
      const g = dateGroup(m.date)
      let groupObj = groups.find((x) => x.group === g)
      if (!groupObj) {
        groupObj = { group: g, items: [] }
        groups.push(groupObj)
      }
      groupObj.items.push(m)
    })

    return groups
  }, [data.movements, active])

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Movimientos</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => open({ kind: 'search' })}
            className="glass-subtle grid size-9 place-items-center rounded-xl active:scale-95 transition-transform"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Filtros"
            onClick={() => open({ kind: 'filters' })}
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
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active === f.value ? 'bg-white/85 text-[oklch(0.45_0.1_255)]' : 'glass-subtle text-foreground'}`}
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
                  const Icon = getIcon(m.icon)
                  const isPositive = m.type === 'ingreso' || m.type === 'deuda'
                  const sign = isPositive ? '+' : '-'

                  return (
                    <li
                      key={m.id}
                      onClick={() => open({ kind: 'transaction', editing: m })}
                      className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: m.color }}
                      >
                        <Icon className="size-4 text-white" />
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
                            color: isPositive
                              ? 'var(--positive)'
                              : 'var(--card-foreground)',
                          }}
                        >
                          {sign}
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
          {grouped.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay movimientos registrados.
            </p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => open({ kind: 'all-movements' })} // NEW: Open all movements modal
        className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground active:text-foreground hover:text-foreground transition-colors"
      >
        Ver más movimientos <ChevronRight className="size-4" />
      </button>
    </GlassCard>
  )
}
