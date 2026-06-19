import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports, type ReportFilters } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Report } from '@/lib/types'
import { CATEGORY_LIST, type CategoryId, type ReportStatus } from '@/lib/categories'
import { DEFAULT_CENTER, useUserLocation } from '@/lib/geo'
import { ReportsMap } from '@/components/map/ReportsMap'
import { ReportCard } from '@/components/ReportCard'
import { Button, Spinner } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'

type StatusFilter = 'all' | 'open' | ReportStatus

export function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  const { coords, status: geoStatus } = useUserLocation()
  const center = coords ?? DEFAULT_CENTER

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
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-2">
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
            <div className="md:hidden flex rounded-lg border border-app overflow-hidden text-sm">
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
              <Button size="sm">
                <Icon name="plus" size={15} /> Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-7xl w-full px-4 py-3">
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Full-height split: list sidebar + immersive map */}
      <div className="flex flex-col-reverse md:flex-row">
        {/* List */}
        <aside
          className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-[380px] md:shrink-0 flex-col border-r border-app bg-app h-[60vh] md:h-[calc(100vh-8.5rem)] overflow-y-auto`}
        >
          {loading && reports.length === 0 ? (
            <div className="grid place-items-center py-16 text-soft">
              <Spinner />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-soft">No reports match these filters yet.</p>
              <Link
                to="/report"
                className="text-brand-600 font-medium hover:underline mt-2 inline-block"
              >
                Be the first to report →
              </Link>
            </div>
          ) : (
            <div className="p-3 space-y-2.5">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          )}
        </aside>

        {/* Map */}
        <div
          className={`${mobileView === 'map' ? 'block' : 'hidden'} md:block flex-1 relative h-[calc(100vh-8.5rem)] min-h-[24rem]`}
        >
          {geoStatus === 'denied' && (
            <div className="absolute z-[500] top-3 left-1/2 -translate-x-1/2 rounded-full bg-surface border border-app shadow px-3 py-1.5 text-xs text-soft">
              Showing Dubai — enable location to center on you
            </div>
          )}
          <ReportsMap reports={reports} className="h-full" center={center} zoom={13} showLocate />
        </div>
      </div>
    </div>
  )
}
