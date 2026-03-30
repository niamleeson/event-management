import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Engine } from '../engine.js'

describe('Async boundaries', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should emit done event on successful async', async () => {
    const input = engine.event<string>('fetch')
    const done = engine.event<string>('fetched')
    const results: string[] = []

    engine.on(done, (v) => results.push(v))

    engine.async(input, {
      done,
      do: async (query) => {
        return `result:${query}`
      },
    })

    engine.emit(input, 'test')

    // Wait for async to complete
    await vi.waitFor(() => {
      expect(results).toEqual(['result:test'])
    })
  })

  it('should emit pending event when async starts', async () => {
    const input = engine.event<string>('input')
    const pending = engine.event<string>('pending')
    const done = engine.event<string>('done')
    const pendingResults: string[] = []
    const doneResults: string[] = []

    engine.on(pending, (v) => pendingResults.push(v))
    engine.on(done, (v) => doneResults.push(v))

    engine.async(input, {
      pending,
      done,
      do: async (payload) => {
        return `done:${payload}`
      },
    })

    engine.emit(input, 'go')

    // Pending should fire synchronously
    expect(pendingResults).toEqual(['go'])

    await vi.waitFor(() => {
      expect(doneResults).toEqual(['done:go'])
    })
  })

  it('should emit error event on failure', async () => {
    const input = engine.event<string>('input')
    const error = engine.event<any>('error')
    const errors: any[] = []

    engine.on(error, (e) => errors.push(e))

    engine.async(input, {
      error,
      do: async () => {
        throw new Error('boom')
      },
    })

    engine.emit(input, 'go')

    await vi.waitFor(() => {
      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('boom')
    })
  })

  it('should support latest strategy (cancel previous)', async () => {
    const input = engine.event<number>('input')
    const done = engine.event<string>('done')
    const results: string[] = []

    engine.on(done, (v) => results.push(v))

    engine.async(input, {
      done,
      strategy: 'latest',
      do: async (val, { signal }) => {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, val * 10)
          signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
        return `result:${val}`
      },
    })

    // Fire twice rapidly — first should be cancelled
    engine.emit(input, 100) // slow
    engine.emit(input, 1)   // fast — cancels slow

    await vi.waitFor(() => {
      expect(results).toEqual(['result:1'])
    }, { timeout: 2000 })
  })

  it('should support first strategy (ignore while in-flight)', async () => {
    const input = engine.event<number>('input')
    const done = engine.event<number>('done')
    const results: number[] = []

    engine.on(done, (v) => results.push(v))

    engine.async(input, {
      done,
      strategy: 'first',
      do: async (val) => {
        await new Promise((r) => setTimeout(r, 10))
        return val
      },
    })

    engine.emit(input, 1) // starts
    engine.emit(input, 2) // should be ignored
    engine.emit(input, 3) // should be ignored

    await vi.waitFor(() => {
      expect(results).toEqual([1])
    }, { timeout: 2000 })
  })

  it('should support progress reporting', async () => {
    const input = engine.event<string>('input')
    const progress = engine.event<number>('progress')
    const done = engine.event<string>('done')
    const progressValues: number[] = []

    engine.on(progress, (v) => progressValues.push(v))

    engine.async(input, {
      done,
      progress,
      do: async (payload, { progress: reportProgress }) => {
        reportProgress(25)
        reportProgress(50)
        reportProgress(100)
        return payload
      },
    })

    engine.emit(input, 'go')

    await vi.waitFor(() => {
      expect(progressValues).toEqual([25, 50, 100])
    })
  })

  it('should support cleanup/unsubscribe', async () => {
    const input = engine.event<string>('input')
    const done = engine.event<string>('done')
    const results: string[] = []

    engine.on(done, (v) => results.push(v))

    const cleanup = engine.async(input, {
      done,
      do: async (val) => `result:${val}`,
    })

    cleanup()

    engine.emit(input, 'test')
    await new Promise((r) => setTimeout(r, 50))
    expect(results).toEqual([]) // should not fire since cleaned up
  })
})
