import type { EventType, AsyncConfig, AsyncContext } from './types.js'

/**
 * Setup an async operation handler.
 * Returns a cleanup function.
 */
export function setupAsync<In, Out>(
  onFn: (type: EventType<In>, handler: (payload: In) => void) => () => void,
  emitFn: (type: EventType, payload: any) => void,
  input: EventType<In>,
  config: AsyncConfig<In, Out>,
): () => void {
  const strategy = config.strategy ?? 'latest'
  let currentAbort: AbortController | null = null
  let activeCount = 0

  return onFn(input, async (payload: In) => {
    if (strategy === 'latest' && currentAbort) {
      currentAbort.abort()
      if (config.cancelled) emitFn(config.cancelled, undefined)
    }
    if (strategy === 'first' && activeCount > 0) return

    const abort = new AbortController()
    currentAbort = abort
    activeCount++

    if (config.pending) {
      emitFn(config.pending, payload)
    }

    try {
      const result = await config.do(payload, {
        signal: abort.signal,
        progress: (data: any) => {
          if (config.progress) emitFn(config.progress, data)
        },
      })

      if (!abort.signal.aborted) {
        if (config.done) emitFn(config.done, result)
      }
    } catch (err: any) {
      if (!abort.signal.aborted && err?.name !== 'AbortError') {
        if (config.error) emitFn(config.error, err)
      }
    } finally {
      activeCount--
      if (currentAbort === abort) currentAbort = null
    }
  })
}
