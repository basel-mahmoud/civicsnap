/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}

interface Window {
  Clerk?: {
    session?: { getToken: () => Promise<string | null> } | null
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
