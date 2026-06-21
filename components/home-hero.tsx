'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Bell } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { loadNotifications } from '@/lib/notifications'
import { fmt, fmtShort } from '@/lib/format'
import { isAccountLiability } from '@/lib/catalog'
import type { AppData } from '@/lib/types'

export function HomeHero({
  data,
  onBellClick,
}: {
  data: AppData
  onBellClick: () => void
}) {
  const { theme } = useUI()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const update = () => setUnread(loadNotifications().filter((n) => !n.read).length)
    update()
    window.addEventListener('nova-notifications-changed', update)
    return () => window.removeEventListener('nova-notifications-changed', update)
  }, [])

  const name = data.profile?.name ?? 'Usuario'

  const availableBalance = data.accounts
    .filter((a) => !isAccountLiability(a))
    .reduce((sum, acc) => sum + acc.balance, 0)

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthMovements = data.movements.filter((m) =>
    m.date && m.date.startsWith(currentYearMonth),
  )
  const incomeThisMonth = thisMonthMovements
    .filter((m) => m.type === 'ingreso' || m.type === 'deuda')
    .reduce((sum, m) => sum + m.amount, 0)
  const expenseThisMonth = thisMonthMovements
    .filter((m) => m.type === 'gasto' || m.type === 'prestamo')
    .reduce((sum, m) => sum + m.amount, 0)
  const balanceChange = incomeThisMonth - expenseThisMonth

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
          background: theme === 'dark'
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

      <div className="absolute bottom-20 left-5 z-10">
        <p className="text-lg font-light text-gray-800 dark:text-gray-100">
          Hola, {name} 👋
        </p>
        <p className="mt-1 text-xs font-normal uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Dinero disponible
        </p>
        <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
          {fmt(availableBalance)}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
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
