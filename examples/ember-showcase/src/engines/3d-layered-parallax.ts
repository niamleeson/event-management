import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Layer {
  id: number
  depth: number
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _isNight = false
let _cameraX = 0
let _cameraY = 0
let _springCameraX = 0
let _springCameraY = 0
let _springVelX = 0
let _springVelY = 0

// Layer entrance animation
const _layerOpacity = new Float64Array(LAYER_COUNT)
const _layerTranslateY = new Float64Array(LAYER_COUNT).fill(60)
const _layerEntranceStart = new Float64Array(LAYER_COUNT)
const _layerEntranceActive = new Uint8Array(LAYER_COUNT)

export function getIsNight(): boolean { return _isNight }
export function getSpringCameraX(): number { return _springCameraX }
export function getSpringCameraY(): number { return _springCameraY }
export function getLayerOpacity(i: number): number { return _layerOpacity[i] }
export function getLayerTranslateY(i: number): number { return _layerTranslateY[i] }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(MouseMove, (pos: { x: number; y: number }) => {
  _cameraX = (pos.x - 0.5) * 2
  _cameraY = (pos.y - 0.5) * 2
})

engine.on(ToggleDayNight, () => {
  _isNight = !_isNight
})

engine.on(EnterScene, () => {
  for (let i = 0; i < LAYER_COUNT; i++) {
    setTimeout(() => {
      _layerEntranceStart[i] = performance.now()
      _layerEntranceActive[i] = 1
    }, i * 200)
  }
})

// ---------------------------------------------------------------------------
// Frame update
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }

export function updateFrame(dt: number, now: number): void {
  // Spring camera
  const stiffness = 80
  const damping = 15
  const dtSec = Math.min(dt / 1000, 0.05)

  const forceX = ((_cameraX - _springCameraX) * stiffness - _springVelX * damping) * dtSec
  const forceY = ((_cameraY - _springCameraY) * stiffness - _springVelY * damping) * dtSec
  _springVelX += forceX
  _springVelY += forceY
  _springCameraX += _springVelX * dtSec
  _springCameraY += _springVelY * dtSec

  // Layer entrance
  for (let i = 0; i < LAYER_COUNT; i++) {
    if (_layerEntranceActive[i]) {
      const elapsed = now - _layerEntranceStart[i]
      const t = Math.min(1, elapsed / 600)
      _layerOpacity[i] = easeOutCubic(t)
      _layerTranslateY[i] = 60 * (1 - easeOutCubic(t))
      if (t >= 1) {
        _layerEntranceActive[i] = 0
        _layerOpacity[i] = 1
        _layerTranslateY[i] = 0
      }
    }
  }
}
