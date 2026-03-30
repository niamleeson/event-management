<script setup lang="ts">
import { computed } from 'vue'
import { useSignal, useEmit } from '@pulse/vue'
import { todoList, activeFilter, TodoRemoved, TodoToggled } from './engine'

const emit = useEmit()
const todos = useSignal(todoList)
const filter = useSignal(activeFilter)

const filtered = computed(() => {
  return todos.value.filter((t) => {
    if (filter.value === 'active') return !t.completed
    if (filter.value === 'completed') return t.completed
    return true
  })
})

const remaining = computed(() => todos.value.filter((t) => !t.completed).length)
</script>

<template>
  <div>
    <template v-if="filtered.length === 0">
      <div :style="{ textAlign: 'center', padding: '40px', color: '#bbb', fontSize: '16px' }">
        {{ todos.length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.' }}
      </div>
    </template>
    <template v-else>
      <div
        v-for="todo in filtered"
        :key="todo.id"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: '#fff',
          borderRadius: '8px',
          marginBottom: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'opacity 0.2s',
          opacity: todo.completed ? 0.5 : 1,
        }"
      >
        <input
          type="checkbox"
          :checked="todo.completed"
          :style="{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#4361ee' }"
          @change="emit(TodoToggled, todo.id)"
        />
        <span :style="{
          flex: 1,
          fontSize: '16px',
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: todo.completed ? '#999' : '#1a1a2e',
        }">{{ todo.text }}</span>
        <button
          :style="{
            padding: '4px 10px',
            fontSize: '18px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#ccc',
            transition: 'color 0.2s',
          }"
          @click="emit(TodoRemoved, todo.id)"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#e63946'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#ccc'"
        >
          &times;
        </button>
      </div>
    </template>
    <div :style="{ marginTop: '16px', fontSize: '14px', color: '#888', textAlign: 'center' }">
      {{ remaining }} item{{ remaining !== 1 ? 's' : '' }} remaining
    </div>
  </div>
</template>
