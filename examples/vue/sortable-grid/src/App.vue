<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  COLS,
  CELL_SIZE,
  GAP,
  DragStart,
  DragMove,
  DragEnd,
  ShuffleItems,
  AddItem,
  RemoveItem,
  ItemsChanged,
  DraggingIdChanged,
  GhostPosChanged,
  PositionsChanged,
  getItems,
  getDraggingId,
  getGhostPos,
  getPositions,
} from './engine'

providePulse(engine)

const emit = useEmit()
const itemList = usePulse(ItemsChanged, getItems())
const dragId = usePulse(DraggingIdChanged, getDraggingId())
const ghost = usePulse(GhostPosChanged, getGhostPos())
const pos = usePulse(PositionsChanged, getPositions())

let containerRect: DOMRect | null = null

function onPointerDown(e: PointerEvent, id: number) {
  const container = (e.currentTarget as HTMLElement).closest('[data-grid]') as HTMLElement
  if (container) containerRect = container.getBoundingClientRect()
  const x = e.clientX - (containerRect?.left ?? 0)
  const y = e.clientY - (containerRect?.top ?? 0)
  emit(DragStart, { id, x, y })
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (dragId.value < 0) return
  const x = e.clientX - (containerRect?.left ?? 0)
  const y = e.clientY - (containerRect?.top ?? 0)
  emit(DragMove, { x, y })
}

function onPointerUp() {
  if (dragId.value < 0) return
  emit(DragEnd, undefined)
}

const gridWidth = COLS * (CELL_SIZE + GAP)
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }">
    <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">Sortable Grid</h1>

    <div :style="{ display: 'flex', gap: '12px' }">
      <button @click="emit(ShuffleItems, undefined)" :style="{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
      }">Shuffle</button>
      <button @click="emit(AddItem, undefined)" :style="{
        background: 'rgba(0,184,148,0.2)', border: '1px solid rgba(0,184,148,0.4)',
        color: '#00b894', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
      }">+ Add</button>
    </div>

    <div
      data-grid
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      :style="{
        width: `${gridWidth}px`,
        height: `${Math.ceil(itemList.length / COLS) * (CELL_SIZE + GAP)}px`,
        position: 'relative',
        userSelect: 'none',
      }"
    >
      <div
        v-for="(item, i) in itemList"
        :key="item.id"
        @pointerdown="(e) => onPointerDown(e, item.id)"
        :style="{
          position: 'absolute',
          left: `${pos.x[i] ?? 0}px`,
          top: `${pos.y[i] ?? 0}px`,
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          background: `linear-gradient(145deg, ${item.color}cc, ${item.color}88)`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: dragId === item.id ? 'grabbing' : 'grab',
          opacity: dragId === item.id ? 0.5 : 1,
          boxShadow: `0 4px 16px ${item.color}44`,
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'left 0.2s ease-out, top 0.2s ease-out',
        }"
      >
        <div :style="{ color: '#fff', fontSize: '14px', fontWeight: 600 }">{{ item.label }}</div>
        <button
          @click.stop="emit(RemoveItem, item.id)"
          :style="{
            background: 'rgba(0,0,0,0.2)', border: 'none', color: 'rgba(255,255,255,0.5)',
            width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }"
        >&times;</button>
      </div>

      <!-- Ghost element -->
      <div
        v-if="dragId >= 0"
        :style="{
          position: 'fixed',
          left: `${ghost.x - CELL_SIZE / 2}px`,
          top: `${ghost.y - CELL_SIZE / 2}px`,
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          background: 'rgba(67,97,238,0.3)',
          borderRadius: '12px',
          border: '2px dashed rgba(67,97,238,0.6)',
          pointerEvents: 'none',
          zIndex: 100,
        }"
      />
    </div>

    <p :style="{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }">
      Drag items to reorder &middot; {{ itemList.length }} items
    </p>
  </div>
</template>
