import L from 'leaflet'
import { categoryMeta } from '@/lib/categories'
import { iconSvgMarkup } from '@/components/icons/paths'

// Colored teardrop pin with the category's outline icon, built as a divIcon so we
// avoid shipping image assets and can theme per category.
const cache = new Map<string, L.DivIcon>()

export function categoryIcon(category: string): L.DivIcon {
  const meta = categoryMeta(category)
  const key = meta.id
  const cached = cache.get(key)
  if (cached) return cached

  const glyph = iconSvgMarkup(meta.icon, { size: 16, color: meta.color, strokeWidth: 2.25 })
  const html = `
    <div style="position:relative;width:34px;height:44px;">
      <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 11.9 17 27 17 27s17-15.1 17-27C34 7.6 26.4 0 17 0Z" fill="${meta.color}"/>
        <circle cx="17" cy="16.5" r="12" fill="white"/>
      </svg>
      <span style="position:absolute;top:8.5px;left:9px;display:inline-flex;">${glyph}</span>
    </div>`

  const icon = L.divIcon({
    html,
    className: 'civic-pin',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  })
  cache.set(key, icon)
  return icon
}

export const draggableMarkerIcon = L.divIcon({
  html: `
    <div style="width:34px;height:44px;">
      <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 11.9 17 27 17 27s17-15.1 17-27C34 7.6 26.4 0 17 0Z" fill="#059669"/>
        <circle cx="17" cy="16.5" r="6" fill="white"/>
      </svg>
    </div>`,
  className: 'civic-pin',
  iconSize: [34, 44],
  iconAnchor: [17, 44],
})
