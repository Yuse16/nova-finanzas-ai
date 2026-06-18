'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { reminderIconOptions } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { todayISO } from '@/lib/format'
import { GlassSheet } from './ui/glass-sheet'
import { Field, GlassInput, GlassButton, ChipSelect } from './ui/form-controls'

const recurringOptions = [
  { value: 'none' as const, label: 'Una sola vez' },
  { value: 'weekly' as const, label: 'Semanal' },
  { value: 'monthly' as const, label: 'Cada mes' },
  { value: 'yearly' as const, label: 'Una vez al año' },
]

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function ReminderModal() {
  const { modal, close } = useUI()
  const { addReminder, updateReminder, deleteReminder } = useStore()

  const isOpen = modal.kind === 'reminder'
  const editing = isOpen ? modal.editing : undefined

  const [title, setTitle] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [recurring, setRecurring] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none')
  const [selectedIconIndex, setSelectedIconIndex] = useState(0)
  const [monthlyDay, setMonthlyDay] = useState(1)
  const [yearlyMonth, setYearlyMonth] = useState(1)
  const [yearlyDay, setYearlyDay] = useState(1)

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setTitle(editing.title)
      setAmountStr(String(editing.amount))
      setDueDate(editing.dueDate.slice(0, 10))
      setRecurring(editing.recurring)
      const idx = reminderIconOptions.findIndex((o) => o.icon === editing.icon)
      setSelectedIconIndex(idx >= 0 ? idx : 0)

      const d = new Date(editing.dueDate + 'T00:00:00')
      setMonthlyDay(d.getDate())
      setYearlyMonth(d.getMonth() + 1)
      setYearlyDay(d.getDate())
    } else {
      setTitle('')
      setAmountStr('')
      setDueDate(todayISO())
      setRecurring('none')
      setSelectedIconIndex(0)
      const d = new Date(todayISO() + 'T00:00:00')
      setMonthlyDay(d.getDate())
      setYearlyMonth(d.getMonth() + 1)
      setYearlyDay(d.getDate())
    }
  }, [isOpen, editing])

  const amountNum = Number.parseFloat(amountStr.replace(/,/g, '')) || 0
  const valid = title.trim().length > 0 && amountNum > 0 && dueDate.length > 0

  function buildDueDate(): string {
    if (recurring === 'monthly') {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(monthlyDay).padStart(2, '0')}`
    }
    if (recurring === 'yearly') {
      const now = new Date()
      return `${now.getFullYear()}-${String(yearlyMonth).padStart(2, '0')}-${String(yearlyDay).padStart(2, '0')}`
    }
    return dueDate
  }

  function save() {
    if (!valid) return
    const opt = reminderIconOptions[selectedIconIndex]
    const baseData = {
      title: title.trim(),
      amount: amountNum,
      dueDate: buildDueDate(),
      recurring,
      completed: editing ? editing.completed : false,
      icon: opt.icon,
      color: opt.color,
    }

    if (editing) {
      updateReminder({
        ...editing,
        ...baseData,
      })
    } else {
      addReminder(baseData)
    }
    close()
  }

  function handleDelete() {
    if (editing) {
      deleteReminder(editing.id)
      close()
    }
  }

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title={editing ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
      footer={
        <div className="flex flex-col gap-3 pb-2">
          <GlassButton onClick={save} disabled={!valid}>
            {editing ? 'Guardar Cambios' : 'Crear Recordatorio'}
          </GlassButton>
          {editing && (
            <GlassButton variant="danger" onClick={handleDelete}>
              <Trash2 className="size-4" /> Eliminar Recordatorio
            </GlassButton>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <Field label="Concepto / Servicio">
          <GlassInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. CFE Luz, Internet Infinitum, Renta..."
            autoFocus={!editing}
          />
        </Field>

        <Field label="Monto a Pagar">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <GlassInput
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </Field>

        <Field label="Repetición">
          <ChipSelect
            options={recurringOptions}
            value={recurring}
            onChange={(v) => {
              setRecurring(v)
              if (v === 'monthly' || v === 'yearly') {
                const d = new Date(dueDate + 'T00:00:00')
                setMonthlyDay(d.getDate())
                setYearlyMonth(d.getMonth() + 1)
                setYearlyDay(d.getDate())
              }
            }}
          />
        </Field>

        {recurring === 'none' || recurring === 'weekly' ? (
          <Field label="Fecha de Vencimiento">
            <GlassInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        ) : recurring === 'monthly' ? (
          <Field label="Día del Mes">
            <GlassInput
              type="number"
              min={1}
              max={31}
              value={monthlyDay}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value) || 1
                setMonthlyDay(Math.max(1, Math.min(31, v)))
              }}
            />
          </Field>
        ) : recurring === 'yearly' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mes">
              <select
                value={yearlyMonth}
                onChange={(e) => setYearlyMonth(Number(e.target.value))}
                className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/30"
              >
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={i + 1} className="text-black">
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Día">
              <GlassInput
                type="number"
                min={1}
                max={31}
                value={yearlyDay}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value) || 1
                  setYearlyDay(Math.max(1, Math.min(31, v)))
                }}
              />
            </Field>
          </div>
        ) : null}

        <Field label="Icono y Color">
          <div className="flex flex-wrap gap-2 pt-1">
            {reminderIconOptions.map((opt, i) => {
              const IconComponent = getIcon(opt.icon)
              const selected = selectedIconIndex === i
              return (
                <button
                  key={opt.icon}
                  type="button"
                  onClick={() => setSelectedIconIndex(i)}
                  className={`grid size-12 place-items-center rounded-2xl transition-all ${
                    selected
                      ? 'scale-105 ring-2 ring-white/60 shadow-lg'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={{ background: opt.color }}
                  title={opt.label}
                >
                  <IconComponent className="size-5 text-white" />
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </GlassSheet>
  )
}
