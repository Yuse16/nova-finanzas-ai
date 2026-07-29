'use client'

import { create } from 'zustand'
import type {
  Account,
  AppData,
  Goal,
  Movement,
  Reminder,
  UserProfile,
  AssistantMessage,
  FinancialSnapshot,
  StabilitySnapshot,
  RecoveryPlan,
} from './types'
import { emptyAppData } from './types'
import { storage } from './storage'
import { snapshotStorage } from './storage-snapshots'
import { uid } from './format'
import { getAccountTypeMeta } from './catalog'
import { supabaseStorage } from './supabase/storage'
import { computeStabilitySnapshot } from './stability-engine'
import { generateRecoveryPlan, shouldRecalculate, type TriggerEvent } from './recovery-engine'

// ---- Constants -------------------------------------------------------------

const MAX_RECOVERY_PLANS = 20
const MAX_ASSISTANT_HISTORY = 100
const PERSIST_DEBOUNCE_MS = 750

// ---- Balance side-effects ---------------------------------------------------

function applyMovement(accounts: Account[], m: Movement, sign = 1): Account[] {
  return accounts.map((acc) => {
    let balance = acc.balance
    const isLiability = getAccountTypeMeta(acc.type).liability
    const factor = isLiability ? -1 : 1

    if (m.type === 'transferencia') {
      if (acc.id === m.accountId) balance -= sign * m.amount * factor
      if (acc.id === m.toAccountId) balance += sign * m.amount * factor
      return { ...acc, balance, updatedAt: Date.now() }
    }

    if (m.type === 'deuda') {
      if (acc.id === m.accountId) balance += sign * m.amount * factor
      if (acc.type === 'deudas') balance += sign * m.amount * factor
      return { ...acc, balance, updatedAt: Date.now() }
    }

    if (m.type === 'prestamo') {
      if (acc.id === m.accountId) balance -= sign * m.amount * factor
      return { ...acc, balance, updatedAt: Date.now() }
    }

    if (acc.id !== m.accountId) return acc

    if (m.type === 'gasto') balance -= sign * m.amount * factor
    else if (m.type === 'ingreso') balance += sign * m.amount * factor

    return { ...acc, balance, updatedAt: Date.now() }
  })
}

// ---- Module-level cache & guards -------------------------------------------

let _cachedSnapshot: StabilitySnapshot | null = null
let _prevSnapshotForTrigger: StabilitySnapshot | null = null
let _processedFingerprints = new Set<string>()
let _isPersisting = false
let _persistTimer: ReturnType<typeof setTimeout> | null = null

export function getCachedSnapshot(): StabilitySnapshot | null {
  return _cachedSnapshot
}

function computeFingerprint(
  userId: string,
  trigger: TriggerEvent,
  snapshot: StabilitySnapshot,
): string {
  return [
    userId,
    trigger,
    snapshot.confirmedIncome,
    snapshot.weeklyFlow,
    snapshot.totalDebt,
    snapshot.overduePayments,
    snapshot.upcomingCommitments,
  ].join('|')
}

function limitRecoveryPlans(plans: RecoveryPlan[]): RecoveryPlan[] {
  const sorted = [...plans].sort((a, b) => b.lastRecalculatedAt - a.lastRecalculatedAt)
  const activeIdx = sorted.findIndex((p) => p.status === 'active')

  // Ensure only one active plan
  if (activeIdx !== -1) {
    for (let i = 0; i < sorted.length; i++) {
      if (i !== activeIdx && sorted[i].status === 'active') {
        sorted[i] = { ...sorted[i], status: 'superseded' }
      }
    }
  }

  // Keep only the top MAX_RECOVERY_PLANS
  return sorted.slice(0, MAX_RECOVERY_PLANS)
}

// ---- Store type ------------------------------------------------------------

export type StoreValue = {
  data: AppData
  ready: boolean
  userId: string | null
  setUserData: (userId: string | null) => Promise<void>
  addAccount: (input: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAccount: (account: Account) => void
  deleteAccount: (id: string) => void
  addMovement: (input: Omit<Movement, 'id' | 'createdAt'>) => void
  updateMovement: (next: Movement) => void
  deleteMovement: (movement: Movement) => void
  addGoal: (input: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (id: string) => void
  addToGoal: (id: string, amount: number) => void
  addReminder: (input: Omit<Reminder, 'id' | 'createdAt'>) => void
  updateReminder: (reminder: Reminder) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
  completeOnboarding: (profile: UserProfile, accounts: Account[]) => void
  reset: () => void
  resetWithSnapshot: (snapshot: FinancialSnapshot) => void
  addAssistantMessage: (message: Omit<AssistantMessage, 'id' | 'createdAt'>) => void
  updateSelectedFont: (font: string) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setRecoveryPlans: (plans: RecoveryPlan[]) => void
  generateRecoveryPlanAction: (trigger?: TriggerEvent | null) => void
}

// ---- Store creation --------------------------------------------------------

export const useStore = create<StoreValue>((set, get) => ({
  data: emptyAppData(),
  ready: false,
  userId: null,

  setUserData: async (userId) => {
    if (!userId) {
      set({ userId, ready: true })
      return
    }
    set({ userId, ready: false })

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const remote = await supabaseStorage.load(userId).catch(() => null)
      if (remote) {
        const sanitized = {
          ...remote,
          recoveryPlans: limitRecoveryPlans(remote.recoveryPlans),
          assistantHistory: remote.assistantHistory.slice(0, MAX_ASSISTANT_HISTORY),
        }
        set({ data: sanitized, ready: true })
        storage.save(sanitized)
        return
      }
    }

    set({ ready: true })
  },

  addAccount: (input) => {
    set((state) => {
      const newAccount: Account = {
        ...input,
        id: uid('acc'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return {
        data: { ...state.data, accounts: [...state.data.accounts, newAccount] },
      }
    })
  },

  updateAccount: (account) => {
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.map((a) =>
          a.id === account.id ? { ...account, updatedAt: Date.now() } : a,
        ),
      },
    }))
  },

  deleteAccount: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        accounts: state.data.accounts.filter((a) => a.id !== id),
        movements: state.data.movements.map((m) => {
          if (m.accountId === id) return { ...m, accountId: null }
          if (m.toAccountId === id) return { ...m, toAccountId: null }
          return m
        }),
      },
    }))
  },

  addMovement: (input) => {
    set((state) => {
      const newMovement: Movement = {
        ...input,
        id: uid('mov'),
        createdAt: Date.now(),
      }
      return {
        data: {
          ...state.data,
          movements: [newMovement, ...state.data.movements],
          accounts: applyMovement(state.data.accounts, newMovement, 1),
        },
      }
    })
  },

  updateMovement: (next) => {
    set((state) => {
      const prev = state.data.movements.find((m) => m.id === next.id)
      if (!prev) return {}
      let accounts = applyMovement(state.data.accounts, prev, -1)
      accounts = applyMovement(accounts, next, 1)
      return {
        data: {
          ...state.data,
          movements: state.data.movements.map((m) =>
            m.id === next.id ? next : m,
          ),
          accounts,
        },
      }
    })
  },

  deleteMovement: (movement) => {
    set((state) => ({
      data: {
        ...state.data,
        movements: state.data.movements.filter((m) => m.id !== movement.id),
        accounts: applyMovement(state.data.accounts, movement, -1),
      },
    }))
  },

  addGoal: (input) => {
    set((state) => {
      const newGoal: Goal = {
        ...input,
        id: uid('goal'),
        createdAt: Date.now(),
      }
      return {
        data: { ...state.data, goals: [...state.data.goals, newGoal] },
      }
    })
  },

  updateGoal: (goal) => {
    set((state) => ({
      data: {
        ...state.data,
        goals: state.data.goals.map((g) => (g.id === goal.id ? goal : g)),
      },
    }))
  },

  deleteGoal: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        goals: state.data.goals.filter((g) => g.id !== id),
      },
    }))
  },

  addToGoal: (id, amount) => {
    set((state) => {
      const goal = state.data.goals.find((g) => g.id === id)
      if (!goal) return {}
      return {
        data: {
          ...state.data,
          goals: state.data.goals.map((g) =>
            g.id === id
              ? { ...g, saved: Math.max(0, g.saved + amount) }
              : g,
          ),
        },
      }
    })
  },

  addReminder: (input) => {
    set((state) => {
      const newReminder: Reminder = {
        ...input,
        id: uid('rem'),
        createdAt: Date.now(),
      }
      return {
        data: { ...state.data, reminders: [...state.data.reminders, newReminder] },
      }
    })
  },

  updateReminder: (reminder) => {
    set((state) => ({
      data: {
        ...state.data,
        reminders: state.data.reminders.map((r) =>
          r.id === reminder.id ? reminder : r,
        ),
      },
    }))
  },

  deleteReminder: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        reminders: state.data.reminders.filter((r) => r.id !== id),
      },
    }))
  },

  toggleReminder: (id) => {
    set((state) => {
      const reminder = state.data.reminders.find((r) => r.id === id)
      if (!reminder) return {}
      return {
        data: {
          ...state.data,
          reminders: state.data.reminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r,
          ),
        },
      }
    })
  },

  completeOnboarding: (profile, accounts) => {
    set((state) => ({
      data: { ...state.data, profile, accounts },
    }))
  },

  reset: () => {
    const uid = get().userId
    storage.clear()
    if (uid) supabaseStorage.clear(uid)
    set({ data: emptyAppData() })
  },

  resetWithSnapshot: (snapshot) => {
    snapshotStorage.saveSnapshot(snapshot).then(() => {
      storage.clear()
      set({ data: emptyAppData(), ready: true })
    })
  },

  updateSelectedFont: (font) => {
    set((state) => ({
      data: {
        ...state.data,
        profile: state.data.profile
          ? { ...state.data.profile, selectedFont: font }
          : null,
      },
    }))
  },

  updateProfile: (updates) => {
    set((state) => ({
      data: {
        ...state.data,
        profile: state.data.profile ? { ...state.data.profile, ...updates } : null,
      },
    }))
  },

  setRecoveryPlans: (plans) => {
    set((state) => ({
      data: { ...state.data, recoveryPlans: limitRecoveryPlans(plans) },
    }))
  },

  generateRecoveryPlanAction: (trigger) => {
    const { data, userId } = get()
    if (!userId) return
    const snapshot = _cachedSnapshot
    if (!snapshot) return

    const activePlan = data.recoveryPlans.find((p) => p.status === 'active') ?? null
    const newPlan = generateRecoveryPlan(
      data.accounts,
      data.movements,
      data.reminders,
      data.goals,
      snapshot,
      activePlan,
      trigger ?? null,
    )

    const plans = limitRecoveryPlans([newPlan, ...data.recoveryPlans])
    set({ data: { ...data, recoveryPlans: plans } })
  },

  addAssistantMessage: (message) => {
    set((state) => ({
      data: {
        ...state.data,
        assistantHistory: [
          {
            ...message,
            id: uid('asm'),
            createdAt: Date.now(),
          },
          ...state.data.assistantHistory,
        ].slice(0, MAX_ASSISTANT_HISTORY),
      },
    }))
  },
}))

// ---- Debounced persistence -------------------------------------------------

function schedulePersist(state: StoreValue) {
  if (_persistTimer) clearTimeout(_persistTimer)
  _persistTimer = setTimeout(async () => {
    if (_isPersisting) return
    _isPersisting = true
    try {
      const current = useStore.getState()
      if (!current.ready) return

      // Local persist (IndexedDB + localStorage)
      storage.save(current.data).catch(() => {})

      // Remote persist (Supabase) — only if authenticated
      if (current.userId) {
        await supabaseStorage.save(current.userId, current.data)
      }
    } finally {
      _isPersisting = false
    }
  }, PERSIST_DEBOUNCE_MS)
}

// ---- Auto-hydrate + subscribe ----------------------------------------------

if (typeof window !== 'undefined') {
  storage.load().then((loaded) => {
    const sanitized = {
      ...loaded,
      recoveryPlans: limitRecoveryPlans(loaded.recoveryPlans),
      assistantHistory: loaded.assistantHistory.slice(0, MAX_ASSISTANT_HISTORY),
    }
    useStore.setState({ data: sanitized, ready: true })
  })

  // Subscribe to changes — each concern is isolated to prevent reentrancy
  useStore.subscribe((state) => {
    if (!state.ready) return

    // 1. Cancel any pending schedule and re-schedule (debounced)
    schedulePersist(state)

    // 2. Compute stability snapshot (pure, no state mutation)
    if (state.userId && state.data.accounts.length > 0) {
      const newSnapshot = computeStabilitySnapshot(
        state.data.accounts,
        state.data.movements,
        state.data.reminders,
        state.userId,
        state.data.profile?.reservedMoney ?? 0,
        state.data.profile?.emergencyMargin ?? 0,
      )

      // Persist snapshot to Supabase
      supabaseStorage.saveSnapshot(newSnapshot).catch(() => {})

      // Detect trigger and optionally generate recovery plan
      if (_prevSnapshotForTrigger) {
        const trigger = shouldRecalculate(_prevSnapshotForTrigger, newSnapshot)
        if (trigger) {
          const fp = computeFingerprint(state.userId, trigger, newSnapshot)
          if (!_processedFingerprints.has(fp)) {
            _processedFingerprints.add(fp)

            const activePlan = state.data.recoveryPlans.find((p) => p.status === 'active') ?? null
            const newPlan = generateRecoveryPlan(
              state.data.accounts,
              state.data.movements,
              state.data.reminders,
              state.data.goals,
              newSnapshot,
              activePlan,
              trigger,
            )
            const plans = limitRecoveryPlans([newPlan, ...state.data.recoveryPlans])
            useStore.setState({ data: { ...state.data, recoveryPlans: plans } })
          }
        }
      }

      // Update snapshot cache AFTER all trigger evaluation to prevent reentrancy
      _cachedSnapshot = newSnapshot
      _prevSnapshotForTrigger = newSnapshot
    }
  })
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
