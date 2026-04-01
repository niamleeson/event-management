// DAG
// MorphToShape ──→ CurrentShapeChanged
//              └──→ rxStart[i], ryStart[i], tzStart[i] (staggered per cell)
// CycleShape ──→ MorphToShape

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Grid config                                                       */
/* ------------------------------------------------------------------ */

export const GRID = 4
export const CELL_COUNT = GRID * GRID

export const SHAPES = ['flat', 'sphere', 'wave', 'spiral'] as const
export type Shape = typeof SHAPES[number]

const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031', '#fdcb6e', '#a29bfe', '#00cec9',
  '#f368e0', '#ff9f43', '#54a0ff', '#5f27cd', '#01a3a4', '#c44569', '#e77f67', '#cf6a87']

/* ------------------------------------------------------------------ */
/*  Shape position calculators                                        */
/* ------------------------------------------------------------------ */

function shapePositions(shape: Shape, row: number, col: number): { rx: number; ry: number; tz: number } {
  const cx = col - (GRID - 1) / 2
  const cy = row - (GRID - 1) / 2
  const dist = Math.sqrt(cx * cx + cy * cy)
  const angle = Math.atan2(cy, cx)

  switch (shape) {
    case 'flat':
      return { rx: 0, ry: 0, tz: 0 }
    case 'sphere':
      return { rx: cy * 20, ry: -cx * 20, tz: Math.max(0, 80 - dist * 30) }
    case 'wave':
      return { rx: Math.sin(col * 0.8) * 30, ry: 0, tz: Math.sin(row * 0.8 + col * 0.8) * 50 }
    case 'spiral':
      return { rx: angle * 15, ry: angle * 15, tz: dist * 25 }
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const MorphToShape = engine.event<Shape>('MorphToShape')
export const CycleShape = engine.event('CycleShape')

/* ------------------------------------------------------------------ */
/*  Current shape signal                                              */
/* ------------------------------------------------------------------ */

export let currentShape = 'flat' as Shape
export const CurrentShapeChanged = engine.event('CurrentShapeChanged')
engine.on(MorphToShape, [CurrentShapeChanged], (shape, setShape) => {
  currentShape = shape
  setShape(currentShape)
})

/* ------------------------------------------------------------------ */
/*  Per-cell tweens for rotateX, rotateY, translateZ                  */
/* ------------------------------------------------------------------ */

export const cellRX: any[] = []
export const cellRY: any[] = []
export const cellTZ: any[] = []

for (let r = 0; r < GRID; r++) {
  for (let c = 0; c < GRID; c++) {
    const idx = r * GRID + c
    const stagger = idx * 50

    const rxStart = engine.event(`CellRX_${idx}`)
    const ryStart = engine.event(`CellRY_${idx}`)
    const tzStart = engine.event(`CellTZ_${idx}`)

    let rxTween = { value: 0, active: false }
const RxTweenVal = engine.event<number>('RxTweenVal')
{
  const _tc = {
      start: rxStart,
      from: () => cellRX[idx]?.value ?? 0,
      to: () => shapePositions(currentShape, r, c).rx,
      duration: 800,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; rxTween.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!rxTween.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      rxTween.value = f + (t - f) * _te(p)
      engine.emit(RxTweenVal, rxTween.value)
      if (p >= 1) { rxTween.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { rxTween.active = false })) }
}
    cellRX.push(rxTween)

    let ryTween = { value: 0, active: false }
const RyTweenVal = engine.event<number>('RyTweenVal')
{
  const _tc = {
      start: ryStart,
      from: () => cellRY[idx]?.value ?? 0,
      to: () => shapePositions(currentShape, r, c).ry,
      duration: 800,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; ryTween.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!ryTween.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      ryTween.value = f + (t - f) * _te(p)
      engine.emit(RyTweenVal, ryTween.value)
      if (p >= 1) { ryTween.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { ryTween.active = false })) }
}
    cellRY.push(ryTween)

    let tzTween = { value: 0, active: false }
const TzTweenVal = engine.event<number>('TzTweenVal')
{
  const _tc = {
      start: tzStart,
      from: () => cellTZ[idx]?.value ?? 0,
      to: () => shapePositions(currentShape, r, c).tz,
      duration: 800,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; tzTween.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!tzTween.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      tzTween.value = f + (t - f) * _te(p)
      engine.emit(TzTweenVal, tzTween.value)
      if (p >= 1) { tzTween.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { tzTween.active = false })) }
}
    cellTZ.push(tzTween)

    // On MorphToShape, fire per-cell tweens with stagger
    engine.on(MorphToShape, () => {
      setTimeout(() => {
        engine.emit(rxStart, undefined)
        engine.emit(ryStart, undefined)
        engine.emit(tzStart, undefined)
      }, stagger)
    })
  }
}

/* ------------------------------------------------------------------ */
/*  Auto-cycle shapes                                                 */
/* ------------------------------------------------------------------ */

let shapeIndex = 0
engine.on(CycleShape, [MorphToShape], (_payload, setMorph) => {
  shapeIndex = (shapeIndex + 1) % SHAPES.length
  setMorph(SHAPES[shapeIndex])
})

// Auto-cycle every 3 seconds
setInterval(() => {
  engine.emit(CycleShape, undefined)
}, 3000)

// Initial morph
setTimeout(() => engine.emit(MorphToShape, 'sphere'), 500)




export { COLORS }

export function startLoop() {}
export function stopLoop() {}
