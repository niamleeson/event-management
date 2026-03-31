<script setup lang="ts">
import { usePulse, useEmit } from '@pulse/vue'
import { FilterChanged, ActiveFilterChanged, getActiveFilter, type Filter } from './engine'

const emit = useEmit()
const filter = usePulse(ActiveFilterChanged, getActiveFilter())
const filters: Filter[] = ['all', 'active', 'completed']
</script>

<template>
  <div :style="{ display: 'flex', gap: '8px', marginBottom: '20px' }">
    <button
      v-for="f in filters"
      :key="f"
      :style="{
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: filter === f ? 600 : 400,
        border: filter === f ? '2px solid #4361ee' : '2px solid #e0e0e0',
        borderRadius: '20px',
        background: filter === f ? '#eef0ff' : '#fff',
        color: filter === f ? '#4361ee' : '#666',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }"
      @click="emit(FilterChanged, f)"
    >
      {{ f.charAt(0).toUpperCase() + f.slice(1) }}
    </button>
  </div>
</template>
