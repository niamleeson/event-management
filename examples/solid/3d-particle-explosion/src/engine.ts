import { createEngine } from '@pulse/core'

export const engine = createEngine()

// Frame loop
export const Frame = engine.event<number>('Frame')

let last = performance.now()
requestAnimationFrame(function loop() {
  const now = performance.now()
  engine.emit(Frame, now - last)
  last = now
  requestAnimationFrame(loop)
})
