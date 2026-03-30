<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { providePulse } from '@pulse/vue'
import { engine } from '../../../vue/canvas-paint/src/engine'
import App from '../../../vue/canvas-paint/src/App.vue'

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
