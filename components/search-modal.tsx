'use client'

import { useMemo, useState } from 'react'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { GlassSheet } from './ui/glass-sheet'
import { getIcon } from '@/lib/icons'
import { fmt, dateGroup } from '@/lib/format'
import { Search as SearchIcon, X } from 'lucide-react'
import type { Movement } from '@/lib/types'

export function SearchModal() {
  const { modal, close, open } = useUI()
  const { data } = useStore()
  const isOpen = modal.kind === 'search'
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return data.movements
      .filter((m) => {
        const title = m.title.toLowerCase()
        const category = m.category.toLowerCase()
        const note = (m.note ?? '').toLowerCase()
        const person = (m.person ?? '').toLowerCase()
        const amountStr = fmt(m.amount).toLowerCase()
        return (
          title.includes(q) ||
          category.includes(q) ||
          note.includes(q) ||
          person.includes(q) ||
          amountStr.includes(q)
        )
      })
      .sort((a, b) => {
        const dateA = a.date || ''
        const dateB = b.date || ''
        if (dateB !== dateA) return dateB.localeCompare(dateA)
        return b.createdAt - a.createdAt
      })
  }, [data.movements, query])

  const grouped = useMemo(() => {
    const groups: { group: string; items: Movement[] }[] = []
    results.forEach((m) => {
      const g = dateGroup(m.date)
      let groupObj = groups.find((x) => x.group === g)
      if (!groupObj) {
        groupObj = { group: g, items: [] }
        groups.push(groupObj)
      }
      groupObj.items.push(m)
    })
    return groups
  }, [results])

  return (
    <GlassSheet open={isOpen} onClose={close} title="Buscar">
      <div className="flex flex-col pb-6">
        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, categoría, nota…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {query && (
          <p className="mb-2 text-xs text-gray-400">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </p>
        )}

        <div>
          {grouped.map((section) => (
            <div key={section.group} className="mb-4 rounded-2xl bg-white shadow-sm dark:bg-gray-900">
              <p className="px-5 pt-4 pb-2 text-sm font-medium text-gray-400">
                {section.group}
              </p>
              {section.items.map((m) => {
                const Icon = getIcon(m.icon)
                const isPositive = m.type === 'ingreso' || m.type === 'deuda'
                const sign = isPositive ? '+' : '-'
                const account = data.accounts.find((a) => a.id === m.accountId)
                const accountName = account?.name ?? ''

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      close()
                      setTimeout(() => open({ kind: 'transaction', editing: m }), 200)
                    }}
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
                      <p className="text-sm text-gray-400">
                        {m.category}{accountName ? ` · ${accountName}` : ''}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {sign}{fmt(m.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
          {query && results.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              No se encontraron movimientos para "{query}"
            </p>
          )}
        </div>
      </div>
    </GlassSheet>
  )
}
