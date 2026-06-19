'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import { getAccountTypeMeta } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import type { Account } from '@/lib/types'

function cardLabel(acc: Account): string {
  const parts: string[] = []
  if (acc.bank) parts.push(acc.bank)
  if (acc.identifier) parts.push(`(${acc.identifier})`)
  return parts.length > 0 ? parts.join(' ') : ''
}

function creditUtilization(acc: Account): string | null {
  if (acc.type !== 'credito' || !acc.limiteCredito || acc.limiteCredito <= 0) return null
  const used = Math.abs(acc.balance)
  const pct = (used / acc.limiteCredito) * 100
  return `${Math.round(pct)}% utilizado`
}

export function AccountsModule() {
  const { data } = useStore()
  const { open } = useUI()

  return (
    <div className="flex flex-col pb-32">
      <section className="relative h-48 w-screen overflow-hidden -mt-5 left-1/2 -translate-x-1/2">
        <div className="absolute inset-0">
          <Image
            src="/montanav2-horizontal.webp"
            alt=""
            fill
            priority
            aria-hidden
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, white 100%)',
          }}
        />
      </section>

      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Cuentas</h1>
        <button
          type="button"
          onClick={() => open({ kind: 'account' })}
          className="flex items-center gap-1 text-sm font-semibold text-blue-600"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>

      <div className="mx-4 rounded-2xl bg-white shadow-sm">
        <div>
          {data.accounts.map((acc) => {
            const Icon = getIcon(acc.icon)
            const meta = getAccountTypeMeta(acc.type)
            const isNegative = acc.balance < 0
            const label = cardLabel(acc)
            const util = creditUtilization(acc)

            return (
              <div
                key={acc.id}
                onClick={() => open({ kind: 'account-detail', account: acc })}
                className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-5 py-3 transition-colors last:border-b-0 active:bg-gray-50"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: acc.color || meta.color }}
                >
                  <Icon className="size-4 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
                  {label && (
                    <p className="text-sm text-gray-400">{label}</p>
                  )}
                  {util && (
                    <p className="text-xs text-gray-400">{util}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold tabular-nums ${isNegative ? 'text-red-500' : 'text-gray-900'}`}
                  >
                    {fmt(acc.balance)}
                  </span>
                  <span className="text-gray-300">›</span>
                </div>
              </div>
            )
          })}
          {data.accounts.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-gray-400">
              No tienes cuentas creadas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
