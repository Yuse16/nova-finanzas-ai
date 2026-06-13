'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import { fmt, todayISO } from '@/lib/format'
import type { Movement } from '@/lib/types'
import { GlassSheet } from './ui/glass-sheet'
import { Field, GlassInput, GlassButton } from './ui/form-controls'

export function TransferModal() {
  const { modal, close } = useUI()
  const { data, addMovement } = useStore()
  const isOpen = modal.kind === 'transfer'

  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setFromId(data.accounts[0]?.id ?? null)
    setToId(data.accounts[1]?.id ?? null)
    setAmount('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const amountNum = Number.parseFloat(amount.replace(/,/g, '')) || 0
  const valid = amountNum > 0 && fromId && toId && fromId !== toId

  function save() {
    if (!valid) return
    const from = data.accounts.find((a) => a.id === fromId)
    const to = data.accounts.find((a) => a.id === toId)
    const mov: Omit<Movement, 'id' | 'createdAt'> = {
      title: `Transferencia a ${to?.name ?? ''}`,
      category: 'Transferencia',
      amount: amountNum,
      type: 'transferencia',
      accountId: fromId,
      toAccountId: toId,
      method: from?.name ?? 'Cuenta',
      date: todayISO(),
      icon: 'arrow-left-right',
      color: 'oklch(0.72 0.15 235)',
    }
    addMovement(mov)
    close()
  }

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title="Transferencia entre cuentas"
      footer={
        <div className="pb-2">
          <GlassButton onClick={save} disabled={!valid}>
            Transferir
          </GlassButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <Field label="Desde">
          <div className="flex flex-col gap-2">
            {data.accounts.map((a) => {
              const Icon = getIcon(a.icon)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setFromId(a.id)}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                    fromId === a.id ? 'bg-white/85 text-[oklch(0.45_0.1_255)]' : 'glass-subtle'
                  }`}
                >
                  <span
                    className="grid size-9 place-items-center rounded-xl"
                    style={{ background: a.color }}
                  >
                    <Icon className="size-4 text-white" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{a.name}</span>
                  <span className="text-sm tabular-nums">{fmt(a.balance)}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Hacia">
          <div className="flex flex-col gap-2">
            {data.accounts
              .filter((a) => a.id !== fromId)
              .map((a) => {
                const Icon = getIcon(a.icon)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setToId(a.id)}
                    className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                      toId === a.id ? 'bg-white/85 text-[oklch(0.45_0.1_255)]' : 'glass-subtle'
                    }`}
                  >
                    <span
                      className="grid size-9 place-items-center rounded-xl"
                      style={{ background: a.color }}
                    >
                      <Icon className="size-4 text-white" />
                    </span>
                    <span className="flex-1 text-sm font-medium">{a.name}</span>
                    <span className="text-sm tabular-nums">{fmt(a.balance)}</span>
                  </button>
                )
              })}
          </div>
        </Field>

        <Field label="Monto">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
              $
            </span>
            <GlassInput
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-8 text-lg"
            />
          </div>
        </Field>
      </div>
    </GlassSheet>
  )
}
