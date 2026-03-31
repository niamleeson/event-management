import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Item data                                                         */
/* ------------------------------------------------------------------ */

export const ITEMS = [
  { title: 'Horizon', color: '#6c5ce7', icon: '\u{1F305}' },
  { title: 'Velocity', color: '#00b894', icon: '\u{1F680}' },
  { title: 'Crystal', color: '#e17055', icon: '\u{1F48E}' },
  { title: 'Thunder', color: '#0984e3', icon: '\u26A1' },
  { title: 'Inferno', color: '#d63031', icon: '\u{1F525}' },
  { title: 'Cascade', color: '#00cec9', icon: '\u{1F30A}' },
  { title: 'Aurora', color: '#a29bfe', icon: '\u2728' },
  { title: 'Zenith', color: '#fdcb6e', icon: '\u2B50' },
]

const ITEM_COUNT = ITEMS.length
const ANGLE_STEP = 360 / ITEM_COUNT

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const DragStart = engine.event('DragStart')
export const DragMove = engine.event<{ dx: number }>('DragMove')
export const DragEnd = engine.event('DragEnd')
export const ItemSelected = engine.event<number>('ItemSelected')
export const AutoRotateStart = engine.event('AutoRotateStart')
export const AutoRotateTick = engine.event('AutoRotateTick')

/* ------------------------------------------------------------------ */
/*  Rotation signal + spring                                          */
/* ------------------------------------------------------------------ */

export let rotationTarget = 0
export const RotationTargetChanged = engine.event('RotationTargetChanged')
engine.on(DragMove, (v: any) => { rotationTarget = ((prev, { dx }) => prev + dx * 0.3)(rotationTarget, v); engine.emit(RotationTargetChanged, rotationTarget) })

// Snap on item select
engine.on(ItemSelected, (v: any) => { rotationTarget = ((_prev, idx) => -idx * ANGLE_STEP)(rotationTarget, v); engine.emit(RotationTargetChanged, rotationTarget) })

// Spring-driven smooth rotation
export let rotationSpring = { value: 0, velocity: 0, settled: true }
export const RotationSpringVal = engine.event<number>('RotationSpringVal')
{
  const _sc = { stiffness: 80, damping: 18 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = rotationTarget
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = rotationSpring.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      rotationSpring.value += _sv * dt
      rotationSpring.velocity = _sv
      engine.emit(RotationSpringVal, rotationSpring.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        rotationSpring.value = tgtVal; _sv = 0; _sa = false; rotationSpring.settled = true
        engine.emit(RotationSpringVal, rotationSpring.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      rotationSpring.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(RotationTargetChanged, () => _ss())
}

/* ------------------------------------------------------------------ */
/*  Selected item                                                     */
/* ------------------------------------------------------------------ */

export let selectedItem = 0
export const SelectedItemChanged = engine.event('SelectedItemChanged')
engine.on(ItemSelected, (v: any) => { selectedItem = ((_prev, idx) => idx)(selectedItem, v); engine.emit(SelectedItemChanged, selectedItem) })

/* ------------------------------------------------------------------ */
/*  Selected item springs forward (translateZ boost)                  */
/* ------------------------------------------------------------------ */

export const selectedZTargets: any[] = []
export const selectedZSprings: any[] = []

for (let i = 0; i < ITEM_COUNT; i++) {
  let zt = 0 as number
const ZtChanged = engine.event('ZtChanged')
engine.on(ItemSelected, (v: any) => { zt = ((_prev, idx) => idx === i ? 60 : 0)(zt, v); engine.emit(ZtChanged, zt) })
  selectedZTargets.push(zt)
  let zs = { value: 0, velocity: 0, settled: true }
const ZsVal = engine.event<number>('ZsVal')
{
  const _sc = { stiffness: 200, damping: 20 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = zt
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = zs.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      zs.value += _sv * dt
      zs.velocity = _sv
      engine.emit(ZsVal, zs.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        zs.value = tgtVal; _sv = 0; _sa = false; zs.settled = true
        engine.emit(ZsVal, zs.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      zs.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(ZtChanged, () => _ss())
}
  selectedZSprings.push(zs)
}

/* ------------------------------------------------------------------ */
/*  Auto-rotate (slow continuous rotation when not dragging)          */
/* ------------------------------------------------------------------ */

let autoRotating = true

engine.on(DragStart, () => { autoRotating = false })
engine.on(DragEnd, () => { autoRotating = true })
engine.on(ItemSelected, () => { autoRotating = false })

engine.on(engine.frame, ({ dt }) => {
  if (!autoRotating) return
  const speed = 0.015
  (rotationTarget = rotationTarget + speed * (dt / 16.667, engine.emit(RotationTargetChanged, rotationTarget)))
})




export { ANGLE_STEP }
