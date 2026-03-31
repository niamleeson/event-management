<script setup lang="ts">
import { providePulse } from '@pulse/vue'
import {
  engine,
} from './engine'
import Counter from './Counter.vue'

providePulse(engine)
</script>

<template>
  <Counter />
</template>
