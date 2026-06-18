'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function GlassInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'glass-subtle w-full rounded-2xl px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-[var(--ring)]',
        className,
      )}
      {...props}
    />
  )
}

export function GlassButton({
  children,
  variant = 'primary',
  className,
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
} & InputHTMLAttributes<HTMLButtonElement> &
  React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
  const styles =
    variant === 'primary'
      ? 'text-white'
      : variant === 'danger'
        ? 'text-white'
        : 'glass-subtle text-foreground'
  const bgStyle = variant === 'primary'
    ? { background: 'var(--primary-btn-bg)', boxShadow: 'var(--primary-btn-shadow)' }
    : variant === 'danger'
      ? { background: 'var(--danger-btn-bg)' }
      : undefined
  return (
    <button className={cn(base, styles, className)} style={bgStyle} {...props}>
      {children}
    </button>
  )
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; color?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-white/85 text-[oklch(0.45_0.1_255)]'
                : 'glass-subtle text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
