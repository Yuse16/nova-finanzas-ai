'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/ui-context'
import { goalIconOptions } from '@/lib/catalog'
import { getIcon } from '@/lib/icons'
import { todayISO } from '@/lib/format'
import { GlassSheet } from './ui/glass-sheet'
import { Field, GlassInput, GlassButton } from './ui/form-controls'

export function GoalModal() {
  const { modal, close } = useUI()
  const { addGoal, updateGoal, deleteGoal } = useStore()

  const isOpen = modal.kind === 'goal'
  const editing = isOpen ? modal.editing : undefined

  const [title, setTitle] = useState('')
  const [targetStr, setTargetStr] = useState('')
  const [savedStr, setSavedStr] = useState('')
  const [date, setDate] = useState(todayISO())
  const [selectedIconIndex, setSelectedIconIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setTitle(editing.title)
      setTargetStr(String(editing.target))
      setSavedStr(String(editing.saved))
      setDate(editing.date.slice(0, 10))
      const idx = goalIconOptions.findIndex((o) => o.icon === editing.icon)
      setSelectedIconIndex(idx >= 0 ? idx : 0)
    } else {
      setTitle('')
      setTargetStr('')
      setSavedStr('0')
      setDate(todayISO())
      setSelectedIconIndex(0)
    }
  }, [isOpen, editing])

  const targetNum = Number.parseFloat(targetStr.replace(/,/g, '')) || 0
  const savedNum = Number.parseFloat(savedStr.replace(/,/g, '')) || 0
  const valid = title.trim().length > 0 && targetNum > 0 && date.length > 0

  function save() {
    if (!valid) return
    const opt = goalIconOptions[selectedIconIndex]
    const baseData = {
      title: title.trim(),
      target: targetNum,
      saved: savedNum,
      date,
      icon: opt.icon,
      color: opt.color,
    }

    if (editing) {
      updateGoal({
        ...editing,
        ...baseData,
      })
    } else {
      addGoal(baseData)
    }
    close()
  }

  function handleDelete() {
    if (editing) {
      deleteGoal(editing.id)
      close()
    }
  }

  return (
    <GlassSheet
      open={isOpen}
      onClose={close}
      title={editing ? 'Editar Meta' : 'Nueva Meta'}
      footer={
        <div className="flex flex-col gap-3 pb-2">
          <GlassButton onClick={save} disabled={!valid}>
            {editing ? 'Guardar Cambios' : 'Crear Meta'}
          </GlassButton>
          {editing && (
            <GlassButton variant="danger" onClick={handleDelete}>
              <Trash2 className="size-4" /> Eliminar Meta
            </GlassButton>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <Field label="Nombre de la Meta">
          <GlassInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Viaje a Cancún, Enganche de Auto..."
            autoFocus={!editing}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Meta de Ahorro">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <GlassInput
                inputMode="decimal"
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </Field>

          <Field label="Monto ya Ahorrado">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <GlassInput
                inputMode="decimal"
                value={savedStr}
                onChange={(e) => setSavedStr(e.target.value)}
                placeholder="0"
                className="pl-7"
              />
            </div>
          </Field>
        </div>

        <Field label="Fecha Límite">
          <GlassInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field label="Icono y Color">
          <div className="flex flex-wrap gap-2 pt-1">
            {goalIconOptions.map((opt, i) => {
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
