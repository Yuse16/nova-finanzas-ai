import type { Reminder } from './types'

export function nextDueDate(reminder: Reminder): Date {
  const due = new Date(reminder.dueDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reminder.recurring === 'none') return due

  if (reminder.recurring === 'monthly') {
    const targetDay = due.getDate()
    const y = today.getFullYear()
    const m = today.getMonth()

    let candidate = new Date(y, m, targetDay)
    if (candidate.getDate() !== targetDay)
      candidate = new Date(y, m + 1, 0)

    if (candidate < today) {
      candidate = new Date(y, m + 1, targetDay)
      if (candidate.getDate() !== targetDay)
        candidate = new Date(y, m + 2, 0)
    }

    return candidate
  }

  if (reminder.recurring === 'yearly') {
    const targetMonth = due.getMonth()
    const targetDay = due.getDate()
    const y = today.getFullYear()

    let candidate = new Date(y, targetMonth, targetDay)
    if (candidate.getDate() !== targetDay)
      candidate = new Date(y, targetMonth + 1, 0)

    if (candidate < today) {
      candidate = new Date(y + 1, targetMonth, targetDay)
      if (candidate.getDate() !== targetDay)
        candidate = new Date(y + 1, targetMonth + 1, 0)
    }

    return candidate
  }

  if (reminder.recurring === 'weekly') {
    const targetDow = due.getDay()
    const diff = targetDow - today.getDay()
    if (diff <= 0) return new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff + 7)
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff)
  }

  return due
}

export function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function predictiveMessages(reminders: Reminder[], userName?: string): string[] {
  const messages: { text: string; days: number }[] = []

  for (const r of reminders) {
    if (r.completed) continue
    const next = nextDueDate(r)
    const days = daysUntil(next)
    if (days < 0) continue

    let text = ''
    if (days === 0) {
      text = `Hoy vence ${r.title} ($${r.amount})`
    } else if (days <= 5) {
      const prefix = userName ? `${userName}, ` : ''
      text = `${prefix}en ${days} días vence ${r.title} ($${r.amount})`
    }

    if (text) messages.push({ text, days })
  }

  return messages.sort((a, b) => a.days - b.days).map((m) => m.text)
}

export function urgentReminders(reminders: Reminder[]): Reminder[] {
  return reminders
    .filter((r) => {
      if (r.completed) return false
      const days = daysUntil(nextDueDate(r))
      return days >= 0 && days <= 5
    })
    .sort((a, b) => daysUntil(nextDueDate(a)) - daysUntil(nextDueDate(b)))
}
