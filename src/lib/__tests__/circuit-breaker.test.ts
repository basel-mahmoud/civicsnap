import { describe, it, expect } from 'vitest'
import { CircuitBreaker, CircuitOpenError } from '../circuit-breaker'

// Chaos / fault-injection: hammer the breaker with failures and assert it opens,
// fails fast, then recovers through half-open.
describe('CircuitBreaker (fault injection)', () => {
  it('opens after the failure threshold and then fails fast', async () => {
    const clock = 0
    const cb = new CircuitBreaker('test', 3, 1000, () => clock)
    const boom = () => Promise.reject(new Error('boom'))

    for (let i = 0; i < 3; i++) {
      await expect(cb.run(boom)).rejects.toThrow('boom')
    }
    expect(cb.state).toBe('open')

    // While open it short-circuits without calling the function.
    let called = false
    await expect(
      cb.run(async () => {
        called = true
        return 'ok'
      }),
    ).rejects.toBeInstanceOf(CircuitOpenError)
    expect(called).toBe(false)
  })

  it('moves to half-open after cooldown and closes on success', async () => {
    let clock = 0
    const cb = new CircuitBreaker('test', 2, 1000, () => clock)
    const boom = () => Promise.reject(new Error('boom'))

    await expect(cb.run(boom)).rejects.toThrow()
    await expect(cb.run(boom)).rejects.toThrow()
    expect(cb.state).toBe('open')

    clock += 1000 // cooldown elapses
    expect(cb.state).toBe('half-open')

    await expect(cb.run(async () => 'recovered')).resolves.toBe('recovered')
    expect(cb.state).toBe('closed')
  })

  it('a success resets the failure count', async () => {
    const cb = new CircuitBreaker('test', 3, 1000)
    await expect(cb.run(() => Promise.reject(new Error('x')))).rejects.toThrow()
    await cb.run(async () => 'ok')
    await expect(cb.run(() => Promise.reject(new Error('x')))).rejects.toThrow()
    expect(cb.state).toBe('closed') // not enough consecutive failures to trip
  })
})
