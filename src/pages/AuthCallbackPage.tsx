import { useEffect, useMemo, useState } from 'react'
import { useStore, type Page, type User as AppUser } from '../store/useStore'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient'

function isGoogleSupabaseUser(user: { app_metadata?: unknown } | null | undefined): boolean {
  if (!user) return false
  const appMetadata = user.app_metadata as { provider?: unknown; providers?: unknown } | undefined
  if (appMetadata?.provider === 'google') return true
  if (Array.isArray(appMetadata?.providers) && appMetadata?.providers.includes('google')) return true
  return false
}

function toAppUser(user: { id: string; email?: string | null; created_at?: string; user_metadata?: unknown; email_confirmed_at?: unknown }): AppUser {
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
    createdAt: user.created_at ?? new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isVerified: Boolean(user.email_confirmed_at),
    status: 'active',
  }
}

function safeNextPage(next: string | null): Page {
  const allowed: Page[] = ['home', 'search', 'seller', 'product', 'favorites', 'profile', 'verify', 'cart', 'sellerDashboard']
  if (!next) return 'home'
  return (allowed as string[]).includes(next) ? (next as Page) : 'home'
}

export function AuthCallbackPage() {
  const navigate = useStore((s) => s.navigate)
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const nextPage = useMemo(() => {
    const url = new URL(window.location.href)
    const qNext = url.searchParams.get('next')
    const ssNext = sessionStorage.getItem('iraq_marketplace_auth_next_page')
    return safeNextPage(qNext ?? ssNext)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
        }

        setStatus('working')
        setErrorMsg(null)

        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) throw error
        if (cancelled) return

        const { data } = await supabase.auth.getSession()
        const session = data.session ?? null
        useStore.getState().setAuthToken(session?.access_token ?? null)
        const authed = Boolean(session?.user && isGoogleSupabaseUser(session.user))
        useStore.getState().setAuthenticated(authed)
        useStore.getState().setUser(authed && session?.user ? toAppUser(session.user) : null)

        sessionStorage.removeItem('iraq_marketplace_auth_next_page')
        window.history.replaceState(null, '', '/')
        setStatus('done')
        navigate(nextPage)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : String(err))
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [navigate, nextPage])

  if (status === 'working') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Completing sign-in…</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait.</p>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Signed in</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sign-in failed</h2>
        <p className="text-sm text-red-600 mb-4">{errorMsg ?? 'Unknown error'}</p>
        <button
          type="button"
          onClick={() => {
            window.history.replaceState(null, '', '/')
            navigate('profile')
          }}
          className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Go to Profile
        </button>
      </div>
    </div>
  )
}
