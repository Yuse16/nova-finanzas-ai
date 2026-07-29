'use client'

export type GuestState = {
  mode: 'guest' | 'none'
  guestId: string
  createdAt: number
  onboardingCompleted: boolean
}

const LS_KEY = 'mpume:guest'
const COOKIE_NAME = 'mpume_guest'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function serializeCookie(value: string): string {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`
}

function deleteCookie(): void {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0`
}

export function loadGuestState(): GuestState {
  if (typeof window === 'undefined') {
    return { mode: 'none', guestId: '', createdAt: 0, onboardingCompleted: false }
  }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GuestState
      if (parsed.mode === 'guest' && parsed.guestId) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { mode: 'none', guestId: '', createdAt: 0, onboardingCompleted: false }
}

export function saveGuestState(state: GuestState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function enableGuestMode(): GuestState {
  const existing = loadGuestState()
  if (existing.mode === 'guest' && existing.guestId) {
    if (typeof document !== 'undefined') {
      document.cookie = serializeCookie(existing.guestId)
    }
    return existing
  }
  const state: GuestState = {
    mode: 'guest',
    guestId: generateId(),
    createdAt: Date.now(),
    onboardingCompleted: false,
  }
  saveGuestState(state)
  if (typeof document !== 'undefined') {
    document.cookie = serializeCookie(state.guestId)
  }
  return state
}

export function completeGuestOnboarding(): void {
  const state = loadGuestState()
  if (state.mode !== 'guest') return
  state.onboardingCompleted = true
  saveGuestState(state)
}

export function disableGuestMode(): void {
  const state: GuestState = {
    mode: 'none',
    guestId: '',
    createdAt: 0,
    onboardingCompleted: false,
  }
  saveGuestState(state)
  if (typeof document !== 'undefined') {
    deleteCookie()
  }
}

export function isGuest(): boolean {
  return loadGuestState().mode === 'guest'
}
