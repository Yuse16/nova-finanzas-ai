'use client'

import { Bell, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from './glass-card'
import { user, fmt, fmtShort } from '@/lib/data'

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Hola, {user.name} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Así van tus finanzas hoy
          </p>
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          className="glass relative grid size-12 shrink-0 place-items-center rounded-2xl active:scale-95 transition-transform"
        >
          <Bell className="size-5" />
          <span className="absolute right-3 top-3 size-2 rounded-full bg-[var(--positive)]" />
        </button>
      </div>

      <GlassCard
        variant="strong"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dinero disponible</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
              {fmt(user.available)}
            </p>
          </div>
          <div className="glass-subtle grid size-14 place-items-center rounded-2xl">
            <Layers className="size-6" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
          <span className="text-sm text-muted-foreground">Balance general</span>
          <span className="text-sm font-medium text-[var(--positive)] tabular-nums">
            + {fmtShort(user.balanceChange)}
          </span>
        </div>
      </GlassCard>
    </div>
  )
}
