<script setup lang="ts">
import { useEmit, usePulse } from '@pulse/vue'
import {
  searchResults,
  searchQuery,
  isSearching,
  selectedUserId,
  UserSelected,
  type User,
  SearchResultsChanged,
  SearchQueryChanged,
  IsSearchingChanged,
  SelectedUserIdChanged,
} from './engine'

const emit = useEmit()
const results = usePulse(SearchResultsChanged, searchResults)
const query = usePulse(SearchQueryChanged, searchQuery)
const loading = usePulse(IsSearchingChanged, isSearching)
const selected = usePulse(SelectedUserIdChanged, selectedUserId)

const colors = {
  primary: '#4361ee',
  primaryLight: '#eef0ff',
  text: '#1a1a2e',
  muted: '#6c757d',
  border: '#e9ecef',
}
</script>

<template>
  <div v-if="loading && results.length === 0" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: colors.muted }">
    Searching...
  </div>
  <div v-else-if="query.length > 0 && results.length === 0 && !loading" :style="{ textAlign: 'center', padding: '40px', color: colors.muted }">
    No users found for "{{ query }}"
  </div>
  <div v-else-if="results.length === 0" :style="{ textAlign: 'center', padding: '40px', color: colors.muted }">
    Type in the search box to find users
  </div>
  <div v-else :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
    <div
      v-for="user in results"
      :key="user.id"
      :style="{
        padding: '16px',
        background: selected === user.id ? colors.primaryLight : '#ffffff',
        borderRadius: '12px',
        border: `2px solid ${selected === user.id ? colors.primary : colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }"
      @click="emit(UserSelected, user.id)"
      @mouseenter="(e) => {
        if (selected !== user.id) {
          (e.currentTarget as HTMLElement).style.borderColor = colors.primary;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }
      }"
      @mouseleave="(e) => {
        if (selected !== user.id) {
          (e.currentTarget as HTMLElement).style.borderColor = colors.border;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }
      }"
    >
      <div :style="{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: colors.primary,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '16px',
        marginBottom: '8px',
      }">{{ user.avatar }}</div>
      <p :style="{ fontWeight: 600, fontSize: '16px', color: colors.text, margin: 0 }">{{ user.name }}</p>
      <p :style="{ fontSize: '13px', color: colors.muted, margin: '2px 0 0' }">{{ user.role }}</p>
    </div>
  </div>
</template>
