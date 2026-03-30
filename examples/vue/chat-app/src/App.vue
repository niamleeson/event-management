<script setup lang="ts">
import { ref as vueRef, nextTick, watch } from 'vue'
import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue'
import { engine, SendMessage, MarkRead, messages, typing, unreadCount, slideInTweens } from './engine'

providePulse(engine)

const emit = useEmit()
const msgs = useSignal(messages)
const typingState = useSignal(typing)
const unread = useSignal(unreadCount)
const inputText = vueRef('')
const messagesEndRef = vueRef<HTMLDivElement | null>(null)

const slideVals = Array.from({ length: 50 }, (_, i) => useTween(slideInTweens[i]))

watch(msgs, () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
})

function send() {
  const text = inputText.value.trim()
  if (!text) return
  emit(SendMessage, text)
  inputText.value = ''
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

const senderColors: Record<string, string> = {
  'You': '#4361ee',
  'Alice Bot': '#00b894',
  'Bob Bot': '#e17055',
}

const typingUsers = () => Object.entries(typingState.value).filter(([, v]) => v).map(([k]) => k)
</script>

<template>
  <div :style="{
    width: '480px',
    height: '700px',
    background: '#16213e',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }">
    <!-- Header -->
    <div :style="{ background: '#1a1a3e', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
      <h2 :style="{ color: '#fff', fontSize: '18px', fontWeight: 600 }">Chat</h2>
      <div
        v-if="unread > 0"
        @click="emit(MarkRead, 0)"
        :style="{
          background: '#e17055', color: '#fff', borderRadius: '12px', padding: '2px 10px',
          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        }"
      >
        {{ unread }} unread
      </div>
    </div>

    <!-- Messages -->
    <div :style="{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }">
      <div
        v-for="(msg, i) in msgs"
        :key="msg.id"
        :style="{
          alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
          maxWidth: '75%',
          transform: `translateY(${slideVals[i % 50].value}px)`,
        }"
      >
        <div :style="{ fontSize: '11px', color: senderColors[msg.sender] || '#888', marginBottom: '4px', fontWeight: 600 }">
          {{ msg.sender }}
        </div>
        <div :style="{
          background: msg.sender === 'You' ? '#4361ee' : '#2a2a4a',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: msg.sender === 'You' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: '14px',
          lineHeight: '1.5',
        }">
          {{ msg.text }}
        </div>
        <div :style="{ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: msg.sender === 'You' ? 'right' : 'left' }">
          {{ msg.time }}
          <span v-if="msg.sender === 'You'" :style="{ marginLeft: '4px' }">{{ msg.read ? 'Read' : 'Sent' }}</span>
        </div>
      </div>

      <!-- Typing indicators -->
      <div v-for="user in typingUsers()" :key="user" :style="{ color: '#888', fontSize: '13px', fontStyle: 'italic' }">
        {{ user }} is typing...
      </div>

      <div ref="messagesEndRef" />
    </div>

    <!-- Input -->
    <div :style="{ display: 'flex', padding: '12px 16px', background: '#1a1a3e', gap: '8px' }">
      <input
        v-model="inputText"
        @keydown="onKeyDown"
        placeholder="Type a message..."
        :style="{
          flex: 1, background: '#2a2a4a', border: 'none', color: '#fff', padding: '10px 14px',
          borderRadius: '8px', fontSize: '14px', outline: 'none',
        }"
      />
      <button
        @click="send"
        :style="{
          background: '#4361ee', border: 'none', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        }"
      >
        Send
      </button>
    </div>
  </div>
</template>
