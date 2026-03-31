<script setup lang="ts">
import { onMounted } from 'vue'
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  CARDS,
  CARD_COUNT,
  PageLoaded,
  allEntered,
  welcomeOpacity,
  welcomeTranslateY,
  AllEnteredChanged,
  WelcomeOpacityVal,
  WelcomeTranslateYVal,
} from './engine'
import AnimatedCard from './AnimatedCard.vue'

providePulse(engine)

const emit = useEmit()
const entered = usePulse(AllEnteredChanged, allEntered)
const wOpacity = usePulse(WelcomeOpacityVal, welcomeOpacity.value)
const wTranslateY = usePulse(WelcomeTranslateYVal, welcomeTranslateY.value)

onMounted(() => {
  const timer = setTimeout(() => {
    emit(PageLoaded, undefined as unknown as void)
  }, 300)
})
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: '#f8f9fa',
    padding: '60px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
  }">
    <div :style="{ maxWidth: '900px', margin: '0 auto' }">
      <div :style="{ textAlign: 'center', marginBottom: '48px' }">
        <h1 :style="{ fontSize: '42px', fontWeight: 800, color: '#1a1a2e', margin: 0 }">
          Staggered Card Entrance
        </h1>
        <p :style="{
          color: '#6c757d',
          fontSize: '16px',
          marginTop: '8px',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }">
          Cards cascade in with staggered tweens. Hover for spring-driven
          shadows. A join rule fires after all cards enter.
        </p>
      </div>

      <div :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
      }">
        <AnimatedCard
          v-for="(card, i) in CARDS"
          :key="card.id"
          :card="card"
          :index="i"
        />
      </div>

      <div
        v-if="entered || wOpacity > 0"
        :style="{
          opacity: wOpacity,
          transform: `translateY(${wTranslateY}px)`,
          textAlign: 'center',
          marginTop: '48px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
          borderRadius: '16px',
          color: '#fff',
        }"
      >
        <h2 :style="{ margin: 0, fontSize: '28px', fontWeight: 700 }">
          Welcome to Pulse
        </h2>
        <p :style="{ margin: '8px 0 0', fontSize: '16px', opacity: 0.9 }">
          All {{ CARD_COUNT }} cards have entered &mdash; this message was triggered by a join rule
        </p>
      </div>
    </div>
  </div>
</template>
