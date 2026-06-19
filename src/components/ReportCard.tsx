import { Link } from 'react-router-dom'
import type { Report } from '@/lib/types'
import { photoPublicUrl } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'
import { CategoryBadge, SeverityBadge, StatusBadge } from './badges'

export function ReportCard({ report }: { report: Report }) {
  const img = photoPublicUrl(report.photo_path)
  return (
    <Link
      to={`/report/${report.id}`}
      className="group flex gap-3 p-3 rounded-2xl border border-app bg-surface hover:border-brand-400 transition"
    >
      {img ? (
        <img
          src={img}
          alt=""
          loading="lazy"
          className="size-20 shrink-0 rounded-xl object-cover bg-muted2"
        />
      ) : (
        <div className="size-20 shrink-0 rounded-xl bg-muted2 grid place-items-center text-2xl">
          📍
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-app truncate group-hover:text-brand-600">
            {report.title}
          </h3>
          <span className="shrink-0 text-xs text-soft">{timeAgo(report.created_at)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <StatusBadge status={report.status} />
          <CategoryBadge category={report.category} />
          <SeverityBadge severity={report.severity} />
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-soft">
          <span>👍 {report.upvote_count}</span>
          {report.address && <span className="truncate">{report.address}</span>}
        </div>
      </div>
    </Link>
  )
}
