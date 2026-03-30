/**
 * Setup an async operation handler.
 * Returns a cleanup function.
 */
export function setupAsync(onFn, emitFn, input, config) {
    const strategy = config.strategy ?? 'latest';
    let currentAbort = null;
    let activeCount = 0;
    return onFn(input, async (payload) => {
        if (strategy === 'latest' && currentAbort) {
            currentAbort.abort();
            if (config.cancelled)
                emitFn(config.cancelled, undefined);
        }
        if (strategy === 'first' && activeCount > 0)
            return;
        const abort = new AbortController();
        currentAbort = abort;
        activeCount++;
        if (config.pending) {
            emitFn(config.pending, payload);
        }
        try {
            const result = await config.do(payload, {
                signal: abort.signal,
                progress: (data) => {
                    if (config.progress)
                        emitFn(config.progress, data);
                },
            });
            if (!abort.signal.aborted) {
                if (config.done)
                    emitFn(config.done, result);
            }
        }
        catch (err) {
            if (!abort.signal.aborted && err?.name !== 'AbortError') {
                if (config.error)
                    emitFn(config.error, err);
            }
        }
        finally {
            activeCount--;
            if (currentAbort === abort)
                currentAbort = null;
        }
    });
}
