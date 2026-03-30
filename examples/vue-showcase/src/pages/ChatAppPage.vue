<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { providePulse } from '@pulse/vue'
import { engine } from '../../../vue/chat-app/src/engine'
import App from '../../../vue/chat-app/src/App.vue'

providePulse(engine)

onMounted(() => {
  ;(window as any).__pulseEngine = engine
})
onUnmounted(() => {
  ;(window as any).__pulseEngine = null
})
</script>

<template>
  <App />
</template>
