'use client'

import { useState } from 'react'
import { Trash2, Edit3, Power } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import { getAccountTypeMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import { GlassSheet } from './ui/glass-sheet'
import type { Account } from '@/lib/types'

export function AccountDetailModal() {
  const { modal, close, open } = useUI()
  const { data, updateAccount, deleteAccount } = useStore()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const isOpen = modal.kind === 'account-detail'
  const account: Account | undefined = isOpen ? modal.account : undefined

  if (!account) return null

  const Icon = getIcon(account.icon)
  const meta = getAccountTypeMeta(account.type)
  const isCredit = account.type === 'credito'
  const isNegative = account.balance < 0
  const creditUsed = isCredit ? Math.abs(account.balance) : 0
  const creditAvailable = isCredit && account.limiteCredito
    ? account.limiteCredito - creditUsed
    : 0

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const accountMovements = data.movements.filter(
    (m) => m.accountId === account.id,
  )

  const thisMonthMovements = accountMovements.filter((m) =>
    m.date?.startsWith(currentMonth),
  )

  const income = thisMonthMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((s, m) => s + m.amount, 0)

  const expenses = thisMonthMovements
    .filter((m) => m.type === 'gasto')
    .reduce((s, m) => s + m.amount, 0)

  const trend = income - expenses

  const recent = [...accountMovements]
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    })
    .slice(0, 8)

  const categoryTotals: Record<string, number> = {}
  accountMovements
    .filter((m) => m.type === 'gasto')
    .forEach((m) => {
      categoryTotals[m.category] =
        (categoryTotals[m.category] || 0) + m.amount
    })

  const totalExpenses = Object.values(categoryTotals).reduce(
    (s, v) => s + v,
    0,
  )

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  function handleEdit() {
    if (!account) return
    close()
    open({ kind: 'account', editing: account })
  }

  function handleDelete() {
    if (!account) return
    deleteAccount(account.id)
    close()
  }

  function handleToggleActive() {
    if (!account) return
    updateAccount({ ...account, activa: !account.activa })
    close()
  }

  return (
    <GlassSheet open={isOpen} onClose={close}>
      <div className="flex flex-col gap-5 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl"
            style={{ background: account.color || meta.color }}
          >
            <Icon className="size-6 text-white" />
          </span>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {account.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {meta.caption}{account.activa === false ? ' · Inactiva' : ''}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/40 px-5 py-4 backdrop-blur-sm dark:bg-white/[0.06]">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Saldo actual
          </p>
          <p
            className={`mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white ${
              isNegative ? 'text-red-500 dark:text-red-400' : ''
            }`}
          >
            {fmt(account.balance)}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/30 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.04]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
            <p className="mt-0.5 text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{fmt(income)}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">este mes</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white/30 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.04]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Gastos</p>
            <p className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white tabular-nums">
              {fmt(expenses)}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">este mes</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white/30 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.04]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tendencia</p>
            <p
              className={`mt-0.5 text-base font-semibold tabular-nums ${
                trend >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? '+' : ''}{fmt(Math.abs(trend))}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">este mes</p>
          </div>
        </div>

        {isCredit && (
          <div className="rounded-2xl bg-white/30 px-5 py-4 backdrop-blur-sm dark:bg-white/[0.04]">
            <p className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Tarjeta de Crédito
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Límite</span>
                <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                  {fmt(account.limiteCredito ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Utilizado</span>
                <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                  {fmt(creditUsed)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Disponible</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {fmt(creditAvailable)}
                </span>
              </div>
              {account.fechaCorte && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Corte</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Día {account.fechaCorte}
                  </span>
                </div>
              )}
              {account.fechaPago && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pago</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Día {account.fechaPago}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Últimos movimientos
            </p>
            <div className="flex flex-col rounded-2xl bg-white/30 backdrop-blur-sm dark:bg-white/[0.04]">
              {recent.map((m) => {
                const MIcon = getIcon(m.icon)
                const isPositive =
                  m.type === 'ingreso' || m.type === 'deuda'
                const sign = isPositive ? '+' : '-'
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 border-b border-white/40 px-4 py-2.5 last:border-b-0 dark:border-white/5"
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-xl"
                      style={{ background: m.color }}
                    >
                      <MIcon className="size-3.5 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight text-gray-900 dark:text-white">
                        {m.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {m.category}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {sign}{fmt(m.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {topCategories.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Categorías más usadas
            </p>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-white/30 px-4 py-3 backdrop-blur-sm dark:bg-white/[0.04]">
              {topCategories.map(([cat, amt]) => {
                const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      {cat}
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                      {fmt(amt)}
                    </span>
                    <span className="w-10 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500">
                      {Math.round(pct)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {accountMovements.length === 0 && (
          <p className="py-3 text-center text-sm text-gray-400 dark:text-gray-500">
            No hay movimientos registrados en esta cuenta.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 pb-2">
        {showConfirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="flex-1 rounded-2xl bg-white/40 py-3 text-sm font-medium text-gray-700 backdrop-blur-sm transition-colors active:bg-white/60 dark:bg-white/[0.06] dark:text-gray-300 dark:active:bg-white/[0.1]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-600 backdrop-blur-sm transition-colors active:bg-red-500/20 dark:text-red-400"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/40 py-3 text-sm font-medium text-gray-700 backdrop-blur-sm transition-colors active:bg-white/60 dark:bg-white/[0.06] dark:text-gray-300 dark:active:bg-white/[0.1]"
            >
              <Edit3 className="size-4" /> Editar cuenta
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/30 py-3 text-sm font-medium text-red-600 backdrop-blur-sm transition-colors active:bg-white/50 dark:bg-white/[0.04] dark:text-red-400 dark:active:bg-white/[0.08]"
              >
                <Trash2 className="size-4" /> Eliminar
              </button>
              {account.type !== 'efectivo' && (
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/30 py-3 text-sm font-medium text-gray-700 backdrop-blur-sm transition-colors active:bg-white/50 dark:bg-white/[0.04] dark:text-gray-300 dark:active:bg-white/[0.08]"
                >
                  <Power className="size-4" />{' '}
                  {account.activa === false ? 'Activar' : 'Desactivar'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </GlassSheet>
  )
}
