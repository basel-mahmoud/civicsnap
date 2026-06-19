import {
  SEVERITY_META,
  STATUS_META,
  categoryMeta,
  type ReportStatus,
  type Severity,
} from '@/lib/categories'
import { Badge } from './ui'

export function CategoryBadge({ category }: { category: string }) {
  const m = categoryMeta(category)
  return (
    <Badge color={m.color} bg={`${m.color}1f`}>
      <span>{m.emoji}</span>
      {m.label}
    </Badge>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity]
  return (
    <Badge color={m.color} bg={m.bg}>
      {m.label} severity
    </Badge>
  )
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const m = STATUS_META[status]
  return (
    <Badge color={m.color} bg={m.bg}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </Badge>
  )
}
