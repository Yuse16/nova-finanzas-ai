'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import {
  categories,
  getCategoryMeta,
  methods,
  movementTypeLabels,
} from '@/lib/catalog'
import { todayISO } from '@/lib/format'
import type { Method, Movement, MovementType } from '@/lib/types'
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
  const { data, addMovement, updateMovement, deleteMovement, resolveAccountIdByMethod } =
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
      setAccountId(resolveAccountIdByMethod(m))
      setDate(todayISO())
      setPerson(parsed?.person ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const amountNum = Number.parseFloat(amount.replace(/,/g, '')) || 0
  const valid = amountNum > 0

  function handleMethod(m: Method) {
    setMethod(m)
    setAccountId(resolveAccountIdByMethod(m))
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
      <div className="flex flex-col gap-4 pb-4">
        <Field label="Tipo">
          <ChipSelect
            options={typeOptions}
            value={type}
            onChange={(v) => setType(v)}
          />
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
              autoFocus={!editing}
            />
          </div>
        </Field>

        <Field label="Concepto">
          <GlassInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Tacos, Sueldo, Renta..."
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

        <Field label="Método / cuenta">
          <ChipSelect
            options={methods.map((m) => ({ value: m, label: m }))}
            value={method}
            onChange={(v) => handleMethod(v as Method)}
          />
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
  )
}
