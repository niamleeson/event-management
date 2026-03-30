<script setup lang="ts">
import { useSignal } from '@pulse/vue'
import { currentMetrics, METRICS } from './engine'

const metrics = useSignal(currentMetrics)

function getValue(name: string): number {
  return metrics.value[name]?.value ?? 0
}

function isBreach(name: string): boolean {
  const config = METRICS.find((m) => m.name === name)
  if (!config) return false
  return getValue(name) > config.threshold
}

function formatValue(name: string): string {
  const val = getValue(name)
  return name === 'Latency' ? val.toFixed(0) : val.toFixed(1)
}
</script>

<template>
  <div :style="{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    maxWidth: '1100px',
    margin: '0 auto 24px',
  }">
    <div
      v-for="config in METRICS"
      :key="config.name"
      :style="{
        background: '#111827',
        border: `1px solid ${isBreach(config.name) ? '#ef4444' : '#1e293b'}`,
        borderRadius: '12px',
        padding: '20px',
        transition: 'border-color 0.3s',
      }"
    >
      <div :style="{
        fontSize: '13px',
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
      }">{{ config.name }}</div>
      <div>
        <span :style="{
          fontSize: '36px',
          fontWeight: 800,
          color: isBreach(config.name) ? '#ef4444' : '#f1f5f9',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }">{{ formatValue(config.name) }}</span>
        <span :style="{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }">{{ config.unit }}</span>
      </div>
      <div :style="{ fontSize: '12px', color: '#475569', marginTop: '4px' }">
        Threshold: {{ config.threshold }}{{ config.unit }}
      </div>
    </div>
  </div>
</template>
