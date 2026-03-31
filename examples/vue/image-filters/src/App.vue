<script setup lang="ts">
import { computed } from 'vue'
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  FilterValueChanged,
  FilterReordered,
  Undo,
  Redo,
  ResetAll,
  SplitChanged,
  filters,
  splitPosition,
  canUndo,
  canRedo,
  FiltersChanged,
  SplitPositionChanged,
  CanUndoChanged,
  CanRedoChanged,
} from './engine'

providePulse(engine)

const emit = useEmit()
const filterList = usePulse(FiltersChanged, filters)
const split = usePulse(SplitPositionChanged, splitPosition)
const hasUndo = usePulse(CanUndoChanged, canUndo)
const hasRedo = usePulse(CanRedoChanged, canRedo)

const filterCSS = computed(() => {
  return filterList.value.map(f => `${f.prop}(${f.value}${f.unit})`).join(' ')
})

let dragIdx = -1

function onDragStart(idx: number) { dragIdx = idx }
function onDragOver(e: DragEvent, idx: number) {
  e.preventDefault()
  if (dragIdx >= 0 && dragIdx !== idx) {
    emit(FilterReordered, { fromIdx: dragIdx, toIdx: idx })
    dragIdx = idx
  }
}
function onDragEnd() { dragIdx = -1 }

const IMAGE_URL = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6c5ce7"/><stop offset="50%" style="stop-color:#00b894"/><stop offset="100%" style="stop-color:#e17055"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><circle cx="200" cy="150" r="60" fill="#fdcb6e" opacity="0.8"/><circle cx="400" cy="250" r="80" fill="#0984e3" opacity="0.6"/><rect x="100" y="280" width="400" height="80" rx="10" fill="#2d3436" opacity="0.4"/><text x="300" y="200" text-anchor="middle" fill="white" font-size="32" font-family="sans-serif">Sample Image</text></svg>`)
</script>

<template>
  <div :style="{ width: '900px', color: '#fff' }">
    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }">
      <h1 :style="{ fontSize: '24px', fontWeight: 300, letterSpacing: '2px' }">Image Filters</h1>
      <div :style="{ display: 'flex', gap: '8px' }">
        <button @click="emit(Undo, undefined)" :disabled="!hasUndo" :style="{
          background: hasUndo ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.2)', color: hasUndo ? '#fff' : '#555',
          padding: '6px 16px', borderRadius: '6px', cursor: hasUndo ? 'pointer' : 'default', fontSize: '13px',
        }">Undo</button>
        <button @click="emit(Redo, undefined)" :disabled="!hasRedo" :style="{
          background: hasRedo ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.2)', color: hasRedo ? '#fff' : '#555',
          padding: '6px 16px', borderRadius: '6px', cursor: hasRedo ? 'pointer' : 'default', fontSize: '13px',
        }">Redo</button>
        <button @click="emit(ResetAll, undefined)" :style="{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
        }">Reset</button>
      </div>
    </div>

    <div :style="{ display: 'flex', gap: '24px' }">
      <!-- Image preview with split view -->
      <div :style="{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '400px' }">
        <!-- Original (right side) -->
        <img :src="IMAGE_URL" :style="{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: '0' }" />
        <!-- Filtered (left side, clipped) -->
        <div :style="{ position: 'absolute', inset: '0', overflow: 'hidden', width: `${split}%` }">
          <img :src="IMAGE_URL" :style="{ width: `${10000 / split}%`, height: '100%', objectFit: 'cover', filter: filterCSS }" />
        </div>
        <!-- Split handle -->
        <div :style="{
          position: 'absolute', top: '0', bottom: '0', left: `${split}%`, width: '3px',
          background: '#fff', cursor: 'col-resize', transform: 'translateX(-1px)',
        }" />
        <!-- Labels -->
        <div :style="{ position: 'absolute', top: '8px', left: '8px', fontSize: '11px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }">Filtered</div>
        <div :style="{ position: 'absolute', top: '8px', right: '8px', fontSize: '11px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }">Original</div>
        <!-- Split slider -->
        <input
          type="range" min="0" max="100"
          :value="split"
          @input="emit(SplitChanged, parseInt(($event.target as HTMLInputElement).value))"
          :style="{ position: 'absolute', bottom: '12px', left: '10%', width: '80%', opacity: 0.6 }"
        />
      </div>

      <!-- Filter controls -->
      <div :style="{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }">
        <div :style="{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#888' }">
          Drag to reorder filters
        </div>
        <div
          v-for="(f, i) in filterList"
          :key="f.id"
          draggable="true"
          @dragstart="onDragStart(i)"
          @dragover="(e) => onDragOver(e, i)"
          @dragend="onDragEnd"
          :style="{
            background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'grab',
          }"
        >
          <div :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }">
            <span :style="{ fontSize: '13px', fontWeight: 500 }">{{ f.name }}</span>
            <span :style="{ fontSize: '12px', color: '#888' }">{{ Math.round(f.value) }}{{ f.unit }}</span>
          </div>
          <input
            type="range"
            :min="f.min"
            :max="f.max"
            :step="f.prop === 'blur' ? 0.5 : 1"
            :value="f.value"
            @input="emit(FilterValueChanged, { id: f.id, value: parseFloat(($event.target as HTMLInputElement).value) })"
            :style="{ width: '100%', cursor: 'pointer' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
