import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Logo } from './Logo'
import { Button } from './ui'
import { Icon } from './icons/Icon'

function navClass({ isActive }: { isActive: boolean }) {
  return `telemetry px-3 py-1 transition-colors ${
    isActive ? 'text-accent' : 'text-soft hover:text-app'
  }`
}

export function Layout() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-full flex flex-col bg-app">
      <header className="sticky top-0 z-[1000] border-b-2 border-app bg-surface">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <Logo className="size-7" />
            <span className="font-display text-lg uppercase tracking-tight leading-none">
              Civic<span className="text-accent">Snap</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/map" className={navClass}>
              Map
            </NavLink>
            <NavLink to="/report" className={navClass}>
              Report
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="size-9 grid place-items-center border-2 border-app text-app hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="size-9 grid place-items-center bg-[var(--accent)] text-white font-mono font-bold border-2 border-[var(--accent)]"
                  aria-label="Account menu"
                >
                  {(profile?.display_name ?? session.user.email ?? '?')[0]?.toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 z-20 bg-surface border-2 border-app p-0">
                      <div className="px-3 py-2.5 border-b-2 border-app">
                        <p className="text-sm font-semibold text-app truncate">
                          {profile?.display_name ?? 'Resident'}
                        </p>
                        <p className="telemetry text-soft truncate mt-0.5">{session.user.email}</p>
                      </div>
                      <Link
                        to="/me"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2.5 telemetry text-app hover:bg-muted2 border-b border-soft"
                      >
                        My reports
                      </Link>
                      <button
                        onClick={async () => {
                          setMenuOpen(false)
                          await signOut()
                          navigate('/')
                        }}
                        className="w-full text-left px-3 py-2.5 telemetry text-accent hover:bg-muted2"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate('/signin')}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
