'use client'

import { createClient } from './client'
import type { AppData, Account, Movement, Goal, Reminder, AssistantMessage, UserProfile } from '@/lib/types'
import { emptyAppData, CURRENT_DATA_VERSION } from '@/lib/types'

// ---- Persistence mutex (prevents concurrent full saves) --------------------

let _saveQueue: Promise<void> = Promise.resolve()

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  _saveQueue = _saveQueue.then(fn, fn)
  return _saveQueue
}

/**
 * Supabase-backed storage for Nova Finanzas AI.
 *
 * Source of truth: Supabase tables.
 * Offline cache: IndexedDB (via lib/storage.ts).
 *
 * Every write goes to Supabase first. On success, the same data is mirrored
 * to IndexedDB so the app works offline on next launch. On load, Supabase is
 * tried first; if the user is offline or Supabase is unreachable, IndexedDB
 * serves as fallback.
 */

// ---- Row types (snake_case, what Supabase returns) -------------------------

type ProfileRow = {
  user_id: string
  name: string
  onboarded: boolean
  created_at: number
  selected_font: string
  accounts_skipped: boolean | null
  reserved_money: number | null
  emergency_margin: number | null
}

type AccountRow = {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  icon: string
  color: string
  is_liability: boolean | null
  bank: string | null
  identifier: string | null
  limite_credito: number | null
  fecha_corte: number | null
  fecha_pago: number | null
  activa: boolean | null
  created_at: number
  updated_at: number
}

type MovementRow = {
  id: string
  user_id: string
  title: string
  category: string
  amount: number
  type: string
  account_id: string | null
  to_account_id: string | null
  method: string
  date: string
  person: string | null
  note: string | null
  icon: string
  color: string
  created_at: number
}

type GoalRow = {
  id: string
  user_id: string
  title: string
  saved: number
  target: number
  date: string
  icon: string
  color: string
  image: string | null
  created_at: number
}

type ReminderRow = {
  id: string
  user_id: string
  title: string
  amount: number
  due_date: string
  recurring: string
  completed: boolean
  icon: string
  color: string
  notified_at: number | null
  snooze_until: number | null
  created_at: number
}

type AssistantMessageRow = {
  id: string
  user_id: string
  question: string
  answer: string
  breakdown: unknown | null
  created_at: number
}

// ---- Mappers (snake_case → camelCase) --------------------------------------

function mapProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    onboarded: row.onboarded,
    createdAt: row.created_at,
    selectedFont: row.selected_font,
    accountsSkipped: row.accounts_skipped ?? undefined,
    reservedMoney: row.reserved_money ?? undefined,
    emergencyMargin: row.emergency_margin ?? undefined,
  }
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    isLiability: row.is_liability ?? undefined,
    bank: row.bank ?? undefined,
    identifier: row.identifier ?? undefined,
    limiteCredito: row.limite_credito ?? undefined,
    fechaCorte: row.fecha_corte ?? undefined,
    fechaPago: row.fecha_pago ?? undefined,
    activa: row.activa ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: row.amount,
    type: row.type as Movement['type'],
    accountId: row.account_id,
    toAccountId: row.to_account_id,
    method: row.method,
    date: row.date,
    person: row.person ?? undefined,
    note: row.note ?? undefined,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  }
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    saved: row.saved,
    target: row.target,
    date: row.date,
    icon: row.icon,
    color: row.color,
    image: row.image ?? undefined,
    createdAt: row.created_at,
  }
}

function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    dueDate: row.due_date,
    recurring: row.recurring as Reminder['recurring'],
    completed: row.completed,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    notifiedAt: row.notified_at ?? undefined,
    snoozeUntil: row.snooze_until ?? undefined,
  }
}

function mapAssistantMessage(row: AssistantMessageRow): AssistantMessage {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    breakdown: row.breakdown as AssistantMessage['breakdown'],
    createdAt: row.created_at,
  }
}

// ---- Reverse mappers (camelCase → snake_case) ------------------------------

function toProfileRow(userId: string, profile: UserProfile): ProfileRow {
  return {
    user_id: userId,
    name: profile.name,
    onboarded: profile.onboarded,
    created_at: profile.createdAt,
    selected_font: profile.selectedFont,
    accounts_skipped: profile.accountsSkipped ?? null,
    reserved_money: profile.reservedMoney ?? null,
    emergency_margin: profile.emergencyMargin ?? null,
  }
}

function toAccountRow(userId: string, a: Account): AccountRow {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    type: a.type,
    balance: a.balance,
    icon: a.icon,
    color: a.color,
    is_liability: a.isLiability ?? null,
    bank: a.bank ?? null,
    identifier: a.identifier ?? null,
    limite_credito: a.limiteCredito ?? null,
    fecha_corte: a.fechaCorte ?? null,
    fecha_pago: a.fechaPago ?? null,
    activa: a.activa ?? null,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }
}

function toMovementRow(userId: string, m: Movement): MovementRow {
  return {
    id: m.id,
    user_id: userId,
    title: m.title,
    category: m.category,
    amount: m.amount,
    type: m.type,
    account_id: m.accountId ?? null,
    to_account_id: m.toAccountId ?? null,
    method: m.method,
    date: m.date,
    person: m.person ?? null,
    note: m.note ?? null,
    icon: m.icon,
    color: m.color,
    created_at: m.createdAt,
  }
}

function toGoalRow(userId: string, g: Goal): GoalRow {
  return {
    id: g.id,
    user_id: userId,
    title: g.title,
    saved: g.saved,
    target: g.target,
    date: g.date,
    icon: g.icon,
    color: g.color,
    image: g.image ?? null,
    created_at: g.createdAt,
  }
}

function toReminderRow(userId: string, r: Reminder): ReminderRow {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    amount: r.amount,
    due_date: r.dueDate,
    recurring: r.recurring,
    completed: r.completed,
    icon: r.icon,
    color: r.color,
    notified_at: r.notifiedAt ?? null,
    snooze_until: r.snoozeUntil ?? null,
    created_at: r.createdAt,
  }
}

function toAssistantMessageRow(userId: string, m: AssistantMessage): AssistantMessageRow {
  return {
    id: m.id,
    user_id: userId,
    question: m.question,
    answer: m.answer,
    breakdown: m.breakdown ?? null,
    created_at: m.createdAt,
  }
}

// ---- Upsert helpers --------------------------------------------------------

async function upsertProfile(userId: string, profile: UserProfile | null): Promise<void> {
  if (!profile) return
  const supabase = createClient()
  await supabase.from('profiles').upsert(toProfileRow(userId, profile), { onConflict: 'user_id' })
}

async function upsertAccounts(userId: string, accounts: Account[]): Promise<void> {
  if (accounts.length === 0) return
  const supabase = createClient()
  const rows = accounts.map((a) => toAccountRow(userId, a))
  await supabase.from('accounts').upsert(rows, { onConflict: 'id' })
}

async function upsertMovements(userId: string, movements: Movement[]): Promise<void> {
  if (movements.length === 0) return
  const supabase = createClient()
  const rows = movements.map((m) => toMovementRow(userId, m))
  await supabase.from('movements').upsert(rows, { onConflict: 'id' })
}

async function upsertGoals(userId: string, goals: Goal[]): Promise<void> {
  if (goals.length === 0) return
  const supabase = createClient()
  const rows = goals.map((g) => toGoalRow(userId, g))
  await supabase.from('goals').upsert(rows, { onConflict: 'id' })
}

async function upsertReminders(userId: string, reminders: Reminder[]): Promise<void> {
  if (reminders.length === 0) return
  const supabase = createClient()
  const rows = reminders.map((r) => toReminderRow(userId, r))
  await supabase.from('reminders').upsert(rows, { onConflict: 'id' })
}

async function upsertAssistantMessages(userId: string, messages: AssistantMessage[]): Promise<void> {
  if (messages.length === 0) return
  const supabase = createClient()
  const rows = messages.map((m) => toAssistantMessageRow(userId, m))
  await supabase.from('assistant_messages').upsert(rows, { onConflict: 'id' })
}

// ---- Public API ------------------------------------------------------------

// ---- Stability Snapshot helpers --------------------------------------------

type SnapshotRow = {
  id: string
  user_id: string
  computed_at: number
  avg_income: number | null
  confirmed_income: number | null
  essential_expenses: number | null
  variable_expenses: number | null
  upcoming_commitments: number | null
  overdue_payments: number | null
  total_debt: number | null
  min_debt_payment: number | null
  weekly_flow: number | null
  monthly_flow: number | null
  real_available_money: number | null
  reserved_money: number | null
  emergency_margin: number | null
  coverage_days: number | null
  deficit_risk: string | null
  payment_capacity: number | null
  savings_capacity: number | null
  recovery_progress: number | null
  status: string
}

import type { StabilitySnapshot, RecoveryPlan, WeeklyAction } from '@/lib/types'

function toSnapshotRow(userId: string, s: StabilitySnapshot): SnapshotRow {
  return {
    id: s.id,
    user_id: userId,
    computed_at: s.computedAt,
    avg_income: s.avgIncome,
    confirmed_income: s.confirmedIncome,
    essential_expenses: s.essentialExpenses,
    variable_expenses: s.variableExpenses,
    upcoming_commitments: s.upcomingCommitments,
    overdue_payments: s.overduePayments,
    total_debt: s.totalDebt,
    min_debt_payment: s.minDebtPayment,
    weekly_flow: s.weeklyFlow,
    monthly_flow: s.monthlyFlow,
    real_available_money: s.realAvailableMoney,
    reserved_money: s.reservedMoney,
    emergency_margin: s.emergencyMargin,
    coverage_days: s.coverageDays,
    deficit_risk: s.deficitRisk,
    payment_capacity: s.paymentCapacity,
    savings_capacity: s.savingsCapacity,
    recovery_progress: s.recoveryProgress,
    status: s.status,
  }
}

async function upsertSnapshot(userId: string, snapshot: StabilitySnapshot): Promise<void> {
  const supabase = createClient()
  const row = toSnapshotRow(userId, snapshot)
  await supabase.from('stability_snapshots').upsert(row, { onConflict: 'id' })
}

// ---- Recovery Plan helpers -------------------------------------------------

type RecoveryPlanRow = {
  id: string
  user_id: string
  version: number
  status: string
  diagnosis: string
  weekly_income: number | null
  essential_expenses: number | null
  debt_payment_target: number | null
  emergency_margin: number | null
  discretionary_limit: number | null
  weekly_actions: any
  start_date: string
  target_date: string | null
  progress_percentage: number
  last_recalculated_at: number
  superseded_by: string | null
}

function mapRecoveryPlan(row: RecoveryPlanRow): RecoveryPlan {
  return {
    id: row.id,
    userId: row.user_id,
    version: row.version,
    status: row.status as RecoveryPlan['status'],
    diagnosis: row.diagnosis,
    weeklyIncome: row.weekly_income,
    essentialExpenses: row.essential_expenses,
    debtPaymentTarget: row.debt_payment_target,
    emergencyMargin: row.emergency_margin,
    discretionaryLimit: row.discretionary_limit,
    weeklyActions: (row.weekly_actions as WeeklyAction[]) ?? [],
    startDate: row.start_date,
    targetDate: row.target_date,
    progressPercentage: row.progress_percentage,
    lastRecalculatedAt: row.last_recalculated_at,
    supersededBy: row.superseded_by,
  }
}

function toRecoveryPlanRow(userId: string, p: RecoveryPlan): RecoveryPlanRow {
  return {
    id: p.id,
    user_id: userId,
    version: p.version,
    status: p.status,
    diagnosis: p.diagnosis,
    weekly_income: p.weeklyIncome,
    essential_expenses: p.essentialExpenses,
    debt_payment_target: p.debtPaymentTarget,
    emergency_margin: p.emergencyMargin,
    discretionary_limit: p.discretionaryLimit,
    weekly_actions: JSON.stringify(p.weeklyActions),
    start_date: p.startDate,
    target_date: p.targetDate,
    progress_percentage: p.progressPercentage,
    last_recalculated_at: p.lastRecalculatedAt,
    superseded_by: p.supersededBy,
  }
}

async function upsertRecoveryPlans(userId: string, plans: RecoveryPlan[]): Promise<void> {
  if (plans.length === 0) return
  const supabase = createClient()
  const rows = plans.map((p) => toRecoveryPlanRow(userId, p))
  // Chunk to avoid request size limits
  const chunkSize = 10
  for (let i = 0; i < rows.length; i += chunkSize) {
    await supabase.from('recovery_plans').upsert(rows.slice(i, i + chunkSize), { onConflict: 'id' })
  }
}

async function loadRecoveryPlans(userId: string): Promise<RecoveryPlan[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('recovery_plans')
    .select('*')
    .eq('user_id', userId)
    .order('version', { ascending: false })
  if (!data) return []
  return (data as RecoveryPlanRow[]).map(mapRecoveryPlan)
}

export const supabaseStorage = {
  async load(userId: string): Promise<AppData | null> {
    const supabase = createClient()

    const [profileRes, accountsRes, movementsRes, goalsRes, remindersRes, assistantRes, plansRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('reminders').select('*').eq('user_id', userId),
        supabase.from('assistant_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('recovery_plans').select('*').eq('user_id', userId).order('version', { ascending: false }),
      ])

    if (profileRes.error && accountsRes.error && movementsRes.error) {
      return null
    }

    return {
      profile: profileRes.data ? mapProfile(profileRes.data as ProfileRow) : null,
      accounts: (accountsRes.data as AccountRow[] | null)?.map(mapAccount) ?? [],
      movements: (movementsRes.data as MovementRow[] | null)?.map(mapMovement) ?? [],
      goals: (goalsRes.data as GoalRow[] | null)?.map(mapGoal) ?? [],
      reminders: (remindersRes.data as ReminderRow[] | null)?.map(mapReminder) ?? [],
      assistantHistory: (assistantRes.data as AssistantMessageRow[] | null)?.map(mapAssistantMessage) ?? [],
      recoveryPlans: (plansRes.data as RecoveryPlanRow[] | null)?.map(mapRecoveryPlan) ?? [],
      version: CURRENT_DATA_VERSION,
    }
  },

  async save(userId: string, data: AppData): Promise<void> {
    return serialized(async () => {
      const errors: string[] = []
      await Promise.all([
        upsertProfile(userId, data.profile).catch((e) => errors.push(`profile: ${e.message}`)),
        upsertAccounts(userId, data.accounts).catch((e) => errors.push(`accounts: ${e.message}`)),
        upsertMovements(userId, data.movements).catch((e) => errors.push(`movements: ${e.message}`)),
        upsertGoals(userId, data.goals).catch((e) => errors.push(`goals: ${e.message}`)),
        upsertReminders(userId, data.reminders).catch((e) => errors.push(`reminders: ${e.message}`)),
        upsertAssistantMessages(userId, data.assistantHistory).catch((e) => errors.push(`assistant: ${e.message}`)),
        upsertRecoveryPlans(userId, data.recoveryPlans).catch((e) => errors.push(`recovery_plans: ${e.message}`)),
      ])
      if (errors.length > 0) {
        console.warn('[supabaseStorage] Partial save errors:', errors.join('; '))
      }
    })
  },

  // Entity-specific saves (avoid full data dump on every change)
  async saveProfile(userId: string, profile: UserProfile | null): Promise<void> {
    return serialized(() => upsertProfile(userId, profile))
  },

  async saveAccount(userId: string, account: Account): Promise<void> {
    const supabase = createClient()
    await supabase.from('accounts').upsert(toAccountRow(userId, account), { onConflict: 'id' })
  },

  async saveMovement(userId: string, movement: Movement): Promise<void> {
    const supabase = createClient()
    await supabase.from('movements').upsert(toMovementRow(userId, movement), { onConflict: 'id' })
  },

  async saveGoal(userId: string, goal: Goal): Promise<void> {
    const supabase = createClient()
    await supabase.from('goals').upsert(toGoalRow(userId, goal), { onConflict: 'id' })
  },

  async saveReminder(userId: string, reminder: Reminder): Promise<void> {
    const supabase = createClient()
    await supabase.from('reminders').upsert(toReminderRow(userId, reminder), { onConflict: 'id' })
  },

  async saveRecoveryPlan(userId: string, plan: RecoveryPlan): Promise<void> {
    const supabase = createClient()
    await supabase.from('recovery_plans').upsert(toRecoveryPlanRow(userId, plan), { onConflict: 'id' })
  },

  async clear(userId: string): Promise<void> {
    const supabase = createClient()
    await Promise.all([
      supabase.from('profiles').delete().eq('user_id', userId),
      supabase.from('accounts').delete().eq('user_id', userId),
      supabase.from('movements').delete().eq('user_id', userId),
      supabase.from('goals').delete().eq('user_id', userId),
      supabase.from('reminders').delete().eq('user_id', userId),
      supabase.from('assistant_messages').delete().eq('user_id', userId),
      supabase.from('recovery_plans').delete().eq('user_id', userId),
    ])
  },

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    const supabase = createClient()
    // Nullify movement references before deleting the account
    await supabase.from('movements').update({ account_id: null }).eq('account_id', accountId).eq('user_id', userId)
    await supabase.from('movements').update({ to_account_id: null }).eq('to_account_id', accountId).eq('user_id', userId)
    await supabase.from('accounts').delete().eq('id', accountId).eq('user_id', userId)
  },

  async deleteMovement(userId: string, movementId: string): Promise<void> {
    const supabase = createClient()
    await supabase.from('movements').delete().eq('id', movementId).eq('user_id', userId)
  },

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const supabase = createClient()
    await supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId)
  },

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    const supabase = createClient()
    await supabase.from('reminders').delete().eq('id', reminderId).eq('user_id', userId)
  },

  async saveSnapshot(snapshot: StabilitySnapshot): Promise<void> {
    if (!snapshot.userId) return
    await upsertSnapshot(snapshot.userId, snapshot)
  },
}
