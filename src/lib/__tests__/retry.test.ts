import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../retry'

describe('withRetry', () => {
  it('returns on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await expect(withRetry(fn)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries transient errors then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue('recovered')
    await expect(withRetry(fn, { baseDelayMs: 1, retries: 3 })).resolves.toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 400, message: 'bad request' })
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toMatchObject({ status: 400 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('gives up after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 500 })
    await expect(withRetry(fn, { baseDelayMs: 1, retries: 2 })).rejects.toMatchObject({ status: 500 })
    expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('retries Postgres serialization failures (40001)', async () => {
    const fn = vi.fn().mockRejectedValueOnce({ code: '40001' }).mockResolvedValue('done')
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe('done')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
