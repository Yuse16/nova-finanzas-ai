'use client'

import { useMemo } from 'react'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { GlassSheet } from './ui/glass-sheet'
import { categories } from '@/lib/catalog'
import { X } from 'lucide-react'

const DATE_PRESETS = [
  { value: 'all' as const, label: 'Todo' },
  { value: 'today' as const, label: 'Hoy' },
  { value: 'week' as const, label: 'Esta semana' },
  { value: 'month' as const, label: 'Este mes' },
  { value: 'year' as const, label: 'Este año' },
  { value: 'custom' as const, label: 'Personalizado' },
]

export function FiltersModal() {
  const { modal, close, filters, setFilters, resetFilters } = useUI()
  const { data } = useStore()
  const isOpen = modal.kind === 'filters'

  const activeCount =
    (filters.accounts.length > 0 ? 1 : 0) +
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.datePreset !== 'all' ? 1 : 0) +
    (filters.datePreset === 'custom' && (filters.dateFrom || filters.dateTo) ? 1 : 0)

  const usedCategories = useMemo(() => {
    const set = new Set(data.movements.map((m) => m.category))
    return categories.filter((c) => set.has(c.label))
  }, [data.movements])

  function toggleAccount(id: string) {
    setFilters({
      ...filters,
      accounts: filters.accounts.includes(id)
        ? filters.accounts.filter((a) => a !== id)
        : [...filters.accounts, id],
    })
  }

  function toggleCategory(label: string) {
    setFilters({
      ...filters,
      categories: filters.categories.includes(label)
        ? filters.categories.filter((c) => c !== label)
        : [...filters.categories, label],
    })
  }

  function setDatePreset(preset: typeof filters.datePreset) {
    setFilters({ ...filters, datePreset: preset, dateFrom: '', dateTo: '' })
  }

  function setDateFrom(val: string) {
    setFilters({ ...filters, datePreset: 'custom', dateFrom: val })
  }

  function setDateTo(val: string) {
    setFilters({ ...filters, datePreset: 'custom', dateTo: val })
  }

  function handleReset() {
    resetFilters()
    close()
  }

  return (
    <GlassSheet open={isOpen} onClose={close} title="Filtros">
      <div className="flex flex-col gap-6 pb-6">

        {/* Date range */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Periodo</p>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setDatePreset(p.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filters.datePreset === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filters.datePreset === 'custom' && (
            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Desde</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Hasta</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accounts */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Cuentas</p>
          {data.accounts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cuentas</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.accounts.map((acc) => {
                const selected = filters.accounts.includes(acc.id)
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {acc.name}
                    {selected && <X className="size-3" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Categorías</p>
          {usedCategories.length === 0 ? (
            <p className="text-sm text-gray-400">Sin categorías</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {usedCategories.map((cat) => {
                const selected = filters.categories.includes(cat.label)
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => toggleCategory(cat.label)}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {cat.label}
                    {selected && <X className="size-3" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors active:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:active:bg-gray-700"
            >
              Limpiar filtros
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors active:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </GlassSheet>
  )
}
