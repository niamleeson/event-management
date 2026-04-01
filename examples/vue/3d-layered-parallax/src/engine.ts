// DAG
// MouseMoved ──→ TiltXTargetChanged
//            └──→ TiltYTargetChanged
// ToggleDayNight ──→ IsNightChanged
//                └──→ DayNightTweenStart
// SceneEnter ──→ enterStart[i] (staggered)

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Layer data                                                        */
/* ------------------------------------------------------------------ */

export const LAYERS = [
  { depth: -200, color: '#1a1a3e', label: 'Stars', opacity: 0.3 },
  { depth: -150, color: '#2d1b69', label: 'Mountains', opacity: 0.5 },
  { depth: -100, color: '#3d2b7a', label: 'Hills', opacity: 0.7 },
  { depth: -50,  color: '#4e3d8b', label: 'Trees', opacity: 0.85 },
  { depth: 0,    color: '#5f4f9c', label: 'Ground', opacity: 1.0 },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const MouseMoved = engine.event<{ x: number; y: number }>('MouseMoved')
export const SceneEnter = engine.event('SceneEnter')
export const ToggleDayNight = engine.event('ToggleDayNight')
export const DayNightChanged = engine.event<boolean>('DayNightChanged')

/* ------------------------------------------------------------------ */
/*  Camera tilt signals + springs (mouse-driven)                      */
/* ------------------------------------------------------------------ */

export let tiltXTarget = 0
export const TiltXTargetChanged = engine.event('TiltXTargetChanged')
engine.on(MouseMoved, [TiltXTargetChanged], ({ y }, setTiltX) => {
  tiltXTarget = (y - 0.5) * 15
  setTiltX(tiltXTarget)
})
export let tiltYTarget = 0
export const TiltYTargetChanged = engine.event('TiltYTargetChanged')
engine.on(MouseMoved, [TiltYTargetChanged], ({ x }, setTiltY) => {
  tiltYTarget = (x - 0.5) * 15
  setTiltY(tiltYTarget)
})

export let tiltXSpring = { value: 0, velocity: 0, settled: true }
export const TiltXSpringVal = engine.event<number>('TiltXSpringVal')
{
  const _sc = { stiffness: 60, damping: 14 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = tiltXTarget
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = tiltXSpring.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      tiltXSpring.value += _sv * dt
      tiltXSpring.velocity = _sv
      engine.emit(TiltXSpringVal, tiltXSpring.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        tiltXSpring.value = tgtVal; _sv = 0; _sa = false; tiltXSpring.settled = true
        engine.emit(TiltXSpringVal, tiltXSpring.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      tiltXSpring.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(TiltXTargetChanged, () => _ss())
}
export let tiltYSpring = { value: 0, velocity: 0, settled: true }
export const TiltYSpringVal = engine.event<number>('TiltYSpringVal')
{
  const _sc = { stiffness: 60, damping: 14 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = tiltYTarget
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = tiltYSpring.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      tiltYSpring.value += _sv * dt
      tiltYSpring.velocity = _sv
      engine.emit(TiltYSpringVal, tiltYSpring.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        tiltYSpring.value = tgtVal; _sv = 0; _sa = false; tiltYSpring.settled = true
        engine.emit(TiltYSpringVal, tiltYSpring.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      tiltYSpring.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(TiltYTargetChanged, () => _ss())
}

/* ------------------------------------------------------------------ */
/*  Day/Night toggle                                                  */
/* ------------------------------------------------------------------ */

export let isNight = true
export const IsNightChanged = engine.event('IsNightChanged')
engine.on(ToggleDayNight, [IsNightChanged], (_payload, setNight) => {
  isNight = !isNight
  setNight(isNight)
})

// Tween for day/night transition (0=day, 1=night)
const DayNightTweenStart = engine.event('DayNightTweenStart')
engine.on(ToggleDayNight, [DayNightTweenStart], (_payload, setStart) => {
  setStart(undefined)
})

export let nightAmount = { value: 0, active: false }
export const NightAmountVal = engine.event<number>('NightAmountVal')
{
  const _tc = {
  start: DayNightTweenStart,
  from: () => nightAmount.value,
  to: () => isNight ? 1 : 0,
  duration: 1200,
  easing: (t: number) => t * t * (3 - 2 * t),
}
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; nightAmount.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!nightAmount.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      nightAmount.value = f + (t - f) * _te(p)
      engine.emit(NightAmountVal, nightAmount.value)
      if (p >= 1) { nightAmount.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { nightAmount.active = false })) }
}

/* ------------------------------------------------------------------ */
/*  Entrance stagger tweens                                           */
/* ------------------------------------------------------------------ */

export const layerEntrance: any[] = []

for (let i = 0; i < LAYERS.length; i++) {
  const enterStart = engine.event(`LayerEnter_${i}`)
  let tw = { value: 0, active: false }
const TwVal = engine.event<number>('TwVal')
{
  const _tc = {
    start: enterStart,
    from: 0,
    to: 1,
    duration: 800,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; tw.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!tw.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      tw.value = f + (t - f) * _te(p)
      engine.emit(TwVal, tw.value)
      if (p >= 1) { tw.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { tw.active = false })) }
}
  layerEntrance.push(tw)

  // Stagger entrance after SceneEnter
  engine.on(SceneEnter, () => {
    setTimeout(() => engine.emit(enterStart, undefined), i * 200)
  })
}

export function startLoop() {}
export function stopLoop() {}
