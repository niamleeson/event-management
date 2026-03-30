<script setup lang="ts">
import { providePulse, useEmit, useTween, useSpring } from '@pulse/vue'
import { engine, CARDS, anims } from './engine'

providePulse(engine)

const emit = useEmit()

const flipVals = CARDS.map((_, i) => useTween(anims.flipTweens[i]))
const unflipVals = CARDS.map((_, i) => useTween(anims.unflipTweens[i]))
const scales = CARDS.map((_, i) => useSpring(anims.hoverSprings[i]))

function getRotation(index: number): number {
  if (anims.flipTweens[index].active) return flipVals[index].value
  if (anims.unflipTweens[index].active) return unflipVals[index].value
  return anims.flippedStates[index] ? 180 : 0
}
</script>

<template>
  <div>
    <h1 :style="{ color: '#fff', textAlign: 'center', marginBottom: '32px', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">
      3D Card Flip Gallery
    </h1>
    <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(4, 260px)', gap: '24px' }">
      <div
        v-for="(card, i) in CARDS"
        :key="i"
        :style="{ perspective: '1000px', width: '260px', height: '340px', cursor: 'pointer' }"
        @click="emit(anims.CardClicked, i)"
        @mouseenter="emit(anims.HoverIn, i)"
        @mouseleave="emit(anims.HoverOut, i)"
      >
        <div :style="{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `scale(${scales[i].value}) rotateY(${getRotation(i)}deg)`,
          transition: 'box-shadow 0.2s',
          borderRadius: '16px',
        }">
          <!-- Front face -->
          <div :style="{
            position: 'absolute',
            inset: '0',
            backfaceVisibility: 'hidden',
            borderRadius: '16px',
            background: `linear-gradient(145deg, ${card.color}dd, ${card.color}88)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: '24px',
          }">
            <div :style="{
              width: '140px',
              height: '140px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${card.color}44, ${card.color})`,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              marginBottom: '20px',
            }">
              {{ card.title[0] }}
            </div>
            <h3 :style="{ color: '#fff', fontSize: '22px', fontWeight: 700, letterSpacing: '1px' }">
              {{ card.title }}
            </h3>
          </div>

          <!-- Back face -->
          <div :style="{
            position: 'absolute',
            inset: '0',
            backfaceVisibility: 'hidden',
            borderRadius: '16px',
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: '24px',
            gap: '16px',
          }">
            <h3 :style="{ color: card.color, fontSize: '20px', fontWeight: 700 }">
              {{ card.title }}
            </h3>
            <p :style="{ color: '#ccc', fontSize: '14px', textAlign: 'center', lineHeight: 1.6, maxWidth: '200px' }">
              {{ card.desc }}
            </p>
            <div :style="{ display: 'flex', gap: '24px', marginTop: '8px' }">
              <div :style="{ textAlign: 'center' }">
                <div :style="{ color: card.color, fontSize: '24px', fontWeight: 700 }">
                  {{ card.views.toLocaleString() }}
                </div>
                <div :style="{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }">
                  Views
                </div>
              </div>
              <div :style="{ textAlign: 'center' }">
                <div :style="{ color: card.color, fontSize: '24px', fontWeight: 700 }">
                  {{ card.likes.toLocaleString() }}
                </div>
                <div :style="{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }">
                  Likes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
