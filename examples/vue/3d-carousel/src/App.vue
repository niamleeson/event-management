<script setup lang="ts">
import { providePulse, useEmit, useSpring, useSignal } from '@pulse/vue'
import {
  engine, ITEMS, ANGLE_STEP, DragStart, DragMove, DragEnd, ItemSelected,
  rotationSpring, selectedItem, selectedZSprings,
} from './engine'

providePulse(engine)

const emit = useEmit()
const rotation = useSpring(rotationSpring)
const selected = useSignal(selectedItem)
const zBoosts = ITEMS.map((_, i) => useSpring(selectedZSprings[i]))

let dragging = false
let lastX = 0

function onPointerDown(e: PointerEvent) {
  dragging = true
  lastX = e.clientX
  emit(DragStart, undefined)
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - lastX
  lastX = e.clientX
  emit(DragMove, { dx })
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  emit(DragEnd, undefined)
}

const RADIUS = 340
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', userSelect: 'none' }">
    <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">
      3D Carousel
    </h1>

    <div
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      :style="{ perspective: '1000px', width: '800px', height: '300px', cursor: dragging ? 'grabbing' : 'grab' }"
    >
      <div :style="{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotation}deg)`,
      }">
        <div
          v-for="(item, i) in ITEMS"
          :key="i"
          @click.stop="emit(ItemSelected, i)"
          :style="{
            position: 'absolute',
            width: '180px',
            height: '240px',
            left: '50%',
            top: '50%',
            marginLeft: '-90px',
            marginTop: '-120px',
            transform: `rotateY(${i * ANGLE_STEP}deg) translateZ(${RADIUS + zBoosts[i].value}px)`,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: selected === i
              ? `linear-gradient(145deg, ${item.color}ee, ${item.color}aa)`
              : `linear-gradient(145deg, ${item.color}88, ${item.color}44)`,
            border: selected === i ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            cursor: 'pointer',
            boxShadow: selected === i
              ? `0 0 30px ${item.color}66`
              : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'background 0.3s, box-shadow 0.3s, border 0.3s',
          }"
        >
          <div :style="{ fontSize: '48px' }">{{ item.icon }}</div>
          <div :style="{ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }">{{ item.title }}</div>
        </div>
      </div>
    </div>

    <p :style="{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }">
      Drag to rotate &middot; Click to select
      <span v-if="selected >= 0" :style="{ color: ITEMS[selected].color, marginLeft: '12px' }">
        Selected: {{ ITEMS[selected].title }}
      </span>
    </p>
  </div>
</template>
