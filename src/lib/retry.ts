// Retry with exponential backoff + jitter. Safe to use on mutating calls ONLY
// when the operation is idempotent (e.g. an upsert keyed by an idempotency key),
// so a retried request can never create a duplicate.

export interface RetryOptions {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  /** Return true if the error is worth retrying (default: transient/network/5xx). */
  shouldRetry?: (err: unknown) => boolean
  signal?: AbortSignal
}

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

function defaultShouldRetry(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; code?: string; message?: string }
    if (typeof e.status === 'number' && TRANSIENT_STATUS.has(e.status)) return true
    // Postgres serialization / deadlock — safe to retry.
    if (e.code === '40001' || e.code === '40P01') return true
    if (typeof e.message === 'string' && /network|fetch failed|timeout|temporarily/i.test(e.message))
      return true
  }
  return false
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseDelayMs = 300, maxDelayMs = 4000, shouldRetry = defaultShouldRetry, signal } = opts
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt > retries || !shouldRetry(err)) throw err
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
      const jitter = Math.random() * backoff * 0.3
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, backoff + jitter)
        signal?.addEventListener('abort', () => {
          clearTimeout(t)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    }
  }
}
