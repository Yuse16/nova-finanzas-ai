'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  Account,
  AppData,
  Goal,
  Movement,
  Reminder,
  UserProfile,
} from './types'
import { emptyAppData } from './types'
import { storage } from './storage'
import { uid } from './format'
import { getAccountTypeMeta, methodToAccountType } from './catalog'

// ---- Actions --------------------------------------------------------------

type Action =
  | { type: 'HYDRATE'; data: AppData }
  | { type: 'COMPLETE_ONBOARDING'; profile: UserProfile; accounts: Account[] }
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'UPDATE_ACCOUNT'; account: Account }
  | { type: 'DELETE_ACCOUNT'; id: string }
  | { type: 'ADD_MOVEMENT'; movement: Movement }
  | { type: 'UPDATE_MOVEMENT'; prev: Movement; next: Movement }
  | { type: 'DELETE_MOVEMENT'; movement: Movement }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'UPDATE_GOAL'; goal: Goal }
  | { type: 'DELETE_GOAL'; id: string }
  | { type: 'ADD_REMINDER'; reminder: Reminder }
  | { type: 'UPDATE_REMINDER'; reminder: Reminder }
  | { type: 'DELETE_REMINDER'; id: string }
  | { type: 'RESET' }

// ---- Balance side-effects -------------------------------------------------

/** Apply a movement's effect to account balances. */
function applyMovement(accounts: Account[], m: Movement, sign = 1): Account[] {
  return accounts.map((acc) => {
    let balance = acc.balance
    const liability = getAccountTypeMeta(acc.type).liability

    if (m.type === 'transferencia') {
      if (acc.id === m.accountId) balance -= sign * m.amount
      if (acc.id === m.toAccountId) balance += sign * m.amount
      return { ...acc, balance, updatedAt: Date.now() }
    }

    if (acc.id !== m.accountId) return acc

    if (m.type === 'gasto' || m.type === 'prestamo') {
      // money leaves the account; for liability accounts (credit) the debt grows
      balance -= sign * m.amount * (liability ? 1 : 1)
    } else if (m.type === 'ingreso') {
      balance += sign * m.amount
    } else if (m.type === 'deuda') {
      // borrowing: cash comes in but it is owed (handled via deudas account)
      balance += sign * m.amount
    }
    return { ...acc, balance, updatedAt: Date.now() }
  })
}

// ---- Reducer --------------------------------------------------------------

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'HYDRATE':
      return action.data

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        profile: action.profile,
        accounts: action.accounts,
      }

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.account] }

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.account.id ? action.account : a,
        ),
      }

    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
      }

    case 'ADD_MOVEMENT':
      return {
        ...state,
        movements: [action.movement, ...state.movements],
        accounts: applyMovement(state.accounts, action.movement, 1),
      }

    case 'UPDATE_MOVEMENT': {
      // reverse the previous effect, then apply the next
      let accounts = applyMovement(state.accounts, action.prev, -1)
      accounts = applyMovement(accounts, action.next, 1)
      return {
        ...state,
        movements: state.movements.map((m) =>
          m.id === action.next.id ? action.next : m,
        ),
        accounts,
      }
    }

    case 'DELETE_MOVEMENT':
      return {
        ...state,
        movements: state.movements.filter((m) => m.id !== action.movement.id),
        accounts: applyMovement(state.accounts, action.movement, -1),
      }

    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.goal] }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goal.id ? action.goal : g,
        ),
      }

    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }

    case 'ADD_REMINDER':
      return { ...state, reminders: [...state.reminders, action.reminder] }

    case 'UPDATE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.reminder.id ? action.reminder : r,
        ),
      }

    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter((r) => r.id !== action.id),
      }

    case 'RESET':
      return emptyAppData()

    default:
      return state
  }
}

// ---- Context --------------------------------------------------------------

type StoreValue = {
  data: AppData
  ready: boolean
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
  // method -> account resolution
  resolveAccountIdByMethod: (method: string) => string | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, emptyAppData)
  const [ready, setReady] = useState(false)
  const hydrated = useRef(false)

  // Hydrate from persistence on mount
  useEffect(() => {
    let active = true
    storage.load().then((loaded) => {
      if (!active) return
      dispatch({ type: 'HYDRATE', data: loaded })
      hydrated.current = true
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  // Persist on every change after hydration
  useEffect(() => {
    if (!hydrated.current) return
    storage.save(data)
  }, [data])

  const value = useMemo<StoreValue>(() => {
    const resolveAccountIdByMethod = (method: string): string | null => {
      const type = methodToAccountType[method]
      if (type) {
        const match = data.accounts.find((a) => a.type === type)
        if (match) return match.id
      }
      return data.accounts[0]?.id ?? null
    }

    return {
      data,
      ready,
      addAccount: (input) =>
        dispatch({
          type: 'ADD_ACCOUNT',
          account: {
            ...input,
            id: uid('acc'),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        }),
      updateAccount: (account) =>
        dispatch({ type: 'UPDATE_ACCOUNT', account }),
      deleteAccount: (id) => dispatch({ type: 'DELETE_ACCOUNT', id }),

      addMovement: (input) =>
        dispatch({
          type: 'ADD_MOVEMENT',
          movement: { ...input, id: uid('mov'), createdAt: Date.now() },
        }),
      updateMovement: (next) => {
        const prev = data.movements.find((m) => m.id === next.id)
        if (prev) dispatch({ type: 'UPDATE_MOVEMENT', prev, next })
      },
      deleteMovement: (movement) =>
        dispatch({ type: 'DELETE_MOVEMENT', movement }),

      addGoal: (input) =>
        dispatch({
          type: 'ADD_GOAL',
          goal: { ...input, id: uid('goal'), createdAt: Date.now() },
        }),
      updateGoal: (goal) => dispatch({ type: 'UPDATE_GOAL', goal }),
      deleteGoal: (id) => dispatch({ type: 'DELETE_GOAL', id }),
      addToGoal: (id, amount) => {
        const goal = data.goals.find((g) => g.id === id)
        if (goal)
          dispatch({
            type: 'UPDATE_GOAL',
            goal: { ...goal, saved: Math.max(0, goal.saved + amount) },
          })
      },

      addReminder: (input) =>
        dispatch({
          type: 'ADD_REMINDER',
          reminder: { ...input, id: uid('rem'), createdAt: Date.now() },
        }),
      updateReminder: (reminder) =>
        dispatch({ type: 'UPDATE_REMINDER', reminder }),
      deleteReminder: (id) => dispatch({ type: 'DELETE_REMINDER', id }),
      toggleReminder: (id) => {
        const r = data.reminders.find((x) => x.id === id)
        if (r)
          dispatch({
            type: 'UPDATE_REMINDER',
            reminder: { ...r, completed: !r.completed },
          })
      },

      completeOnboarding: (profile, accounts) =>
        dispatch({ type: 'COMPLETE_ONBOARDING', profile, accounts }),
      reset: () => {
        storage.clear()
        dispatch({ type: 'RESET' })
      },
      resolveAccountIdByMethod,
    }
  }, [data, ready])

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  )
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
