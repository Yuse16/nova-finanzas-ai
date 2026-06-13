// Core domain types for Nova Finanzas AI
// All types are JSON-serializable so they can be persisted to IndexedDB /
// localStorage today and migrated to Supabase later without changes.

export type AccountType =
  | 'efectivo'
  | 'debito'
  | 'credito'
  | 'ahorro'
  | 'inversion'
  | 'deudas'

export type MovementType =
  | 'gasto'
  | 'ingreso'
  | 'transferencia'
  | 'deuda'
  | 'prestamo'

export type Method =
  | 'Efectivo'
  | 'Débito'
  | 'Crédito'
  | 'Ahorro'
  | 'Inversión'
  | 'Otro'

export type Account = {
  id: string
  name: string
  type: AccountType
  /**
   * Current balance. For liability accounts (credito, deudas) this is stored
   * as a negative number so the global balance math is consistent.
   */
  balance: number
  /** Icon key resolved against the icon registry at render time. */
  icon: string
  color: string
  createdAt: number
  updatedAt: number
}

export type Movement = {
  id: string
  title: string
  category: string
  /** Always stored as a positive magnitude; sign is derived from `type`. */
  amount: number
  type: MovementType
  /** Account id this movement debits/credits. */
  accountId: string | null
  /** Destination account id for transfers. */
  toAccountId?: string | null
  method: Method | string
  /** ISO date string (yyyy-mm-dd or full ISO). */
  date: string
  person?: string
  note?: string
  icon: string
  color: string
  createdAt: number
}

export type Goal = {
  id: string
  title: string
  saved: number
  target: number
  /** ISO date string for the target date. */
  date: string
  icon: string
  color: string
  image?: string
  createdAt: number
}

export type Reminder = {
  id: string
  title: string
  amount: number
  /** ISO date string for the due date. */
  dueDate: string
  recurring: 'none' | 'monthly' | 'weekly' | 'yearly'
  completed: boolean
  icon: string
  color: string
  createdAt: number
}

export type UserProfile = {
  name: string
  onboarded: boolean
  createdAt: number
}

export type AppData = {
  profile: UserProfile | null
  accounts: Account[]
  movements: Movement[]
  goals: Goal[]
  reminders: Reminder[]
  version: number
}

export const CURRENT_DATA_VERSION = 1

export function emptyAppData(): AppData {
  return {
    profile: null,
    accounts: [],
    movements: [],
    goals: [],
    reminders: [],
    version: CURRENT_DATA_VERSION,
  }
}
