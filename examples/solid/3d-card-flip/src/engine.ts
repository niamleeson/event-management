import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// Frame ──→ (drives animation loop)

export const engine = createEngine()

// Frame loop
export const Frame = engine.event<number>('Frame')

let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}
