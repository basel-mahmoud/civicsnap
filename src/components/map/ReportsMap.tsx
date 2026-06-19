import { useEffect } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import type { Report } from '@/lib/types'
import { categoryMeta } from '@/lib/categories'
import { DEFAULT_CENTER, DEFAULT_ZOOM, type LatLng } from '@/lib/geo'
import { categoryIcon } from './icons'
import { ThemedTiles } from './ThemedTiles'
import { LocateControl } from './LocateControl'
import { Icon } from '@/components/icons/Icon'

// Keeps the Leaflet view in sync when the desired center changes (e.g. once the
// user's geolocation resolves after first paint).
function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true })
  }, [center.lat, center.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Leaflet can initialise with a 0-height container when it mounts inside a flex
// layout before the browser settles sizes. Re-measure shortly after mount and on
// resize so tiles always render.
function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const fix = () => map.invalidateSize()
    const t = setTimeout(fix, 150)
    window.addEventListener('resize', fix)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', fix)
    }
  }, [map])
  return null
}

export function ReportsMap({
  reports,
  className = '',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showLocate = false,
}: {
  reports: Report[]
  className?: string
  center?: LatLng
  zoom?: number
  showLocate?: boolean
}) {
  const navigate = useNavigate()

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={className}
      style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
        <ThemedTiles />
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
      <Recenter center={center} zoom={zoom} />
      <InvalidateSize />
      {showLocate && <LocateControl />}
    </MapContainer>
  )
}
