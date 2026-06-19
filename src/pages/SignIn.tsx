import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Logo } from '@/components/Logo'
import { Button, Field, inputClass } from '@/components/ui'

export function SignIn() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/map'

  const [mode, setMode] = useState<'signin' | 'signup'>(
    params.get('mode') === 'signup' ? 'signup' : 'signin',
  )
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, displayName.trim())
        // If email confirmation is on, there is no session yet.
        setNotice('Account created. You can sign in now.')
        setMode('signin')
      } else {
        await signIn(email.trim(), password)
        navigate(redirect)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <Logo className="size-9" />
          Civic<span className="text-brand-600 -ml-2">Snap</span>
        </Link>

        <div className="bg-surface border border-app rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-app">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-soft">
            {mode === 'signup'
              ? 'Join your neighbors and start reporting.'
              : 'Sign in to report and track issues.'}
          </p>

          {!isSupabaseConfigured && (
            <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
              Backend not configured yet — set your Supabase env vars to enable auth.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {mode === 'signup' && (
              <Field label="Display name">
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jordan from Maple St."
                  required
                  maxLength={60}
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </Field>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {notice && <p className="text-sm text-brand-600">{notice}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-soft">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup')
                setError(null)
                setNotice(null)
              }}
              className="font-medium text-brand-600 hover:underline"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
