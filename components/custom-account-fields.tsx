'use client'

import { Check } from 'lucide-react'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Field } from './ui/form-controls'

export const ICON_KEYS = [
  'wallet', 'banknote', 'piggy-bank', 'landmark',
  'building', 'briefcase', 'home', 'car',
  'plane', 'heart', 'gift', 'coffee',
  'target', 'smartphone', 'credit-card', 'trending-up',
  'hand-coins', 'dollar',
]

export const COLOR_OPTIONS = [
  'oklch(0.72 0.16 150)',
  'oklch(0.72 0.15 235)',
  'oklch(0.68 0.18 295)',
  'oklch(0.78 0.16 70)',
  'oklch(0.74 0.15 175)',
  'oklch(0.68 0.19 25)',
  'oklch(0.82 0.16 90)',
  'oklch(0.7 0.18 290)',
  'oklch(0.7 0.16 255)',
  'oklch(0.82 0.17 155)',
]

type CustomAccountFieldsProps = {
  selectedIcon: string
  onIconChange: (key: string) => void
  selectedColor: string
  onColorChange: (color: string) => void
  isLiability: boolean
  onLiabilityChange: (v: boolean) => void
}

export function CustomAccountFields({
  selectedIcon,
  onIconChange,
  selectedColor,
  onColorChange,
  isLiability,
  onLiabilityChange,
}: CustomAccountFieldsProps) {
  return (
    <>
      <Field label="Icono">
        <div className="grid grid-cols-4 gap-2">
          {ICON_KEYS.map((key) => {
            const Icon = getIcon(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => onIconChange(key)}
                className={cn(
                  'flex items-center justify-center rounded-2xl p-3 transition-all',
                  selectedIcon === key
                    ? 'glass-strong ring-2 ring-white/50 scale-105'
                    : 'glass-subtle text-white/70',
                )}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={cn(
                'flex items-center justify-center rounded-full transition-all',
                selectedColor === c
                  ? 'size-9 ring-2 ring-white scale-110'
                  : 'size-8',
              )}
              style={{ background: c }}
            >
              {selectedColor === c && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>
      </Field>

      <Field label="¿Esta cuenta cuenta como dinero disponible o como deuda?">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onLiabilityChange(false)}
            className={cn(
              'flex-1 rounded-2xl p-3 text-sm font-semibold transition-all',
              !isLiability
                ? 'bg-[oklch(0.72_0.16_150)] text-white shadow-[0_4px_12px_-4px_oklch(0.72_0.16_150/40%)]'
                : 'glass-subtle text-white/70',
            )}
          >
            Dinero disponible
          </button>
          <button
            type="button"
            onClick={() => onLiabilityChange(true)}
            className={cn(
              'flex-1 rounded-2xl p-3 text-sm font-semibold transition-all',
              isLiability
                ? 'bg-[oklch(0.68_0.19_25)] text-white shadow-[0_4px_12px_-4px_oklch(0.68_0.19_25/40%)]'
                : 'glass-subtle text-white/70',
            )}
          >
            Deuda
          </button>
        </div>
      </Field>
    </>
  )
}
