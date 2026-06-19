import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Spinner } from './ui'

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactNode
  adminOnly?: boolean
}) {
  const { session, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center py-24 text-soft">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/signin?redirect=${redirect}`} replace />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="flex-1 grid place-items-center py-24 text-center px-4">
        <div>
          <h1 className="text-xl font-bold text-app">Admins only</h1>
          <p className="mt-2 text-soft">This area is for city/admin accounts.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
