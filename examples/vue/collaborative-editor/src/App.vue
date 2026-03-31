<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  USERS,
  UserTyped,
  UserDeleted,
  CursorMoved,
  DocumentChanged,
  CursorsChanged,
  EditHistoryChanged,
  CursorXChanged,
  getDocument,
  getCursors,
  getEditHistory,
  getCursorXPositions,
} from './engine'

providePulse(engine)

const emit = useEmit()
const text = usePulse(DocumentChanged, getDocument())
const cursorMap = usePulse(CursorsChanged, getCursors())
const history = usePulse(EditHistoryChanged, getEditHistory())
const cursorXPos = usePulse(CursorXChanged, getCursorXPositions())

let myPosition = 0

function onInput(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  const newVal = textarea.value
  const oldVal = text.value

  if (newVal.length > oldVal.length) {
    const inserted = newVal.slice(myPosition, myPosition + (newVal.length - oldVal.length))
    emit(UserTyped, { user: 'You', text: inserted, position: myPosition })
    myPosition += inserted.length
  } else if (newVal.length < oldVal.length) {
    const count = oldVal.length - newVal.length
    emit(UserDeleted, { user: 'You', position: myPosition, count })
    myPosition = Math.max(0, myPosition - count)
  }

  emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' })
}

function onKeyUp(e: KeyboardEvent) {
  const textarea = e.target as HTMLTextAreaElement
  myPosition = textarea.selectionStart ?? 0
  emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' })
}

function onClick(e: MouseEvent) {
  const textarea = e.target as HTMLTextAreaElement
  myPosition = textarea.selectionStart ?? 0
  emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div :style="{ width: '800px', display: 'flex', gap: '24px' }">
    <!-- Editor -->
    <div :style="{ flex: 1 }">
      <h1 :style="{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '16px' }">Collaborative Editor</h1>

      <!-- Online users -->
      <div :style="{ display: 'flex', gap: '12px', marginBottom: '16px' }">
        <div
          v-for="user in USERS"
          :key="user.name"
          :style="{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
            background: '#fff', borderRadius: '16px', border: `1px solid ${user.color}44`,
            fontSize: '13px',
          }"
        >
          <div :style="{ width: '8px', height: '8px', borderRadius: '50%', background: user.color }" />
          <span :style="{ color: '#333' }">{{ user.name }}</span>
        </div>
      </div>

      <!-- Editor area -->
      <div :style="{ position: 'relative' }">
        <textarea
          :value="text"
          @input="onInput"
          @keyup="onKeyUp"
          @click="onClick"
          :style="{
            width: '100%', height: '400px', padding: '16px', fontSize: '14px',
            fontFamily: 'Consolas, monospace', border: '1px solid #ddd', borderRadius: '8px',
            resize: 'none', outline: 'none', background: '#fff', lineHeight: '1.6',
          }"
        />
        <!-- Cursor indicators -->
        <div
          v-for="user in USERS.filter(u => u.name !== 'You')"
          :key="user.name"
          :style="{
            position: 'absolute', top: '8px',
            left: `${16 + (cursorXPos[user.name] ?? 0)}px`,
            pointerEvents: 'none',
          }"
        >
          <div :style="{ width: '2px', height: '20px', background: user.color }" />
          <div :style="{
            fontSize: '10px', color: '#fff', background: user.color,
            padding: '1px 4px', borderRadius: '2px', whiteSpace: 'nowrap',
          }">
            {{ user.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit history -->
    <div :style="{ width: '240px' }">
      <h3 :style="{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '12px' }">Edit History</h3>
      <div :style="{ maxHeight: '500px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }">
        <div
          v-for="edit in [...history].reverse()"
          :key="edit.id"
          :style="{
            padding: '8px 10px', background: '#fff', borderRadius: '6px',
            borderLeft: `3px solid ${USERS.find(u => u.name === edit.user)?.color ?? '#888'}`,
            fontSize: '12px',
          }"
        >
          <div :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }">
            <span :style="{ fontWeight: 600, color: USERS.find(u => u.name === edit.user)?.color ?? '#888' }">{{ edit.user }}</span>
            <span :style="{ color: '#999' }">{{ formatTime(edit.timestamp) }}</span>
          </div>
          <div :style="{ color: edit.type === 'insert' ? '#00b894' : '#d63031' }">
            {{ edit.type === 'insert' ? '+' : '-' }} {{ edit.text.slice(0, 30) }}{{ edit.text.length > 30 ? '...' : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
