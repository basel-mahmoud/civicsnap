import { useEffect, useState } from 'react'
import { MapContainer, Marker, useMap } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { draggableMarkerIcon } from './icons'
import { ThemedTiles } from './ThemedTiles'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { DEFAULT_CENTER, type LatLng } from '@/lib/geo'

export type { LatLng }

function ClickAndRecenter({
  value,
  onChange,
}: {
  value: LatLng
  onChange: (v: LatLng) => void
}) {
  const map = useMap()
  useEffect(() => {
    map.setView([value.lat, value.lng], map.getZoom() < 14 ? 16 : map.getZoom())
  }, [value.lat, value.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: LeafletMouseEvent) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, onChange])
  return null
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null
  onChange: (v: LatLng) => void
}) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const center = value ?? DEFAULT_CENTER

  function useMyLocation() {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not available in this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — drop a pin on the map instead.'
            : 'Could not get your location — drop a pin on the map instead.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  // Try to locate automatically the first time we have no value.
  useEffect(() => {
    if (!value) useMyLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-soft">
          {value
            ? 'Drag the pin or tap the map to fine-tune.'
            : 'Set the location of the issue.'}
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={useMyLocation} loading={locating}>
          <Icon name="map-pin" size={14} /> My location
        </Button>
      </div>

      <div className="h-64 rounded-xl overflow-hidden border border-app">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <ThemedTiles />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={draggableMarkerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng()
                  onChange({ lat: p.lat, lng: p.lng })
                },
              }}
            />
          )}
          <ClickAndRecenter value={center} onChange={onChange} />
        </MapContainer>
      </div>

      {geoError && <p className="text-xs text-amber-600">{geoError}</p>}
      {value && (
        <p className="text-xs text-soft">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  )
}

// Reverse geocode via OpenStreetMap Nominatim (no key). Best-effort.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept-Language': 'en' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.display_name as string) ?? null
  } catch {
    return null
  }
}
