<script setup lang="ts">
import { useSignal, useEmit } from '@pulse/vue'
import { alerts, AlertDismissed } from './engine'

const emit = useEmit()
const alertList = useSignal(alerts)
</script>

<template>
  <div :style="{ maxWidth: '1100px', margin: '0 auto' }">
    <h2 :style="{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }">
      Alerts ({{ alertList.length }})
    </h2>
    <div v-if="alertList.length === 0" :style="{ textAlign: 'center', padding: '32px', color: '#334155', fontSize: '14px' }">
      No active alerts. Alerts trigger after 3 consecutive threshold breaches.
    </div>
    <div
      v-for="alert in alertList"
      :key="alert.id"
      :style="{
        background: '#1a0a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideIn 0.3s ease-out',
      }"
    >
      <span :style="{ fontSize: '14px', color: '#fca5a5', flex: 1 }">{{ alert.message }}</span>
      <span :style="{ fontSize: '12px', color: '#7f1d1d', marginLeft: '16px', flexShrink: 0 }">
        {{ new Date(alert.timestamp).toLocaleTimeString() }}
      </span>
      <button
        :style="{
          fontSize: '18px',
          color: '#7f1d1d',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginLeft: '12px',
          padding: '0 4px',
          transition: 'color 0.2s',
        }"
        @click="emit(AlertDismissed, alert.id)"
        @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#fca5a5'"
        @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#7f1d1d'"
      >x</button>
    </div>
  </div>
</template>
