import { useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getCurrentPosition } from '@/lib/geo'
import { Icon } from '@/components/icons/Icon'

// A floating "find me" button that pans the map to the user's live location
// and drops a pulsing marker.
export function LocateControl() {
  const map = useMap()
  const [busy, setBusy] = useState(false)

  async function locate() {
    setBusy(true)
    try {
      const { lat, lng } = await getCurrentPosition()
      map.flyTo([lat, lng], 16, { duration: 0.8 })
      const marker = L.marker([lat, lng], { icon: youAreHereIcon }).addTo(map)
      marker.bindPopup('You are here').openPopup()
      setTimeout(() => marker.remove(), 8000)
    } catch {
      // permission denied / unavailable — silently ignore; default view stays.
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={locate}
      aria-label="Find my location"
      className="absolute z-[500] bottom-4 right-4 size-11 grid place-items-center rounded-full bg-surface border border-app shadow-lg text-app hover:bg-muted2 transition disabled:opacity-60"
      disabled={busy}
    >
      <Icon name="map-pin" size={20} className={busy ? 'animate-pulse' : ''} />
    </button>
  )
}

const youAreHereIcon = L.divIcon({
  className: 'civic-pin',
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.3);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
