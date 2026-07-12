/**
 * Stability Engine — Motor determinista de estabilidad financiera.
 *
 * Funciones puras que reciben datos reales (accounts, movements, reminders)
 * y devuelven el snapshot completo de estabilidad. Sin llamadas a IA.
 * Todo campo que no se pueda calcular con datos reales queda en null,
 * documentando la razón en el código.
 */

import type { Account, Movement, Reminder, StabilitySnapshot, StabilityStatus, DeficitRisk } from './types'
import { uid } from './format'

// ---- Configuración exportada para ajustar después --------------------------

/**
 * Categorías consideradas "gastos esenciales".
 * Se usa para separar essentialExpenses de variableExpenses.
 * Exportado para que Fase 5.2 pueda permitir al usuario ajustarlo.
 */
export const ESSENTIAL_CATEGORIES = ['Casa', 'Servicios', 'Salud', 'Transporte']

// ---- Helpers de fecha (sin dependencias externas) --------------------------

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function isAfter(date: Date, reference: Date): boolean {
  return date.getTime() >= reference.getTime()
}

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date(0) : d
}

function isThisMonth(d: Date): boolean {
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function startOfDay(d: Date): Date {
  const clone = new Date(d)
  clone.setHours(0, 0, 0, 0)
  return clone
}

// ---- Cálculos auxiliares ---------------------------------------------------

function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((acc, item) => acc + item.amount, 0)
}

function getLast3MonthsIncomeAvg(movements: Movement[]): number | null {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const incomes = movements.filter(
    (m) => m.type === 'ingreso' && parseDate(m.date) >= threeMonthsAgo,
  )
  if (incomes.length === 0) return null
  return sumAmounts(incomes) / incomes.length
}

function getConfirmedIncomeThisMonth(movements: Movement[]): number | null {
  const incomes = movements.filter(
    (m) => m.type === 'ingreso' && isThisMonth(parseDate(m.date)),
  )
  if (incomes.length === 0) return null
  return sumAmounts(incomes)
}

function getExpensesByCategories(
  movements: Movement[],
  categories: string[],
): Movement[] {
  return movements.filter((m) => m.type === 'gasto' && categories.includes(m.category))
}

function getUpcomingCommitments(reminders: Reminder[]): number | null {
  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = reminders.filter(
    (r) =>
      !r.completed &&
      parseDate(r.dueDate) >= now &&
      parseDate(r.dueDate) <= sevenDays,
  )
  if (upcoming.length === 0) return null
  return sumAmounts(upcoming)
}

function getOverduePayments(reminders: Reminder[]): number | null {
  const now = new Date()
  const overdue = reminders.filter(
    (r) => !r.completed && parseDate(r.dueDate) < now,
  )
  if (overdue.length === 0) return null
  return sumAmounts(overdue)
}

function sumBalances(items: { balance: number }[]): number {
  return items.reduce((acc, item) => acc + item.balance, 0)
}

function getTotalDebt(accounts: Account[]): number | null {
  const debts = accounts.filter((a) => a.isLiability)
  if (debts.length === 0) return null
  return Math.abs(sumBalances(debts))
}

function getMinDebtPayment(
  accounts: Account[],
  reminders: Reminder[],
): number | null {
  const debtAccounts = accounts.filter((a) => a.isLiability)
  if (debtAccounts.length === 0) return null

  // Buscar reminders que podrian estar ligados a deudas por nombre
  const debtNames = new Set(debtAccounts.map((a) => a.name.toLowerCase()))
  const matchingReminders = reminders.filter((r) => {
    const title = r.title.toLowerCase()
    for (const name of debtNames) {
      if (title.includes(name) || name.includes(title)) return true
    }
    return false
  })

  if (matchingReminders.length === 0) return null
  return sumAmounts(matchingReminders)
}

function getFlow(
  movements: Movement[],
  days: number,
): number | null {
  const cutoff = daysAgo(days)
  const relevant = movements.filter((m) => parseDate(m.date) >= cutoff)
  if (relevant.length === 0) return null
  const income = sumAmounts(relevant.filter((m) => m.type === 'ingreso'))
  const expense = sumAmounts(
    relevant.filter((m) => m.type === 'gasto' || m.type === 'deuda' || m.type === 'prestamo'),
  )
  return income - expense
}

function getLiquidBalance(accounts: Account[]): number | null {
  const liquid = accounts.filter((a) => !a.isLiability)
  if (liquid.length === 0) return null
  return sumBalances(liquid)
}

function getDailyAverageExpense(
  movements: Movement[],
  categories: string[],
  lookbackDays: number,
): number | null {
  const cutoff = daysAgo(lookbackDays)
  const relevant = movements.filter(
    (m) => m.type === 'gasto' && categories.includes(m.category) && parseDate(m.date) >= cutoff,
  )
  if (relevant.length === 0) return null
  const total = sumAmounts(relevant)
  // Usar el minimo entre lookbackDays y los días reales desde el movimiento mas antiguo
  const oldest = relevant.reduce(
    (min, m) => Math.min(min, parseDate(m.date).getTime()),
    Infinity,
  )
  const actualDays = Math.max(1, daysBetween(new Date(oldest), new Date()))
  return total / Math.min(lookbackDays, actualDays)
}

// ---- Clasificador de estado ------------------------------------------------

function classifyStatus(
  realAvailableMoney: number | null,
  upcomingCommitments: number | null,
  weeklyFlow: number | null,
  coverageDays: number | null,
  overduePayments: number | null,
  emergencyMargin: number | null,
): StabilityStatus {
  const isCritical =
    realAvailableMoney !== null &&
    upcomingCommitments !== null &&
    realAvailableMoney < upcomingCommitments &&
    weeklyFlow !== null &&
    weeklyFlow < 0 &&
    overduePayments !== null &&
    overduePayments > 0

  if (isCritical) return 'critical'

  if (coverageDays !== null && coverageDays < 14) return 'unstable'

  // Stable by coverage (sin emergencyMargin configurado aún — Fase 5.2)
  if (
    coverageDays !== null &&
    coverageDays >= 14 &&
    realAvailableMoney !== null &&
    realAvailableMoney >= 0
  ) {
    return 'stable'
  }

  // Stable by full criteria (requiere emergencyMargin > 0, Fase 5.2)
  if (
    upcomingCommitments !== null &&
    realAvailableMoney !== null &&
    realAvailableMoney >= upcomingCommitments &&
    weeklyFlow !== null &&
    weeklyFlow > 0 &&
    emergencyMargin !== null &&
    emergencyMargin > 0
  ) {
    return 'stable'
  }

  return 'recovering'
}

// ---- Función principal -----------------------------------------------------

export function computeStabilitySnapshot(
  accounts: Account[],
  movements: Movement[],
  reminders: Reminder[],
  userId: string = '',
  userReservedMoney: number = 0,
  userEmergencyMargin: number = 0,
): StabilitySnapshot {
  const computedAt = Date.now()

  // 1. Ingresos
  const avgIncome = getLast3MonthsIncomeAvg(movements)
  const confirmedIncome = getConfirmedIncomeThisMonth(movements)

  // 2. Gastos
  const essentialMvts = getExpensesByCategories(movements, ESSENTIAL_CATEGORIES)
  const essentialExpenses = essentialMvts.length > 0 ? sumAmounts(essentialMvts) : null

  const variableMvts = getExpensesByCategories(
    movements,
    // todas las categorías de gasto que no son esenciales
    movements
      .filter((m) => m.type === 'gasto')
      .map((m) => m.category)
      .filter((c, i, arr) => arr.indexOf(c) === i && !ESSENTIAL_CATEGORIES.includes(c)),
  )
  const variableExpenses = variableMvts.length > 0 ? sumAmounts(variableMvts) : null

  // 3. Compromisos
  const upcomingCommitments = getUpcomingCommitments(reminders)
  const overduePayments = getOverduePayments(reminders)

  // 4. Deuda
  const totalDebt = getTotalDebt(accounts)
  const minDebtPayment = getMinDebtPayment(accounts, reminders)

  // 5. Flujo
  const weeklyFlow = getFlow(movements, 7)
  const monthlyFlow = getFlow(movements, 30)

  // 6. Dinero disponible
  const liquidBalance = getLiquidBalance(accounts)
  const reservedMoney = userReservedMoney
  const emergencyMargin = userEmergencyMargin

  const realAvailableMoney =
    liquidBalance !== null
      ? liquidBalance - reservedMoney - (upcomingCommitments ?? 0) - emergencyMargin
      : null

  // 7. Días de cobertura
  const dailyEssentialAvg = getDailyAverageExpense(movements, ESSENTIAL_CATEGORIES, 90)
  const dailyVariableAvg = getDailyAverageExpense(
    movements,
    movements
      .filter((m) => m.type === 'gasto')
      .map((m) => m.category)
      .filter((c, i, arr) => arr.indexOf(c) === i && !ESSENTIAL_CATEGORIES.includes(c)),
    90,
  )
  const dailySpend =
    dailyEssentialAvg !== null && dailyVariableAvg !== null
      ? dailyEssentialAvg + dailyVariableAvg
      : dailyEssentialAvg ?? dailyVariableAvg ?? null

  const coverageDays =
    realAvailableMoney !== null && dailySpend !== null && dailySpend > 0
      ? realAvailableMoney / dailySpend
      : null

  // 8. Riesgo
  let deficitRisk: DeficitRisk = 'low'
  if (realAvailableMoney !== null && upcomingCommitments !== null && realAvailableMoney < upcomingCommitments) {
    deficitRisk = 'high'
  } else if (coverageDays !== null && coverageDays < 7) {
    deficitRisk = 'medium'
  }

  // 9. Capacidad de pago y ahorro
  const paymentCapacity =
    monthlyFlow !== null && essentialExpenses !== null
      ? Math.max(0, monthlyFlow - essentialExpenses)
      : null

  const savingsCapacity =
    paymentCapacity !== null
      ? paymentCapacity - (minDebtPayment ?? 0)
      : null

  // 10. Estado general
  const status = classifyStatus(
    realAvailableMoney,
    upcomingCommitments,
    weeklyFlow,
    coverageDays,
    overduePayments,
    emergencyMargin,
  )

  return {
    id: uid('ss'),
    userId,
    computedAt,
    avgIncome,
    confirmedIncome,
    essentialExpenses,
    variableExpenses,
    upcomingCommitments,
    overduePayments,
    totalDebt,
    minDebtPayment,
    weeklyFlow,
    monthlyFlow,
    realAvailableMoney,
    reservedMoney,
    emergencyMargin,
    coverageDays,
    deficitRisk,
    paymentCapacity,
    savingsCapacity,
    recoveryProgress: null,
    status,
  }
}
