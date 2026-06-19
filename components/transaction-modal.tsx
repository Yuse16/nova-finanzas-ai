'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { getIcon } from '@/lib/icons'
import {
  categories,
  getAccountTypeMeta,
  getCategoryMeta,
  methodToAccountType,
  movementTypeLabels,
} from '@/lib/catalog'
import { todayISO } from '@/lib/format'
import type { Account, Method, Movement, MovementType } from '@/lib/types'
import { GlassSheet } from './ui/glass-sheet'
import {
  Field,
  GlassInput,
  GlassButton,
  ChipSelect,
} from './ui/form-controls'

const typeOptions: { value: MovementType; label: string }[] = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'prestamo', label: 'Préstamo' },
  { value: 'deuda', label: 'Me prestaron' },
]

export function TransactionModal() {
  const { modal, close } = useUI()
  const { data, addMovement, updateMovement, deleteMovement } =
    useStore()

  const isOpen = modal.kind === 'transaction'
  const editing = isOpen ? modal.editing : undefined
  const preset = isOpen ? modal.preset : undefined
  const parsed = isOpen ? modal.parsed : undefined

  const [type, setType] = useState<MovementType>('gasto')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('General')
  const [method, setMethod] = useState<Method>('Efectivo')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [person, setPerson] = useState('')
  const [showAccountPicker, setShowAccountPicker] = useState(false)

  // Initialize the form whenever it opens
  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setType(editing.type)
      setTitle(editing.title)
      setAmount(String(editing.amount))
      setCategory(editing.category)
      setMethod((editing.method as Method) ?? 'Efectivo')
      setAccountId(editing.accountId)
      setDate(editing.date.slice(0, 10))
      setPerson(editing.person ?? '')
    } else {
      const t = (parsed?.type as MovementType) ?? preset ?? 'gasto'
      setType(t)
      setTitle(parsed?.title ?? '')
      setAmount(parsed?.amount ? String(parsed.amount) : '')
      setCategory(parsed?.category ?? (t === 'ingreso' ? 'Ingreso' : 'General'))
      const m = (parsed?.method as Method) ?? 'Efectivo'
      setMethod(m)
      const accType = methodToAccountType[m]
      const fallback = accType
        ? data.accounts.find((a) => a.type === accType)
        : undefined
      setAccountId(fallback?.id ?? data.accounts[0]?.id ?? null)
      setDate(todayISO())
      setPerson(parsed?.person ?? '')
    }
    setShowAccountPicker(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const amountNum = Number.parseFloat(amount.replace(/,/g, '')) || 0
  const valid = amountNum > 0

  const selectedAccount: Account | undefined = accountId
    ? data.accounts.find((a) => a.id === accountId)
    : undefined

  function handleSelectAccount(id: string) {
    setAccountId(id)
    const acc = data.accounts.find((a) => a.id === id)
    if (acc) {
      const m = Object.entries(methodToAccountType).find(
        ([, v]) => v === acc.type,
      )?.[0]
      setMethod((m ?? 'Otro') as Method)
    }
  }

  function save() {
    const cat = getCategoryMeta(category)
    const base: Omit<Movement, 'id' | 'createdAt'> = {
      title: title.trim() || movementTypeLabels[type],
      category,
      amount: amountNum,
      type,
      accountId,
      method,
      date,
      person: person.trim() || undefined,
      icon: cat.icon,
      color: cat.color,
    }
    if (editing) {
      updateMovement({ ...editing, ...base })
    } else {
      addMovement(base)
    }
    close()
  }

  function handleDelete() {
    if (editing) {
      deleteMovement(editing)
      close()
    }
  }

  const showPerson = type === 'prestamo' || type === 'deuda'

  return (
    <>
      <GlassSheet
        open={isOpen}
        onClose={close}
        title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        footer={
          <div className="flex flex-col gap-3 pb-2">
            <GlassButton onClick={save} disabled={!valid}>
              {editing ? 'Guardar cambios' : 'Agregar movimiento'}
            </GlassButton>
            {editing && (
              <GlassButton variant="danger" onClick={handleDelete}>
                <Trash2 className="size-4" /> Eliminar
              </GlassButton>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Field label="Tipo">
            <ChipSelect
              options={typeOptions}
              value={type}
              onChange={(v) => setType(v)}
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Monto
            </p>
            <div className="flex items-center rounded-2xl bg-white/40 px-5 py-4 backdrop-blur-sm ring-1 ring-white/30 transition-all focus-within:ring-2 focus-within:ring-[var(--ring)] dark:bg-white/[0.06] dark:ring-white/10 dark:focus-within:ring-white/30">
              <span className="mr-2 text-3xl font-light text-gray-400 dark:text-gray-500">
                $
              </span>
              <input
                autoFocus={!editing}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent text-4xl font-semibold tabular-nums text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          <Field label="Concepto">
            <GlassInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tacos, Sueldo, Renta..."
            />
          </Field>

          {type !== 'ingreso' && (
            <Field label="Categoría">
              <ChipSelect
                options={categories
                  .filter((c) => c.label !== 'Ingreso')
                  .map((c) => ({ value: c.label, label: c.label }))}
                value={category}
                onChange={setCategory}
              />
            </Field>
          )}

          {showPerson && (
            <Field label="Persona">
              <GlassInput
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Nombre de la persona"
              />
            </Field>
          )}

          <Field label="Cuenta">
            <button
              type="button"
              onClick={() => setShowAccountPicker(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/40 px-4 py-3 backdrop-blur-sm ring-1 ring-white/30 transition-all active:scale-[0.98] dark:bg-white/[0.06] dark:ring-white/10"
            >
              {selectedAccount ? (
                <>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl"
                    style={{
                      background:
                        selectedAccount.color ||
                        getAccountTypeMeta(selectedAccount.type).color,
                    }}
                  >
                    {(() => {
                      const Icon = getIcon(selectedAccount.icon)
                      return <Icon className="size-4 text-white" />
                    })()}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedAccount.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getAccountTypeMeta(selectedAccount.type).caption}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 py-1 text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seleccionar cuenta
                  </p>
                </div>
              )}
              <ChevronDown className="size-4 shrink-0 text-gray-400 dark:text-gray-500" />
            </button>
          </Field>

          <Field label="Fecha">
            <GlassInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
      </GlassSheet>

      <AnimatePresence>
        {showAccountPicker && (
          <>
            <motion.div
              className="fixed inset-0 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setShowAccountPicker(false)}
                className="absolute inset-0 cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/[0.04] backdrop-blur-[2px] dark:bg-black/30 dark:backdrop-blur-sm" />
              </button>
            </motion.div>

            <motion.div
              className="fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center"
              initial={{ opacity: 0, y: '100%', scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: '100%', scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="relative max-h-[60vh] w-full max-w-md overflow-hidden rounded-t-[1.5rem] bg-white/[0.78] pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] backdrop-blur-[24px] dark:bg-gray-900/[0.82] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.3)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Seleccionar cuenta
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAccountPicker(false)}
                    className="grid size-8 place-items-center rounded-full bg-white/50 text-gray-500 backdrop-blur-xl transition-colors hover:bg-white/70 active:scale-95 dark:bg-white/15 dark:text-white/60 dark:hover:bg-white/25"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>

                <div className="flex flex-col overflow-y-auto">
                  {data.accounts.map((acc) => {
                    const Icon = getIcon(acc.icon)
                    const meta = getAccountTypeMeta(acc.type)
                    const selected = acc.id === accountId
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          handleSelectAccount(acc.id)
                          setShowAccountPicker(false)
                        }}
                        className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-white/30 dark:active:bg-white/[0.06] ${
                          selected
                            ? 'bg-white/40 dark:bg-white/[0.08]'
                            : ''
                        }`}
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-xl"
                          style={{
                            background: acc.color || meta.color,
                          }}
                        >
                          <Icon className="size-4 text-white" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {acc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {meta.caption}
                          </p>
                        </div>
                        {selected && (
                          <Check className="size-4 shrink-0 text-emerald-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
