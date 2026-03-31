<script setup lang="ts">
import { usePulse, useEmit } from '@pulse/vue'
import {
  TodoTextChanged,
  TodoAdded,
  CurrentTextChanged,
  ValidationChanged,
  getCurrentText,
  getValidation,
  type Todo,
} from './engine'

const emit = useEmit()
const text = usePulse(CurrentTextChanged, getCurrentText())
const validation = usePulse(ValidationChanged, getValidation())

function handleAdd() {
  if (!validation.value.valid) return
  const todo: Todo = {
    id: crypto.randomUUID(),
    text: text.value.trim(),
    completed: false,
  }
  emit(TodoAdded, todo)
  emit(TodoTextChanged, '')
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAdd()
}
</script>

<template>
  <div>
    <div :style="{ display: 'flex', gap: '8px', marginBottom: '8px' }">
      <input
        :style="{
          flex: 1,
          padding: '12px 16px',
          fontSize: '16px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }"
        :value="text"
        placeholder="What needs to be done?"
        @input="(e) => emit(TodoTextChanged, (e.target as HTMLInputElement).value)"
        @keydown="handleKeyDown"
      />
      <button
        :style="{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '8px',
          cursor: !validation.valid ? 'not-allowed' : 'pointer',
          background: !validation.valid ? '#ccc' : '#4361ee',
          color: '#fff',
          transition: 'background 0.2s',
        }"
        :disabled="!validation.valid"
        @click="handleAdd"
      >
        Add
      </button>
    </div>
    <div :style="{ color: '#e63946', fontSize: '13px', minHeight: '20px', marginBottom: '16px' }">
      {{ validation.error ?? '\u00A0' }}
    </div>
  </div>
</template>
