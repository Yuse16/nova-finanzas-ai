'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { accountTypes, getAccountTypeMeta, bankOptions, cardIdentifierOptions } from '@/lib/catalog'
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

function isCardType(type: AccountType): boolean {
  return type === 'credito' || type === 'debito'
}

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

  // Card fields
  const [bank, setBank] = useState('')
  const [customBank, setCustomBank] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [limiteCreditoStr, setLimiteCreditoStr] = useState('')
  const [fechaCorte, setFechaCorte] = useState('')
  const [fechaPago, setFechaPago] = useState('')
  const [activa, setActiva] = useState(true)

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
      // Card fields
      const bankVal = editing.bank ?? ''
      const isCustomBank = !!bankVal && !bankOptions.find((b) => b.value === bankVal)
      setBank(isCustomBank ? 'Otros' : bankVal)
      setCustomBank(isCustomBank ? bankVal : '')
      setIdentifier(editing.identifier ?? '')
      setLimiteCreditoStr(editing.limiteCredito ? String(editing.limiteCredito) : '')
      setFechaCorte(editing.fechaCorte ? String(editing.fechaCorte) : '')
      setFechaPago(editing.fechaPago ? String(editing.fechaPago) : '')
      setActiva(editing.activa ?? true)
    } else {
      setName('')
      setType('efectivo')
      setBalanceStr('')
      setSelectedIcon('wallet')
      setSelectedColor('oklch(0.72 0.16 150)')
      setLocalIsLiability(false)
      setBank('')
      setCustomBank('')
      setIdentifier('')
      setLimiteCreditoStr('')
      setFechaCorte('')
      setFechaPago('')
      setActiva(true)
    }
  }, [isOpen, editing])

  const balanceNum = Number.parseFloat(balanceStr.replace(/,/g, '')) || 0
  const valid = name.trim().length > 0 && balanceStr.trim().length > 0

  function getSelectedBank(): string | undefined {
    if (bank === 'Otros') return customBank.trim() || undefined
    return bank || undefined
  }

  function save() {
    if (!valid) return
    const isLiability = type === 'personalizada' ? localIsLiability : getAccountTypeMeta(type).liability
    const storedBalance = isLiability ? -balanceNum : balanceNum

    const baseData: Record<string, unknown> = {
      name: name.trim(),
      type,
      balance: storedBalance,
      icon: type === 'personalizada' ? selectedIcon : getAccountTypeMeta(type).icon,
      color: type === 'personalizada' ? selectedColor : getAccountTypeMeta(type).color,
      ...(type === 'personalizada' ? { isLiability: localIsLiability } : {}),
    }

    if (isCardType(type)) {
      baseData.bank = getSelectedBank()
      baseData.identifier = identifier.trim() || undefined
      baseData.activa = activa
      if (type === 'credito') {
        const limit = Number.parseFloat(limiteCreditoStr.replace(/,/g, '')) || 0
        baseData.limiteCredito = limit > 0 ? limit : undefined
        baseData.fechaCorte = fechaCorte ? Number.parseInt(fechaCorte, 10) : undefined
        baseData.fechaPago = fechaPago ? Number.parseInt(fechaPago, 10) : undefined
      }
    }

    if (editing) {
      updateAccount({ ...editing, ...baseData } as Account)
    } else {
      addAccount(baseData as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>)
    }
    close()
  }

  function handleDelete() {
    if (editing) {
      deleteAccount(editing.id)
      close()
    }
  }

  const isCard = isCardType(type)

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
            placeholder={type === 'personalizada' ? 'Ej. Mi Wallet Cripto' : isCard ? 'Ej. Tarjeta Principal' : 'Ej. Mi Efectivo, Nómina...'}
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
              if (!isCardType(v)) {
                setBank('')
                setCustomBank('')
                setIdentifier('')
                setLimiteCreditoStr('')
                setFechaCorte('')
                setFechaPago('')
                setActiva(true)
              }
            }}
          />
        </Field>

        {isCard && (
          <>
            <Field label="Banco">
              <div className="flex flex-wrap gap-1.5">
                {bankOptions.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBank(b.value)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                      bank === b.value
                        ? 'bg-white/85 text-gray-900 shadow-sm dark:bg-white/20 dark:text-white dark:shadow-sm'
                        : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </Field>

            {bank === 'Otros' && (
              <Field label="Nombre del banco">
                <GlassInput
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  placeholder="Ej. Mi Banco"
                />
              </Field>
            )}

            <Field label="Identificador (opcional)">
              <GlassInput
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. Principal, Nómina, Viajes..."
              />
              {identifier.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cardIdentifierOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIdentifier(opt)}
                      className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Activa">
              <button
                type="button"
                onClick={() => setActiva(!activa)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activa
                    ? 'bg-white/85 text-gray-900 dark:bg-white/20 dark:text-white'
                    : 'bg-white/50 text-gray-500 dark:bg-white/8 dark:text-white/40'
                }`}
              >
                {activa ? 'Sí' : 'No'}
              </button>
            </Field>
          </>
        )}

        {type === 'credito' && (
          <>
            <Field label="Límite de Crédito">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-gray-500">$</span>
                <GlassInput
                  inputMode="decimal"
                  value={limiteCreditoStr}
                  onChange={(e) => setLimiteCreditoStr(e.target.value)}
                  placeholder="0"
                  className="pl-8"
                />
              </div>
            </Field>

            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Fecha de Corte">
                  <GlassInput
                    inputMode="numeric"
                    value={fechaCorte}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setFechaCorte(v)
                    }}
                    placeholder="Día (1-31)"
                    maxLength={2}
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Fecha de Pago">
                  <GlassInput
                    inputMode="numeric"
                    value={fechaPago}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setFechaPago(v)
                    }}
                    placeholder="Día (1-31)"
                    maxLength={2}
                  />
                </Field>
              </div>
            </div>
          </>
        )}

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
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-gray-500">
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
