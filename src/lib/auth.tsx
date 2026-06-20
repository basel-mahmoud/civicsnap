import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { supabase } from './supabase'
import type { Profile } from './types'

interface SessionLike {
  user: { id: string; email: string | null }
}

interface AuthState {
  session: SessionLike | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Upsert (idempotent) the profile row keyed by the Clerk user id, then read it
// back for the role. RLS allows a user to insert/select only their own profile.
async function syncProfile(userId: string, displayName: string | null): Promise<Profile | null> {
  await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: displayName }, { onConflict: 'id', ignoreDuplicates: true })
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    console.error('[auth] profile sync failed', error.message)
    return null
  }
  return (data as Profile) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, signOut: clerkSignOut } = useClerkAuth()
  const { user } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!isLoaded) return
    if (isSignedIn && userId) {
      setProfileLoading(true)
      const name = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null
      syncProfile(userId, name).then((p) => {
        if (!active) return
        setProfile(p)
        setProfileLoading(false)
      })
    } else {
      setProfile(null)
    }
    return () => {
      active = false
    }
  }, [isLoaded, isSignedIn, userId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const session: SessionLike | null =
    isSignedIn && userId
      ? { user: { id: userId, email: user?.primaryEmailAddress?.emailAddress ?? null } }
      : null

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading: !isLoaded || profileLoading,
      isAdmin: profile?.role === 'admin',
      async signOut() {
        await clerkSignOut()
        setProfile(null)
      },
      async refreshProfile() {
        if (userId) {
          setProfile(await syncProfile(userId, user?.fullName ?? null))
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user.id, profile, isLoaded, profileLoading, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
