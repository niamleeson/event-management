import { usePulse, useEmit } from '@pulse/solid'
import { engine, Frame } from './engine'

/* ------------------------------------------------------------------ */
/*  Face data                                                         */
/* ------------------------------------------------------------------ */

const FACES = [
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

const DragStart = engine.event('DragStart')
const DragMove = engine.event<{ dx: number; dy: number }>('DragMove')
const DragEnd = engine.event('DragEnd')
const FaceSelected = engine.event<number>('FaceSelected')
const SnapToFace = engine.event<number>('SnapToFace')

const CubeStateChanged = engine.event<{ rotX: number; rotY: number; selected: number }>('CubeStateChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let rotXTarget = 0, rotYTarget = 0
let rotXSpring = 0, rotYSpring = 0
let rotXVel = 0, rotYVel = 0
let selected = -1

engine.on(DragMove, ({ dx, dy }) => {
  rotXTarget += dy * 0.4
  rotYTarget += dx * 0.4
})

engine.on(SnapToFace, (face) => {
  const snapsX: Record<number, number> = { 4: -90, 5: 90 }
  rotXTarget = snapsX[face] ?? 0

  const canonical: Record<number, number> = { 0: 0, 1: -90, 2: -180, 3: -270 }
  const base = canonical[face] ?? 0
  const offset = Math.round((rotYTarget - base) / 360) * 360
  rotYTarget = base + offset
})

engine.on(DragEnd, () => {
  const rx = rotXSpring
  if (rx < -45) { engine.emit(SnapToFace, 4); return }
  if (rx > 45) { engine.emit(SnapToFace, 5); return }
  const normalized = ((rotYSpring % 360) + 360) % 360
  const faceIndex = Math.round(normalized / 90) % 4
  engine.emit(SnapToFace, faceIndex)
})

engine.on(FaceSelected, (idx) => { selected = idx })

engine.on(Frame, () => {
  const stiff = 0.06, damp = 0.7
  rotXVel += (rotXTarget - rotXSpring) * stiff
  rotXVel *= damp
  rotXSpring += rotXVel
  rotYVel += (rotYTarget - rotYSpring) * stiff
  rotYVel *= damp
  rotYSpring += rotYVel
  engine.emit(CubeStateChanged, { rotX: rotXSpring, rotY: rotYSpring, selected })
})

/* ------------------------------------------------------------------ */
/*  Cube face component                                               */
/* ------------------------------------------------------------------ */

function CubeFace({ index, transform, selected }: { index: number; transform: string; selected: boolean }) {
  const emit = useEmit()
  const face = FACES[index]

  return (
    <div onClick={(e) => { e.stopPropagation(); emit(FaceSelected, index) }}
      style={{
        position: 'absolute', width: 300, height: 300, transform, 'backface-visibility': 'hidden',
        display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
        background: selected ? `linear-gradient(145deg, ${face.color}ee, ${face.color}aa)` : `linear-gradient(145deg, ${face.color}88, ${face.color}44)`,
        border: selected ? `2px solid ${face.color}` : '1px solid rgba(255,255,255,0.1)',
        'border-radius': 4, cursor: 'pointer',
        'box-shadow': selected ? `0 0 30px ${face.color}66, inset 0 0 30px ${face.color}22` : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'background 0.3s, box-shadow 0.3s', gap: 12,
      }}>
      <div style={{ 'font-size': 48 }}>{face.icon}</div>
      <div style={{ color: '#fff', 'font-size': 22, 'font-weight': 700, 'letter-spacing': 1 }}>{face.label}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', 'font-size': 13 }}>{face.desc}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const state = usePulse(CubeStateChanged, { rotX: 0, rotY: 0, selected: -1 })
  let dragRef = false
  let lastPos = { x: 0, y: 0 }

  const onPointerDown = (e: PointerEvent) => {
    dragRef = true
    lastPos = { x: e.clientX, y: e.clientY }
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef) return
    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y
    lastPos = { x: e.clientX, y: e.clientY }
    emit(DragMove, { dx, dy })
  }

  const onPointerUp = () => {
    if (!dragRef) return
    dragRef = false
    emit(DragEnd, undefined)
  }

  const lightAngle = ((state().rotY % 360) + 360) % 360
  const lightX = 50 + Math.sin(lightAngle * Math.PI / 180) * 30
  const lightY = 50 - Math.sin(state().rotX * Math.PI / 180) * 30

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: 40, 'user-select': 'none' }}>
      <h1 style={{ color: '#fff', 'font-size': 28, 'font-weight': 300, 'letter-spacing': 2 }}>3D Cube Menu</h1>

      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        style={{ perspective: 800, width: 300, height: 300, cursor: dragRef ? 'grabbing' : 'grab' }}>
        <div style={{ width: 300, height: 300, position: 'relative', 'transform-style': 'preserve-3d', transform: `rotateX(${-state.rotX}deg) rotateY(${-state.rotY}deg)` }}>
          <div style={{ position: 'absolute', inset: -150, 'border-radius': '50%', background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.05) 0%, transparent 60%)`, 'pointer-events': 'none', 'transform-style': 'preserve-3d' }} />
          <CubeFace index={0} selected={state().selected === 0} transform="translateZ(150px)" />
          <CubeFace index={1} selected={state().selected === 1} transform="rotateY(90deg) translateZ(150px)" />
          <CubeFace index={2} selected={state().selected === 2} transform="rotateY(180deg) translateZ(150px)" />
          <CubeFace index={3} selected={state().selected === 3} transform="rotateY(-90deg) translateZ(150px)" />
          <CubeFace index={4} selected={state().selected === 4} transform="rotateX(90deg) translateZ(150px)" />
          <CubeFace index={5} selected={state().selected === 5} transform="rotateX(-90deg) translateZ(150px)" />
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', 'font-size': 14 }}>
        Drag to rotate {'\u00B7'} Click a face to select
        {state().selected >= 0 && <span style={{ color: FACES[state().selected].color, 'margin-left': 12 }}>Selected: {FACES[state().selected].label}</span>}
      </p>
    </div>
  )
}
