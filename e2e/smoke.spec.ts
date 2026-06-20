import { test, expect } from '@playwright/test'

// Skip the one-time boot intro so tests go straight to the page.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('cs_intro', '1')
    } catch {
      /* ignore */
    }
  })
})

test('landing renders the hero and primary CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SNAP')
  await expect(page.getByRole('link', { name: /report an issue/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /view map/i }).first()).toBeVisible()
})

test('map page loads with filters', async ({ page }) => {
  await page.goto('/map')
  await expect(page.getByRole('button', { name: 'Report' })).toBeVisible()
  await expect(page.getByText(/categories/i)).toBeVisible()
})

test('unknown route shows the 404', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByText(/not found/i)).toBeVisible()
})
