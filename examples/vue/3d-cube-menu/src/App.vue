<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  FACES,
  DragStart,
  DragMove,
  DragEnd,
  FaceSelected,
  rotXSpring,
  rotYSpring,
  selectedFace,
  SelectedFaceChanged,
  RotXSpringVal,
  RotYSpringVal,
} from './engine'

providePulse(engine)

const emit = useEmit()
const rotX = usePulse(RotXSpringVal, rotXSpring.value)
const rotY = usePulse(RotYSpringVal, rotYSpring.value)
const selected = usePulse(SelectedFaceChanged, selectedFace)

let dragging = false
let lastPos = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent) {
  dragging = true
  lastPos = { x: e.clientX, y: e.clientY }
  emit(DragStart, undefined)
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - lastPos.x
  const dy = e.clientY - lastPos.y
  lastPos = { x: e.clientX, y: e.clientY }
  emit(DragMove, { dx, dy })
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  emit(DragEnd, undefined)
}

const faceTransforms = [
  'translateZ(150px)',
  'rotateY(90deg) translateZ(150px)',
  'rotateY(180deg) translateZ(150px)',
  'rotateY(-90deg) translateZ(150px)',
  'rotateX(90deg) translateZ(150px)',
  'rotateX(-90deg) translateZ(150px)',
]
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', userSelect: 'none' }">
    <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">
      3D Cube Menu
    </h1>

    <div
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      :style="{ perspective: '800px', width: '300px', height: '300px', cursor: dragging ? 'grabbing' : 'grab' }"
    >
      <div :style="{
        width: '300px',
        height: '300px',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${-rotX}deg) rotateY(${-rotY}deg)`,
      }">
        <div
          v-for="(face, i) in FACES"
          :key="i"
          @click.stop="emit(FaceSelected, i)"
          :style="{
            position: 'absolute',
            width: '300px',
            height: '300px',
            transform: faceTransforms[i],
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected === i
              ? `linear-gradient(145deg, ${face.color}ee, ${face.color}aa)`
              : `linear-gradient(145deg, ${face.color}88, ${face.color}44)`,
            border: selected === i ? `2px solid ${face.color}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: selected === i
              ? `0 0 30px ${face.color}66, inset 0 0 30px ${face.color}22`
              : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'background 0.3s, box-shadow 0.3s',
            gap: '12px',
          }"
        >
          <div :style="{ fontSize: '48px' }">{{ face.icon }}</div>
          <div :style="{ color: '#fff', fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }">{{ face.label }}</div>
          <div :style="{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }">{{ face.desc }}</div>
        </div>
      </div>
    </div>

    <p :style="{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }">
      Drag to rotate &middot; Click a face to select
      <span v-if="selected >= 0" :style="{ color: FACES[selected].color, marginLeft: '12px' }">
        Selected: {{ FACES[selected].label }}
      </span>
    </p>
  </div>
</template>
