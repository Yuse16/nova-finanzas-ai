'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { loadGuestState, enableGuestMode, disableGuestMode, completeGuestOnboarding, isGuest as checkIsGuest, type GuestState } from '@/lib/guest-storage'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isStandalone: boolean
  isGuest: boolean
  guestState: GuestState
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  enableGuestMode: () => void
  exitGuestMode: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [isGuest, setIsGuest] = useState(false)
  const [guestState, setGuestState] = useState<GuestState>(() => loadGuestState())

  const detectStandalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true)

  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(detectStandalone())
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setIsGuest(!session && checkIsGuest())

      const gs = loadGuestState()
      setGuestState(gs)

      if (session?.user?.id) {
        useStore.getState().setUserData(session.user.id)
      } else if (gs.mode === 'guest') {
        useStore.getState().setUserData(null)
      }

      setLoading(false)
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const standalone = detectStandalone()
      console.log(
        `[AUTH] onAuthStateChange evento="${event}" standalone=${standalone}`,
        session ? `usuario ${session.user.email}` : 'sin sesión',
      )
      setSession(session)
      setUser(session?.user ?? null)

      const gs = loadGuestState()
      const wasGuest = gs.mode === 'guest'

      if (session?.user?.id) {
        // Transition: guest → authenticated
        if (wasGuest) {
          disableGuestMode()
        }
        setIsGuest(false)
        setGuestState({ mode: 'none', guestId: '', createdAt: 0, onboardingCompleted: false })
        useStore.getState().setUserData(session.user.id)
      } else {
        setIsGuest(false)
        setGuestState(loadGuestState())
        useStore.getState().setUserData(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null, user: data.user }
  }

  const signInWithGoogle = async () => {
    const standalone = detectStandalone()
    console.log(
      `[AUTH] signInWithGoogle — modo: ${standalone ? 'standalone (PWA)' : 'navegador'}`,
      `redirigiendo a: ${window.location.origin}/auth/callback`,
    )
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsGuest(false)
    setGuestState(loadGuestState())
    useStore.getState().setUserData(null)
  }

  const handleEnableGuestMode = useCallback(() => {
    const gs = enableGuestMode()
    setGuestState(gs)
    setIsGuest(true)
    useStore.getState().setUserData(null)
  }, [])

  const handleExitGuestMode = useCallback(() => {
    disableGuestMode()
    setGuestState({ mode: 'none', guestId: '', createdAt: 0, onboardingCompleted: false })
    setIsGuest(false)
    useStore.getState().setUserData(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isStandalone,
        isGuest,
        guestState,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        enableGuestMode: handleEnableGuestMode,
        exitGuestMode: handleExitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
