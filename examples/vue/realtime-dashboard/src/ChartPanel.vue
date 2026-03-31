<script setup lang="ts">
import { usePulse } from '@pulse/vue'
import {
  METRICS,
  ChartDataChanged,
  getChartData,
  type ChartDataPoint,
} from './engine'

const data = usePulse(ChartDataChanged, getChartData())

const CHART_COLORS: Record<string, string> = {
  'CPU Usage': '#4361ee',
  'Memory': '#7209b7',
  'Latency': '#f59e0b',
  'Requests/s': '#10b981',
}

function getPoints(name: string): ChartDataPoint[] {
  return data.value[name] ?? []
}

function getThreshold(name: string): number {
  return METRICS.find((m) => m.name === name)?.threshold ?? 0
}

function barHeight(value: number, maxVal: number): number {
  return (value / maxVal) * 100
}

function maxValue(points: ChartDataPoint[], threshold: number): number {
  if (points.length === 0) return threshold * 1.1
  return Math.max(...points.map((d) => d.value), threshold * 1.1)
}
</script>

<template>
  <div :style="{
    maxWidth: '1100px',
    margin: '0 auto 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  }">
    <div
      v-for="config in METRICS"
      :key="config.name"
      :style="{
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
      }"
    >
      <div :style="{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px' }">
        {{ config.name }}
      </div>
      <div v-if="getPoints(config.name).length === 0" :style="{
        height: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        justifyContent: 'center',
        color: '#334155',
        fontSize: '13px',
      }">
        Waiting for data...
      </div>
      <div v-else :style="{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '2px', position: 'relative' }">
        <div
          v-for="(point, i) in getPoints(config.name)"
          :key="i"
          :style="{
            flex: 1,
            height: `${barHeight(point.value, maxValue(getPoints(config.name), config.threshold))}%`,
            background: point.value > config.threshold ? '#ef4444' : (CHART_COLORS[config.name] ?? '#4361ee'),
            borderRadius: '3px 3px 0 0',
            minWidth: '3px',
            opacity: 0.5 + (i / getPoints(config.name).length) * 0.5,
            transition: 'height 0.3s ease-out',
          }"
        />
        <!-- Threshold line -->
        <div :style="{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${(config.threshold / maxValue(getPoints(config.name), config.threshold)) * 100}%`,
          height: '1px',
          background: '#ef4444',
          opacity: 0.3,
          pointerEvents: 'none',
        }" />
      </div>
    </div>
  </div>
</template>
