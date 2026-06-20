import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import {
  addComment,
  deleteReport,
  getReport,
  hasUpvoted,
  listComments,
  listStatusEvents,
  namesByIds,
  setUpvote,
  updateReportStatus,
} from '@/lib/api'
import { photoPublicUrl } from '@/lib/supabase'
import type { Comment, Report, StatusEvent } from '@/lib/types'
import { STATUS_FLOW, type ReportStatus } from '@/lib/categories'
import { CategoryBadge, SeverityBadge, StatusBadge } from '@/components/badges'
import { StatusTimeline } from '@/components/StatusTimeline'
import { ReportsMap } from '@/components/map/ReportsMap'
import { Button, Card, Spinner, inputClass } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { fullDate, timeAgo } from '@/lib/time'

export function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const { session, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [report, setReport] = useState<Report | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [upvoted, setUpvoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = Boolean(
    report && session && (report.reporter_id === session.user.id || isAdmin),
  )

  async function removeReport() {
    if (!report || !canDelete) return
    if (!confirm('Delete this report permanently? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteReport(report.id)
      navigate('/map')
    } catch (err) {
      setDeleting(false)
      alert(err instanceof Error ? err.message : 'Could not delete the report.')
    }
  }

  async function loadAll() {
    if (!id) return
    try {
      const r = await getReport(id)
      if (!r) {
        setNotFound(true)
        return
      }
      setReport(r)
      const [ev, cm] = await Promise.all([listStatusEvents(id), listComments(id)])
      setEvents(ev)
      setComments(cm)
      const ids = [
        r.reporter_id,
        ...cm.map((c) => c.author_id),
        ...ev.map((e) => e.changed_by),
      ].filter(Boolean) as string[]
      setNames(await namesByIds(ids))
      if (session) setUpvoted(await hasUpvoted(id, session.user.id))
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session?.user.id])

  async function toggleUpvote() {
    if (!session) {
      navigate(`/signin?redirect=/report/${id}`)
      return
    }
    if (!report) return
    const next = !upvoted
    setUpvoted(next)
    setReport({ ...report, upvote_count: report.upvote_count + (next ? 1 : -1) })
    try {
      await setUpvote(report.id, session.user.id, next)
    } catch {
      // revert on failure
      setUpvoted(!next)
      setReport({ ...report, upvote_count: report.upvote_count })
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !report || !commentText.trim()) return
    setPosting(true)
    try {
      const c = await addComment(report.id, session.user.id, commentText.trim())
      setComments((prev) => [...prev, c])
      setCommentText('')
      if (!names.has(session.user.id)) {
        setNames(await namesByIds([session.user.id]))
      }
    } finally {
      setPosting(false)
    }
  }

  async function changeStatus(status: ReportStatus) {
    if (!report) return
    setSavingStatus(true)
    try {
      await updateReportStatus(report.id, status)
      await loadAll()
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center py-24 text-soft">
        <Spinner />
      </div>
    )
  }

  if (notFound || !report) {
    return (
      <div className="flex-1 grid place-items-center py-24 text-center px-4">
        <div>
          <h1 className="text-xl font-bold text-app">Report not found</h1>
          <Link to="/map" className="text-brand-600 hover:underline mt-2 inline-block">
            Back to the map →
          </Link>
        </div>
      </div>
    )
  }

  const img = photoPublicUrl(report.photo_path)
  const reporterName = report.reporter_id ? names.get(report.reporter_id) ?? 'Resident' : 'Anonymous'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link to="/map" className="inline-flex items-center gap-1 text-sm text-soft hover:text-app">
        <Icon name="arrow-left" size={15} /> Back to map
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-app">{report.title}</h1>
          <p className="mt-1 text-sm text-soft">
            Reported by {reporterName} · {timeAgo(report.created_at)}
          </p>
        </div>
        <button
          onClick={toggleUpvote}
          aria-pressed={upvoted}
          aria-label={`${upvoted ? 'Remove upvote' : 'Upvote'} — ${report.upvote_count} so far`}
          className={`flex items-center gap-2 rounded-xl border px-4 h-11 font-semibold transition ${
            upvoted
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'border-app bg-surface text-app hover:border-brand-400'
          }`}
        >
          <Icon name="thumbs-up" size={18} /> <span>{report.upvote_count}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={report.status} />
        <CategoryBadge category={report.category} />
        <SeverityBadge severity={report.severity} />
      </div>

      {img && (
        <img
          src={img}
          alt={report.title}
          className="mt-4 w-full max-h-96 object-cover rounded-2xl border border-app"
        />
      )}

      {report.description && (
        <p className="mt-4 text-app whitespace-pre-wrap">{report.description}</p>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <Card className="mt-5 p-4">
          <p className="text-sm font-semibold text-app">Admin · update status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={report.status === s ? 'primary' : 'secondary'}
                disabled={savingStatus || report.status === s}
                onClick={() => changeStatus(s)}
              >
                {s.replace('_', ' ')}
              </Button>
            ))}
            <Button
              size="sm"
              variant="danger"
              disabled={savingStatus || report.status === 'rejected'}
              onClick={() => changeStatus('rejected')}
            >
              reject
            </Button>
          </div>
        </Card>
      )}

      {/* Status timeline */}
      <Card className="mt-5 p-5">
        <h2 className="font-semibold text-app mb-4">Progress</h2>
        <StatusTimeline current={report.status} events={events} />
      </Card>

      {/* Location */}
      <Card className="mt-5 p-0 overflow-hidden">
        <div className="relative h-64">
          <ReportsMap
            reports={[report]}
            center={{ lat: report.lat, lng: report.lng }}
            zoom={16}
          />
        </div>
        {report.address && (
          <p className="flex items-center gap-1.5 px-4 py-3 text-sm text-soft border-t border-app">
            <Icon name="map-pin" size={15} /> {report.address}
          </p>
        )}
      </Card>

      {/* Comments */}
      <div className="mt-6">
        <h2 className="font-semibold text-app mb-3">
          Comments {comments.length > 0 && <span className="text-soft">({comments.length})</span>}
        </h2>

        {session ? (
          <form onSubmit={postComment} className="flex gap-2 mb-4">
            <input
              className={inputClass}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
            />
            <Button type="submit" loading={posting} disabled={!commentText.trim()}>
              Post
            </Button>
          </form>
        ) : (
          <p className="text-sm text-soft mb-4">
            <Link to={`/signin?redirect=/report/${id}`} className="text-brand-600 hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-soft">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-app bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-app">
                    {c.author_id ? names.get(c.author_id) ?? 'Resident' : 'Resident'}
                  </span>
                  <span className="text-xs text-soft">{fullDate(c.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-app whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Owner / admin self-serve deletion */}
      {canDelete && (
        <div className="mt-8 border-t-2 border-app pt-5 flex items-center justify-between gap-3">
          <p className="telemetry text-soft">
            {isAdmin && report?.reporter_id !== session?.user.id
              ? 'Admin action'
              : 'This is your report'}
          </p>
          <Button variant="danger" size="sm" loading={deleting} onClick={removeReport}>
            <Icon name="trash" size={15} /> Delete report
          </Button>
        </div>
      )}
    </div>
  )
}
