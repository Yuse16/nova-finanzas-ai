'use client'

import { useUI } from '@/lib/ui-context'
import { useStore } from '@/lib/store'
import { GlassSheet } from './ui/glass-sheet'
import { getAccountTypeMeta, isAccountLiability } from '@/lib/catalog'
import { fmt } from '@/lib/format'

export function BalanceDetailModal() {
  const { modal, close } = useUI()
  const { data } = useStore()
  const isOpen = modal.kind === 'balance-detail'

  const liquidAccounts = data.accounts.filter((a) => !isAccountLiability(a))
  const liabilityAccounts = data.accounts.filter((a) => isAccountLiability(a))

  const availableBalance = liquidAccounts.reduce((s, a) => s + a.balance, 0)
  const totalLiability = liabilityAccounts.reduce((s, a) => s + a.balance, 0)
  const totalBalance = data.accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <GlassSheet open={isOpen} onClose={close} title="Detalle del Balance">
      <div className="flex flex-col gap-6 pb-6">
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Cuentas líquidas
          </h3>
          <div className="flex flex-col gap-2">
            {liquidAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin cuentas líquidas</p>
            )}
            {liquidAccounts.map((acc) => {
              const meta = getAccountTypeMeta(acc.type)
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between glass-subtle rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="text-sm font-medium">{acc.name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(acc.balance)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/15">
            <span className="text-sm font-semibold">Subtotal disponible</span>
            <span className="text-sm font-semibold tabular-nums text-[var(--positive)]">
              {fmt(availableBalance)}
            </span>
          </div>
        </section>

        {liabilityAccounts.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Deudas y crédito
            </h3>
            <div className="flex flex-col gap-2">
              {liabilityAccounts.map((acc) => {
                const meta = getAccountTypeMeta(acc.type)
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between glass-subtle rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ background: meta.color }}
                      />
                      <span className="text-sm font-medium">{acc.name}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[var(--negative)]">
                      {fmt(Math.abs(acc.balance))}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/15">
              <span className="text-sm font-semibold">Total deudas</span>
              <span className="text-sm font-semibold tabular-nums text-[var(--negative)]">
                {fmt(Math.abs(totalLiability))}
              </span>
            </div>
          </section>
        )}

        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Balance general</span>
            <span className="text-xl font-bold tabular-nums">{fmt(totalBalance)}</span>
          </div>
        </section>
      </div>
    </GlassSheet>
  )
}
