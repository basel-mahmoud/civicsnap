import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import type { Report } from '@/lib/types'
import { categoryMeta } from '@/lib/categories'
import { categoryIcon } from './icons'
import { Icon } from '@/components/icons/Icon'

function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  useEffect(() => {
    if (reports.length === 0) return
    const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 })
  }, [reports, map])
  return null
}

export function ReportsMap({
  reports,
  className = '',
  focusId,
}: {
  reports: Report[]
  className?: string
  focusId?: string
}) {
  const navigate = useNavigate()
  const center = useMemo<[number, number]>(() => {
    if (reports.length) return [reports[0].lat, reports[0].lng]
    return [40.7128, -74.006]
  }, [reports])

  return (
    <MapContainer
      center={center}
      zoom={13}
      className={className}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={categoryIcon(r.category)}>
          <Popup>
            <div className="min-w-44">
              <p className="font-semibold text-sm text-ink-900">{r.title}</p>
              <p className="inline-flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                {categoryMeta(r.category).label} · {r.upvote_count}
                <Icon name="thumbs-up" size={12} />
              </p>
              <button
                onClick={() => navigate(`/report/${r.id}`)}
                className="mt-2 text-xs font-medium text-brand-700 hover:underline"
              >
                View details →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      {focusId ? null : <FitBounds reports={reports} />}
    </MapContainer>
  )
}
