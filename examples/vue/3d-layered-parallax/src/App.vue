<script setup lang="ts">
import { onMounted } from 'vue'
import { providePulse, useEmit, useSpring, useSignal, useTween } from '@pulse/vue'
import {
  engine, LAYERS, MouseMoved, SceneEnter, ToggleDayNight,
  tiltXSpring, tiltYSpring, isNight, nightAmount, layerEntrance,
} from './engine'

providePulse(engine)

const emit = useEmit()
const tiltX = useSpring(tiltXSpring)
const tiltY = useSpring(tiltYSpring)
const night = useSignal(isNight)
const nightVal = useTween(nightAmount)
const entrances = LAYERS.map((_, i) => useTween(layerEntrance[i]))

function onMouseMove(e: MouseEvent) {
  emit(MouseMoved, { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
}

onMounted(() => {
  setTimeout(() => emit(SceneEnter, undefined), 300)
})

const DAY_COLORS = ['#87CEEB', '#6bb3d9', '#5a9ec4', '#4a89af', '#3a749a']
const NIGHT_COLORS = ['#1a1a3e', '#2d1b69', '#3d2b7a', '#4e3d8b', '#5f4f9c']

function layerColor(i: number): string {
  const dayR = parseInt(DAY_COLORS[i].slice(1, 3), 16)
  const dayG = parseInt(DAY_COLORS[i].slice(3, 5), 16)
  const dayB = parseInt(DAY_COLORS[i].slice(5, 7), 16)
  const nightR = parseInt(NIGHT_COLORS[i].slice(1, 3), 16)
  const nightG = parseInt(NIGHT_COLORS[i].slice(3, 5), 16)
  const nightB = parseInt(NIGHT_COLORS[i].slice(5, 7), 16)
  const t = nightVal.value
  const r = Math.round(dayR + (nightR - dayR) * t)
  const g = Math.round(dayG + (nightG - dayG) * t)
  const b = Math.round(dayB + (nightB - dayB) * t)
  return `rgb(${r},${g},${b})`
}
</script>

<template>
  <div
    @mousemove="onMouseMove"
    :style="{
      width: '100vw',
      height: '100vh',
      perspective: '600px',
      overflow: 'hidden',
      position: 'relative',
      background: night ? '#0a0a1a' : '#87CEEB',
      transition: 'background 1s',
    }"
  >
    <div :style="{
      width: '100%',
      height: '100%',
      transformStyle: 'preserve-3d',
      transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    }">
      <div
        v-for="(layer, i) in LAYERS"
        :key="i"
        :style="{
          position: 'absolute',
          inset: '-20%',
          transform: `translateZ(${layer.depth}px)`,
          background: layerColor(i),
          opacity: entrances[i].value * layer.opacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }"
      >
        <div :style="{
          color: 'rgba(255,255,255,0.2)',
          fontSize: '72px',
          fontWeight: 100,
          letterSpacing: '8px',
          textTransform: 'uppercase',
        }">
          {{ layer.label }}
        </div>
      </div>
    </div>

    <!-- UI Overlay -->
    <div :style="{
      position: 'absolute',
      top: '24px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px',
      zIndex: 10,
    }">
      <h1 :style="{ color: '#fff', fontSize: '22px', fontWeight: 300, letterSpacing: '2px' }">
        3D Layered Parallax
      </h1>
      <button
        @click="emit(ToggleDayNight, undefined)"
        :style="{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          letterSpacing: '1px',
        }"
      >
        {{ night ? 'Switch to Day' : 'Switch to Night' }}
      </button>
    </div>

    <div :style="{
      position: 'absolute',
      bottom: '24px',
      left: '0',
      right: '0',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '13px',
      zIndex: 10,
    }">
      Move mouse to tilt the scene
    </div>
  </div>
</template>
