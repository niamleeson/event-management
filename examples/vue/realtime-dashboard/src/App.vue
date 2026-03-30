<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { providePulse, useSignal, useEmit } from '@pulse/vue'
import {
  engine,
  feedRunning,
  FeedToggled,
  startFeed,
  stopFeed,
  METRICS,
} from './engine'
import MetricCards from './MetricCards.vue'
import ChartPanel from './ChartPanel.vue'
import AlertPanel from './AlertPanel.vue'

providePulse(engine)

const emit = useEmit()
const running = useSignal(feedRunning)

onMounted(() => startFeed())
onUnmounted(() => stopFeed())
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: '#0a0a1a',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    color: '#e2e8f0',
  }">
    <component :is="'style'">
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    </component>

    <div :style="{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1100px',
      margin: '0 auto 32px',
    }">
      <div>
        <h1 :style="{ fontSize: '32px', fontWeight: 800, color: '#f1f5f9', margin: 0 }">
          <span :style="{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: running ? '#10b981' : '#64748b',
            marginRight: '8px',
            animation: running ? 'pulse 2s infinite' : 'none',
          }" />
          Realtime Dashboard
        </h1>
        <p :style="{ color: '#64748b', fontSize: '13px', marginTop: '2px' }">
          Mock WebSocket pushing metrics every second. All data flows through Pulse events.
        </p>
      </div>
      <button
        :style="{
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          background: running ? '#ef4444' : '#10b981',
          color: '#fff',
          transition: 'background 0.2s',
        }"
        @click="emit(FeedToggled, !running)"
      >
        {{ running ? 'Pause Feed' : 'Resume Feed' }}
      </button>
    </div>

    <MetricCards />
    <ChartPanel />
    <AlertPanel />
  </div>
</template>
