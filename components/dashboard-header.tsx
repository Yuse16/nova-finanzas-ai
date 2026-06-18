'use client'

import { Bell, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context' // NUEVA IMPORTACIÓN
import { getAccountTypeMeta, isAccountLiability } from '@/lib/catalog'
import { fmt, fmtShort } from '@/lib/format'

export function DashboardHeader() {
  const { data } = useStore()
  const { open } = useUI() // NUEVO: Obtener la función open de useUI
  const name = data.profile?.name ?? 'Usuario'

  // Calculate available balance (liquid accounts only)
  const availableBalance = data.accounts
    .filter((a) => !isAccountLiability(a))
    .reduce((sum, acc) => sum + acc.balance, 0)

  // Calculate total balance (all accounts, including liabilities stored as negative)
  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Calculate net balance change for the current month (Income - Expense)
  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthMovements = data.movements.filter((m) =>
    m.date && m.date.startsWith(currentYearMonth)
  )

  const incomeThisMonth = thisMonthMovements
    .filter((m) => m.type === 'ingreso' || m.type === 'deuda') // NEW: 'deuda' also counts as income for cashflow purposes
    .reduce((sum, m) => sum + m.amount, 0)

  const expenseThisMonth = thisMonthMovements
    .filter((m) => m.type === 'gasto' || m.type === 'prestamo') // NEW: 'prestamo' subtracts from cashflow
    .reduce((sum, m) => sum + m.amount, 0)

  const balanceChange = incomeThisMonth - expenseThisMonth

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Hola, {name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Así van tus finanzas hoy
          </p>
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={() => open({ kind: 'notifications' })} // MODIFICADO: Abrir modal de notificaciones
          className="glass relative grid size-12 shrink-0 place-items-center rounded-2xl active:scale-95 transition-transform"
        >
          <Bell className="size-5" />
          <span className="absolute right-3 top-3 size-2 rounded-full bg-[var(--positive)]" />
        </button>
      </div>

      <GlassCard
        variant="strong"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => open({ kind: 'balance-detail' })}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dinero disponible</p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
              {fmt(availableBalance)}
            </p>
          </div>
          <div className="glass-subtle grid size-14 place-items-center rounded-2xl">
            <Layers className="size-6" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
          <span className="text-sm text-muted-foreground">Balance general</span>
          <span
            className="text-sm font-medium tabular-nums"
            style={{
              color: balanceChange >= 0 ? 'var(--positive)' : 'var(--negative)',
            }}
          >
            {balanceChange >= 0 ? `+ ${fmtShort(balanceChange)}` : fmtShort(balanceChange)}
          </span>
        </div>
      </GlassCard>
    </div>
  )
}

