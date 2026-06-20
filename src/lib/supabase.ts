import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Surfaced clearly during dev so a missing env var never fails silently.
  // eslint-disable-next-line no-console
  console.warn(
    '[CivicSnap] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project values.',
  )
}

// Auth is delegated to Clerk (Supabase Third-Party Auth). Every request carries
// the current Clerk session token (which includes `sub` + `role: authenticated`);
// RLS reads `auth.jwt()->>'sub'`. When signed out the token is null, so public
// reads still work as anonymous.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  accessToken: async () => {
    try {
      return (await window.Clerk?.session?.getToken()) ?? null
    } catch {
      return null
    }
  },
})

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Public URL for a stored report photo, given its storage path. */
export function photoPublicUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return supabase.storage.from('report-photos').getPublicUrl(path).data.publicUrl
}
