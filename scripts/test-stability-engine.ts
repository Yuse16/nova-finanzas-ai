/**
 * Test script for the Stability Engine.
 *
 * Run: npx tsx scripts/test-stability-engine.ts
 *
 * Shows 3 scenarios: critical, unstable, and stable.
 */

import { computeStabilitySnapshot } from '../lib/stability-engine'
import type { Account, Movement, Reminder } from '../lib/types'

function today(daysOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function print(title: string, result: ReturnType<typeof computeStabilitySnapshot>) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`  Status: ${result.status}  |  Deficit Risk: ${result.deficitRisk}`)
  console.log(`  Avg Income (3mo):     ${result.avgIncome?.toFixed(2) ?? 'null'}`)
  console.log(`  Confirmed Income (mes): ${result.confirmedIncome?.toFixed(2) ?? 'null'}`)
  console.log(`  Essential Expenses:   ${result.essentialExpenses?.toFixed(2) ?? 'null'}`)
  console.log(`  Variable Expenses:    ${result.variableExpenses?.toFixed(2) ?? 'null'}`)
  console.log(`  Upcoming Commitments: ${result.upcomingCommitments?.toFixed(2) ?? 'null'}`)
  console.log(`  Overdue Payments:     ${result.overduePayments?.toFixed(2) ?? 'null'}`)
  console.log(`  Total Debt:           ${result.totalDebt?.toFixed(2) ?? 'null'}`)
  console.log(`  Min Debt Payment:     ${result.minDebtPayment?.toFixed(2) ?? 'null'}`)
  console.log(`  Weekly Flow:          ${result.weeklyFlow?.toFixed(2) ?? 'null'}`)
  console.log(`  Monthly Flow:         ${result.monthlyFlow?.toFixed(2) ?? 'null'}`)
  console.log(`  Real Available Money: ${result.realAvailableMoney?.toFixed(2) ?? 'null'}`)
  console.log(`  Reserved Money:       ${result.reservedMoney?.toFixed(2) ?? 'null'}`)
  console.log(`  Emergency Margin:     ${result.emergencyMargin?.toFixed(2) ?? 'null'}`)
  console.log(`  Coverage Days:        ${result.coverageDays?.toFixed(1) ?? 'null'}`)
  console.log(`  Payment Capacity:     ${result.paymentCapacity?.toFixed(2) ?? 'null'}`)
  console.log(`  Savings Capacity:     ${result.savingsCapacity?.toFixed(2) ?? 'null'}`)
  console.log(`  Recovery Progress:    ${result.recoveryProgress ?? 'null'}`)
  console.log('='.repeat(60))
}

// ── Scenario 1: Critical ──────────────────────────────────────────────────
// realAvailableMoney < upcomingCommitments, weeklyFlow < 0, overduePayments > 0
;(() => {
  const accounts: Account[] = [
    { id: 'a1', name: 'Efectivo', type: 'efectivo', balance: 500, icon: 'wallet', color: '#22c55e', createdAt: 1, updatedAt: 1 },
    { id: 'a2', name: 'Tarjeta Crédito', type: 'credito', balance: -8000, icon: 'credit-card', color: '#ef4444', isLiability: true, createdAt: 1, updatedAt: 1 },
  ]

  const movements: Movement[] = [
    // Gastos recientes (weekly flow negativo)
    { id: 'm1', title: 'Comida', category: 'Comida', amount: 300, type: 'gasto', accountId: 'a1', date: today(-1), icon: 'utensils', color: '#ef4444', createdAt: 1 },
    { id: 'm2', title: 'Renta', category: 'Casa', amount: 5000, type: 'gasto', accountId: 'a1', date: today(-2), icon: 'home', color: '#ef4444', createdAt: 2 },
    { id: 'm3', title: 'Transporte', category: 'Transporte', amount: 200, type: 'gasto', accountId: 'a1', date: today(-3), icon: 'fuel', color: '#ef4444', createdAt: 3 },
    { id: 'm4', title: 'Café', category: 'Café', amount: 80, type: 'gasto', accountId: 'a1', date: today(-4), icon: 'coffee', color: '#ef4444', createdAt: 4 },
    // Un ingreso pequeño
    { id: 'm5', title: 'Pago freelance', category: 'Ingreso', amount: 1000, type: 'ingreso', accountId: 'a1', date: today(-1), icon: 'wallet', color: '#22c55e', createdAt: 5 },
  ]

  const reminders: Reminder[] = [
    { id: 'r1', title: 'Pago tarjeta crédito', amount: 2000, dueDate: today(3), recurring: 'monthly', completed: false, icon: 'credit-card', color: '#ef4444', createdAt: 1 },
    { id: 'r2', title: 'Agua', amount: 400, dueDate: today(-10), recurring: 'monthly', completed: false, icon: 'droplet', color: '#3b82f6', createdAt: 2 },
  ]

  const result = computeStabilitySnapshot(accounts, movements, reminders, 'test-critical')
  print('SCENARIO 1: CRITICAL', result)
})()

// ── Scenario 2: Unstable ──────────────────────────────────────────────────
// Coverage days < 14 pero no cumple condiciones de critical
;(() => {
  const accounts: Account[] = [
    { id: 'b1', name: 'Nómina BBVA', type: 'debito', balance: 8500, icon: 'wallet', color: '#3b82f6', createdAt: 1, updatedAt: 1 },
    { id: 'b2', name: 'Tarjeta Crédito', type: 'credito', balance: -3000, icon: 'credit-card', color: '#ef4444', isLiability: true, createdAt: 1, updatedAt: 1 },
  ]

  const movements: Movement[] = [
    // Ingresos
    { id: 'n1', title: 'Nómina', category: 'Ingreso', amount: 12000, type: 'ingreso', accountId: 'b1', date: today(-5), icon: 'wallet', color: '#22c55e', createdAt: 1 },
    // Gastos esenciales altos
    { id: 'n2', title: 'Renta', category: 'Casa', amount: 6000, type: 'gasto', accountId: 'b1', date: today(-4), icon: 'home', color: '#ef4444', createdAt: 2 },
    { id: 'n3', title: 'Luz', category: 'Servicios', amount: 800, type: 'gasto', accountId: 'b1', date: today(-3), icon: 'zap', color: '#ef4444', createdAt: 3 },
    { id: 'n4', title: 'Comida', category: 'Comida', amount: 2500, type: 'gasto', accountId: 'b1', date: today(-2), icon: 'utensils', color: '#ef4444', createdAt: 4 },
    { id: 'n5', title: 'Transporte', category: 'Transporte', amount: 600, type: 'gasto', accountId: 'b1', date: today(-1), icon: 'fuel', color: '#ef4444', createdAt: 5 },
  ]

  const reminders: Reminder[] = [
    { id: 's1', title: 'Tarjeta crédito', amount: 1500, dueDate: today(10), recurring: 'monthly', completed: false, icon: 'credit-card', color: '#ef4444', createdAt: 1 },
  ]

  const result = computeStabilitySnapshot(accounts, movements, reminders, 'test-unstable')
  print('SCENARIO 2: UNSTABLE', result)
})()

// ── Scenario 3: Stable ────────────────────────────────────────────────────
// Obligaciones cubiertas, flujo positivo, margen de emergencia > 0
;(() => {
  const accounts: Account[] = [
    { id: 'c1', name: 'Nómina BBVA', type: 'debito', balance: 45000, icon: 'wallet', color: '#3b82f6', createdAt: 1, updatedAt: 1 },
    { id: 'c2', name: 'Ahorro', type: 'ahorro', balance: 30000, icon: 'piggy-bank', color: '#22c55e', createdAt: 1, updatedAt: 1 },
    { id: 'c3', name: 'Tarjeta Crédito', type: 'credito', balance: -2000, icon: 'credit-card', color: '#ef4444', isLiability: true, createdAt: 1, updatedAt: 1 },
  ]

  const movements: Movement[] = [
    // Ingresos
    { id: 'p1', title: 'Nómina', category: 'Ingreso', amount: 20000, type: 'ingreso', accountId: 'c1', date: today(-2), icon: 'wallet', color: '#22c55e', createdAt: 1 },
    { id: 'p2', title: 'Freelance', category: 'Ingreso', amount: 5000, type: 'ingreso', accountId: 'c1', date: today(-10), icon: 'briefcase', color: '#22c55e', createdAt: 2 },
    // Gastos controlados
    { id: 'p3', title: 'Renta', category: 'Casa', amount: 8000, type: 'gasto', accountId: 'c1', date: today(-3), icon: 'home', color: '#ef4444', createdAt: 3 },
    { id: 'p4', title: 'Comida', category: 'Comida', amount: 3000, type: 'gasto', accountId: 'c1', date: today(-1), icon: 'utensils', color: '#ef4444', createdAt: 4 },
    { id: 'p5', title: 'Transporte', category: 'Transporte', amount: 500, type: 'gasto', accountId: 'c1', date: today(-2), icon: 'fuel', color: '#ef4444', createdAt: 5 },
    { id: 'p6', title: 'Internet', category: 'Servicios', amount: 700, type: 'gasto', accountId: 'c1', date: today(-5), icon: 'wifi', color: '#ef4444', createdAt: 6 },
    // Ingresos históricos para promedio 3 meses
    { id: 'p7', title: 'Nómina', category: 'Ingreso', amount: 20000, type: 'ingreso', accountId: 'c1', date: daysAgo(35), icon: 'wallet', color: '#22c55e', createdAt: 7 },
    { id: 'p8', title: 'Nómina', category: 'Ingreso', amount: 20000, type: 'ingreso', accountId: 'c1', date: daysAgo(65), icon: 'wallet', color: '#22c55e', createdAt: 8 },
    { id: 'p9', title: 'Freelance', category: 'Ingreso', amount: 3000, type: 'ingreso', accountId: 'c1', date: daysAgo(40), icon: 'briefcase', color: '#22c55e', createdAt: 9 },
  ]

  const reminders: Reminder[] = [
    { id: 't1', title: 'Tarjeta crédito', amount: 1000, dueDate: today(15), recurring: 'monthly', completed: false, icon: 'credit-card', color: '#ef4444', createdAt: 1 },
    { id: 't2', title: 'Agua', amount: 300, dueDate: today(20), recurring: 'monthly', completed: false, icon: 'droplet', color: '#3b82f6', createdAt: 2 },
  ]

  const result = computeStabilitySnapshot(accounts, movements, reminders, 'test-stable')
  print('SCENARIO 3: STABLE', result)
})()
