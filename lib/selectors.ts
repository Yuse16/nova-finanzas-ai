import type { AppData, Account, Movement } from './types'

// ---- Balance --------------------------------------------------------------

/**
 * Global balance / net worth.
 * Assets (efectivo + débito + ahorro + inversión + dinero por cobrar)
 * minus liabilities (crédito + deudas + dinero prestado).
 * Liability accounts already store a negative balance, so a simple sum works.
 * Outstanding loans (type 'prestamo') count as money to collect (asset),
 * and 'deuda' movements count as money owed (liability).
 */
export function globalBalance(data: AppData): number {
  const accountsNet = data.accounts.reduce((s, a) => s + a.balance, 0)
  return accountsNet
}

export function liquidBalance(data: AppData): number {
  return data.accounts
    .filter((a) => !['credito', 'deudas'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)
}

// ---- Date helpers ---------------------------------------------------------

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isThisWeek(d: Date, now: Date) {
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return d >= start && d <= now
}

function isThisMonth(d: Date, now: Date) {
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isLastMonth(d: Date, now: Date) {
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
}

// ---- Quick stats ----------------------------------------------------------

export type QuickStat = {
  label: string
  value: number
  delta: number
  up: boolean
}

export function quickStats(data: AppData): QuickStat[] {
  const now = new Date()
  const expenses = data.movements.filter((m) => m.type === 'gasto')
  const incomes = data.movements.filter((m) => m.type === 'ingreso')

  const sum = (list: Movement[]) => list.reduce((s, m) => s + m.amount, 0)

  const today = sum(expenses.filter((m) => isSameDay(new Date(m.date), now)))
  const week = sum(expenses.filter((m) => isThisWeek(new Date(m.date), now)))
  const month = sum(expenses.filter((m) => isThisMonth(new Date(m.date), now)))
  const lastMonth = sum(
    expenses.filter((m) => isLastMonth(new Date(m.date), now)),
  )
  const incomeMonth = sum(
    incomes.filter((m) => isThisMonth(new Date(m.date), now)),
  )
  const incomeLastMonth = sum(
    incomes.filter((m) => isLastMonth(new Date(m.date), now)),
  )

  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100)

  const monthDelta = pctChange(month, lastMonth)
  const incomeDelta = pctChange(incomeMonth, incomeLastMonth)

  return [
    { label: 'Gastos hoy', value: today, delta: 0, up: false },
    { label: 'Gastos semana', value: week, delta: 0, up: false },
    {
      label: 'Gastos mes',
      value: month,
      delta: Math.abs(monthDelta),
      up: monthDelta >= 0,
    },
    {
      label: 'Ingresos mes',
      value: incomeMonth,
      delta: Math.abs(incomeDelta),
      up: incomeDelta >= 0,
    },
  ]
}

// ---- Chart (daily expense totals for current month) -----------------------

export function chartData(data: AppData): number[] {
  const now = new Date()
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()
  const totals = new Array(daysInMonth).fill(0)

  for (const m of data.movements) {
    if (m.type !== 'gasto') continue
    const d = new Date(m.date)
    if (isThisMonth(d, now)) {
      totals[d.getDate() - 1] += m.amount
    }
  }
  return totals
}

// ---- Spending breakdown ---------------------------------------------------

export type Breakdown = {
  label: string
  amount: number
  percent: number
  color: string
}

const breakdownColors = [
  'oklch(0.68 0.19 25)',
  'oklch(0.78 0.16 70)',
  'oklch(0.68 0.18 295)',
  'oklch(0.72 0.15 235)',
  'oklch(0.74 0.15 175)',
]

export function spendingBreakdown(data: AppData): Breakdown[] {
  const now = new Date()
  const byCategory = new Map<string, number>()
  for (const m of data.movements) {
    if (m.type !== 'gasto') continue
    if (!isThisMonth(new Date(m.date), now)) continue
    byCategory.set(m.category, (byCategory.get(m.category) ?? 0) + m.amount)
  }
  const total = [...byCategory.values()].reduce((a, b) => a + b, 0)
  return [...byCategory.entries()]
    .map(([label, amount], i) => ({
      label,
      amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
      color: breakdownColors[i % breakdownColors.length],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
}

// ---- Financial health -----------------------------------------------------

export type HealthScore = {
  score: number
  factors: { label: string; value: number }[]
}

export function healthScore(data: AppData): HealthScore {
  const now = new Date()
  const income = data.movements
    .filter((m) => m.type === 'ingreso' && isThisMonth(new Date(m.date), now))
    .reduce((s, m) => s + m.amount, 0)
  const expenses = data.movements
    .filter((m) => m.type === 'gasto' && isThisMonth(new Date(m.date), now))
    .reduce((s, m) => s + m.amount, 0)

  // Savings rate
  const savingsRate = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0

  // Debt level: liabilities vs assets
  const assets = data.accounts
    .filter((a) => !['credito', 'deudas'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const liabilities = Math.abs(
    data.accounts
      .filter((a) => ['credito', 'deudas'].includes(a.type))
      .reduce((s, a) => s + a.balance, 0),
  )
  const debtScore =
    assets + liabilities > 0
      ? Math.max(0, (1 - liabilities / (assets + liabilities)) * 100)
      : 100

  // Spending habits: lower expense/income ratio is better
  const habitsScore = income > 0 ? Math.max(0, Math.min(100, (1 - expenses / income) * 100 + 40)) : 50

  // Emergency fund: savings + investment vs 3 months of expenses
  const fund = data.accounts
    .filter((a) => ['ahorro', 'inversion'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const target = expenses * 3 || 1
  const fundScore = Math.max(0, Math.min(100, (fund / target) * 100))

  const factors = [
    { label: 'Tasa de ahorro', value: Math.round(savingsRate) },
    { label: 'Nivel de deuda', value: Math.round(debtScore) },
    { label: 'Hábitos de gasto', value: Math.round(habitsScore) },
    { label: 'Fondo de emergencia', value: Math.round(fundScore) },
  ]
  const score = Math.round(
    factors.reduce((s, f) => s + f.value, 0) / factors.length,
  )
  return { score, factors }
}

// ---- Poverty Zero (recoverable spending) ----------------------------------

export type PovertyZero = {
  total: number
  items: { label: string; amount: number }[]
}

export function povertyZero(data: AppData): PovertyZero {
  const now = new Date()
  const monthExpenses = data.movements.filter(
    (m) => m.type === 'gasto' && isThisMonth(new Date(m.date), now),
  )

  const items: { label: string; amount: number }[] = []

  // Repeated small recurring expenses by title (likely subscriptions / habits)
  const byTitle = new Map<string, { count: number; amount: number }>()
  for (const m of monthExpenses) {
    const key = m.title.toLowerCase()
    const cur = byTitle.get(key) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += m.amount
    byTitle.set(key, cur)
  }
  for (const [title, info] of byTitle) {
    if (info.count >= 3) {
      // Recoverable: assume 30% of repeated habitual spend can be trimmed
      items.push({
        label: `Gasto repetido: ${title} (${info.count}x)`,
        amount: Math.round(info.amount * 0.3),
      })
    }
  }

  // Entertainment subscriptions
  const entertainment = monthExpenses
    .filter((m) => m.category === 'Entretenimiento')
    .reduce((s, m) => s + m.amount, 0)
  if (entertainment > 0) {
    items.push({
      label: 'Suscripciones de entretenimiento',
      amount: Math.round(entertainment * 0.5),
    })
  }

  // Coffee / ant expenses
  const coffee = monthExpenses
    .filter((m) => m.category === 'Café')
    .reduce((s, m) => s + m.amount, 0)
  if (coffee > 0) {
    items.push({
      label: 'Café fuera de casa',
      amount: Math.round(coffee * 0.6),
    })
  }

  const total = items.reduce((s, i) => s + i.amount, 0)
  return { total, items: items.slice(0, 5) }
}

// ---- Smart insights -------------------------------------------------------

export type Insight = {
  id: string
  text: string
  tone: 'warn' | 'good' | 'info'
}

export function insights(data: AppData): Insight[] {
  const now = new Date()
  const out: Insight[] = []
  const expensesMonth = data.movements.filter(
    (m) => m.type === 'gasto' && isThisMonth(new Date(m.date), now),
  )
  const expensesLast = data.movements.filter(
    (m) => m.type === 'gasto' && isLastMonth(new Date(m.date), now),
  )
  const sum = (list: Movement[]) => list.reduce((s, m) => s + m.amount, 0)
  const totalMonth = sum(expensesMonth)
  const totalLast = sum(expensesLast)

  if (totalLast > 0) {
    const change = Math.round(((totalMonth - totalLast) / totalLast) * 100)
    if (change > 5)
      out.push({
        id: 'i-trend',
        text: `Has gastado ${change}% más que el mes pasado.`,
        tone: 'warn',
      })
    else if (change < -5)
      out.push({
        id: 'i-trend',
        text: `Has gastado ${Math.abs(change)}% menos que el mes pasado. ¡Bien!`,
        tone: 'good',
      })
  }

  const breakdown = spendingBreakdown(data)
  if (breakdown[0]) {
    out.push({
      id: 'i-top',
      text: `Tu gasto más alto este mes es ${breakdown[0].label} (${fmtMoney(breakdown[0].amount)}).`,
      tone: 'info',
    })
  }

  const pz = povertyZero(data)
  if (pz.total > 0) {
    out.push({
      id: 'i-pz',
      text: `Podrías recuperar ${fmtMoney(pz.total)} este mes ajustando gastos.`,
      tone: 'good',
    })
  }

  const upcoming = data.reminders.filter(
    (r) => !r.completed && new Date(r.dueDate) >= now,
  )
  if (upcoming.length > 0) {
    const totalDue = upcoming.reduce((s, r) => s + r.amount, 0)
    out.push({
      id: 'i-rem',
      text: `Tienes ${upcoming.length} pagos próximos por ${fmtMoney(totalDue)}.`,
      tone: 'info',
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'i-empty',
      text: 'Registra tus primeros movimientos para recibir análisis personalizados.',
      tone: 'info',
    })
  }
  return out
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n)
}

// ---- Movement display helpers --------------------------------------------

/** Signed amount for display: expenses/loans negative, income/collected positive. */
export function signedAmount(m: Movement): number {
  if (m.type === 'ingreso') return m.amount
  return -m.amount
}
