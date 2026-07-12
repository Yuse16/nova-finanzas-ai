'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { Bell, Pencil, Check, X } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { useCustomization } from '@/context/ThemeCustomizationContext'
import { loadNotifications } from '@/lib/notifications'
import { fmt, fmtShort } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'
import { useStore, getCachedSnapshot } from '@/lib/store'
import type { AppData } from '@/lib/types'

export function HomeHero({
  data,
  onBellClick,
}: {
  data: AppData
  onBellClick: () => void
}) {
  const { theme, openFullSummary } = useUI()
  const { settings } = useCustomization()
  const updateProfile = useStore((s) => s.updateProfile)
  const [unread, setUnread] = useState(0)
  const [editReserved, setEditReserved] = useState(false)
  const [editMargin, setEditMargin] = useState(false)
  const [reservedDraft, setReservedDraft] = useState('')
  const [marginDraft, setMarginDraft] = useState('')

  useEffect(() => {
    const update = () => setUnread(loadNotifications().filter((n) => !n.read).length)
    update()
    window.addEventListener('nova-notifications-changed', update)
    return () => window.removeEventListener('nova-notifications-changed', update)
  }, [])

  const name = data.profile?.name ?? 'Usuario'

  const snapshot = getCachedSnapshot()

  const liquidBalance = useMemo(
    () => data.accounts.filter((a) => !isAccountLiability(a)).reduce((sum, acc) => sum + acc.balance, 0),
    [data.accounts],
  )

  const reservedMoney = data.profile?.reservedMoney ?? 0
  const emergencyMargin = data.profile?.emergencyMargin ?? 0
  const upcomingCommitments = snapshot?.upcomingCommitments ?? null
  const freeMoney = liquidBalance - reservedMoney - (upcomingCommitments ?? 0) - emergencyMargin

  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
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

  function startEditReserved() {
    setReservedDraft(String(reservedMoney))
    setEditReserved(true)
  }

  function saveReserved() {
    const val = parseFloat(reservedDraft)
    if (!isNaN(val) && val >= 0) {
      updateProfile({ reservedMoney: val })
    }
    setEditReserved(false)
  }

  function startEditMargin() {
    setMarginDraft(String(emergencyMargin))
    setEditMargin(true)
  }

  function saveMargin() {
    const val = parseFloat(marginDraft)
    if (!isNaN(val) && val >= 0) {
      updateProfile({ emergencyMargin: val })
    }
    setEditMargin(false)
  }

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

      <div className="absolute bottom-16 left-5 z-10 cursor-pointer" onClick={openFullSummary}>
        {settings.dashboard.showGreeting && (
          <p className="text-lg font-light text-gray-800 dark:text-gray-100">
            Hola, {name} 👋
          </p>
        )}
        {settings.dashboard.showBalance && (
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Saldo total
              </p>
              <p className="text-lg font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
                {fmt(liquidBalance)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startEditReserved() }}
                className="flex items-center gap-1 text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Reservado
                <Pencil className="size-2.5" />
              </button>
              {editReserved ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    value={reservedDraft}
                    onChange={(e) => setReservedDraft(e.target.value)}
                    className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 text-sm tabular-nums text-gray-900 dark:text-white"
                    autoFocus
                    min={0}
                  />
                  <button type="button" onClick={saveReserved} className="text-green-600 hover:text-green-500">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditReserved(false)} className="text-red-500 hover:text-red-400">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-lg font-semibold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
                  -{fmt(reservedMoney)}
                </p>
              )}
            </div>
            {upcomingCommitments !== null && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Próximos compromisos
                </p>
                <p className="text-lg font-semibold tracking-tight tabular-nums text-red-500 dark:text-red-400">
                  -{fmt(upcomingCommitments)}
                </p>
              </div>
            )}
            {emergencyMargin > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditMargin() }}
                  className="flex items-center gap-1 text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Margen emergencia
                  <Pencil className="size-2.5" />
                </button>
                {editMargin ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      value={marginDraft}
                      onChange={(e) => setMarginDraft(e.target.value)}
                      className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 text-sm tabular-nums text-gray-900 dark:text-white"
                      autoFocus
                      min={0}
                    />
                    <button type="button" onClick={saveMargin} className="text-green-600 hover:text-green-500">
                      <Check className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditMargin(false)} className="text-red-500 hover:text-red-400">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-semibold tracking-tight tabular-nums text-orange-600 dark:text-orange-400">
                    -{fmt(emergencyMargin)}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <p className="text-xs font-normal uppercase tracking-widest text-gray-600 dark:text-gray-300">
                Libre para gastar
              </p>
              <p className={`text-lg font-semibold tracking-tight tabular-nums ${freeMoney >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmt(freeMoney)}
              </p>
            </div>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={`text-sm tabular-nums ${balanceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}
          >
            {balanceChange >= 0 ? `+${fmtShort(balanceChange)}` : fmtShort(balanceChange)}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">este mes</span>
        </div>
      </div>
    </section>
  )
}
