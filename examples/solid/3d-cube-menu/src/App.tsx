import { onMount, onCleanup, Show } from 'solid-js'
import { useEmit, useSignal, useSpring } from '@pulse/solid'
import type { Signal, SpringValue } from '@pulse/core'
import { engine } from './engine'

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

/* ------------------------------------------------------------------ */
/*  Rotation signals + springs                                        */
/* ------------------------------------------------------------------ */

const rotationXTarget: Signal<number> = engine.signal(DragMove, 0, (prev, { dy }) => prev + dy * 0.4)
const rotationYTarget: Signal<number> = engine.signal(DragMove, 0, (prev, { dx }) => prev + dx * 0.4)

engine.signalUpdate(rotationXTarget, SnapToFace, (_prev, face) => {
  const snaps: Record<number, number> = { 4: -90, 5: 90 }
  return snaps[face] ?? 0
})
engine.signalUpdate(rotationYTarget, SnapToFace, (_prev, face) => {
  const snaps: Record<number, number> = { 0: 0, 1: -90, 2: -180, 3: -270 }
  return snaps[face] ?? 0
})

const rotXSpring: SpringValue = engine.spring(rotationXTarget, { stiffness: 120, damping: 20 })
const rotYSpring: SpringValue = engine.spring(rotationYTarget, { stiffness: 120, damping: 20 })

const selectedFace: Signal<number> = engine.signal(FaceSelected, -1, (_prev, idx) => idx)

/* ------------------------------------------------------------------ */
/*  Snap logic                                                        */
/* ------------------------------------------------------------------ */

engine.on(DragEnd, () => {
  const rx = rotXSpring.value
  if (rx < -45) { engine.emit(SnapToFace, 4); return }
  if (rx > 45) { engine.emit(SnapToFace, 5); return }
  const ry = rotYSpring.value
  const normalized = ((ry % 360) + 360) % 360
  const faceIndex = Math.round(normalized / 90) % 4
  engine.emit(SnapToFace, faceIndex)
})

/* ------------------------------------------------------------------ */
/*  Cube face component                                               */
/* ------------------------------------------------------------------ */

function CubeFace(props: { index: number; transform: string; selected: boolean }) {
  const emit = useEmit()
  const face = FACES[props.index]

  return (
    <div
      onClick={(e) => { e.stopPropagation(); emit(FaceSelected, props.index) }}
      style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        transform: props.transform,
        'backface-visibility': 'hidden',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        background: props.selected
          ? `linear-gradient(145deg, ${face.color}ee, ${face.color}aa)`
          : `linear-gradient(145deg, ${face.color}88, ${face.color}44)`,
        border: props.selected ? `2px solid ${face.color}` : '1px solid rgba(255,255,255,0.1)',
        'border-radius': '4px',
        cursor: 'pointer',
        'box-shadow': props.selected
          ? `0 0 30px ${face.color}66, inset 0 0 30px ${face.color}22`
          : '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'background 0.3s, box-shadow 0.3s',
        gap: '12px',
      }}
    >
      <div style={{ 'font-size': '48px' }}>{face.icon}</div>
      <div style={{ color: '#fff', 'font-size': '22px', 'font-weight': '700', 'letter-spacing': '1px' }}>{face.label}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', 'font-size': '13px' }}>{face.desc}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const emit = useEmit()
  const rotX = useSpring(rotXSpring)
  const rotY = useSpring(rotYSpring)
  const selected = useSignal(selectedFace)

  let dragging = false
  let lastPos = { x: 0, y: 0 }

  const onPointerDown = (e: PointerEvent) => {
    dragging = true
    lastPos = { x: e.clientX, y: e.clientY }
    emit(DragStart, undefined)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y
    lastPos = { x: e.clientX, y: e.clientY }
    emit(DragMove, { dx, dy })
  }

  const onPointerUp = () => {
    if (!dragging) return
    dragging = false
    emit(DragEnd, undefined)
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '40px', 'user-select': 'none' }}>
      <h1 style={{ color: '#fff', 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px' }}>
        3D Cube Menu
      </h1>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          perspective: '800px',
          width: '300px',
          height: '300px',
          cursor: 'grab',
        }}
      >
        <div
          style={{
            width: '300px',
            height: '300px',
            position: 'relative',
            'transform-style': 'preserve-3d',
            transform: `rotateX(${-rotX()}deg) rotateY(${-rotY()}deg)`,
          }}
        >
          <CubeFace index={0} selected={selected() === 0} transform="translateZ(150px)" />
          <CubeFace index={1} selected={selected() === 1} transform="rotateY(90deg) translateZ(150px)" />
          <CubeFace index={2} selected={selected() === 2} transform="rotateY(180deg) translateZ(150px)" />
          <CubeFace index={3} selected={selected() === 3} transform="rotateY(-90deg) translateZ(150px)" />
          <CubeFace index={4} selected={selected() === 4} transform="rotateX(90deg) translateZ(150px)" />
          <CubeFace index={5} selected={selected() === 5} transform="rotateX(-90deg) translateZ(150px)" />
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', 'font-size': '14px' }}>
        Drag to rotate &middot; Click a face to select
        <Show when={selected() >= 0}>
          <span style={{ color: FACES[selected()]?.color, 'margin-left': '12px' }}>
            Selected: {FACES[selected()]?.label}
          </span>
        </Show>
      </p>
    </div>
  )
}
