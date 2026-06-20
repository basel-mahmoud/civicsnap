import { supabase } from './supabase'
import { withRetry } from './retry'
import type {
  AIClassification,
  Comment,
  Report,
  StatusEvent,
} from './types'
import type { CategoryId, ReportStatus, Severity } from './categories'

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportFilters {
  category?: CategoryId | 'all'
  status?: ReportStatus | 'all' | 'open'
}

const REPORT_COLUMNS =
  'id, reporter_id, title, description, category, severity, status, lat, lng, address, photo_path, ai_summary, ai_confidence, upvote_count, created_at, updated_at'

export async function listReports(filters: ReportFilters = {}): Promise<Report[]> {
  let q = supabase.from('reports').select(REPORT_COLUMNS).order('created_at', { ascending: false })

  if (filters.category && filters.category !== 'all') {
    q = q.eq('category', filters.category)
  }
  if (filters.status === 'open') {
    q = q.in('status', ['reported', 'acknowledged', 'in_progress'])
  } else if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Report[]
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Report) ?? null
}

export async function listMyReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Report[]
}

export interface NewReportInput {
  title: string
  description: string
  category: CategoryId
  severity: Severity
  lat: number
  lng: number
  address?: string | null
  photo_path?: string | null
  ai_summary?: string | null
  ai_confidence?: number | null
}

/**
 * Idempotent report creation. `idempotencyKey` must be stable across retries of
 * the same logical submission: the unique (reporter_id, idempotency_key) index
 * means a retried call upserts the same row instead of creating a duplicate.
 * Wrapped in exponential backoff — safe precisely because the write is idempotent.
 */
export async function createReport(
  reporterId: string,
  input: NewReportInput,
  idempotencyKey: string,
): Promise<Report> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('reports')
      .upsert(
        { ...input, reporter_id: reporterId, idempotency_key: idempotencyKey },
        { onConflict: 'reporter_id,idempotency_key', ignoreDuplicates: false },
      )
      .select(REPORT_COLUMNS)
      .single()
    if (error) throw error
    return data as Report
  })
}

// ---------------------------------------------------------------------------
// Photo upload + AI classification
// ---------------------------------------------------------------------------

export async function uploadReportPhoto(
  userId: string,
  blob: Blob,
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('report-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}

export async function classifyPhoto(
  imageBase64: string,
  mediaType: string,
): Promise<AIClassification> {
  // Read-only classification — safe to retry on transient failure.
  return withRetry(
    async () => {
      const { data, error } = await supabase.functions.invoke('classify-photo', {
        body: { image_base64: imageBase64, media_type: mediaType },
      })
      if (error) throw new Error(error.message || 'AI classification failed')
      if (data?.error) throw new Error(data.error)
      return data as AIClassification
    },
    { retries: 2 },
  )
}

// ---------------------------------------------------------------------------
// Upvotes
// ---------------------------------------------------------------------------

export async function hasUpvoted(reportId: string, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId)
    .eq('user_id', userId)
  if (error) throw error
  return (count ?? 0) > 0
}

export async function myUpvotedReportIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('upvotes')
    .select('report_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.report_id as string))
}

export async function setUpvote(
  reportId: string,
  userId: string,
  on: boolean,
): Promise<void> {
  if (on) {
    const { error } = await supabase
      .from('upvotes')
      .insert({ report_id: reportId, user_id: userId })
    if (error && error.code !== '23505') throw error // ignore duplicate
  } else {
    const { error } = await supabase
      .from('upvotes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
// Status events + comments
// ---------------------------------------------------------------------------

export async function listStatusEvents(reportId: string): Promise<StatusEvent[]> {
  const { data, error } = await supabase
    .from('status_events')
    .select('id, report_id, status, note, changed_by, created_at')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as StatusEvent[]
}

export async function listComments(reportId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, report_id, author_id, body, created_at')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Comment[]
}

export async function addComment(
  reportId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ report_id: reportId, author_id: authorId, body })
    .select('id, report_id, author_id, body, created_at')
    .single()
  if (error) throw error
  return data as Comment
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  const { error } = await supabase.from('reports').update({ status }).eq('id', reportId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Display-name lookup (for labeling reports/comments without joins in RLS).
// ---------------------------------------------------------------------------

export async function namesByIds(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', unique)
  if (error) throw error
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.id as string, (row.display_name as string) || 'Resident')
  }
  return map
}
