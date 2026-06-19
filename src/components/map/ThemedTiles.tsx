import { TileLayer } from 'react-leaflet'
import { useTheme } from '@/lib/theme'

// CARTO basemaps look far more polished than raw OSM tiles and come in matched
// light/dark variants, so the map blends into the app chrome in either theme.
const LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

export function ThemedTiles() {
  const { theme } = useTheme()
  return (
    <TileLayer
      key={theme}
      url={theme === 'dark' ? DARK : LIGHT}
      subdomains="abcd"
      detectRetina
      maxZoom={20}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    />
  )
}
