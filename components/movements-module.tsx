'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
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
    <div className="flex flex-col pb-32">
      <div className="flex items-center justify-end gap-2 px-5 pt-4 pb-2">
        <button
          type="button"
          aria-label="Buscar"
          onClick={() => open({ kind: 'search' })}
          className="grid size-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900"
        >
          <Search className="size-4 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          type="button"
          aria-label="Filtros"
          onClick={() => open({ kind: 'filters' })}
          className="grid size-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900"
        >
          <SlidersHorizontal className="size-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 py-2 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActive(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active === f.value ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col pt-2">
        {grouped.map((section) => (
          <div key={section.group} className="mx-4 mb-4 rounded-2xl bg-white shadow-sm dark:bg-gray-900">
            <p className="px-5 pt-4 pb-2 text-sm font-medium text-gray-400 dark:text-gray-400">
              {section.group}
            </p>
            <div>
              {section.items.map((m) => {
                const Icon = getIcon(m.icon)
                const isPositive = m.type === 'ingreso' || m.type === 'deuda'
                const sign = isPositive ? '+' : '-'
                const account = data.accounts.find((a) => a.id === m.accountId)
                const accountName = account?.name ?? ''

                return (
                  <div
                    key={m.id}
                    onClick={() => open({ kind: 'transaction', editing: m })}
                    className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-5 py-3 transition-colors last:border-b-0 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: m.color }}
                    >
                      <Icon className="size-4 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.title}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-400">
                        {m.category}{accountName ? ` · ${accountName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {sign}{fmt(m.amount)}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">›</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-400">
            No hay movimientos registrados.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => open({ kind: 'all-movements' })}
        className="mx-4 flex items-center justify-center gap-1 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm active:bg-gray-50 dark:bg-gray-900 dark:text-white dark:active:bg-gray-800"
      >
        Ver más movimientos
        <span className="text-gray-300 dark:text-gray-600">›</span>
      </button>
    </div>
  )
}
