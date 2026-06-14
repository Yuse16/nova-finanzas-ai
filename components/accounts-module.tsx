'use client'

import { ChevronRight, Plus } from 'lucide-react'
import { GlassCard } from './glass-card'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import { getAccountTypeMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'

export function AccountsModule() {
  const { data } = useStore()
  const { open } = useUI()

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Cuentas</h2>
        <button
          type="button"
          onClick={() => open({ kind: 'account' })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>

      <ul className="mt-3 flex flex-col">
        {data.accounts.map((acc) => {
          const Icon = getIcon(acc.icon)
          const meta = getAccountTypeMeta(acc.type)
          const isNegative = acc.balance < 0

          return (
            <li
              key={acc.id}
              onClick={() => open({ kind: 'account', editing: acc })}
              className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0 cursor-pointer hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl"
                style={{ background: acc.color || meta.color }}
              >
                <Icon className="size-5 text-white" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">
                {acc.name}
              </span>
              <span className="text-right">
                <span
                  className="block text-sm font-semibold tabular-nums"
                  style={{ color: isNegative ? 'var(--negative)' : undefined }}
                >
                  {fmt(acc.balance)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {meta.caption}
                </span>
              </span>
            </li>
          )
        })}
        {data.accounts.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tienes cuentas creadas.
          </p>
        )}
      </ul>
    </GlassCard>
  )
}
