<script setup lang="ts">
import { useEmit, usePulse, useTween, useSpring } from '@pulse/vue'
import {
  HoverCard,
  UnhoverCard,
  cardOpacity,
  cardTranslateY,
  cardHoverScale,
  cardHoverShadow,
  type CardData,
} from './engine'

const props = defineProps<{ card: CardData; index: number }>()

const emit = useEmit()
const opacity = useTween(cardOpacity[props.index])
const translateY = useTween(cardTranslateY[props.index])
const scale = useTween(cardHoverScale[props.index])
const shadowSize = useSpring(cardHoverShadow[props.index])
</script>

<template>
  <div
    :style="{
      opacity: opacity,
      transform: `translateY(${translateY}px) scale(${scale})`,
      background: '#fff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: `0 ${2 + shadowSize * 0.5}px ${8 + shadowSize}px rgba(0,0,0,${0.06 + shadowSize * 0.008})`,
      cursor: 'pointer',
      borderTop: `4px solid ${card.color}`,
      transition: 'box-shadow 0.05s',
    }"
    @mouseenter="emit(HoverCard[index], index)"
    @mouseleave="emit(UnhoverCard[index], index)"
  >
    <div :style="{ fontSize: '36px', marginBottom: '12px' }">
      {{ card.icon }}
    </div>
    <h3 :style="{
      margin: 0,
      fontSize: '20px',
      fontWeight: 700,
      color: '#1a1a2e',
      marginBottom: '8px',
    }">{{ card.title }}</h3>
    <p :style="{
      margin: 0,
      fontSize: '14px',
      color: '#6c757d',
      lineHeight: 1.5,
    }">{{ card.description }}</p>
  </div>
</template>
