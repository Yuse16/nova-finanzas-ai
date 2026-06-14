'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { accountTypes, getAccountTypeMeta } from '@/lib/catalog'
import type { Account, AccountType } from '@/lib/types'
import { GlassSheet } from './ui/glass-sheet'
import {
  Field,
  GlassInput,
  GlassButton,
  ChipSelect,
} from './ui/form-controls'

const typeOptions = accountTypes.map((t) => ({
  value: t.type,
  label: t.label,
}))

export function AccountModal() {
  const { modal, close } = useUI()
  const { addAccount, updateAccount, deleteAccount } = useStore()

  const isOpen = modal.kind === 'account'
  const editing = isOpen ? modal.editing : undefined

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('efectivo')
  const [balanceStr, setBalanceStr] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setName(editing.name)
      setType(editing.type)
      // Display absolute balance on input
      setBalanceStr(String(Math.abs(editing.balance)))
    } else {
      setName('')
      setType('efectivo')
      setBalanceStr('')
    }
  }, [isOpen, editing])

  const balanceNum = Number.parseFloat(balanceStr.replace(/,/g, '')) || 0
  const valid = name.trim().length > 0 && balanceStr.trim().length > 0

  function save() {
    if (!valid) return
    const meta = getAccountTypeMeta(type)
    const storedBalance = meta.liability ? -balanceNum : balanceNum

    const baseData = {
      name: name.trim(),
      type,
      balance: storedBalance,
      icon: meta.icon,
      color: meta.color,
    }

    if (editing) {
      updateAccount({
        ...editing,
        ...baseData,
      })
    } else {
      addAccount(baseData)
    }
    close()
  }

  function handleDelete() {
    if (editing) {
      deleteAccount(editing.id)
      close()
    }
  }

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title={editing ? 'Editar Cuenta' : 'Nueva Cuenta'}
      footer={
        <div className="flex flex-col gap-3 pb-2">
          <GlassButton onClick={save} disabled={!valid}>
            {editing ? 'Guardar Cambios' : 'Crear Cuenta'}
          </GlassButton>
          {editing && (
            <GlassButton variant="danger" onClick={handleDelete}>
              <Trash2 className="size-4" /> Eliminar Cuenta
            </GlassButton>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <Field label="Nombre de la Cuenta">
          <GlassInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Mi Efectivo, Nómina Bancomer..."
            autoFocus={!editing}
          />
        </Field>

        <Field label="Tipo de Cuenta">
          <ChipSelect
            options={typeOptions}
            value={type}
            onChange={(v) => {
              setType(v)
              // Auto fill default name if name is empty or matched a default
              const currentMeta = getAccountTypeMeta(type)
              if (!name || name === currentMeta.label) {
                setName(getAccountTypeMeta(v).label)
              }
            }}
          />
        </Field>

        <Field label="Saldo Inicial / Actual">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
              $
            </span>
            <GlassInput
              inputMode="decimal"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              placeholder="0.00"
              className="pl-8 text-lg"
            />
          </div>
        </Field>
      </div>
    </GlassSheet>
  )
}
