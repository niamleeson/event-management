import { createEngine, type EventType, type TweenValue, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LAYER_COUNT = 5

export interface Layer {
  depth: number
  color: string
  label: string
}

export const LAYERS: Layer[] = [
  { depth: 0, color: '#1a1a2e', label: 'Background' },
  { depth: 50, color: '#16213e', label: 'Mountains' },
  { depth: 100, color: '#0f3460', label: 'Hills' },
  { depth: 150, color: '#533483', label: 'Trees' },
  { depth: 200, color: '#e94560', label: 'Foreground' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const MouseMove = engine.event<{ x: number; y: number }>('MouseMove')
export const ToggleTheme = engine.event<void>('ToggleTheme')
export const PageEnter = engine.event<void>('PageEnter')

// Per-layer entrance
export const LayerEnter: EventType<void>[] = []
export const LayerEnterDone: EventType<void>[] = []

for (let i = 0; i < LAYER_COUNT; i++) {
  LayerEnter.push(engine.event<void>(`LayerEnter_${i}`))
  LayerEnterDone.push(engine.event<void>(`LayerEnterDone_${i}`))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Mouse position normalized to -1..1
export const mouseX = engine.signal<number>(MouseMove, 0, (_prev, pos) => pos.x)
export const mouseY = engine.signal<number>(MouseMove, 0, (_prev, pos) => pos.y)

// Day/night theme
export const isDark = engine.signal<boolean>(ToggleTheme, true, (prev) => !prev)

// ---------------------------------------------------------------------------
// Springs: camera tilt from mouse
// ---------------------------------------------------------------------------

export const cameraTiltX = engine.spring(mouseX, {
  stiffness: 80,
  damping: 14,
  restThreshold: 0.001,
})

export const cameraTiltY = engine.spring(mouseY, {
  stiffness: 80,
  damping: 14,
  restThreshold: 0.001,
})

// ---------------------------------------------------------------------------
// Tweens: staggered layer entrance
// ---------------------------------------------------------------------------

export const layerOpacity: TweenValue[] = []
export const layerTranslateY: TweenValue[] = []

engine.on(PageEnter, () => {
  for (let i = 0; i < LAYER_COUNT; i++) {
    setTimeout(() => {
      engine.emit(LayerEnter[i], undefined)
    }, i * 200)
  }
})

for (let i = 0; i < LAYER_COUNT; i++) {
  layerOpacity.push(engine.tween({
    start: LayerEnter[i],
    done: LayerEnterDone[i],
    from: 0,
    to: 1,
    duration: 600,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))

  layerTranslateY.push(engine.tween({
    start: LayerEnter[i],
    from: 60,
    to: 0,
    duration: 600,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }))
}

// Start frame loop
engine.startFrameLoop()
