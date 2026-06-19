import { STATUS_FLOW, STATUS_META, type ReportStatus } from '@/lib/categories'
import type { StatusEvent } from '@/lib/types'
import { fullDate } from '@/lib/time'
import { Icon } from './icons/Icon'

// Horizontal pipeline showing where the report is, plus the event log.
export function StatusTimeline({
  current,
  events,
}: {
  current: ReportStatus
  events: StatusEvent[]
}) {
  const rejected = current === 'rejected'
  const currentStep = STATUS_META[current].step

  return (
    <div>
      {!rejected ? (
        <ol className="flex items-center">
          {STATUS_FLOW.map((s, i) => {
            const meta = STATUS_META[s]
            const done = meta.step <= currentStep
            const isCurrent = meta.step === currentStep
            return (
              <li key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <span
                    className={`size-7 grid place-items-center rounded-full text-xs font-bold transition ${
                      done ? 'text-white' : 'text-soft bg-muted2'
                    }`}
                    style={done ? { backgroundColor: meta.color } : undefined}
                  >
                    {done ? <Icon name="check" size={15} /> : i + 1}
                  </span>
                  <span
                    className={`mt-1 text-[11px] font-medium ${isCurrent ? 'text-app' : 'text-soft'}`}
                  >
                    {meta.label}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className="h-0.5 flex-1 mx-1 -mt-4 rounded"
                    style={{
                      backgroundColor:
                        STATUS_META[STATUS_FLOW[i + 1]].step <= currentStep
                          ? meta.color
                          : 'var(--border)',
                    }}
                  />
                )}
              </li>
            )
          })}
        </ol>
      ) : (
        <div
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: STATUS_META.rejected.color, backgroundColor: STATUS_META.rejected.bg }}
        >
          This report was rejected.
        </div>
      )}

      {events.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {[...events].reverse().map((ev) => {
            const meta = STATUS_META[ev.status as ReportStatus] ?? STATUS_META.reported
            return (
              <li key={ev.id} className="flex gap-2.5 text-sm">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <div>
                  <p className="text-app">
                    <span className="font-medium">{meta.label}</span>
                    {ev.note ? ` — ${ev.note}` : ''}
                  </p>
                  <p className="text-xs text-soft">{fullDate(ev.created_at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
