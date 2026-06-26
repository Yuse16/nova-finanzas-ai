'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { fmt, fmtShort } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'

import type { Movement } from '@/lib/types'

const EASE = [0.33, 1, 0.68, 1] as const

type FilterType = 'day' | 'week' | 'month' | 'custom'

function getFilterRange(filter: FilterType) {
  const now = new Date()
  const end = new Date(now)
  switch (filter) {
    case 'day': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { start, end }
    }
    case 'week': {
      const dayOfWeek = now.getDay()
      const start = new Date(now)
      start.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end }
    }
    case 'custom':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end }
  }
}

function filterMovements(movements: Movement[], filter: FilterType) {
  const { start, end } = getFilterRange(filter)
  return movements.filter((m) => {
    if (!m.date) return false
    const d = new Date(m.date)
    return d >= start && d <= end
  })
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'custom', label: 'Personalizado' },
]

const CATEGORY_COLORS: Record<string, string> = {
  comida: 'bg-orange-500',
  transporte: 'bg-blue-500',
  entretenimiento: 'bg-purple-500',
  servicios: 'bg-cyan-500',
  salud: 'bg-green-500',
  educación: 'bg-yellow-500',
  ropa: 'bg-pink-500',
  hogar: 'bg-indigo-500',
  Otros: 'bg-gray-400',
}

export function FinancialSummaryFull() {
  const { theme, closeFullSummary } = useUI()
  const { data } = useStore()
  const { settings } = useCustomization()
  const [filter, setFilter] = useState<FilterType>('month')
  const [showCalendar, setShowCalendar] = useState(false)

  const name = data.profile?.name ?? 'Usuario'

  const availableBalance = useMemo(
    () => data.accounts.filter((a) => !isAccountLiability(a)).reduce((sum, acc) => sum + acc.balance, 0),
    [data.accounts],
  )

  // Use type-safe approach
  const allMovements = data.movements
  const filteredMovements = useMemo(() => filterMovements(allMovements, filter), [allMovements, filter])
  const filteredIncome = filteredMovements
    .filter((m) => m.type === 'ingreso' || m.type === 'deuda')
    .reduce((sum, m) => sum + m.amount, 0)
  const filteredExpense = filteredMovements
    .filter((m) => m.type === 'gasto' || m.type === 'prestamo')
    .reduce((sum, m) => sum + m.amount, 0)
  const filteredBalance = filteredIncome - filteredExpense

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const expenses = filteredMovements.filter((m) => m.type === 'gasto')
    const grouped: Record<string, number> = {}
    for (const m of expenses) {
      const cat = m.category || 'Otros'
      grouped[cat] = (grouped[cat] || 0) + m.amount
    }
    const total = Object.values(grouped).reduce((s, v) => s + v, 0)
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount, percentage: total > 0 ? (amount / total) * 100 : 0 }))
  }, [filteredMovements])

  // Recent movements
  const recentMovements = useMemo(
    () => filteredMovements.slice(-10).reverse(),
    [filteredMovements],
  )

  function handleClose() {
    closeFullSummary()
  }

  const filterLabel = filters.find((f) => f.key === filter)?.label || 'Mes'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {/* Mountain background */}
        <div className="absolute inset-0">
          <Image
            src={theme === 'dark' ? '/montanaobs.webp' : '/montanav2.webp'}
            alt=""
            fill
            priority
            aria-hidden
            className="object-cover"
            style={{ objectPosition: 'center 30%' }}
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                theme === 'dark'
                  ? 'linear-gradient(to bottom, transparent 0%, #030712 100%)'
                  : 'linear-gradient(to bottom, transparent 0%, white 100%)',
            }}
          />
        </div>

        {/* Close button */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-2">
          <motion.p
            className="text-lg font-light text-gray-800 dark:text-gray-100"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
          >
            Hola, {name} 👋
          </motion.p>
          <motion.button
            type="button"
            onClick={handleClose}
            className="grid size-9 place-items-center rounded-full bg-white/50 dark:bg-white/15 text-gray-600 dark:text-white/70 backdrop-blur-xl active:scale-90 transition-transform"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.15, ease: EASE }}
          >
            <X className="size-4" />
          </motion.button>
        </div>

        {/* Hero amount */}
        <div className="relative z-10 px-6">
          <motion.p
            className="text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: EASE }}
          >
            Dinero disponible
          </motion.p>
          <motion.p
            className="text-5xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white mt-0.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.22, ease: EASE }}
          >
            {fmt(availableBalance)}
          </motion.p>
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-6 pb-8 mt-2">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className="rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: EASE }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grid size-7 place-items-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="size-3.5 text-green-600 dark:text-green-400" />
                </span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ingresos</p>
              </div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400 tabular-nums">+{fmtShort(filteredIncome)}</p>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3, ease: EASE }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grid size-7 place-items-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="size-3.5 text-red-600 dark:text-red-400" />
                </span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gastos</p>
              </div>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">-{fmtShort(filteredExpense)}</p>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35, ease: EASE }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grid size-7 place-items-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="size-3.5 text-blue-600 dark:text-blue-400" />
                </span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Balance</p>
              </div>
              <p className={`text-lg font-semibold tabular-nums ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {filteredBalance >= 0 ? '+' : ''}{fmtShort(filteredBalance)}
              </p>
            </motion.div>
          </div>

          {/* Distribution bar */}
          <motion.div
            className="mt-5 rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35, ease: EASE }}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Distribución
            </p>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              {filteredIncome + filteredExpense > 0 && (
                <>
                  <motion.div
                    className="bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(filteredIncome / (filteredIncome + filteredExpense)) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
                  />
                  <motion.div
                    className="bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(filteredExpense / (filteredIncome + filteredExpense)) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="size-2 rounded-full bg-green-500" />
                Ingresos {filteredIncome + filteredExpense > 0 ? Math.round((filteredIncome / (filteredIncome + filteredExpense)) * 100) : 0}%
              </span>
              <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <span className="size-2 rounded-full bg-red-500" />
                Gastos {filteredIncome + filteredExpense > 0 ? Math.round((filteredExpense / (filteredIncome + filteredExpense)) * 100) : 0}%
              </span>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="mt-5 flex items-center gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4, ease: EASE }}
          >
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => { setFilter(f.key); setShowCalendar(false) }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white/50 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={`grid size-9 shrink-0 place-items-center rounded-xl transition-all ${
                showCalendar
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white/50 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Calendar className="size-4" />
            </button>
          </motion.div>

          {/* Expenses by category */}
          {expensesByCategory.length > 0 && (
            <motion.div
              className="mt-5 rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.45, ease: EASE }}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Gastos por categoría</p>
              <div className="space-y-2.5">
                {expensesByCategory.slice(0, 6).map((cat, i) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.05, ease: EASE }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{cat.category}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">${fmt(cat.amount)}</span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className={CATEGORY_COLORS[cat.category.toLowerCase()] || 'bg-gray-400'}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.55 + i * 0.05, ease: EASE }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{Math.round(cat.percentage)}% del total</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent movements */}
          {recentMovements.length > 0 && (
            <motion.div
              className="mt-5 rounded-2xl bg-white/60 dark:bg-white/[0.08] border border-white/30 dark:border-white/10 p-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.5, ease: EASE }}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Últimos movimientos</p>
              <div className="space-y-2">
                {recentMovements.map((m, i) => (
                  <motion.div
                    key={`${m.title}-${m.date}-${i}`}
                    className="flex items-center justify-between py-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.55 + i * 0.03 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`size-2 rounded-full ${m.type === 'ingreso' || m.type === 'deuda' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{m.title}</p>
                        {m.date && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {new Date(m.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${m.type === 'ingreso' || m.type === 'deuda' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {m.type === 'ingreso' || m.type === 'deuda' ? '+' : '-'}${fmt(m.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
