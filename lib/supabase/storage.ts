'use client'

import { createClient } from './client'
import type { AppData, Account, Movement, Goal, Reminder, AssistantMessage, UserProfile } from '@/lib/types'
import { emptyAppData } from '@/lib/types'

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

export const supabaseStorage = {
  async load(userId: string): Promise<AppData | null> {
    const supabase = createClient()

    const [profileRes, accountsRes, movementsRes, goalsRes, remindersRes, assistantRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('reminders').select('*').eq('user_id', userId),
        supabase.from('assistant_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])

    if (profileRes.error && accountsRes.error && movementsRes.error) {
      // Supabase completely unreachable — caller should fall back to IndexedDB
      return null
    }

    return {
      profile: profileRes.data ? mapProfile(profileRes.data as ProfileRow) : null,
      accounts: (accountsRes.data as AccountRow[] | null)?.map(mapAccount) ?? [],
      movements: (movementsRes.data as MovementRow[] | null)?.map(mapMovement) ?? [],
      goals: (goalsRes.data as GoalRow[] | null)?.map(mapGoal) ?? [],
      reminders: (remindersRes.data as ReminderRow[] | null)?.map(mapReminder) ?? [],
      assistantHistory: (assistantRes.data as AssistantMessageRow[] | null)?.map(mapAssistantMessage) ?? [],
      version: 1,
    }
  },

  async save(userId: string, data: AppData): Promise<void> {
    const errors: string[] = []

    await Promise.all([
      upsertProfile(userId, data.profile).catch((e) => errors.push(`profile: ${e.message}`)),
      upsertAccounts(userId, data.accounts).catch((e) => errors.push(`accounts: ${e.message}`)),
      upsertMovements(userId, data.movements).catch((e) => errors.push(`movements: ${e.message}`)),
      upsertGoals(userId, data.goals).catch((e) => errors.push(`goals: ${e.message}`)),
      upsertReminders(userId, data.reminders).catch((e) => errors.push(`reminders: ${e.message}`)),
      upsertAssistantMessages(userId, data.assistantHistory).catch((e) => errors.push(`assistant: ${e.message}`)),
    ])

    if (errors.length > 0) {
      console.warn('[supabaseStorage] Partial save errors:', errors.join('; '))
    }
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
}
