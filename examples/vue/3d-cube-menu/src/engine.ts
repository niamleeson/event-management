// DAG
// DragMove ──→ RotationXTargetChanged
//          └──→ RotationYTargetChanged
// SnapToFace ──→ RotationXTargetChanged
//            └──→ RotationYTargetChanged
// FaceSelected ──→ SelectedFaceChanged
// DragEnd ──→ SnapToFace

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Face data                                                         */
/* ------------------------------------------------------------------ */

export const FACES = [
  { icon: '\u2302', label: 'Home', desc: 'Return to dashboard', color: '#6c5ce7' },
  { icon: '\u2699', label: 'Settings', desc: 'Configure preferences', color: '#00b894' },
  { icon: '\u2709', label: 'Messages', desc: 'View your inbox', color: '#e17055' },
  { icon: '\u2605', label: 'Favorites', desc: 'Bookmarked items', color: '#0984e3' },
  { icon: '\u263A', label: 'Profile', desc: 'Your account details', color: '#d63031' },
  { icon: '\u2139', label: 'About', desc: 'App information', color: '#fdcb6e' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const DragStart = engine.event('DragStart')
export const DragMove = engine.event<{ dx: number; dy: number }>('DragMove')
export const DragEnd = engine.event('DragEnd')
export const FaceSelected = engine.event<number>('FaceSelected')
export const SnapToFace = engine.event<number>('SnapToFace')
export const SnapDone = engine.event('SnapDone')

/* ------------------------------------------------------------------ */
/*  Rotation signals + springs                                        */
/* ------------------------------------------------------------------ */

export let rotationXTarget = 0
export const RotationXTargetChanged = engine.event('RotationXTargetChanged')
engine.on(DragMove, [RotationXTargetChanged], ({ dy }, setTargetX) => {
  rotationXTarget = rotationXTarget + dy * 0.4
  setTargetX(rotationXTarget)
})
export let rotationYTarget = 0
export const RotationYTargetChanged = engine.event('RotationYTargetChanged')
engine.on(DragMove, [RotationYTargetChanged], ({ dx }, setTargetY) => {
  rotationYTarget = rotationYTarget + dx * 0.4
  setTargetY(rotationYTarget)
})

engine.on(SnapToFace, [RotationXTargetChanged], (face, setTargetX) => {
  const snaps: Record<number, number> = { 4: -90, 5: 90 }
  rotationXTarget = snaps[face] ?? 0
  setTargetX(rotationXTarget)
})
engine.on(SnapToFace, [RotationYTargetChanged], (face, setTargetY) => {
  const snaps: Record<number, number> = { 0: 0, 1: -90, 2: -180, 3: -270 }
  rotationYTarget = snaps[face] ?? 0
  setTargetY(rotationYTarget)
})

export let rotXSpring = { value: 0, velocity: 0, settled: true }
export const RotXSpringVal = engine.event<number>('RotXSpringVal')
{
  const _sc = { stiffness: 120, damping: 20 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = rotationXTarget
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = rotXSpring.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      rotXSpring.value += _sv * dt
      rotXSpring.velocity = _sv
      engine.emit(RotXSpringVal, rotXSpring.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        rotXSpring.value = tgtVal; _sv = 0; _sa = false; rotXSpring.settled = true
        engine.emit(RotXSpringVal, rotXSpring.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      rotXSpring.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(RotationXTargetChanged, () => _ss())
}
export let rotYSpring = { value: 0, velocity: 0, settled: true }
export const RotYSpringVal = engine.event<number>('RotYSpringVal')
{
  const _sc = { stiffness: 120, damping: 20 }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = rotationYTarget
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = rotYSpring.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      rotYSpring.value += _sv * dt
      rotYSpring.velocity = _sv
      engine.emit(RotYSpringVal, rotYSpring.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        rotYSpring.value = tgtVal; _sv = 0; _sa = false; rotYSpring.settled = true
        engine.emit(RotYSpringVal, rotYSpring.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      rotYSpring.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(RotationYTargetChanged, () => _ss())
}

export let selectedFace = -1
export const SelectedFaceChanged = engine.event('SelectedFaceChanged')
engine.on(FaceSelected, [SelectedFaceChanged], (idx, setSelected) => {
  selectedFace = idx
  setSelected(selectedFace)
})

/* ------------------------------------------------------------------ */
/*  Snap logic                                                        */
/* ------------------------------------------------------------------ */

engine.on(DragEnd, [SnapToFace], (_payload, setSnap) => {
  const ry = rotYSpring.value
  const rx = rotXSpring.value

  if (rx < -45) {
    setSnap(4)
    return
  }
  if (rx > 45) {
    setSnap(5)
    return
  }

  const normalized = ((ry % 360) + 360) % 360
  const faceIndex = Math.round(normalized / 90) % 4
  setSnap(faceIndex)
})

export function startLoop() {}
export function stopLoop() {}
