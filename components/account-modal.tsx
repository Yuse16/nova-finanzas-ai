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
import { CustomAccountFields } from './custom-account-fields'

const typeOptions = accountTypes.map((t) => ({
  value: t.type,
  label: t.type === 'personalizada' ? 'Otro' : t.label,
}))

export function AccountModal() {
  const { modal, close } = useUI()
  const { addAccount, updateAccount, deleteAccount } = useStore()

  const isOpen = modal.kind === 'account'
  const editing = isOpen ? modal.editing : undefined

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('efectivo')
  const [balanceStr, setBalanceStr] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('wallet')
  const [selectedColor, setSelectedColor] = useState('oklch(0.72 0.16 150)')
  const [localIsLiability, setLocalIsLiability] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setName(editing.name)
      setType(editing.type)
      setBalanceStr(String(Math.abs(editing.balance)))
      setSelectedIcon(editing.icon)
      setSelectedColor(editing.color)
      if (editing.type === 'personalizada') {
        setLocalIsLiability(editing.isLiability ?? false)
      }
    } else {
      setName('')
      setType('efectivo')
      setBalanceStr('')
      setSelectedIcon('wallet')
      setSelectedColor('oklch(0.72 0.16 150)')
      setLocalIsLiability(false)
    }
  }, [isOpen, editing])

  const balanceNum = Number.parseFloat(balanceStr.replace(/,/g, '')) || 0
  const valid = name.trim().length > 0 && balanceStr.trim().length > 0

  function save() {
    if (!valid) return
    const isLiability = type === 'personalizada' ? localIsLiability : getAccountTypeMeta(type).liability
    const storedBalance = isLiability ? -balanceNum : balanceNum

    const baseData = {
      name: name.trim(),
      type,
      balance: storedBalance,
      icon: type === 'personalizada' ? selectedIcon : getAccountTypeMeta(type).icon,
      color: type === 'personalizada' ? selectedColor : getAccountTypeMeta(type).color,
      ...(type === 'personalizada' ? { isLiability: localIsLiability } : {}),
    }

    if (editing) {
      updateAccount({ ...editing, ...baseData })
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
            placeholder={type === 'personalizada' ? 'Ej. Mi Wallet Cripto' : 'Ej. Mi Efectivo, Nómina Bancomer...'}
            autoFocus={!editing}
          />
        </Field>

        <Field label="Tipo de Cuenta">
          <ChipSelect
            options={typeOptions}
            value={type}
            onChange={(v) => {
              setType(v)
              const currentMeta = getAccountTypeMeta(type)
              if (!name || name === currentMeta.label) {
                setName(getAccountTypeMeta(v).label)
              }
              if (v !== 'personalizada') {
                setSelectedIcon(getAccountTypeMeta(v).icon)
                setSelectedColor(getAccountTypeMeta(v).color)
              }
            }}
          />
        </Field>

        {type === 'personalizada' && (
          <CustomAccountFields
            selectedIcon={selectedIcon}
            onIconChange={setSelectedIcon}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            isLiability={localIsLiability}
            onLiabilityChange={setLocalIsLiability}
          />
        )}

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
