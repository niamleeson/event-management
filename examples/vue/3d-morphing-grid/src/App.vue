<script setup lang="ts">
import { providePulse, useEmit, usePulse, useTween } from '@pulse/vue'
import {
  engine,
  GRID,
  CELL_COUNT,
  SHAPES,
  COLORS,
  MorphToShape,
  currentShape,
  cellRX,
  cellRY,
  cellTZ,
  CurrentShapeChanged,
} from './engine'
import type { Shape } from './engine'

providePulse(engine)

const emit = useEmit()
const shape = usePulse(CurrentShapeChanged, currentShape)

const rxVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellRX[i]))
const ryVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellRY[i]))
const tzVals = Array.from({ length: CELL_COUNT }, (_, i) => useTween(cellTZ[i]))

function gridItems() {
  const items = []
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      items.push({ row: r, col: c, idx: r * GRID + c })
    }
  }
  return items
}

const items = gridItems()
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }">
    <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">
      3D Morphing Grid
    </h1>

    <!-- Shape selector -->
    <div :style="{ display: 'flex', gap: '12px' }">
      <button
        v-for="s in SHAPES"
        :key="s"
        @click="emit(MorphToShape, s as Shape)"
        :style="{
          background: shape === s ? 'rgba(108,92,231,0.8)' : 'rgba(255,255,255,0.1)',
          border: shape === s ? '1px solid #6c5ce7' : '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          letterSpacing: '1px',
          textTransform: 'capitalize',
        }"
      >
        {{ s }}
      </button>
    </div>

    <!-- 3D Grid -->
    <div :style="{ perspective: '800px', width: '400px', height: '400px' }">
      <div :style="{
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transform: 'rotateX(15deg) rotateY(-15deg)',
        position: 'relative',
      }">
        <div
          v-for="item in items"
          :key="item.idx"
          :style="{
            position: 'absolute',
            width: '70px',
            height: '70px',
            left: `${item.col * 90 + 25}px`,
            top: `${item.row * 90 + 25}px`,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rxVals[item.idx].value}deg) rotateY(${ryVals[item.idx].value}deg) translateZ(${tzVals[item.idx].value}px)`,
            background: `linear-gradient(145deg, ${COLORS[item.idx]}cc, ${COLORS[item.idx]}88)`,
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: `0 4px 20px ${COLORS[item.idx]}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            fontWeight: 600,
          }"
        >
          {{ item.row }},{{ item.col }}
        </div>
      </div>
    </div>

    <p :style="{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }">
      Auto-cycles every 3s &middot; Current: {{ shape }}
    </p>
  </div>
</template>
