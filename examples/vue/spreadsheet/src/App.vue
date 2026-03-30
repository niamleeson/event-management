<script setup lang="ts">
import { ref as vueRef, watch } from 'vue'
import { providePulse, useSignal, useEmit, useEvent } from '@pulse/vue'
import { engine, cells, selectedCell, CellEdited, CellSelected, FormulaError, colLabel, ROWS, COLS } from './engine'

providePulse(engine)

const emit = useEmit()
const grid = useSignal(cells)
const sel = useSignal(selectedCell)
const formulaInputRef = vueRef<HTMLInputElement | null>(null)

useEvent(FormulaError, (payload) => {
  console.warn(`Formula error at ${colLabel(payload.col)}${payload.row + 1}: ${payload.error}`)
})

watch([() => sel.value.row, () => sel.value.col], () => {
  if (formulaInputRef.value) {
    const cell = grid.value[sel.value.row]?.[sel.value.col]
    formulaInputRef.value.value = cell?.raw ?? ''
  }
})

function onFormulaKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLInputElement
  if (e.key === 'Enter') {
    e.preventDefault()
    emit(CellEdited, { row: sel.value.row, col: sel.value.col, value: target.value })
    if (sel.value.row < ROWS - 1) emit(CellSelected, { row: sel.value.row + 1, col: sel.value.col })
  } else if (e.key === 'Tab') {
    e.preventDefault()
    emit(CellEdited, { row: sel.value.row, col: sel.value.col, value: target.value })
    if (sel.value.col < COLS - 1) {
      emit(CellSelected, { row: sel.value.row, col: sel.value.col + 1 })
    } else if (sel.value.row < ROWS - 1) {
      emit(CellSelected, { row: sel.value.row + 1, col: 0 })
    }
  } else if (e.key === 'Escape') {
    const cell = grid.value[sel.value.row]?.[sel.value.col]
    target.value = cell?.raw ?? ''
  }
}

function onFormulaBlur(e: FocusEvent) {
  const value = (e.target as HTMLInputElement).value
  const cell = grid.value[sel.value.row]?.[sel.value.col]
  if (value !== cell?.raw) {
    emit(CellEdited, { row: sel.value.row, col: sel.value.col, value })
  }
}

function cellStyle(row: number, col: number) {
  const isSelected = sel.value.row === row && sel.value.col === col
  const cell = grid.value[row][col]
  const hasError = !!cell.error
  return {
    border: isSelected ? '2px solid #217346' : '1px solid #d0d0d0',
    padding: isSelected ? '3px 5px' : '4px 6px',
    fontSize: '13px',
    cursor: 'cell',
    width: '90px',
    minWidth: '90px',
    height: '28px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    background: isSelected ? '#e8f5e9' : hasError ? '#fff5f5' : '#fff',
    color: hasError ? '#d32f2f' : '#222',
    position: 'relative' as const,
    outline: 'none',
  }
}

const filledCount = () => grid.value.flat().filter(c => c.raw !== '').length
const formulaCount = () => grid.value.flat().filter(c => c.raw.startsWith('=')).length
const errorCount = () => grid.value.flat().filter(c => !!c.error).length
</script>

<template>
  <div :style="{
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f5f5f5',
  }">
    <!-- Header -->
    <div :style="{ background: '#217346', color: '#fff', padding: '8px 16px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }">
      Pulse Spreadsheet
    </div>

    <!-- Formula Bar -->
    <div :style="{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #d0d0d0', padding: '4px 8px', gap: '8px' }">
      <div :style="{ fontWeight: 600, fontSize: '13px', color: '#333', minWidth: '40px', textAlign: 'center', padding: '4px 8px', background: '#f0f0f0', border: '1px solid #d0d0d0', borderRadius: '2px' }">
        {{ colLabel(sel.col) }}{{ sel.row + 1 }}
      </div>
      <span :style="{ color: '#999', fontSize: '13px' }">fx</span>
      <input
        ref="formulaInputRef"
        :style="{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #d0d0d0', borderRadius: '2px', outline: 'none', fontFamily: 'Consolas, monospace' }"
        :defaultValue="grid[sel.row]?.[sel.col]?.raw ?? ''"
        @keydown="onFormulaKeyDown"
        @blur="onFormulaBlur"
      />
    </div>

    <!-- Grid -->
    <div :style="{ flex: 1, overflow: 'auto', padding: '16px' }">
      <table :style="{ borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', userSelect: 'none' }">
        <thead>
          <tr>
            <th :style="{ background: '#e8e8e8', border: '1px solid #d0d0d0', width: '36px', minWidth: '36px' }" />
            <th
              v-for="c in COLS"
              :key="c"
              :style="{ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '6px 0', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#555', width: '90px', minWidth: '90px' }"
            >
              {{ colLabel(c - 1) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in ROWS" :key="r">
            <td :style="{ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '4px 10px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#555', width: '36px', minWidth: '36px' }">
              {{ r }}
            </td>
            <td
              v-for="c in COLS"
              :key="`${r}-${c}`"
              :style="cellStyle(r - 1, c - 1)"
              @click="emit(CellSelected, { row: r - 1, col: c - 1 })"
              :title="grid[r - 1][c - 1].error || grid[r - 1][c - 1].raw"
            >
              {{ grid[r - 1][c - 1].computed }}
              <div
                v-if="grid[r - 1][c - 1].error && sel.row === r - 1 && sel.col === c - 1"
                :style="{
                  position: 'absolute', bottom: '100%', left: '0', background: '#d32f2f', color: '#fff',
                  fontSize: '11px', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                }"
              >
                {{ grid[r - 1][c - 1].error }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status Bar -->
    <div :style="{ background: '#217346', color: '#fff', padding: '4px 16px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }">
      <span>{{ filledCount() }} cells filled | {{ formulaCount() }} formulas | {{ errorCount() }} errors</span>
      <span>
        <template v-if="grid[sel.row]?.[sel.col]?.raw.startsWith('=')">
          Formula: {{ grid[sel.row][sel.col].raw }} = {{ grid[sel.row][sel.col].computed }}
        </template>
        <template v-else-if="grid[sel.row]?.[sel.col]?.computed">
          Value: {{ grid[sel.row][sel.col].computed }}
        </template>
        <template v-else>Empty cell</template>
      </span>
    </div>
  </div>
</template>
