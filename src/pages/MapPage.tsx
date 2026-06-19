import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports, type ReportFilters } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Report } from '@/lib/types'
import { CATEGORY_LIST, type CategoryId, type ReportStatus } from '@/lib/categories'
import { ReportsMap } from '@/components/map/ReportsMap'
import { ReportCard } from '@/components/ReportCard'
import { Button, Spinner } from '@/components/ui'

type StatusFilter = 'all' | 'open' | ReportStatus

export function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  const filters = useMemo<ReportFilters>(() => ({ category, status }), [category, status])

  async function load() {
    try {
      setError(null)
      const data = await listReports(filters)
      setReports(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Realtime: refetch whenever reports change anywhere.
  useEffect(() => {
    const channel = supabase
      .channel('reports-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        void load()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  return (
    <div className="flex-1 flex flex-col">
      {/* Filter bar */}
      <div className="border-b border-app bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
            className="h-9 rounded-lg border border-app bg-app text-app text-sm px-2"
          >
            <option value="all">All categories</option>
            {CATEGORY_LIST.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg border border-app overflow-hidden text-sm">
            {(
              [
                ['all', 'All'],
                ['open', 'Open'],
                ['fixed', 'Fixed'],
              ] as [StatusFilter, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatus(val)}
                className={`px-3 h-9 ${
                  status === val ? 'bg-brand-600 text-white' : 'bg-app text-soft hover:text-app'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-sm text-soft ml-1">
            {loading ? '…' : `${reports.length} report${reports.length === 1 ? '' : 's'}`}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile view toggle */}
            <div className="sm:hidden flex rounded-lg border border-app overflow-hidden text-sm">
              <button
                onClick={() => setMobileView('map')}
                className={`px-3 h-9 ${mobileView === 'map' ? 'bg-muted2 text-app' : 'text-soft'}`}
              >
                Map
              </button>
              <button
                onClick={() => setMobileView('list')}
                className={`px-3 h-9 ${mobileView === 'list' ? 'bg-muted2 text-app' : 'text-soft'}`}
              >
                List
              </button>
            </div>
            <Link to="/report">
              <Button size="sm">+ Report</Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-6xl w-full px-4 py-3">
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Split layout */}
      <div className="flex-1 mx-auto max-w-6xl w-full grid sm:grid-cols-[1fr_360px] gap-0 sm:gap-4 sm:px-4 sm:py-4">
        {/* Map */}
        <div
          className={`${mobileView === 'map' ? 'block' : 'hidden'} sm:block min-h-[60vh] sm:min-h-[70vh] sm:rounded-2xl overflow-hidden border-app sm:border`}
        >
          {loading && reports.length === 0 ? (
            <div className="h-full grid place-items-center text-soft">
              <Spinner />
            </div>
          ) : (
            <ReportsMap reports={reports} className="h-full" />
          )}
        </div>

        {/* List */}
        <div
          className={`${mobileView === 'list' ? 'block' : 'hidden'} sm:block px-4 sm:px-0 py-4 sm:py-0 space-y-2.5 sm:max-h-[70vh] sm:overflow-y-auto`}
        >
          {loading && reports.length === 0 ? (
            <p className="text-soft text-sm">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-soft">No reports match these filters.</p>
              <Link to="/report" className="text-brand-600 font-medium hover:underline mt-2 inline-block">
                Be the first to report →
              </Link>
            </div>
          ) : (
            reports.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </div>
      </div>
    </div>
  )
}
