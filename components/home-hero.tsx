'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { loadNotifications } from '@/lib/notifications'
import { fmt, fmtShort } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'
import type { AppData } from '@/lib/types'

const PARTICLE_COUNT = 16
const ANIM_DURATION = 0.5

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

function filterMovements(movements: AppData['movements'], filter: FilterType) {
  const { start, end } = getFilterRange(filter)
  return movements.filter((m) => {
    if (!m.date) return false
    const d = new Date(m.date)
    return d >= start && d <= end
  })
}

type ViewState = 'normal' | 'expanding' | 'expanded' | 'collapsing'

export function HomeHero({
  data,
  onBellClick,
}: {
  data: AppData
  onBellClick: () => void
}) {
  const { theme } = useUI()
  const { settings } = useCustomization()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const update = () => setUnread(loadNotifications().filter((n) => !n.read).length)
    update()
    window.addEventListener('nova-notifications-changed', update)
    return () => window.removeEventListener('nova-notifications-changed', update)
  }, [])

  const name = data.profile?.name ?? 'Usuario'

  const availableBalance = useMemo(
    () => data.accounts.filter((a) => !isAccountLiability(a)).reduce((sum, acc) => sum + acc.balance, 0),
    [data.accounts],
  )

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthMovements = useMemo(
    () => data.movements.filter((m) => m.date?.startsWith(currentYearMonth)),
    [data.movements, currentYearMonth],
  )
  const incomeThisMonth = thisMonthMovements
    .filter((m) => m.type === 'ingreso' || m.type === 'deuda')
    .reduce((sum, m) => sum + m.amount, 0)
  const expenseThisMonth = thisMonthMovements
    .filter((m) => m.type === 'gasto' || m.type === 'prestamo')
    .reduce((sum, m) => sum + m.amount, 0)
  const balanceChange = incomeThisMonth - expenseThisMonth

  const [view, setView] = useState<ViewState>('normal')
  const [filter, setFilter] = useState<FilterType>('month')
  const balanceRef = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.55 })

  const filteredMovements = useMemo(() => filterMovements(data.movements, filter), [data.movements, filter])
  const filteredIncome = filteredMovements
    .filter((m) => m.type === 'ingreso' || m.type === 'deuda')
    .reduce((sum, m) => sum + m.amount, 0)
  const filteredExpense = filteredMovements
    .filter((m) => m.type === 'gasto' || m.type === 'prestamo')
    .reduce((sum, m) => sum + m.amount, 0)
  const filteredBalance = filteredIncome - filteredExpense

  function handleTapBalance() {
    if (view !== 'normal') return
    if (balanceRef.current) {
      const rect = balanceRef.current.getBoundingClientRect()
      const parent = balanceRef.current.closest('section')
      if (parent) {
        const prect = parent.getBoundingClientRect()
        setOrigin({
          x: (rect.left + rect.width / 2 - prect.left) / prect.width,
          y: (rect.top + rect.height / 2 - prect.top) / prect.height,
        })
      }
    }
    setView('expanding')
    setTimeout(() => setView('expanded'), ANIM_DURATION * 1000)
  }

  const handleClose = useCallback(() => {
    setView('collapsing')
    setTimeout(() => setView('normal'), ANIM_DURATION * 1000)
  }, [])

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
        distance: 60 + Math.random() * 140,
        size: 3 + Math.random() * 10,
      })),
    [],
  )

  const showNormalContent = view === 'normal' || view === 'expanding' || view === 'collapsing'
  const showParticles = view === 'expanding' || view === 'collapsing'
  const showCard = view === 'expanded' || view === 'collapsing'

  return (
    <section className="relative h-[40vh] min-h-[280px] w-screen overflow-hidden -mt-6 left-1/2 -translate-x-1/2">
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
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background:
            theme === 'dark'
              ? 'linear-gradient(to bottom, transparent 0%, #030712 100%)'
              : 'linear-gradient(to bottom, transparent 0%, white 100%)',
        }}
      />

      <div className="absolute right-5 top-9 z-10">
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={onBellClick}
          className="glass relative grid size-11 place-items-center rounded-2xl active:scale-95 transition-transform"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-[var(--negative)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </div>

      {/* Normal content */}
      {showNormalContent && (
        <motion.div
          className="absolute bottom-20 left-5 z-10"
          initial={false}
          animate={{
            opacity: view === 'normal' || view === 'collapsing' ? 1 : 0,
            filter: view === 'normal' || view === 'collapsing' ? 'blur(0px)' : 'blur(8px)',
          }}
          transition={{ duration: ANIM_DURATION, ease: [0.32, 0.72, 0, 1] }}
        >
          <div ref={balanceRef} onClick={handleTapBalance} className="cursor-pointer">
            {settings.dashboard.showGreeting && (
              <p className="text-lg font-light text-gray-800 dark:text-gray-100">
                Hola, {name} 👋
              </p>
            )}
            {settings.dashboard.showBalance && (
              <>
                <p className="mt-1 text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Dinero disponible
                </p>
                <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
                  {fmt(availableBalance)}
                </p>
              </>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`text-sm tabular-nums ${balanceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}
              >
                {balanceChange >= 0 ? `+${fmtShort(balanceChange)}` : fmtShort(balanceChange)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">este mes</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Particles */}
      <AnimatePresence>
        {showParticles &&
          particles.map((p) => {
            const isExpanding = view === 'expanding'
            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-white/20 dark:bg-white/15 backdrop-blur-sm"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `${origin.x * 100}%`,
                  top: `${origin.y * 100}%`,
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={
                  isExpanding
                    ? {
                        x: Math.cos(p.angle) * p.distance,
                        y: Math.sin(p.angle) * p.distance - 20,
                        opacity: [0, 0.7, 0.3],
                        scale: [0, 1.8, 0.8],
                      }
                    : {
                        x: 0,
                        y: 0,
                        opacity: [0.3, 0.7, 0],
                        scale: [0.8, 1.5, 0],
                      }
                }
                transition={{
                  duration: ANIM_DURATION,
                  ease: [0.32, 0.72, 0, 1],
                }}
              />
            )
          })}
      </AnimatePresence>

      {/* Expanded card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-3xl bg-white/70 dark:bg-white/[0.12] backdrop-blur-2xl border border-white/40 dark:border-white/20 shadow-xl overflow-hidden"
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={
                view === 'expanded'
                  ? { scale: 1, y: 0, opacity: 1 }
                  : { scale: 0.85, y: 30, opacity: 0 }
              }
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 100 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) handleClose()
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/50 dark:bg-white/15 text-gray-600 dark:text-white/70 backdrop-blur-xl hover:bg-white/70 dark:hover:bg-white/25 active:scale-90 transition-all"
              >
                <X className="size-4" />
              </button>

              <div className="p-6 pt-12">
                {settings.dashboard.showIncome && (
                  <div className="flex items-center justify-between py-3 border-b border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-green-100 dark:bg-green-900/30">
                        <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Ingresos</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total del período</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400 tabular-nums">+{fmt(filteredIncome)}</p>
                  </div>
                )}

                {settings.dashboard.showExpenses && (
                  <div className="flex items-center justify-between py-3 border-b border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-red-100 dark:bg-red-900/30">
                        <TrendingDown className="size-5 text-red-600 dark:text-red-400" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Gastos</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total del período</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">-{fmt(filteredExpense)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <DollarSign className="size-5 text-blue-600 dark:text-blue-400" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Balance</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Neto del período</p>
                    </div>
                  </div>
                  <p className={`text-lg font-semibold tabular-nums ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {filteredBalance >= 0 ? '+' : ''}{fmt(filteredBalance)}
                  </p>
                </div>

                {/* Chart bar */}
                <div className="py-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Distribución
                  </p>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    {filteredIncome + filteredExpense > 0 && (
                      <>
                        <motion.div
                          className="bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(filteredIncome / (filteredIncome + filteredExpense)) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          className="bg-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(filteredExpense / (filteredIncome + filteredExpense)) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      Ingresos{' '}
                      {filteredIncome + filteredExpense > 0
                        ? Math.round((filteredIncome / (filteredIncome + filteredExpense)) * 100)
                        : 0}
                      %
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
                      <span className="size-1.5 rounded-full bg-red-500" />
                      Gastos{' '}
                      {filteredIncome + filteredExpense > 0
                        ? Math.round((filteredExpense / (filteredIncome + filteredExpense)) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 pt-2">
                  {(['day', 'week', 'month', 'custom'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                          : 'bg-white/50 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {f === 'day' ? 'Día' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Personalizado'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
