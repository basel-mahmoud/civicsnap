import { describe, it, expect } from 'vitest'

// Integration tests against the live Supabase REST API. They self-skip when no
// public env is present (e.g. unit-only CI), matching the project's convention.
const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const run = URL && KEY ? describe : describe.skip

run('integration: Row Level Security', () => {
  const headers = { apikey: KEY!, Authorization: `Bearer ${KEY!}` }

  it('anon CAN read reports (public select policy)', async () => {
    const res = await fetch(`${URL}/rest/v1/reports?select=id&limit=1`, { headers })
    expect(res.ok).toBe(true)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  it('anon CANNOT insert a report (insert policy requires auth.uid())', async () => {
    const res = await fetch(`${URL}/rest/v1/reports`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'rls-probe', category: 'other', severity: 'low', lat: 0, lng: 0 }),
    })
    expect(res.ok).toBe(false) // 401/403 — RLS denies anonymous writes
  })
})
