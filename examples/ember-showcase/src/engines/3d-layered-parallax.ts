import { createEngine, type EventType, type TweenValue, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Layer {
  id: number
  depth: number // translateZ value
  color: string
  label: string
  elements: { x: number; y: number; size: number; shape: 'circle' | 'square' | 'triangle' }[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LAYER_COUNT = 5

export const LAYERS: Layer[] = [
  {
    id: 0, depth: -200, color: '#1a1a2e', label: 'Background',
    elements: [
      { x: 10, y: 15, size: 80, shape: 'circle' },
      { x: 70, y: 60, size: 100, shape: 'circle' },
      { x: 40, y: 80, size: 60, shape: 'circle' },
    ],
  },
  {
    id: 1, depth: -100, color: '#16213e', label: 'Mountains',
    elements: [
      { x: 15, y: 40, size: 120, shape: 'triangle' },
      { x: 55, y: 35, size: 140, shape: 'triangle' },
      { x: 85, y: 45, size: 100, shape: 'triangle' },
    ],
  },
  {
    id: 2, depth: 0, color: '#0f3460', label: 'Trees',
    elements: [
      { x: 20, y: 55, size: 40, shape: 'triangle' },
      { x: 40, y: 50, size: 50, shape: 'triangle' },
      { x: 65, y: 58, size: 35, shape: 'triangle' },
      { x: 80, y: 52, size: 45, shape: 'triangle' },
    ],
  },
  {
    id: 3, depth: 100, color: '#533483', label: 'Clouds',
    elements: [
      { x: 25, y: 20, size: 70, shape: 'circle' },
      { x: 60, y: 15, size: 90, shape: 'circle' },
      { x: 80, y: 25, size: 50, shape: 'circle' },
    ],
  },
  {
    id: 4, depth: 200, color: '#e94560', label: 'Foreground',
    elements: [
      { x: 30, y: 70, size: 30, shape: 'square' },
      { x: 50, y: 75, size: 25, shape: 'square' },
      { x: 75, y: 68, size: 35, shape: 'square' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const MouseMove = engine.event<{ x: number; y: number }>('MouseMove')
export const ToggleDayNight = engine.event<void>('ToggleDayNight')
export const EnterScene = engine.event<void>('EnterScene')
export const LayerEnter: EventType<number>[] = []
export const LayerEntered: EventType<number>[] = []

for (let i = 0; i < LAYER_COUNT; i++) {
  LayerEnter.push(engine.event<number>(`LayerEnter_${i}`))
  LayerEntered.push(engine.event<number>(`LayerEntered_${i}`))
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const isNight = engine.signal<boolean>(
  ToggleDayNight, false, (prev) => !prev,
)

// Camera position from mouse (normalized -1 to 1)
export const cameraX = engine.signal<number>(
  MouseMove, 0, (_prev, pos) => (pos.x - 0.5) * 2,
)
export const cameraY = engine.signal<number>(
  MouseMove, 0, (_prev, pos) => (pos.y - 0.5) * 2,
)

// ---------------------------------------------------------------------------
// Springs — smooth camera tracking
// ---------------------------------------------------------------------------

export const springCameraX: SpringValue = engine.spring(cameraX, {
  stiffness: 80,
  damping: 15,
  restThreshold: 0.001,
})

export const springCameraY: SpringValue = engine.spring(cameraY, {
  stiffness: 80,
  damping: 15,
  restThreshold: 0.001,
})

// ---------------------------------------------------------------------------
// Tweens — staggered layer entrance
// ---------------------------------------------------------------------------

export const layerOpacity: TweenValue[] = []
export const layerTranslateY: TweenValue[] = []

for (let i = 0; i < LAYER_COUNT; i++) {
  layerOpacity.push(engine.tween({
    start: LayerEnter[i],
    done: LayerEntered[i],
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

// Stagger entrance
engine.on(EnterScene, () => {
  for (let i = 0; i < LAYER_COUNT; i++) {
    setTimeout(() => {
      engine.emit(LayerEnter[i], i)
    }, i * 200)
  }
})

// Start frame loop
engine.startFrameLoop()
