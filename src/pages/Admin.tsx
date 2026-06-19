import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports, updateReportStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Report } from '@/lib/types'
import {
  STATUS_FLOW,
  STATUS_META,
  type ReportStatus,
} from '@/lib/categories'
import { CategoryBadge, SeverityBadge, StatusBadge } from '@/components/badges'
import { Card, Spinner } from '@/components/ui'
import { timeAgo } from '@/lib/time'

export function Admin() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'open' | 'all'>('open')

  async function load() {
    const data = await listReports({ status: tab === 'open' ? 'open' : 'all' })
    setReports(data)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    const channel = supabase
      .channel('admin-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const stats = useMemo(() => {
    const by: Record<string, number> = {}
    for (const r of reports) by[r.status] = (by[r.status] ?? 0) + 1
    return by
  }, [reports])

  async function setStatus(id: string, status: ReportStatus) {
    setSavingId(id)
    try {
      await updateReportStatus(id, status)
      await load()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-app">Admin dashboard</h1>
      <p className="mt-1 text-soft">Triage and resolve reports across the city.</p>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['reported', 'acknowledged', 'in_progress', 'fixed'] as ReportStatus[]).map((s) => (
          <Card key={s} className="p-4">
            <p className="text-2xl font-bold" style={{ color: STATUS_META[s].color }}>
              {stats[s] ?? 0}
            </p>
            <p className="text-sm text-soft">{STATUS_META[s].label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex rounded-lg border border-app overflow-hidden text-sm w-fit">
        {(['open', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 h-9 capitalize ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-app text-soft hover:text-app'
            }`}
          >
            {t === 'open' ? 'Open queue' : 'All reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-soft">
          <Spinner />
        </div>
      ) : reports.length === 0 ? (
        <p className="py-12 text-center text-soft">Nothing here. 🎉</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <Link to={`/report/${r.id}`} className="font-semibold text-app hover:text-brand-600">
                  {r.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusBadge status={r.status} />
                  <CategoryBadge category={r.category} />
                  <SeverityBadge severity={r.severity} />
                  <span className="text-xs text-soft self-center">
                    👍 {r.upvote_count} · {timeAgo(r.created_at)}
                  </span>
                </div>
              </div>
              <select
                value={STATUS_FLOW.includes(r.status) ? r.status : ''}
                disabled={savingId === r.id}
                onChange={(e) => setStatus(r.id, e.target.value as ReportStatus)}
                className="h-9 rounded-lg border border-app bg-app text-app text-sm px-2"
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
                <option value="rejected">Rejected</option>
              </select>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
