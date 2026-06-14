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
  notifiedAt?: number; // NEW: Timestamp when the reminder was last notified
  snoozeUntil?: number; // NEW: Timestamp until when the reminder is snoozed
}

// NEW: Assistant Conversation History
export type AssistantMessage = {
  id: string;
  question: string;
  answer: string;
  breakdown?: { label: string; amount: number; percent: number; color: string }[];
  createdAt: number;
}

export type UserProfile = {
  name: string
  onboarded: boolean
  createdAt: number
  selectedFont: string // NEW: Store the selected font preference
}

// NEW: Define available font options
export const availableFonts = [
  { label: 'System UI', value: 'system' }, // Default system font
  { label: 'Inter', value: 'var(--font-inter)' }, // Example using a CSS variable for Inter
  { label: 'Roboto Mono', value: 'var(--font-roboto-mono)' }, // Example using a CSS variable for Roboto Mono
]

export type AppData = {
  profile: UserProfile | null
  accounts: Account[]
  movements: Movement[]
  goals: Goal[]
  reminders: Reminder[]
  assistantHistory: AssistantMessage[]; // NEW: Assistant History
  version: number
}

export const CURRENT_DATA_VERSION = 1

export function emptyAppData(): AppData {
  return {
    profile: {
      name: '',
      onboarded: false,
      createdAt: Date.now(),
      selectedFont: 'system',
    },
    accounts: [],
    movements: [],
    goals: [],
    reminders: [],
    assistantHistory: [], // Initialize new field
    version: CURRENT_DATA_VERSION,
  }
}
