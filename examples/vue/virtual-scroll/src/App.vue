<script setup lang="ts">
import { computed } from 'vue'
import { providePulse, useEmit, useSignal } from '@pulse/vue'
import {
  engine, TOTAL_ITEMS, PAGE_SIZE, ITEM_HEIGHT,
  ScrollTo, SearchChanged, scrollTop, searchQuery, loadedPages, loadingPages,
} from './engine'
import type { Item } from './engine'

providePulse(engine)

const emit = useEmit()
const top = useSignal(scrollTop)
const query = useSignal(searchQuery)
const pages = useSignal(loadedPages)
const loading = useSignal(loadingPages)

const VIEWPORT_HEIGHT = 600
const BUFFER = 5

const totalHeight = TOTAL_ITEMS * ITEM_HEIGHT

const visibleRange = computed(() => {
  const startIdx = Math.max(0, Math.floor(top.value / ITEM_HEIGHT) - BUFFER)
  const endIdx = Math.min(TOTAL_ITEMS - 1, Math.ceil((top.value + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + BUFFER)
  return { startIdx, endIdx }
})

function getItem(index: number): Item | null {
  const page = Math.floor(index / PAGE_SIZE)
  const items = pages.value.get(page)
  if (!items) return null
  return items[index % PAGE_SIZE] ?? null
}

function isLoading(index: number): boolean {
  const page = Math.floor(index / PAGE_SIZE)
  return loading.value.has(page)
}

function matchesSearch(item: Item | null): boolean {
  if (!query.value || !item) return true
  const q = query.value.toLowerCase()
  return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q)
}

const statusColors: Record<string, string> = {
  active: '#00b894',
  inactive: '#d63031',
  pending: '#fdcb6e',
}

function onScroll(e: Event) {
  const target = e.target as HTMLElement
  emit(ScrollTo, target.scrollTop)
}

const visibleItems = computed(() => {
  const items = []
  for (let i = visibleRange.value.startIdx; i <= visibleRange.value.endIdx; i++) {
    const item = getItem(i)
    if (!query.value || matchesSearch(item)) {
      items.push({ index: i, item, loading: isLoading(i) })
    }
  }
  return items
})
</script>

<template>
  <div :style="{ width: '600px' }">
    <h1 :style="{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '16px' }">
      Virtual Scroll ({{ TOTAL_ITEMS.toLocaleString() }} items)
    </h1>

    <!-- Search -->
    <input
      :value="query"
      @input="emit(SearchChanged, ($event.target as HTMLInputElement).value)"
      placeholder="Search by name or email..."
      :style="{
        width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #ddd',
        borderRadius: '8px', marginBottom: '16px', outline: 'none', background: '#fff',
      }"
    />

    <!-- Loading indicator -->
    <div v-if="loading.size > 0" :style="{ fontSize: '12px', color: '#888', marginBottom: '8px' }">
      Loading pages: {{ [...loading].join(', ') }}
    </div>

    <!-- Virtual list -->
    <div
      @scroll="onScroll"
      :style="{
        height: `${VIEWPORT_HEIGHT}px`, overflow: 'auto', background: '#fff',
        borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        position: 'relative',
      }"
    >
      <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
        <div
          v-for="{ index, item, loading: isLoad } in visibleItems"
          :key="index"
          :style="{
            position: 'absolute',
            top: `${index * ITEM_HEIGHT}px`,
            left: '0', right: '0',
            height: `${ITEM_HEIGHT}px`,
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px',
            borderBottom: '1px solid #f0f0f0',
            background: index % 2 === 0 ? '#fff' : '#fafafa',
          }"
        >
          <!-- Skeleton loading -->
          <template v-if="!item || isLoad">
            <div :style="{ width: '40px', height: '12px', background: '#e0e0e0', borderRadius: '4px' }" />
            <div :style="{ flex: 1, height: '12px', background: '#e0e0e0', borderRadius: '4px' }" />
            <div :style="{ width: '180px', height: '12px', background: '#e0e0e0', borderRadius: '4px' }" />
          </template>
          <template v-else>
            <div :style="{ width: '40px', color: '#999', fontSize: '12px' }">{{ item.id }}</div>
            <div :style="{ flex: 1, fontSize: '14px', color: '#333', fontWeight: 500 }">{{ item.name }}</div>
            <div :style="{ width: '200px', fontSize: '13px', color: '#888' }">{{ item.email }}</div>
            <div :style="{
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
              color: statusColors[item.status], padding: '2px 8px',
              background: `${statusColors[item.status]}18`, borderRadius: '4px',
            }">
              {{ item.status }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
