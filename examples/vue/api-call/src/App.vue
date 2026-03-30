<script setup lang="ts">
import { providePulse, useSignal } from '@pulse/vue'
import { engine, error } from './engine'
import SearchBar from './SearchBar.vue'
import UserList from './UserList.vue'
import UserDetail from './UserDetail.vue'

providePulse(engine)

const err = useSignal(error)
</script>

<template>
  <div :style="{
    maxWidth: '720px',
    margin: '40px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    padding: '0 20px',
  }">
    <div :style="{ textAlign: 'center', marginBottom: '32px' }">
      <h1 :style="{ fontSize: '36px', fontWeight: 700, color: '#1a1a2e', margin: 0 }">User Search</h1>
      <p :style="{ color: '#6c757d', fontSize: '14px', marginTop: '4px' }">
        Async search with debounce, cancellation, and details fetching via Pulse
      </p>
    </div>
    <div v-if="err" :style="{
      padding: '16px',
      background: '#fef2f2',
      border: '1px solid #e63946',
      borderRadius: '8px',
      color: '#e63946',
      fontSize: '14px',
      marginBottom: '16px',
    }">{{ err }}</div>
    <SearchBar />
    <UserList />
    <UserDetail />
  </div>
</template>
