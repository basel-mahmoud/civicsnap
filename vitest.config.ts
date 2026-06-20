import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    // Playwright specs live in e2e/ and are run by `npm run e2e`, not Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
