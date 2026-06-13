'use client'

import { ChevronRight, Plus } from 'lucide-react'
import { GlassCard } from './glass-card'
import { accounts, fmt } from '@/lib/data'

export function AccountsModule() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Cuentas</h2>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>

      <ul className="mt-3 flex flex-col">
        {accounts.map((acc) => (
          <li
            key={acc.id}
            className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0"
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ background: acc.color }}
            >
              <acc.icon className="size-5 text-white" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">
              {acc.name}
            </span>
            <span className="text-right">
              <span
                className="block text-sm font-semibold tabular-nums"
                style={{ color: acc.negative ? 'var(--negative)' : undefined }}
              >
                {fmt(acc.amount)}
              </span>
              <span className="text-xs text-muted-foreground">
                {acc.caption}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground active:text-foreground"
      >
        Ver todas las cuentas <ChevronRight className="size-4" />
      </button>
    </GlassCard>
  )
}
