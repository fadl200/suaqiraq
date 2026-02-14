import { type Session, type User as SupabaseUser } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStore, type User as AppUser } from '../store/useStore'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient'

type SupabaseAuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: SupabaseUser | null
  isGoogleUser: boolean
  error: string | null
  signInWithGoogle: (nextPage?: string) => Promise<void>
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null)

function isGoogleSupabaseUser(user: SupabaseUser | null | undefined): boolean {
  if (!user) return false
  const appMetadata = user.app_metadata as { provider?: unknown; providers?: unknown } | undefined
  if (appMetadata?.provider === 'google') return true
  if (Array.isArray(appMetadata?.providers) && appMetadata?.providers.includes('google')) return true
  return false
}

function toAppUser(user: SupabaseUser): AppUser {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : user.email
        ? user.email.split('@')[0] ?? ''
        : ''
  const avatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined

  return {
    id: user.id,
    email: user.email ?? '',
    phone: '',
    name: name || 'User',
    nameAr: name || 'مستخدم',
    role: 'seller',
    avatar,
    createdAt: user.created_at,
    lastLogin: new Date().toISOString(),
    isVerified: Boolean(user.email_confirmed_at),
    status: 'active',
  }
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const setAuthenticated = useStore((s) => s.setAuthenticated)
  const setAuthToken = useStore((s) => s.setAuthToken)
  const setUser = useStore((s) => s.setUser)
  const navigate = useStore((s) => s.navigate)
  const consumeAuthNextPage = useStore((s) => s.consumeAuthNextPage)

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  const user = session?.user ?? null
  const isGoogleUser = useMemo(() => isGoogleSupabaseUser(user), [user])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setError(null)
      if (!isSupabaseConfigured || !supabase) {
        setSession(null)
        setAuthenticated(false)
        setAuthToken(null)
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error) throw error
        setSession(data.session ?? null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setSession(null)
        setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()

    if (!isSupabaseConfigured || !supabase) return () => {}

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [setAuthenticated, setAuthToken, setUser])

  useEffect(() => {
    const accessToken = session?.access_token ?? null
    const authed = Boolean(session?.user && isGoogleSupabaseUser(session.user))
    setAuthToken(accessToken)
    setAuthenticated(authed)
    setUser(authed && session?.user ? toAppUser(session.user) : null)

    if (session?.user && isGoogleSupabaseUser(session.user)) {
      const next = consumeAuthNextPage()
      if (next) navigate(next)
    }
  }, [consumeAuthNextPage, navigate, session, setAuthenticated, setAuthToken, setUser])

  async function signInWithGoogle(nextPage?: string) {
    setError(null)
    if (!isSupabaseConfigured || !supabase) {
      setError('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
      return
    }

    const next = nextPage ?? 'home'
    sessionStorage.setItem('iraq_marketplace_auth_next_page', next)
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  async function signOut() {
    setError(null)
    if (!supabase) {
      setSession(null)
      setAuthenticated(false)
      setAuthToken(null)
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      isGoogleUser,
      error,
      signInWithGoogle,
      signOut,
    }),
    [error, isGoogleUser, loading, session, user],
  )

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>
}

export function useSupabaseAuth() {
  const ctx = useContext(SupabaseAuthContext)
  if (!ctx) throw new Error('useSupabaseAuth must be used within <SupabaseAuthProvider>')
  return ctx
}
