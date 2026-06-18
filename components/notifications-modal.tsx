'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck, AlertTriangle, TrendingUp, CreditCard, Target, DollarSign, Zap, X } from 'lucide-react'
import { useUI } from '@/lib/ui-context'
import { GlassSheet } from './ui/glass-sheet'
import {
  loadNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from '@/lib/notifications'
import type { Notification } from '@/lib/types'

const typeConfig: Record<Notification['type'], { icon: typeof Bell; label: string; color: string }> = {
  recordatorio: { icon: Zap, label: 'Recordatorio', color: 'oklch(0.72 0.15 235)' },
  tarjeta: { icon: CreditCard, label: 'Tarjeta', color: 'oklch(0.68 0.18 295)' },
  meta: { icon: Target, label: 'Meta', color: 'oklch(0.78 0.16 120)' },
  gasto: { icon: TrendingUp, label: 'Gasto', color: 'oklch(0.68 0.19 25)' },
  saldo: { icon: DollarSign, label: 'Saldo', color: 'oklch(0.72 0.16 150)' },
  ia: { icon: AlertTriangle, label: 'IA', color: 'oklch(0.7 0.16 255)' },
}

const priorityColors: Record<Notification['priority'], string> = {
  alta: 'oklch(0.7 0.2 18)',
  media: 'oklch(0.78 0.16 70)',
  baja: 'oklch(0.72 0.15 235)',
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60))
  if (diff < 1) return 'ahora'
  if (diff < 60) return `hace ${diff}m`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export function NotificationsModal() {
  const { modal, close } = useUI()
  const isOpen = modal.kind === 'notifications'
  const [notifs, setNotifs] = useState<Notification[]>([])

  useEffect(() => {
    if (!isOpen) return
    setNotifs(loadNotifications())

    const handler = () => setNotifs(loadNotifications())
    window.addEventListener('nova-notifications-changed', handler)
    return () => window.removeEventListener('nova-notifications-changed', handler)
  }, [isOpen])

  const unreadNotifs = notifs.filter((n) => !n.read)
  const readNotifs = notifs.filter((n) => n.read)

  return (
    <GlassSheet open={isOpen} onClose={close} title="Notificaciones">
      <div className="flex flex-col pb-4">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="size-10 text-white/20" />
            <p className="text-base text-muted-foreground">No hay notificaciones</p>
          </div>
        ) : (
          <>
            {unreadNotifs.length > 0 && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  No leídas ({unreadNotifs.length})
                </span>
                <button
                  type="button"
                  onClick={() => { markAllRead(); setNotifs(loadNotifications()) }}
                  className="flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white"
                >
                  <CheckCheck className="size-3.5" /> Marcar todas leídas
                </button>
              </div>
            )}

            <ul className="flex flex-col gap-2">
              {[...unreadNotifs, ...readNotifs].map((n) => {
                const cfg = typeConfig[n.type]
                const Icon = cfg.icon
                return (
                  <li
                    key={n.id}
                    className={`group relative rounded-2xl transition-colors ${
                      n.read ? 'opacity-50' : 'glass'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => { markAsRead(n.id); setNotifs(loadNotifications()) }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{ background: cfg.color }}
                      >
                        <Icon className="size-4 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{n.title}</span>
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ background: priorityColors[n.priority] }}
                          />
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                          {n.message}
                        </p>
                        <span className="mt-1 block text-[11px] text-white/30">
                          {formatDate(n.date)}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteNotification(n.id); setNotifs(loadNotifications()) }}
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-white/20 opacity-0 transition-opacity hover:text-white/60 group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </GlassSheet>
  )
}
