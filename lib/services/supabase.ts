import type { AppData } from '../types'

/**
 * Supabase data source interface.
 *
 * The app currently runs entirely on the local `storage` backend. This
 * interface documents the contract a future Supabase-backed repository must
 * fulfil so the swap is a drop-in replacement. No network calls are made yet.
 *
 * Suggested schema (for future migration):
 *   profiles(id uuid pk, name text, onboarded bool, created_at timestamptz)
 *   accounts(id uuid pk, user_id uuid fk, name, type, balance, icon, color, ...)
 *   movements(id uuid pk, user_id uuid fk, title, category, amount, type,
 *             account_id, to_account_id, method, date, person, note, ...)
 *   goals(id uuid pk, user_id uuid fk, title, saved, target, date, icon, color)
 *   reminders(id uuid pk, user_id uuid fk, title, amount, due_date, recurring,
 *             completed, icon, color)
 * All tables protected with Row Level Security scoped to auth.uid().
 */
export interface RemoteDataSource {
  fetchAll(userId: string): Promise<AppData>
  pushAll(userId: string, data: AppData): Promise<void>
}

export const SUPABASE_READY = false

/**
 * Placeholder that will be replaced by a real Supabase client once the
 * integration is connected. Throwing keeps accidental usage obvious.
 */
export function createSupabaseDataSource(): RemoteDataSource {
  return {
    async fetchAll() {
      throw new Error('Supabase no está conectado todavía.')
    },
    async pushAll() {
      throw new Error('Supabase no está conectado todavía.')
    },
  }
}
