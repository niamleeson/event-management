// ---- @pulse/devtools entry point ----

export { DevTools } from './devtools.js'
export type { PulseEngine, DevToolsOptions, EngineDebugHooks } from './types.js'

import { DevTools } from './devtools.js'
import type { PulseEngine, DevToolsOptions } from './types.js'

/**
 * Create and mount a Pulse DevTools panel.
 *
 * @param engine - The Pulse engine instance to debug
 * @param options - Configuration for the devtools panel
 * @returns A DevTools instance with pause/resume/step/destroy methods
 *
 * @example
 * ```ts
 * import { createDevTools } from '@pulse/devtools'
 *
 * const devtools = createDevTools(engine, {
 *   container: document.getElementById('devtools'),
 *   position: 'floating',
 *   theme: 'dark',
 * })
 *
 * devtools.pause()    // pause engine propagation
 * devtools.resume()   // resume
 * devtools.step()     // step one propagation cycle
 * devtools.destroy()  // clean up
 * ```
 */
export function createDevTools(
  engine: PulseEngine,
  options?: DevToolsOptions,
): DevTools {
  return new DevTools(engine, options)
}
