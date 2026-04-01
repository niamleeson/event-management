// DAG
// MouseMove ──→ CameraTiltXChanged (via spring loop)
//           └──→ CameraTiltYChanged (via spring loop)
// ToggleTheme ──→ IsDarkChanged
// PageEnter ──→ LayerOpacityChanged[i]
//           └──→ LayerTranslateYChanged[i]

import { createEngine, type EventType } from '@pulse/core'

export const engine = createEngine()
export const LAYER_COUNT = 5
export interface Layer { depth: number; color: string; label: string }
export const LAYERS: Layer[] = [
  { depth: 0, color: '#1a1a2e', label: 'Background' }, { depth: 50, color: '#16213e', label: 'Mountains' },
  { depth: 100, color: '#0f3460', label: 'Hills' }, { depth: 150, color: '#533483', label: 'Trees' },
  { depth: 200, color: '#e94560', label: 'Foreground' },
]

export const MouseMove = engine.event<{ x: number; y: number }>('MouseMove')
export const ToggleTheme = engine.event<void>('ToggleTheme')
export const PageEnter = engine.event<void>('PageEnter')
export const CameraTiltXChanged = engine.event<number>('CameraTiltXChanged')
export const CameraTiltYChanged = engine.event<number>('CameraTiltYChanged')
export const IsDarkChanged = engine.event<boolean>('IsDarkChanged')
export const LayerOpacityChanged: EventType<{ index: number; value: number }>[] = []
export const LayerTranslateYChanged: EventType<{ index: number; value: number }>[] = []

for (let i = 0; i < LAYER_COUNT; i++) {
  LayerOpacityChanged.push(engine.event<{ index: number; value: number }>('LayerOpacity_' + i))
  LayerTranslateYChanged.push(engine.event<{ index: number; value: number }>('LayerTranslateY_' + i))
}

let isDark = true, tiltX = 0, tiltY = 0, posX = 0, posY = 0, velX = 0, velY = 0

engine.on(MouseMove, (pos) => { tiltX = pos.x; tiltY = pos.y })
engine.on(ToggleTheme, [IsDarkChanged], (_payload, setDark) => { isDark = !isDark; setDark(isDark) })

let _rafId: number | null = null
function springLoop() {
  velX = (velX + (tiltX - posX) * 0.08) * 0.986; posX += velX; engine.emit(CameraTiltXChanged, posX)
  velY = (velY + (tiltY - posY) * 0.08) * 0.986; posY += velY; engine.emit(CameraTiltYChanged, posY)
  _rafId = requestAnimationFrame(springLoop)
}

export function startLoop() {
  if (_rafId !== null) return
  _rafId = requestAnimationFrame(springLoop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}

function animateTo(from: number, to: number, dur: number, ease: (t: number) => number, cb: (v: number) => void) {
  const s = performance.now()
  function tick() { const t = Math.min(1, (performance.now() - s) / dur); cb(from + (to - from) * ease(t)); if (t < 1) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
}

engine.on(PageEnter, () => {
  for (let i = 0; i < LAYER_COUNT; i++) {
    setTimeout(() => {
      animateTo(0, 1, 600, (t) => 1 - Math.pow(1 - t, 3), (v) => engine.emit(LayerOpacityChanged[i], { index: i, value: v }))
      animateTo(60, 0, 600, (t) => 1 - Math.pow(1 - t, 3), (v) => engine.emit(LayerTranslateYChanged[i], { index: i, value: v }))
    }, i * 200)
  }
})
