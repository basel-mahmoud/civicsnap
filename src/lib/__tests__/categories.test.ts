import { describe, it, expect } from 'vitest'
import { CATEGORY_LIST, categoryMeta, STATUS_FLOW, CATEGORIES } from '../categories'

describe('categories', () => {
  it('every category has the fields the UI relies on', () => {
    for (const c of CATEGORY_LIST) {
      expect(c.id).toBeTruthy()
      expect(c.label).toBeTruthy()
      expect(c.icon).toBeTruthy()
      expect(c.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('categoryMeta falls back to "other" for unknown ids', () => {
    expect(categoryMeta('not-a-real-category').id).toBe('other')
    expect(categoryMeta('pothole').id).toBe('pothole')
  })

  it('status flow is the expected ordered pipeline', () => {
    expect(STATUS_FLOW).toEqual(['reported', 'acknowledged', 'in_progress', 'fixed'])
  })

  it('category ids match their map keys', () => {
    for (const [key, meta] of Object.entries(CATEGORIES)) {
      expect(meta.id).toBe(key)
    }
  })
})
