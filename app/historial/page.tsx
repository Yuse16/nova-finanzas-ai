'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/glass-card'
import { snapshotStorage } from '@/lib/storage-snapshots'
import { fmt } from '@/lib/format'
import { getAccountTypeMeta } from '@/lib/catalog'
import type { FinancialSnapshot } from '@/lib/types'

export default function HistorialPage() {
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([])
  const [selected, setSelected] = useState<FinancialSnapshot | null>(null)

  useEffect(() => {
    snapshotStorage.loadSnapshots().then(setSnapshots)
  }, [])

  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(ts)

  if (selected) {
    const debtAccounts = selected.fullData.accounts.filter((a) => getAccountTypeMeta(a.type).liability)
    const totalDebt = Math.abs(debtAccounts.reduce((s, a) => s + a.balance, 0))
    const liquidAccounts = selected.fullData.accounts.filter((a) => !getAccountTypeMeta(a.type).liability)
    const availableBalance = liquidAccounts.reduce((s, a) => s + a.balance, 0)

    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-white/60"
        >
          <ArrowLeft className="size-4" />
          Historial
        </button>

        <div>
          <h2 className="text-lg font-semibold">{selected.label}</h2>
          <p className="text-sm text-white/50">{formatDate(selected.createdAt)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GlassCard variant="strong" className="flex flex-col gap-1 p-4">
            <span className="text-xs text-white/50">Balance disponible</span>
            <span className={availableBalance >= 0 ? 'text-sm font-semibold text-[oklch(0.72_0.16_150)]' : 'text-sm font-semibold text-[oklch(0.7_0.2_25)]'}>
              {fmt(availableBalance)}
            </span>
          </GlassCard>
          <GlassCard variant="strong" className="flex flex-col gap-1 p-4">
            <span className="text-xs text-white/50">Deuda total</span>
            <span className="text-sm font-semibold text-[oklch(0.7_0.2_25)]">{fmt(totalDebt)}</span>
          </GlassCard>
          <GlassCard variant="strong" className="flex flex-col gap-1 p-4">
            <span className="text-xs text-white/50">Movimientos</span>
            <span className="text-sm font-semibold">{selected.summary.movementsCount}</span>
          </GlassCard>
          <GlassCard variant="strong" className="flex flex-col gap-1 p-4">
            <span className="text-xs text-white/50">Metas</span>
            <span className="text-sm font-semibold">{selected.summary.goalsCount}</span>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-3">
          <GlassCard variant="subtle" className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">Cuentas ({selected.fullData.accounts.length})</h3>
            <div className="space-y-2">
              {selected.fullData.accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: acc.color }} />
                    <span className="text-white/80">{acc.name}</span>
                    <span className="text-xs text-white/40">{acc.type}</span>
                  </div>
                  <span className={getAccountTypeMeta(acc.type).liability ? 'text-[oklch(0.7_0.2_25)]' : ''}>
                    {fmt(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard variant="subtle" className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">Movimientos ({selected.fullData.movements.length})</h3>
            <div className="space-y-2">
              {selected.fullData.movements.slice(0, 20).map((mov) => (
                <div key={mov.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: mov.color }} />
                    <span className="text-white/80">{mov.title}</span>
                  </div>
                  <span>{fmt(mov.amount)}</span>
                </div>
              ))}
              {selected.fullData.movements.length > 20 && (
                <p className="text-xs text-white/40">...y {selected.fullData.movements.length - 20} más</p>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="subtle" className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">Metas ({selected.fullData.goals.length})</h3>
            <div className="space-y-2">
              {selected.fullData.goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{g.title}</span>
                  <span className="text-white/60">{fmt(g.saved)} / {fmt(g.target)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Historial de cierres</h2>
      <p className="text-sm text-white/50">
        Cada vez que reinicias tus finanzas se guarda un cierre financiero completo.
      </p>

      {snapshots.length === 0 ? (
        <GlassCard variant="subtle" className="p-6 text-center text-sm text-white/40">
          Aún no hay cierres financieros guardados.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {snapshots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="flex items-center justify-between rounded-2xl p-4 text-left glass-subtle active:scale-[0.98]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white/80">{s.label}</span>
                <span className="text-xs text-white/40">{formatDate(s.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">
                  {s.summary.movementsCount} mov. · {s.summary.goalsCount} metas
                </span>
                <ChevronRight className="size-4 text-white/30" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
