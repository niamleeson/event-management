<script setup lang="ts">
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  AddNotification,
  DismissNotification,
  FloodNotifications,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
  NotificationsChanged,
  getNotifications,
} from './engine'
import type { Priority } from './engine'

providePulse(engine)

const emit = useEmit()
const notifs = usePulse(NotificationsChanged, getNotifications())

const DEMO_TYPES: { priority: Priority; title: string; message: string }[] = [
  { priority: 'info', title: 'Info', message: 'This is an informational notification.' },
  { priority: 'success', title: 'Success', message: 'Operation completed successfully!' },
  { priority: 'warning', title: 'Warning', message: 'Please review your settings.' },
  { priority: 'error', title: 'Error', message: 'Something went wrong. Please try again.' },
]
</script>

<template>
  <div :style="{ padding: '40px', position: 'relative', minHeight: '100vh' }">
    <!-- Controls -->
    <div :style="{ maxWidth: '600px', margin: '0 auto' }">
      <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px', marginBottom: '24px', textAlign: 'center' }">
        Notification System
      </h1>

      <div :style="{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }">
        <button
          v-for="demo in DEMO_TYPES"
          :key="demo.priority"
          @click="emit(AddNotification, demo)"
          :style="{
            background: PRIORITY_COLORS[demo.priority],
            border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }"
        >
          {{ demo.priority }}
        </button>
      </div>

      <div :style="{ textAlign: 'center' }">
        <button
          @click="emit(FloodNotifications, undefined)"
          :style="{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '10px 24px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', letterSpacing: '1px',
          }"
        >
          Flood (10 random)
        </button>
      </div>

      <p :style="{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '24px', fontSize: '13px' }">
        Notifications appear top-right. They auto-dismiss based on priority.
      </p>
    </div>

    <!-- Toast stack (top-right) -->
    <div :style="{ position: 'fixed', top: '20px', right: '20px', width: '340px', zIndex: 1000 }">
      <div
        v-for="(notif, i) in notifs"
        :key="notif.id"
        :style="{
          position: 'relative',
          marginBottom: '8px',
          width: '100%',
          background: '#16213e',
          borderRadius: '10px',
          padding: '14px 16px',
          borderLeft: `4px solid ${PRIORITY_COLORS[notif.priority]}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }"
      >
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: `${PRIORITY_COLORS[notif.priority]}22`,
          color: PRIORITY_COLORS[notif.priority],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, flexShrink: 0,
        }">
          {{ PRIORITY_ICONS[notif.priority] }}
        </div>
        <div :style="{ flex: 1, minWidth: 0 }">
          <div :style="{ color: '#fff', fontSize: '14px', fontWeight: 600 }">{{ notif.title }}</div>
          <div :style="{ color: '#888', fontSize: '12px', marginTop: '2px' }">{{ notif.message }}</div>
        </div>
        <button
          @click="emit(DismissNotification, notif.id)"
          :style="{
            background: 'none', border: 'none', color: '#555', fontSize: '16px',
            cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>
