<script setup lang="ts">
import { computed } from 'vue'
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  stocks,
  selectedStock,
  alerts,
  StockSelected,
  DismissAlert,
  StocksChanged,
  SelectedStockChanged,
  AlertsChanged,
} from './engine'
import type { Stock } from './engine'

providePulse(engine)

const emit = useEmit()
const stockList = usePulse(StocksChanged, stocks)
const selected = usePulse(SelectedStockChanged, selectedStock)
const alertList = usePulse(AlertsChanged, alerts)

const selectedData = computed(() => stockList.value.find(s => s.symbol === selected.value))

function sparklinePath(history: number[], width: number, height: number): string {
  if (history.length < 2) return ''
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min || 1
  const stepX = width / (history.length - 1)
  return history.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function mainChartPath(): string {
  const data = selectedData.value
  if (!data || data.history.length < 2) return ''
  return sparklinePath(data.history, 560, 200)
}

function priceColor(stock: Stock): string {
  return stock.change >= 0 ? '#00b894' : '#d63031'
}
</script>

<template>
  <div>
    <h1 :style="{ fontSize: '24px', fontWeight: 300, letterSpacing: '2px', marginBottom: '24px' }">Stock Dashboard</h1>

    <div :style="{ display: 'flex', gap: '20px' }">
      <!-- Stock list -->
      <div :style="{ width: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }">
        <div
          v-for="stock in stockList"
          :key="stock.symbol"
          @click="emit(StockSelected, stock.symbol)"
          :style="{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
            background: selected === stock.symbol ? 'rgba(67,97,238,0.15)' : 'rgba(255,255,255,0.03)',
            border: selected === stock.symbol ? '1px solid rgba(67,97,238,0.4)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', cursor: 'pointer',
          }"
        >
          <div :style="{ flex: 1 }">
            <div :style="{ fontSize: '14px', fontWeight: 700 }">{{ stock.symbol }}</div>
            <div :style="{ fontSize: '11px', color: '#888' }">{{ stock.name }}</div>
          </div>
          <!-- Sparkline -->
          <svg :width="60" :height="24" :style="{ overflow: 'visible' }">
            <path :d="sparklinePath(stock.history, 60, 24)" fill="none" :stroke="priceColor(stock)" stroke-width="1.5" />
          </svg>
          <div :style="{ textAlign: 'right', minWidth: '80px' }">
            <div :style="{ fontSize: '14px', fontWeight: 600 }">${{ stock.price.toFixed(2) }}</div>
            <div :style="{ fontSize: '11px', color: priceColor(stock) }">
              {{ stock.change >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Main chart -->
      <div :style="{ flex: 1 }">
        <div v-if="selectedData" :style="{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }">
          <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }">
            <div>
              <div :style="{ fontSize: '20px', fontWeight: 700 }">{{ selectedData.symbol }}</div>
              <div :style="{ fontSize: '13px', color: '#888' }">{{ selectedData.name }}</div>
            </div>
            <div :style="{ textAlign: 'right' }">
              <div :style="{ fontSize: '28px', fontWeight: 700 }">${{ selectedData.price.toFixed(2) }}</div>
              <div :style="{ fontSize: '14px', color: priceColor(selectedData) }">
                {{ selectedData.change >= 0 ? '+' : '' }}{{ selectedData.change.toFixed(2) }}
                ({{ selectedData.change >= 0 ? '+' : '' }}{{ selectedData.changePercent.toFixed(2) }}%)
              </div>
            </div>
          </div>
          <svg width="560" height="200" :style="{ overflow: 'visible' }">
            <path :d="mainChartPath()" fill="none" :stroke="priceColor(selectedData)" stroke-width="2" />
          </svg>
        </div>

        <!-- Alerts -->
        <div v-if="alertList.length > 0" :style="{ marginTop: '16px' }">
          <h3 :style="{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '8px' }">Alerts</h3>
          <div
            v-for="alert in alertList"
            :key="alert.id"
            :style="{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
              background: alert.type === 'up' ? 'rgba(0,184,148,0.1)' : 'rgba(214,48,49,0.1)',
              border: `1px solid ${alert.type === 'up' ? 'rgba(0,184,148,0.3)' : 'rgba(214,48,49,0.3)'}`,
              borderRadius: '8px', marginBottom: '6px', fontSize: '13px',
            }"
          >
            <span :style="{ color: alert.type === 'up' ? '#00b894' : '#d63031', fontWeight: 700 }">
              {{ alert.type === 'up' ? '\u25B2' : '\u25BC' }}
            </span>
            <span :style="{ flex: 1 }">{{ alert.message }}</span>
            <button
              @click="emit(DismissAlert, alert.id)"
              :style="{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px' }"
            >&times;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
