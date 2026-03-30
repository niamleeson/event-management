<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { providePulse, useSignal, useSpring, useEmit } from '@pulse/vue'
import {
  engine,
  cards,
  dragState,
  cardStatuses,
  dragSpringX,
  dragSpringY,
  DragStart,
  DragMove,
  DragEnd,
  CardMoved,
  UndoRequested,
  type KanbanCard,
  type ColumnId,
  type CardStatus,
} from './engine'

providePulse(engine)

const emit = useEmit()
const allCards = useSignal(cards)
const drag = useSignal(dragState)
const statuses = useSignal(cardStatuses)
const springX = useSpring(dragSpringX)
const springY = useSpring(dragSpringY)

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: '#4361ee' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

const STATUS_LABELS: Record<CardStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Error - retrying',
  settled: '',
}

function getCardStatus(cardId: string): CardStatus {
  return statuses.value[cardId] ?? 'idle'
}

function cardBorderColor(status: CardStatus): string {
  if (status === 'saving') return '#f59e0b'
  if (status === 'saved') return '#10b981'
  if (status === 'error') return '#ef4444'
  return '#334155'
}

function cardBg(status: CardStatus): string {
  if (status === 'saved') return '#10b98108'
  if (status === 'error') return '#ef444408'
  return '#0f172a'
}

function statusColor(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    idle: '#64748b',
    saving: '#f59e0b',
    saved: '#10b981',
    error: '#ef4444',
    settled: '#64748b',
  }
  return map[status]
}

function cardAnimation(status: CardStatus): string | undefined {
  if (status === 'error') return 'shake 0.5s ease-in-out'
  if (status === 'saved') return 'flashGreen 0.6s ease-out'
  return undefined
}

function columnCards(colId: ColumnId): KanbanCard[] {
  return allCards.value.filter((c) => c.column === colId)
}

function handleMouseDown(card: KanbanCard, e: MouseEvent) {
  e.preventDefault()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit(DragStart, {
    cardId: card.id,
    startX: e.clientX,
    startY: e.clientY,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
  })
}

function handleDropZoneMouseUp(colId: ColumnId) {
  if (drag.value) {
    const card = allCards.value.find((c) => c.id === drag.value!.cardId)
    if (card && card.column !== colId) {
      emit(CardMoved, {
        cardId: drag.value.cardId,
        fromColumn: card.column,
        toColumn: colId,
      })
    }
    emit(DragEnd, undefined as unknown as void)
  }
}

// Global mouse handlers
function onGlobalMouseMove(e: MouseEvent) {
  if (drag.value) {
    emit(DragMove, { x: e.clientX, y: e.clientY })
  }
}

function onGlobalMouseUp() {
  if (drag.value) {
    emit(DragEnd, undefined as unknown as void)
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onGlobalMouseMove)
  window.addEventListener('mouseup', onGlobalMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onGlobalMouseMove)
  window.removeEventListener('mouseup', onGlobalMouseUp)
})

// Ghost card
function ghostCard() {
  if (!drag.value) return null
  return allCards.value.find((c) => c.id === drag.value!.cardId) ?? null
}
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: '#0f172a',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
  }">
    <component :is="'style'">
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
      }
      @keyframes flashGreen {
        0% { background: #10b98122; }
        100% { background: #0f172a; }
      }
    </component>

    <div :style="{ textAlign: 'center', marginBottom: '32px' }">
      <h1 :style="{ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', margin: 0 }">Pulse Kanban</h1>
      <p :style="{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }">
        Drag cards between columns. Spring physics follow your mouse. Saves auto-retry on failure.
      </p>
    </div>

    <div :style="{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      maxWidth: '1100px',
      margin: '0 auto',
    }">
      <div
        v-for="col in COLUMNS"
        :key="col.id"
        :style="{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '16px',
          minHeight: '400px',
          borderTop: `3px solid ${col.color}`,
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }">
          <span :style="{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }">{{ col.title }}</span>
          <span :style="{
            fontSize: '13px',
            fontWeight: 600,
            color: col.color,
            background: `${col.color}22`,
            padding: '2px 10px',
            borderRadius: '12px',
          }">{{ columnCards(col.id).length }}</span>
        </div>

        <div
          v-for="card in columnCards(col.id)"
          :key="card.id"
          :style="{
            background: cardBg(getCardStatus(card.id)),
            border: `2px solid ${cardBorderColor(getCardStatus(card.id))}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '10px',
            cursor: drag?.cardId === card.id ? 'grabbing' : 'grab',
            opacity: drag?.cardId === card.id ? 0.4 : 1,
            transition: 'border-color 0.3s, background 0.3s, opacity 0.15s',
            userSelect: 'none',
            animation: cardAnimation(getCardStatus(card.id)),
          }"
          @mousedown="(e) => handleMouseDown(card, e)"
        >
          <p :style="{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: 0, marginBottom: '4px' }">{{ card.title }}</p>
          <p :style="{ fontSize: '13px', color: '#94a3b8', margin: 0, marginBottom: '10px' }">{{ card.description }}</p>
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
            <span :style="{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: PRIORITY_COLORS[card.priority] ?? '#94a3b8',
              background: `${PRIORITY_COLORS[card.priority] ?? '#94a3b8'}22`,
              padding: '2px 8px',
              borderRadius: '8px',
            }">{{ card.priority }}</span>
            <span>
              <span
                v-if="STATUS_LABELS[getCardStatus(card.id)]"
                :style="{ fontSize: '11px', fontWeight: 600, color: statusColor(getCardStatus(card.id)) }"
              >{{ STATUS_LABELS[getCardStatus(card.id)] }}</span>
              <button
                v-if="getCardStatus(card.id) === 'saved' || getCardStatus(card.id) === 'error'"
                :style="{
                  fontSize: '12px',
                  color: '#94a3b8',
                  background: 'none',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                }"
                @click.stop="emit(UndoRequested, card.id)"
              >Undo</button>
            </span>
          </div>
        </div>

        <!-- Drop zone shown during drag -->
        <div
          v-if="drag !== null"
          :style="{
            minHeight: '60px',
            border: '2px dashed transparent',
            borderRadius: '8px',
            transition: 'border-color 0.2s, background 0.2s',
            background: 'transparent',
          }"
          @mouseenter="(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#4361ee';
            (e.currentTarget as HTMLElement).style.background = '#4361ee11';
          }"
          @mouseleave="(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }"
          @mouseup="handleDropZoneMouseUp(col.id)"
        >
          <div :style="{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }">
            Drop here
          </div>
        </div>
      </div>
    </div>

    <!-- Ghost card -->
    <div
      v-if="drag && ghostCard()"
      :style="{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        width: '300px',
        background: '#1e293b',
        border: '2px solid #4361ee',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        left: `${springX - drag.offsetX}px`,
        top: `${springY - drag.offsetY}px`,
      }"
    >
      <p :style="{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: 0, marginBottom: '4px' }">{{ ghostCard()!.title }}</p>
      <p :style="{ fontSize: '13px', color: '#94a3b8', margin: 0 }">{{ ghostCard()!.description }}</p>
    </div>

    <div :style="{
      textAlign: 'center',
      marginTop: '32px',
      padding: '16px',
      background: '#1e293b',
      borderRadius: '12px',
      maxWidth: '500px',
      margin: '32px auto 0',
    }">
      <p :style="{ color: '#94a3b8', fontSize: '13px' }">
        This example integrates with
        <code :style="{ color: '#4361ee', fontFamily: 'monospace', fontSize: '12px' }">@pulse/devtools</code>.
        Import and connect to visualize event flow, signals, and the DAG in real-time.
      </p>
      <p :style="{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }">
        <code :style="{ color: '#4361ee', fontFamily: 'monospace', fontSize: '12px' }">import { connectDevtools } from '@pulse/devtools'</code>
      </p>
    </div>
  </div>
</template>
