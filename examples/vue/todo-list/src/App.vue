<script setup lang="ts">
import { providePulse } from '@pulse/vue'
import { engine } from './engine'
import TodoInput from './TodoInput.vue'
import FilterBar from './FilterTabs.vue'
import TodoList from './TodoList.vue'

providePulse(engine)
</script>

<template>
  <div :style="{
    maxWidth: '560px',
    margin: '40px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    padding: '0 20px',
  }">
    <div :style="{ textAlign: 'center', marginBottom: '32px' }">
      <h1 :style="{ fontSize: '36px', fontWeight: 700, color: '#1a1a2e', margin: 0 }">Pulse Todos</h1>
      <p :style="{ color: '#666', fontSize: '14px', marginTop: '4px' }">
        All state managed through Pulse events and signals
      </p>
    </div>
    <TodoInput />
    <FilterBar />
    <TodoList />
  </div>
</template>
