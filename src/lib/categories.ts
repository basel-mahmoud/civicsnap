// Canonical issue categories. The AI vision model is constrained to this set,
// and the UI derives pin colors, icons, and labels from it.

import type { IconName } from '@/components/icons/paths'

export type CategoryId =
  | 'pothole'
  | 'streetlight'
  | 'graffiti'
  | 'trash'
  | 'water'
  | 'sign'
  | 'sidewalk'
  | 'other'

export type Severity = 'low' | 'medium' | 'high'

export type ReportStatus =
  | 'reported'
  | 'acknowledged'
  | 'in_progress'
  | 'fixed'
  | 'rejected'

export interface CategoryMeta {
  id: CategoryId
  label: string
  emoji: string
  /** Outline icon name (used everywhere except plain <option> text). */
  icon: IconName
  /** Tailwind/inline hex used for map pins and badges. */
  color: string
  description: string
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  pothole: {
    id: 'pothole',
    label: 'Pothole / Road damage',
    emoji: '🕳️',
    icon: 'construction',
    color: '#b45309',
    description: 'Damaged road surface, potholes, cracks',
  },
  streetlight: {
    id: 'streetlight',
    label: 'Street light',
    emoji: '💡',
    icon: 'lightbulb',
    color: '#ca8a04',
    description: 'Broken, flickering, or dark street lighting',
  },
  graffiti: {
    id: 'graffiti',
    label: 'Graffiti / Vandalism',
    emoji: '🎨',
    icon: 'spray-can',
    color: '#7c3aed',
    description: 'Graffiti, tagging, or property vandalism',
  },
  trash: {
    id: 'trash',
    label: 'Trash / Illegal dumping',
    emoji: '🗑️',
    icon: 'trash',
    color: '#15803d',
    description: 'Litter, overflowing bins, illegal dumping',
  },
  water: {
    id: 'water',
    label: 'Water / Drainage',
    emoji: '💧',
    icon: 'droplets',
    color: '#0284c7',
    description: 'Leaks, flooding, blocked drains, hydrants',
  },
  sign: {
    id: 'sign',
    label: 'Signage',
    emoji: '🚸',
    icon: 'signpost',
    color: '#dc2626',
    description: 'Damaged, missing, or obscured signs',
  },
  sidewalk: {
    id: 'sidewalk',
    label: 'Sidewalk / Access',
    emoji: '🦽',
    icon: 'accessibility',
    color: '#0d9488',
    description: 'Broken sidewalks, curbs, accessibility hazards',
  },
  other: {
    id: 'other',
    label: 'Other',
    emoji: '📍',
    icon: 'map-pin',
    color: '#64748b',
    description: 'Anything else affecting the neighborhood',
  },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string }
> = {
  low: { label: 'Low', color: '#15803d', bg: 'rgba(21,128,61,0.12)' },
  medium: { label: 'Medium', color: '#b45309', bg: 'rgba(180,83,9,0.12)' },
  high: { label: 'High', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
}

export const STATUS_META: Record<
  ReportStatus,
  { label: string; color: string; bg: string; step: number }
> = {
  reported: { label: 'Reported', color: '#64748b', bg: 'rgba(100,116,139,0.12)', step: 0 },
  acknowledged: { label: 'Acknowledged', color: '#0284c7', bg: 'rgba(2,132,199,0.12)', step: 1 },
  in_progress: { label: 'In progress', color: '#b45309', bg: 'rgba(180,83,9,0.12)', step: 2 },
  fixed: { label: 'Fixed', color: '#059669', bg: 'rgba(5,150,105,0.12)', step: 3 },
  rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', step: -1 },
}

export const STATUS_FLOW: ReportStatus[] = [
  'reported',
  'acknowledged',
  'in_progress',
  'fixed',
]

export function categoryMeta(id: string): CategoryMeta {
  return CATEGORIES[(id as CategoryId)] ?? CATEGORIES.other
}
