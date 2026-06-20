'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getAccountTypeMeta, bankOptions, cardIdentifierOptions } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { fmt } from '@/lib/format'
import type { Account, AccountType } from '@/lib/types'
import { GlassSheet } from './ui/glass-sheet'
import {
  Field,
  GlassInput,
  GlassButton,
  ChipSelect,
} from './ui/form-controls'

const typeOptions = [
  { value: 'efectivo' as AccountType, label: 'Efectivo' },
  { value: 'debito' as AccountType, label: 'Tarjeta Débito' },
  { value: 'credito' as AccountType, label: 'Tarjeta Crédito' },
  { value: 'ahorro' as AccountType, label: 'Ahorro' },
  { value: 'inversion' as AccountType, label: 'Inversión' },
  { value: 'personalizada' as AccountType, label: 'Otra' },
]

const institutionOptions = [
  { value: 'GBM', label: 'GBM' },
  { value: 'CETES', label: 'CETES' },
  { value: 'Actinver', label: 'Actinver' },
  { value: 'Finsus', label: 'Finsus' },
  { value: 'Mercado Pago', label: 'Mercado Pago' },
  { value: 'Nu Inversión', label: 'Nu Inversión' },
  { value: 'Kuspit', label: 'Kuspit' },
  { value: 'Otro', label: 'Otro' },
]

const efectivoPlaceholders = ['Efectivo', 'Caja chica', 'Negocio']
const ahorroPlaceholders = ['Fondo de emergencia', 'Vacaciones', 'Casa', 'Auto']
const otraPlaceholders = ['PayPal', 'Dólares', 'Criptomonedas', 'Caja de ahorro', 'Negocio', 'Mercado Pago']

function isCardType(type: AccountType): boolean {
  return type === 'credito' || type === 'debito'
}

function getBalanceLabel(type: AccountType): string {
  switch (type) {
    case 'credito': return 'Saldo utilizado'
    case 'debito': return 'Saldo disponible'
    case 'inversion': return 'Monto invertido'
    case 'ahorro':
    case 'efectivo':
    case 'personalizada':
    default: return 'Saldo actual'
  }
}

export function AccountModal() {
  const { modal, close } = useUI()
  const { addAccount, updateAccount, deleteAccount } = useStore()

  const isOpen = modal.kind === 'account'
  const editing = isOpen ? modal.editing : undefined

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('efectivo')
  const [balanceStr, setBalanceStr] = useState('')
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
      const bankVal = editing.bank ?? ''
      const isCustomBank = !!bankVal && !bankOptions.find((b) => b.value === bankVal) && !institutionOptions.find((b) => b.value === bankVal)
      setBank(isCustomBank ? 'Otro' : bankVal)
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

  const isEfectivo = type === 'efectivo'
  const isDebito = type === 'debito'
  const isCredito = type === 'credito'
  const isAhorro = type === 'ahorro'
  const isInversion = type === 'inversion'
  const isOtra = type === 'personalizada'
  const isCard = isCardType(type)

  const nameRequired = !isEfectivo
  const nameValid = nameRequired ? name.trim().length > 0 : true
  const valid = nameValid && balanceStr.trim().length > 0

  function getSelectedBank(): string | undefined {
    if (!bank) return undefined
    if (bank === 'Otro' || bank === 'Otros') return customBank.trim() || undefined
    return bank
  }

  function previewName(): string {
    if (name.trim()) return name.trim()
    if (isEfectivo) return 'Efectivo'
    if (isAhorro) return 'Ahorro'
    if (isInversion) return 'Inversión'
    if (isOtra) return 'Otra'
    if (isCard) return 'Tarjeta'
    return ''
  }

  function previewSubtitle(): string {
    const parts: string[] = []
    const selectedBank = getSelectedBank()
    if (selectedBank) parts.push(selectedBank)
    if (identifier) parts.push(`(${identifier})`)
    return parts.join(' ')
  }

  function save() {
    if (!valid) return
    const storedBalance = isCredito ? -balanceNum : balanceNum

    const baseData: Record<string, unknown> = {
      name: isEfectivo && !name.trim() ? 'Efectivo' : name.trim(),
      type,
      balance: storedBalance,
      icon: getAccountTypeMeta(type).icon,
      color: getAccountTypeMeta(type).color,
    }

    if (isCard) {
      baseData.bank = getSelectedBank()
      baseData.identifier = identifier.trim() || undefined
      baseData.activa = activa
      if (isCredito) {
        const limit = Number.parseFloat(limiteCreditoStr.replace(/,/g, '')) || 0
        baseData.limiteCredito = limit > 0 ? limit : undefined
        baseData.fechaCorte = fechaCorte ? Number.parseInt(fechaCorte, 10) : undefined
        baseData.fechaPago = fechaPago ? Number.parseInt(fechaPago, 10) : undefined
      }
    }

    if (isInversion) {
      baseData.bank = getSelectedBank()
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
        <Field label="Tipo de cuenta">
          <ChipSelect
            options={typeOptions}
            value={type}
            onChange={(v) => {
              setType(v)
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

        {/* EFECTIVO */}
        {isEfectivo && (
          <>
            <Field label="Nombre (opcional)" hint="Dale un nombre a tu efectivo">
              <GlassInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Efectivo, Caja chica, Negocio"
                autoFocus={!editing}
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {efectivoPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setName(p)}
                  className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* TARJETA DÉBITO */}
        {isDebito && (
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
            <Field label="Alias (opcional)" hint="Ej. Nómina, Personal, Negocio, Principal">
              <GlassInput
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. Principal"
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
          </>
        )}

        {/* TARJETA CRÉDITO */}
        {isCredito && (
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
            <Field label="Alias (opcional)" hint="Ej. Principal, Viajes, Negocio, Personal">
              <GlassInput
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. Principal"
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
            <Field label="Límite de crédito">
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
                <Field label="Fecha de corte">
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
                <Field label="Fecha de pago">
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
            <Field label="Estado">
              <button
                type="button"
                onClick={() => setActiva(!activa)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activa
                    ? 'bg-white/85 text-gray-900 dark:bg-white/20 dark:text-white'
                    : 'bg-white/50 text-gray-500 dark:bg-white/8 dark:text-white/40'
                }`}
              >
                {activa ? 'Activa' : 'Inactiva'}
              </button>
            </Field>
          </>
        )}

        {/* AHORRO */}
        {isAhorro && (
          <>
            <Field label="Nombre" hint="¿Para qué estás ahorrando?">
              <GlassInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Fondo de emergencia, Vacaciones, Casa"
                autoFocus={!editing}
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {ahorroPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setName(p)}
                  className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* INVERSIÓN */}
        {isInversion && (
          <>
            <Field label="Institución">
              <div className="flex flex-wrap gap-1.5">
                {institutionOptions.map((b) => (
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
            {bank === 'Otro' && (
              <Field label="Nombre de la institución">
                <GlassInput
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  placeholder="Ej. Otra institución"
                />
              </Field>
            )}
          </>
        )}

        {/* OTRA */}
        {isOtra && (
          <>
            <Field label="Nombre personalizado" hint="¿Qué tipo de cuenta es?">
              <GlassInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. PayPal, Dólares, Criptomonedas"
                autoFocus={!editing}
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {otraPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setName(p)}
                  className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-white/70 hover:text-gray-700 dark:bg-white/8 dark:text-white/50 dark:hover:bg-white/12 dark:hover:text-white/70"
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        <Field label={getBalanceLabel(type)}>
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

        {/* PREVIEW */}
        {(name.trim() || balanceNum > 0 || getSelectedBank() || identifier) && (
          <div className="mt-2 rounded-2xl bg-white/30 p-4 backdrop-blur-sm dark:bg-white/[0.04]">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Vista previa
            </p>
            <div className="flex items-center gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl"
                style={{ background: getAccountTypeMeta(type).color }}
              >
                {(() => {
                  const Icon = getIcon(getAccountTypeMeta(type).icon)
                  return <Icon className="size-4 text-white" />
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {previewName()}
                </p>
                {isCredito ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Utilizado {balanceNum > 0 ? fmt(balanceNum) : '$0'}
                      {limiteCreditoStr ? ` / ${fmt(Number.parseFloat(limiteCreditoStr.replace(/,/g, '')) || 0)}` : ''}
                    </p>
                    {previewSubtitle() && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{previewSubtitle()}</p>
                    )}
                  </>
                ) : (
                  <>
                    {balanceNum > 0 && (
                      <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {fmt(balanceNum)}
                      </p>
                    )}
                    {previewSubtitle() && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{previewSubtitle()}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassSheet>
  )
}
