/**
 * Recovery Engine — Generación determinista de Planes de Recuperación.
 *
 * Toma accounts, movements, reminders, goals y el último StabilitySnapshot
 * y produce un RecoveryPlan versionado con diagnóstico, metas semanales
 * y acciones concretas. Sin llamadas a IA.
 */

import type { Account, Movement, Reminder, Goal, StabilitySnapshot, RecoveryPlan, WeeklyAction } from './types'
import { uid } from './format'

// ---- Constantes -----------------------------------------------------------

const TRIGGER_EVENTS = [
  'income_change',
  'major_expense',
  'debt_payment',
  'missed_payment',
  'new_commitment',
  'goal_change',
] as const

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]

// ---- Generación de diagnóstico ---------------------------------------------

function generateDiagnosis(snapshot: StabilitySnapshot): string {
  const parts: string[] = []

  if (snapshot.deficitRisk === 'high') {
    parts.push('Tu dinero disponible no cubre los compromisos próximos.')
  }
  if (snapshot.overduePayments && snapshot.overduePayments > 0) {
    parts.push(`Tienes ${snapshot.overduePayments.toFixed(0)} MXN en pagos vencidos.`)
  }
  if (snapshot.totalDebt && snapshot.totalDebt > 0) {
    parts.push(`Tu deuda total es de ${snapshot.totalDebt.toFixed(0)} MXN.`)
  }
  if (snapshot.coverageDays !== null) {
    if (snapshot.coverageDays < 7) {
      parts.push(`Tu dinero alcanza solo para ${snapshot.coverageDays.toFixed(1)} días de gasto.`)
    } else if (snapshot.coverageDays < 30) {
      parts.push(`Tu dinero alcanza para ${snapshot.coverageDays.toFixed(1)} días de gasto.`)
    }
  }
  if (snapshot.savingsCapacity !== null && snapshot.savingsCapacity <= 0) {
    parts.push('No tienes capacidad de ahorro después de cubrir gastos esenciales y deuda mínima.')
  }
  if (snapshot.weeklyFlow !== null && snapshot.weeklyFlow < 0) {
    parts.push('Tu flujo semanal es negativo — gastas más de lo que ingresas.')
  }

  if (parts.length === 0) {
    return 'Tus finanzas están estables. El plan de recuperación se enfoca en fortalecer tu margen de emergencia y aumentar ahorro.'
  }

  return parts.join(' ')
}

// ---- Cálculo de metas ------------------------------------------------------

function getEssentialExpenses(
  snapshot: StabilitySnapshot,
): number | null {
  return snapshot.essentialExpenses
}

function getDebtPaymentTarget(
  snapshot: StabilitySnapshot,
  movements: Movement[],
): number | null {
  // Target = min debt payment + 10% of total debt as extra, or null if no debt
  if (!snapshot.totalDebt || snapshot.totalDebt <= 0) return null
  const base = snapshot.minDebtPayment ?? 0
  const extra = snapshot.totalDebt * 0.1
  return base + extra
}

function getDiscretionaryLimit(
  snapshot: StabilitySnapshot,
  essentialExpenses: number | null,
): number | null {
  if (snapshot.monthlyFlow === null) return null
  if (essentialExpenses === null) return snapshot.monthlyFlow * 0.2
  const afterEssentials = snapshot.monthlyFlow - essentialExpenses
  if (afterEssentials <= 0) return 0
  return afterEssentials * 0.3 // 30% of what's left after essentials
}

// ---- Generación de acciones semanales ---------------------------------------

function generateWeeklyActions(
  snapshot: StabilitySnapshot,
  goals: Goal[],
  debtPaymentTarget: number | null,
  discretionaryLimit: number | null,
): WeeklyAction[] {
  const actions: WeeklyAction[] = []
  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

  // Track how much we've assigned
  let dayIndex = 0
  const assign = (action: string, amount: number, category: WeeklyAction['category']) => {
    if (dayIndex >= days.length) return
    actions.push({ day: days[dayIndex], action, amount, category })
    dayIndex++
  }

  // Essential expense tracking (always day 1)
  if (snapshot.essentialExpenses && snapshot.essentialExpenses > 0) {
    const weeklyEssential = snapshot.essentialExpenses / 4
    assign(
      `Registrar gastos esenciales de la semana (meta: ${weeklyEssential.toFixed(0)} MXN)`,
      0,
      'essential',
    )
  }

  // Debt payment
  if (debtPaymentTarget && debtPaymentTarget > 0) {
    const weeklyDebt = debtPaymentTarget / 4
    assign(
      `Pago de deuda semanal: ${weeklyDebt.toFixed(0)} MXN`,
      weeklyDebt,
      'debt',
    )
  }

  // Saving (if savings capacity > 0)
  if (snapshot.savingsCapacity && snapshot.savingsCapacity > 0) {
    const weeklySave = snapshot.savingsCapacity / 4
    assign(
      `Ahorro semanal: ${weeklySave.toFixed(0)} MXN`,
      weeklySave,
      'saving',
    )
  }

  // Discretionary spending limit
  if (discretionaryLimit !== null && discretionaryLimit > 0) {
    const weeklyDisc = discretionaryLimit / 4
    assign(
      `Gasto discrecional máximo: ${weeklyDisc.toFixed(0)} MXN esta semana`,
      weeklyDisc,
      'discretionary',
    )
  } else if (discretionaryLimit === 0) {
    assign(
      'Evitar gastos no esenciales esta semana',
      0,
      'discretionary',
    )
  }

  // Goal progress
  const activeGoals = goals.filter((g) => !g.completed)
  if (activeGoals.length > 0) {
    const goal = activeGoals[0]
    const weeklyGoal = (goal.target - (goal.saved ?? 0)) / 4
    assign(
      `Meta "${goal.title}": ahorrar ${Math.max(0, weeklyGoal).toFixed(0)} MXN esta semana`,
      Math.max(0, weeklyGoal),
      'saving',
    )
  }

  // If no actions, add a default
  if (actions.length === 0) {
    assign('Revisar tus finanzas y registrar todos los gastos de la semana', 0, 'essential')
  }

  return actions
}

// ---- Estimación de fecha objetivo -------------------------------------------

function estimateTargetDate(
  snapshot: StabilitySnapshot,
): string | null {
  if (!snapshot.savingsCapacity || snapshot.savingsCapacity <= 0) return null
  if (!snapshot.totalDebt || snapshot.totalDebt <= 0) {
    // No debt — aim for 3 months of emergency fund
    if (!snapshot.essentialExpenses || snapshot.essentialExpenses <= 0) return null
    const monthsToTarget = (snapshot.essentialExpenses * 3) / snapshot.savingsCapacity
    const d = new Date()
    d.setMonth(d.getMonth() + Math.ceil(monthsToTarget))
    return d.toISOString().split('T')[0]
  }
  // Has debt — estimate months to be debt-free
  const monthlyPayment = (snapshot.minDebtPayment ?? 0) + (snapshot.savingsCapacity * 0.5)
  if (monthlyPayment <= 0) return null
  const monthsToDebtFree = snapshot.totalDebt / monthlyPayment
  const d = new Date()
  d.setMonth(d.getMonth() + Math.ceil(monthsToDebtFree))
  return d.toISOString().split('T')[0]
}

// ---- Función principal -----------------------------------------------------

export function generateRecoveryPlan(
  accounts: Account[],
  movements: Movement[],
  reminders: Reminder[],
  goals: Goal[],
  snapshot: StabilitySnapshot,
  previousPlan: RecoveryPlan | null,
  trigger: TriggerEvent | null,
): RecoveryPlan {
  const diagnosis = generateDiagnosis(snapshot)
  const essentialExpenses = getEssentialExpenses(snapshot)
  const debtPaymentTarget = getDebtPaymentTarget(snapshot, movements)
  const discretionaryLimit = getDiscretionaryLimit(snapshot, essentialExpenses)
  const weeklyActions = generateWeeklyActions(snapshot, goals, debtPaymentTarget, discretionaryLimit)
  const targetDate = estimateTargetDate(snapshot)
  const today = new Date().toISOString().split('T')[0]

  const version = previousPlan ? previousPlan.version + 1 : 1

  // Calculate progress if we have a previous plan
  let progressPercentage = 0
  if (previousPlan && previousPlan.debtPaymentTarget && debtPaymentTarget) {
    // Simple progress: how much closer we got to the target
    const prev = previousPlan.debtPaymentTarget
    const curr = debtPaymentTarget
    if (prev > 0) {
      progressPercentage = Math.min(100, Math.max(0, ((prev - curr) / prev) * 100))
    }
  }

  return {
    id: uid('rp'),
    userId: snapshot.userId,
    version,
    status: 'active',
    diagnosis,
    weeklyIncome: snapshot.confirmedIncome,
    essentialExpenses,
    debtPaymentTarget,
    emergencyMargin: snapshot.emergencyMargin,
    discretionaryLimit,
    weeklyActions,
    startDate: today,
    targetDate,
    progressPercentage,
    lastRecalculatedAt: Date.now(),
    supersededBy: null,
  }
}

// ---- Trigger detection ------------------------------------------------------

export function shouldRecalculate(
  prevSnapshot: StabilitySnapshot,
  currentSnapshot: StabilitySnapshot,
): TriggerEvent | null {
  // Income change
  if (
    prevSnapshot.confirmedIncome !== currentSnapshot.confirmedIncome
  ) {
    return 'income_change'
  }

  // Major expense (weekly flow dropped significantly)
  if (
    prevSnapshot.weeklyFlow !== null &&
    currentSnapshot.weeklyFlow !== null &&
    currentSnapshot.weeklyFlow < prevSnapshot.weeklyFlow * 0.7
  ) {
    return 'major_expense'
  }

  // Debt payment made (total debt decreased by more than min payment)
  if (
    prevSnapshot.totalDebt !== null &&
    currentSnapshot.totalDebt !== null &&
    currentSnapshot.totalDebt < prevSnapshot.totalDebt
  ) {
    return 'debt_payment'
  }

  // Missed payment (new overdue payments)
  if (
    prevSnapshot.overduePayments === null &&
    currentSnapshot.overduePayments !== null &&
    currentSnapshot.overduePayments > 0
  ) {
    return 'missed_payment'
  }
  if (
    prevSnapshot.overduePayments !== null &&
    currentSnapshot.overduePayments !== null &&
    currentSnapshot.overduePayments > prevSnapshot.overduePayments
  ) {
    return 'missed_payment'
  }

  // New commitment (upcoming commitments increased)
  if (
    prevSnapshot.upcomingCommitments !== null &&
    currentSnapshot.upcomingCommitments !== null &&
    currentSnapshot.upcomingCommitments > prevSnapshot.upcomingCommitments
  ) {
    return 'new_commitment'
  }

  return null
}
