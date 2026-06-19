import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Logo } from './Logo'
import { Button } from './ui'
import { Icon } from './icons/Icon'

function navClass({ isActive }: { isActive: boolean }) {
  return `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-muted2 text-app' : 'text-soft hover:text-app hover:bg-muted2'
  }`
}

export function Layout() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-full flex flex-col bg-app">
      <header className="sticky top-0 z-[1000] border-b border-app bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
            <Logo />
            <span className="hidden sm:inline">
              Civic<span className="text-brand-600">Snap</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
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
              className="size-9 grid place-items-center rounded-lg text-soft hover:text-app hover:bg-muted2 transition"
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="size-9 grid place-items-center rounded-full bg-brand-600 text-white font-semibold"
                  aria-label="Account menu"
                >
                  {(profile?.display_name ?? session.user.email ?? '?')[0]?.toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 z-20 bg-surface border border-app rounded-xl shadow-lg p-1.5">
                      <div className="px-3 py-2 border-b border-app mb-1">
                        <p className="text-sm font-medium text-app truncate">
                          {profile?.display_name ?? 'Resident'}
                        </p>
                        <p className="text-xs text-soft truncate">{session.user.email}</p>
                      </div>
                      <Link
                        to="/me"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm text-app hover:bg-muted2"
                      >
                        My reports
                      </Link>
                      <button
                        onClick={async () => {
                          setMenuOpen(false)
                          await signOut()
                          navigate('/')
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-muted2"
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

      <footer className="border-t border-app bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-soft">
          <p>CivicSnap — report, track, and fix neighborhood issues together.</p>
          <p>Built with React, Supabase &amp; Claude vision.</p>
        </div>
      </footer>
    </div>
  )
}
