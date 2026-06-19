import { MapContainer, Marker } from 'react-leaflet'
import { motion } from 'motion/react'
import { ThemedTiles } from './ThemedTiles'
import { categoryIcon } from './icons'
import { Icon } from '@/components/icons/Icon'

// A REAL map (live CARTO tiles) used as the hero visual — not a hand-drawn mockup.
// Interactions are disabled so it reads as a calm, real snapshot and never hijacks
// page scroll. Markers are illustrative (the live DB drives the real /map page).
const SAMPLE: { lat: number; lng: number; category: string }[] = [
  { lat: 25.214, lng: 55.279, category: 'pothole' },
  { lat: 25.198, lng: 55.263, category: 'water' },
  { lat: 25.206, lng: 55.252, category: 'streetlight' },
  { lat: 25.221, lng: 55.272, category: 'trash' },
  { lat: 25.189, lng: 55.275, category: 'sidewalk' },
]

export function HeroLiveMap() {
  return (
    <div className="relative w-full aspect-[4/3.3] rounded-[1.75rem] border border-app overflow-hidden glow-brand">
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

      {/* edge vignette so the card melts into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 70px 12px var(--bg)' }}
      />

      {/* floating AI classification chip */}
      <motion.div
        initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="absolute bottom-4 left-4 right-4 glass border border-app rounded-2xl p-3 flex items-center gap-3"
      >
        <div className="grid size-10 place-items-center rounded-xl bg-brand-500/15 text-brand-400 shrink-0">
          <Icon name="sparkles" size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-soft">AI classified · just now</p>
          <p className="text-sm font-semibold text-app truncate">Pothole · High severity</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-400">
          98%
        </span>
      </motion.div>

      {/* live badge */}
      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full glass border border-app px-2.5 py-1 text-[11px] font-medium text-app">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
        </span>
        Live map
      </div>
    </div>
  )
}
