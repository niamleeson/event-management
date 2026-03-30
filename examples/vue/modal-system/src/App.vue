<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue'
import {
  engine, OpenModal, CloseModal, CloseTopModal,
  modalStack, backdropOpacity, scaleEntranceTweens, fadeEntranceTweens, SIZE_WIDTHS,
} from './engine'
import type { ModalSize } from './engine'

providePulse(engine)

const emit = useEmit()
const stack = useSignal(modalStack)
const backdrop = useTween(backdropOpacity)

const scaleVals = Array.from({ length: 10 }, (_, i) => useTween(scaleEntranceTweens[i]))
const fadeVals = Array.from({ length: 10 }, (_, i) => useTween(fadeEntranceTweens[i]))

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit(CloseTopModal, undefined)
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

const DEMO_MODALS: { title: string; content: string; size: ModalSize }[] = [
  { title: 'Small Modal', content: 'This is a small modal dialog. You can stack multiple modals!', size: 'sm' },
  { title: 'Medium Modal', content: 'This is a medium-sized modal with more content space. Try opening another modal on top of this one to see the stacking effect with offset positioning.', size: 'md' },
  { title: 'Large Modal', content: 'This is a large modal. It has the most content space. Modals stack with scale/fade tweens, backdrop blur, and offset positioning. Press Escape to close the top modal, or click the X button. Focus is trapped within the modal.', size: 'lg' },
]
</script>

<template>
  <div>
    <!-- Controls -->
    <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }">
      <h1 :style="{ color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px' }">Modal System</h1>

      <div :style="{ display: 'flex', gap: '12px' }">
        <button
          v-for="demo in DEMO_MODALS"
          :key="demo.size"
          @click="emit(OpenModal, demo)"
          :style="{
            background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.4)',
            color: '#4361ee', padding: '10px 24px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }"
        >
          {{ demo.size.toUpperCase() }}
        </button>
      </div>

      <p :style="{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }">
        Click buttons to open modals &middot; Escape to close &middot; Stack supported
      </p>
    </div>

    <!-- Backdrop -->
    <div
      v-if="stack.length > 0"
      @click="emit(CloseTopModal, undefined)"
      :style="{
        position: 'fixed', inset: '0', zIndex: 1000,
        background: `rgba(0,0,0,${0.5 * backdrop})`,
        backdropFilter: `blur(${4 * backdrop}px)`,
      }"
    />

    <!-- Modal stack -->
    <div
      v-for="(modal, i) in stack"
      :key="modal.id"
      :style="{
        position: 'fixed', inset: '0', zIndex: 1001 + i,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        pointerEvents: 'none',
      }"
    >
      <div
        :style="{
          width: `${SIZE_WIDTHS[modal.size]}px`,
          background: '#16213e',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'all',
          transform: `scale(${scaleVals[i % 10].value}) translateY(${i * -12}px)`,
          opacity: fadeVals[i % 10].value,
        }"
        @click.stop
      >
        <!-- Header -->
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }">
          <h2 :style="{ color: '#fff', fontSize: '18px', fontWeight: 600 }">{{ modal.title }}</h2>
          <button
            @click="emit(CloseModal, modal.id)"
            :style="{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#888',
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }"
          >&times;</button>
        </div>

        <!-- Content -->
        <p :style="{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }">
          {{ modal.content }}
        </p>

        <!-- Stack another modal button -->
        <div :style="{ display: 'flex', gap: '8px' }">
          <button
            @click="emit(OpenModal, { title: `Stacked Modal #${stack.length + 1}`, content: 'This is a stacked modal! You can keep stacking them.', size: 'sm' as ModalSize })"
            :style="{
              background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.4)',
              color: '#4361ee', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }"
          >Stack Another</button>
          <button
            @click="emit(CloseModal, modal.id)"
            :style="{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }"
          >Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
