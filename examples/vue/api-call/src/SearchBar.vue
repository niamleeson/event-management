<script setup lang="ts">
import { useSignal, useEmit } from '@pulse/vue'
import { SearchInput, searchQuery, isSearching } from './engine'

const emit = useEmit()
const query = useSignal(searchQuery)
const loading = useSignal(isSearching)
</script>

<template>
  <div :style="{ position: 'relative', marginBottom: '24px' }">
    <span :style="{
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6c757d',
      fontSize: '18px',
    }">&#128269;</span>
    <input
      :style="{
        width: '100%',
        padding: '14px 16px 14px 44px',
        fontSize: '16px',
        border: '2px solid #e9ecef',
        borderRadius: '12px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }"
      :value="query"
      placeholder="Search users by name, email, or role..."
      @input="(e) => emit(SearchInput, (e.target as HTMLInputElement).value)"
    />
    <div v-if="loading" :style="{
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '20px',
      border: '2px solid #e9ecef',
      borderTop: '2px solid #4361ee',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }" />
    <component :is="'style'">@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }</component>
  </div>
</template>
