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
} from './types' // NEW: Import AssistantMessage
import { emptyAppData } from './types'
import { storage } from './storage'
import { snapshotStorage } from './storage-snapshots'
import { uid } from './format'
import { getAccountTypeMeta } from './catalog'
import { supabaseStorage } from './supabase/storage'
import { computeStabilitySnapshot } from './stability-engine'

// ---- Balance side-effects -------------------------------------------------

/** Apply a movement's effect to account balances. */
function applyMovement(accounts: Account[], m: Movement, sign = 1): Account[] {
  return accounts.map((acc) => {
    let balance = acc.balance
    const isLiability = getAccountTypeMeta(acc.type).liability

    // For liability accounts, the effect on the balance is inverted.
    // E.g., 'gasto' on a credit card (liability) increases the negative balance.
    const factor = isLiability ? -1 : 1

    if (m.type === 'transferencia') {
      if (acc.id === m.accountId) balance -= sign * m.amount * factor // Money leaves this account
      if (acc.id === m.toAccountId) balance += sign * m.amount * factor // Money enters this account
      return { ...acc, balance, updatedAt: Date.now() }
    }

    // Handle specific cases for 'deuda' and 'prestamo' in relation to liability accounts
    if (m.type === 'deuda') { // When YOU borrow money (income/liability increase)
      // If the movement is to accountId (where the money is received)
      if (acc.id === m.accountId) {
        balance += sign * m.amount * factor
      }
      // If the account is a 'deudas' type (tracking total money owed by YOU)
      // This means the total debt increases (becomes more negative)
      if (acc.type === 'deudas') {
        balance += sign * m.amount * factor // Adjusts liability balance (e.g., -100 to -200 for new debt)
      }
    return { ...acc, balance, updatedAt: Date.now() }
}

    if (m.type === 'prestamo') { // When YOU lend money (expense/asset decrease)
      // Money leaves the account
      if (acc.id === m.accountId) {
        balance -= sign * m.amount * factor
      }
      // If the account tracks loans you've given (an asset account type, if implemented)
      // For now, it mostly impacts the source account.
      // If acc.type === 'prestamos_otorgados' (Hypothetical asset account for loans given)
      // then: balance += sign * m.amount * factor
      return { ...acc, balance, updatedAt: Date.now() }
    }

    // Default handling for 'gasto' and 'ingreso'
    if (acc.id !== m.accountId) return acc

    if (m.type === 'gasto') {
      balance -= sign * m.amount * factor
    } else if (m.type === 'ingreso') {
      balance += sign * m.amount * factor
    }

    return { ...acc, balance, updatedAt: Date.now() }
  })
}

export type StoreValue = {
  data: AppData
  ready: boolean
  userId: string | null
  setUserData: (userId: string | null) => Promise<void>
  // account helpers
  addAccount: (input: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAccount: (account: Account) => void
  deleteAccount: (id: string) => void
  // movement helpers
  addMovement: (input: Omit<Movement, 'id' | 'createdAt'>) => void
  updateMovement: (next: Movement) => void
  deleteMovement: (movement: Movement) => void
  // goal helpers
  addGoal: (input: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (id: string) => void
  addToGoal: (id: string, amount: number) => void
  // reminder helpers
  addReminder: (input: Omit<Reminder, 'id' | 'createdAt'>) => void
  updateReminder: (reminder: Reminder) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
  // onboarding
  completeOnboarding: (profile: UserProfile, accounts: Account[]) => void
  reset: () => void
  resetWithSnapshot: (snapshot: FinancialSnapshot) => void
  // NEW: Assistant History
  addAssistantMessage: (message: Omit<AssistantMessage, 'id' | 'createdAt'>) => void;
  updateSelectedFont: (font: string) => void;
}

export const useStore = create<StoreValue>((set, get) => ({
  data: emptyAppData(),
  ready: false,
  userId: null,

  setUserData: async (userId) => {
    if (!userId) {
      set({ userId })
      return
    }

    // Mark as not-ready to prevent the subscriber from writing stale
    // offline data to Supabase while the remote load is in flight.
    set({ userId, ready: false })

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const remote = await supabaseStorage.load(userId).catch(() => null)
      if (remote) {
        set({ data: remote, ready: true })
        storage.save(remote)
        return
      }
    }

    // Fallback: keep IndexedDB data (already loaded by auto-hydrate)
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
        data: {
          ...state.data,
          accounts: [...state.data.accounts, newAccount],
        },
      }
    });
    // Triggers save via subscriber
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
        data: {
          ...state.data,
          goals: [...state.data.goals, newGoal],
        },
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
        data: {
          ...state.data,
          reminders: [...state.data.reminders, newReminder],
        },
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
      data: {
        ...state.data,
        profile,
        accounts,
      },
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

  // NEW: Assistant History Actions
  addAssistantMessage: (message) => {
    set((state) => ({
      data: {
        ...state.data,
        assistantHistory: [{
          ...message,
          id: uid('asm'),
          createdAt: Date.now()
        }, ...state.data.assistantHistory],
      },
    }));
  },
}))

// Auto-hydrate from storage on client side
if (typeof window !== 'undefined') {
  storage.load().then((loaded) => {
    useStore.setState({ data: loaded, ready: true })
  })

  // Subscribe to updates and save to both IndexedDB and Supabase
  useStore.subscribe((state) => {
    if (!state.ready) return

    // Always save to IndexedDB (offline cache)
    storage.save(state.data)

    // Fire-and-forget save to Supabase when user is authenticated
    if (state.userId) {
      supabaseStorage.save(state.userId, state.data)
    }

    // Compute and persist stability snapshot (debounced by Zustand batching)
    if (state.userId && state.data.accounts.length > 0) {
      const snapshot = computeStabilitySnapshot(
        state.data.accounts,
        state.data.movements,
        state.data.reminders,
        state.userId,
      )
      supabaseStorage.saveSnapshot(snapshot)
    }
  })
}

// Dummy provider for compatibility (not needed for Zustand but keeps imports safe)
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

