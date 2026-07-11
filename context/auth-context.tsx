'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isStandalone: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
      useStore.getState().setUserData(session?.user?.id ?? null)
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
      useStore.getState().setUserData(session?.user?.id ?? null)
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
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isStandalone, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
