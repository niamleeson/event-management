<script setup lang="ts">
import { computed } from 'vue'
import { useEmit, usePulse } from '@pulse/vue'
import {
  count,
  animatedCount,
  colorIntensity,
  bounceScale,
  Increment,
  Decrement,
  CountChanged,
} from './engine'

const emit = useEmit()
const currentCount = usePulse(CountChanged, count)
const animCount = usePulse(AnimatedCountVal, animatedCount.value)
const colorT = usePulse(ColorIntensityVal, colorIntensity.value)
const bounce = usePulse(BounceScaleVal, bounceScale.value)

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): string {
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function getBackgroundColor(intensity: number): string {
  if (intensity <= 0) {
    const t = Math.abs(intensity)
    return lerpColor(248, 249, 250, 255, 200, 200, t)
  } else {
    return lerpColor(248, 249, 250, 200, 255, 210, intensity)
  }
}

function getTextColor(intensity: number): string {
  if (intensity <= -0.3) return '#c0392b'
  if (intensity >= 0.3) return '#27ae60'
  return '#1a1a2e'
}

const bgColor = computed(() => getBackgroundColor(colorT.value))
const textColor = computed(() => getTextColor(colorT.value))
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: bgColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    transition: 'background 0.1s',
  }">
    <h1 :style="{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }">
      Animated Counter
    </h1>
    <p :style="{ color: '#6c757d', fontSize: '14px', marginBottom: '48px' }">
      Tweens smoothly animate the count and background color
    </p>

    <div :style="{ transform: `scale(${bounce})`, marginBottom: '48px' }">
      <div :style="{
        fontSize: '120px',
        fontWeight: 800,
        color: textColor,
        lineHeight: 1,
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 0.3s',
        userSelect: 'none',
      }">{{ Math.round(animCount) }}</div>
      <div :style="{ textAlign: 'center', fontSize: '14px', color: '#aaa', marginTop: '8px' }">
        actual: {{ currentCount }} | animated: {{ animCount.toFixed(1) }}
      </div>
    </div>

    <div :style="{ display: 'flex', gap: '16px' }">
      <button
        @click="emit(Decrement, undefined as unknown as void)"
        :style="{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          border: 'none',
          background: '#e63946',
          color: '#fff',
          fontSize: '36px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(230, 57, 70, 0.3)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }"
        @mousedown="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'"
        @mouseup="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'"
        @mouseleave="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'"
      >-</button>
      <button
        @click="emit(Increment, undefined as unknown as void)"
        :style="{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          border: 'none',
          background: '#4361ee',
          color: '#fff',
          fontSize: '36px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }"
        @mousedown="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'"
        @mouseup="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'"
        @mouseleave="(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'"
      >+</button>
    </div>

    <p :style="{ marginTop: '48px', color: '#bbb', fontSize: '13px' }">
      Color shifts green for positive, red for negative (saturates at +/-10)
    </p>
  </div>
</template>
