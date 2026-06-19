import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { listMyReports } from '@/lib/api'
import type { Report } from '@/lib/types'
import { ReportCard } from '@/components/ReportCard'
import { Button, Spinner } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'

export function MyReports() {
  const { session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    listMyReports(session.user.id)
      .then(setReports)
      .finally(() => setLoading(false))
  }, [session])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-app">My reports</h1>
        <Link to="/report">
          <Button size="sm">
            <Icon name="plus" size={15} /> New report
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-soft">
          <Spinner />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-soft">You haven't reported anything yet.</p>
          <Link to="/report" className="text-brand-600 font-medium hover:underline mt-2 inline-block">
            Make your first report →
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  )
}
