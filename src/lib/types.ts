import type { CategoryId, ReportStatus, Severity } from './categories'

export interface Profile {
  id: string
  display_name: string | null
  role: 'resident' | 'admin'
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string | null
  title: string
  description: string | null
  category: CategoryId
  severity: Severity
  status: ReportStatus
  lat: number
  lng: number
  address: string | null
  photo_path: string | null
  ai_summary: string | null
  ai_confidence: number | null
  upvote_count: number
  created_at: string
  updated_at: string
  // Joined / derived client-side:
  has_upvoted?: boolean
  reporter_name?: string | null
}

export interface StatusEvent {
  id: string
  report_id: string
  status: ReportStatus
  note: string | null
  changed_by: string | null
  changed_by_name?: string | null
  created_at: string
}

export interface Comment {
  id: string
  report_id: string
  author_id: string | null
  author_name?: string | null
  body: string
  created_at: string
}

/** Shape returned by the AI vision edge function. */
export interface AIClassification {
  category: CategoryId
  severity: Severity
  title: string
  description: string
  confidence: number
  is_valid_issue: boolean
}
