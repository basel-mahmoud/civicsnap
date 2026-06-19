import { MapContainer, Marker } from 'react-leaflet'
import { ThemedTiles } from './ThemedTiles'
import { categoryIcon } from './icons'

// A REAL map (live CARTO tiles) used as the hero visual, framed like a technical
// figure. Interactions disabled so it reads as a calm snapshot and never hijacks
// scroll. Markers are illustrative; the live DB drives the real /map page.
const SAMPLE: { lat: number; lng: number; category: string }[] = [
  { lat: 25.214, lng: 55.279, category: 'pothole' },
  { lat: 25.198, lng: 55.263, category: 'water' },
  { lat: 25.206, lng: 55.252, category: 'streetlight' },
  { lat: 25.221, lng: 55.272, category: 'trash' },
  { lat: 25.189, lng: 55.275, category: 'sidewalk' },
]

export function HeroLiveMap() {
  return (
    <figure className="m-0 border-2 border-app bg-surface">
      {/* figure header bar */}
      <div className="flex items-center justify-between border-b-2 border-app px-3 py-2">
        <span className="telemetry text-app">FIG.01 // LIVE REPORT MAP</span>
        <span className="telemetry inline-flex items-center gap-1.5 text-accent">
          <span className="size-2 bg-accent" />
          REC
        </span>
      </div>

      <div className="relative aspect-[4/3.1]">
        <MapContainer
          center={[25.205, 55.268]}
          zoom={12}
          className="absolute inset-0 h-full w-full"
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
        >
          <ThemedTiles />
          {SAMPLE.map((s, i) => (
            <Marker key={i} position={[s.lat, s.lng]} icon={categoryIcon(s.category)} />
          ))}
        </MapContainer>

        {/* corner crosshairs */}
        {['top-1.5 left-1.5', 'top-1.5 right-1.5', 'bottom-1.5 left-1.5', 'bottom-1.5 right-1.5'].map(
          (pos) => (
            <span key={pos} className={`absolute ${pos} text-soft text-xs font-mono select-none`}>
              +
            </span>
          ),
        )}
      </div>

      {/* figure footer telemetry */}
      <figcaption className="flex items-center justify-between border-t-2 border-app px-3 py-2">
        <span className="telemetry text-soft">LAT 25.205 / LNG 55.268</span>
        <span className="telemetry text-soft">DUBAI / AE</span>
      </figcaption>
    </figure>
  )
}
