import type { AppData, Notification } from './types'
import { fmtShort } from './format'
import { isAccountLiability } from './catalog'

const STORAGE_KEY = 'nova-finanzas:notifications'

export function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveNotifications(ns: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ns))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nova-notifications-changed'))
  }
}

export function markAsRead(id: string) {
  const ns = loadNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n,
  )
  saveNotifications(ns)
}

export function markAllRead() {
  const ns = loadNotifications().map((n) => ({ ...n, read: true }))
  saveNotifications(ns)
}

export function deleteNotification(id: string) {
  const ns = loadNotifications().filter((n) => n.id !== id)
  saveNotifications(ns)
}

function daysUntil(targetDay: number): number {
  const now = new Date()
  const today = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  let diff = targetDay - today
  if (diff < 0) diff += daysInMonth
  return diff
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function weekRange(weekStart: Date): { start: Date; end: Date } {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start: weekStart, end }
}

export function generateNotifications(data: AppData): Notification[] {
  const existing = loadNotifications()
  const existingIds = new Set(existing.map((n) => n.id))
  const now = Date.now()
  const today = new Date()
  const newNotifs: Notification[] = []

  // -- Calendar reminders --
  for (const rem of data.reminders) {
    if (rem.completed) continue
    const due = new Date(rem.dueDate)
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 0) {
      const id = `rem_${rem.id}_today`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: rem.title,
          message: `${rem.title} vence hoy.`,
          type: 'recordatorio',
          date: now,
          read: false,
          priority: 'alta',
        })
      }
    } else if (diffDays === 1) {
      const id = `rem_${rem.id}_tomorrow`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: rem.title,
          message: `${rem.title} vence mañana.`,
          type: 'recordatorio',
          date: now,
          read: false,
          priority: 'alta',
        })
      }
    } else if (diffDays >= 2 && diffDays <= 3) {
      const id = `rem_${rem.id}_${diffDays}d`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: rem.title,
          message: `${rem.title} vence en ${diffDays} días.`,
          type: 'recordatorio',
          date: now,
          read: false,
          priority: 'media',
        })
      }
    } else if (diffDays >= 4 && diffDays <= 7) {
      const id = `rem_${rem.id}_week`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: rem.title,
          message: `${rem.title} vence esta semana.`,
          type: 'recordatorio',
          date: now,
          read: false,
          priority: 'baja',
        })
      }
    }
  }

  // -- Credit card notifications --
  for (const acc of data.accounts) {
    if (acc.type !== 'credito' || !acc.bank) continue
    const bank = acc.bank
    const label = acc.identifier ? `${bank} (${acc.identifier})` : bank

    // Fecha de corte
    if (acc.fechaCorte != null) {
      const corteDiff = daysUntil(acc.fechaCorte)

      if (corteDiff === 7) {
        const id = `card_${acc.id}_corte_7`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Corte ${label}`,
            message: `Tu tarjeta ${label} corta en 7 días.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'baja',
          })
        }
      }
      if (corteDiff === 3) {
        const id = `card_${acc.id}_corte_3`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Corte ${label}`,
            message: `Tu tarjeta ${label} corta en 3 días.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'media',
          })
        }
      }
      if (corteDiff === 0) {
        const id = `card_${acc.id}_corte_0`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Corte ${label}`,
            message: `Hoy es fecha de corte de ${label}.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'alta',
          })
        }
      }
    }

    // Fecha de pago
    if (acc.fechaPago != null) {
      const pagoDiff = daysUntil(acc.fechaPago)

      if (pagoDiff === 5) {
        const id = `card_${acc.id}_pago_5`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Pago ${label}`,
            message: `Tu tarjeta ${label} vence en 5 días.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'baja',
          })
        }
      }
      if (pagoDiff === 3) {
        const id = `card_${acc.id}_pago_3`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Pago ${label}`,
            message: `Tu tarjeta ${label} vence en 3 días.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'media',
          })
        }
      }
      if (pagoDiff === 0) {
        const id = `card_${acc.id}_pago_0`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Pago ${label}`,
            message: `Hoy vence tu tarjeta ${label}.`,
            type: 'tarjeta',
            date: now,
            read: false,
            priority: 'alta',
          })
        }
      }
    }
  }

  // -- Goal notifications --
  for (const goal of data.goals) {
    const pct = (goal.saved / goal.target) * 100
    if (pct >= 100) {
      const id = `goal_${goal.id}_100`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: `Meta cumplida`,
          message: `¡Alcanzaste tu meta ${goal.title}!`,
          type: 'meta',
          date: now,
          read: false,
          priority: 'alta',
        })
      }
    } else if (pct >= 75) {
      const id = `goal_${goal.id}_75`
      if (!existingIds.has(id)) {
        const falta = goal.target - goal.saved
        newNotifs.push({
          id,
          title: `Meta ${goal.title}`,
          message: `Te faltan ${fmtShort(falta)} para tu meta ${goal.title}.`,
          type: 'meta',
          date: now,
          read: false,
          priority: 'media',
        })
      }
    } else if (pct >= 50) {
      const id = `goal_${goal.id}_50`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: `Meta ${goal.title}`,
          message: `Alcanzaste 50% de tu meta ${goal.title}.`,
          type: 'meta',
          date: now,
          read: false,
          priority: 'media',
        })
      }
    } else if (pct >= 25) {
      const id = `goal_${goal.id}_25`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: `Meta ${goal.title}`,
          message: `Alcanzaste 25% de tu meta ${goal.title}.`,
          type: 'meta',
          date: now,
          read: false,
          priority: 'baja',
        })
      }
    }
  }

  // -- Spending alerts --
  const thisWeekStart = getMonday(today)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeekRange = weekRange(thisWeekStart)
  const lastWeekRange = weekRange(lastWeekStart)

  const movementsThisWeek = data.movements.filter((m) => {
    const d = new Date(m.date)
    return (
      m.type === 'gasto' &&
      d >= thisWeekRange.start &&
      d <= thisWeekRange.end
    )
  })

  const movementsLastWeek = data.movements.filter((m) => {
    const d = new Date(m.date)
    return (
      m.type === 'gasto' &&
      d >= lastWeekRange.start &&
      d <= lastWeekRange.end
    )
  })

  const categoryMap = new Map<string, { thisWeek: number; lastWeek: number }>()
  for (const m of movementsThisWeek) {
    const entry = categoryMap.get(m.category) || { thisWeek: 0, lastWeek: 0 }
    entry.thisWeek += m.amount
    categoryMap.set(m.category, entry)
  }
  for (const m of movementsLastWeek) {
    const entry = categoryMap.get(m.category) || { thisWeek: 0, lastWeek: 0 }
    entry.lastWeek += m.amount
    categoryMap.set(m.category, entry)
  }

  for (const [category, amounts] of categoryMap) {
    if (amounts.thisWeek > 0 && amounts.lastWeek > 0) {
      const increase = ((amounts.thisWeek - amounts.lastWeek) / amounts.lastWeek) * 100
      if (increase >= 30) {
        const id = `spend_${category}_${Math.floor(thisWeekStart.getTime() / 86400000)}`
        if (!existingIds.has(id)) {
          newNotifs.push({
            id,
            title: `Gasto en ${category}`,
            message: `${category} aumentó ${Math.round(increase)}% respecto a la semana pasada.`,
            type: 'gasto',
            date: now,
            read: false,
            priority: 'media',
          })
        }
      }
    } else if (amounts.thisWeek > 0 && amounts.lastWeek === 0) {
      const id = `spend_${category}_new_${Math.floor(thisWeekStart.getTime() / 86400000)}`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: `Gasto en ${category}`,
          message: `Esta semana has gastado ${fmtShort(amounts.thisWeek)} en ${category}.`,
          type: 'gasto',
          date: now,
          read: false,
          priority: 'media',
        })
      }
    }
  }

  // -- Balance burn rate --
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentExpenses = data.movements.filter((m) => {
    const d = new Date(m.date)
    return m.type === 'gasto' && d >= thirtyDaysAgo && d <= today
  })

  if (recentExpenses.length >= 5) {
    const totalSpent = recentExpenses.reduce((s, m) => s + m.amount, 0)
    const dailyBurn = totalSpent / 30

    const availableBalance = data.accounts
      .filter((a) => !isAccountLiability(a))
      .reduce((s, a) => s + a.balance, 0)

    if (dailyBurn > 0 && availableBalance / dailyBurn < 7) {
      const daysLeft = Math.floor(availableBalance / dailyBurn)
      const id = `balance_burn_${Math.floor(today.getTime() / 86400000)}`
      if (!existingIds.has(id)) {
        newNotifs.push({
          id,
          title: 'Alerta de saldo',
          message: daysLeft <= 1
            ? 'Tu efectivo disponible podría agotarse hoy.'
            : `Tu efectivo disponible podría agotarse en menos de ${daysLeft} días.`,
          type: 'saldo',
          date: now,
          read: false,
          priority: 'alta',
        })
      }
    }
  }

  // Merge: keep existing read status for matching IDs, add new ones
  const existingMap = new Map(existing.map((n) => [n.id, n]))
  const merged = newNotifs.map((n) => {
    const prev = existingMap.get(n.id)
    if (prev) return { ...n, read: prev.read }
    return n
  })

  return merged
}


