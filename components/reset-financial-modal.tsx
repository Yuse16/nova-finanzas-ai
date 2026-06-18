'use client'

import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import { getAccountTypeMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import { uid } from '@/lib/format'
import type { FinancialSnapshot } from '@/lib/types'

export function ResetFinancialModal() {
  const { data, resetWithSnapshot, ready } = useStore()
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'reset-financial'

  if (!ready) return null

  const liquidAccounts = data.accounts.filter((a) => !getAccountTypeMeta(a.type).liability)
  const availableBalance = liquidAccounts.reduce((s, a) => s + a.balance, 0)

  const debtAccounts = data.accounts.filter((a) => getAccountTypeMeta(a.type).liability)
  const totalDebt = Math.abs(debtAccounts.reduce((s, a) => s + a.balance, 0))

  const movementsCount = data.movements.length
  const goalsCount = data.goals.length

  const handleConfirm = () => {
    const snapshot: FinancialSnapshot = {
      id: uid('snap'),
      createdAt: Date.now(),
      label: `Cierre financiero — ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      summary: { availableBalance, totalDebt, movementsCount, goalsCount },
      fullData: {
        accounts: data.accounts,
        movements: data.movements,
        goals: data.goals,
        reminders: data.reminders,
        assistantHistory: data.assistantHistory,
        profile: data.profile,
      },
    }
    resetWithSnapshot(snapshot)
    close()
  }

  return (
    <GlassSheet open={isOpen} onClose={close} title="Reiniciar finanzas">
      <div className="flex flex-col gap-5 p-4 text-left">
        <p className="text-sm text-white/60">
          Esto guardará un cierre financiero completo y borrará todos tus datos actuales.
          Esta acción es <span className="font-semibold text-[oklch(0.7_0.2_25)]">irreversible</span>.
        </p>

        <div className="flex flex-col gap-3 rounded-2xl glass-strong p-4">
          <h4 className="text-sm font-semibold text-white/70">Resumen del cierre</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Balance disponible</span>
              <span className={availableBalance >= 0 ? 'text-[oklch(0.72_0.16_150)]' : 'text-[oklch(0.7_0.2_25)]'}>
                {fmt(availableBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Deuda total</span>
              <span className="text-[oklch(0.7_0.2_25)]">{fmt(totalDebt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Movimientos registrados</span>
              <span>{movementsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Metas creadas</span>
              <span>{goalsCount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-2xl py-3 text-sm font-semibold glass-subtle active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white active:scale-[0.98]"
            style={{ background: 'oklch(0.6 0.25 25)' }}
          >
            Sí, reiniciar
          </button>
        </div>
      </div>
    </GlassSheet>
  )
}
