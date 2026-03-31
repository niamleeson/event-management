<script setup lang="ts">
import { computed } from 'vue'
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  COLUMNS,
  PAGE_SIZE,
  STATUS_COLORS,
  FetchData,
  SortChanged,
  FilterChanged,
  PageChanged,
  RowExpanded,
  RowSelected,
  SelectAll,
  BulkDelete,
  SearchChanged,
  ColumnResized,
  allData,
  loading,
  sortColumn,
  sortDir,
  filterStatus,
  searchQuery,
  currentPage,
  expandedRow,
  selectedRows,
  columnWidths,
  expandTween,
  AllDataChanged,
  LoadingChanged,
  SortColumnChanged,
  SortDirChanged,
  FilterStatusChanged,
  SearchQueryChanged,
  CurrentPageChanged,
  ExpandedRowChanged,
  ExpandTweenVal,
} from './engine'
import type { DataRow, Column } from './engine'

providePulse(engine)

const emit = useEmit()
const data = usePulse(AllDataChanged, allData)
const isLoading = usePulse(LoadingChanged, loading)
const sortCol = usePulse(SortColumnChanged, sortColumn)
const sortDirection = usePulse(SortDirChanged, sortDir)
const filter = usePulse(FilterStatusChanged, filterStatus)
const search = usePulse(SearchQueryChanged, searchQuery)
const page = usePulse(CurrentPageChanged, currentPage)
const expanded = usePulse(ExpandedRowChanged, expandedRow)
const selected = usePulse(SelectedRowsChanged, selectedRows)
const colWidths = usePulse(ColumnWidthsChanged, columnWidths)
const expandVal = usePulse(ExpandTweenVal, expandTween.value)

const filteredData = computed(() => {
  let rows = data.value
  if (filter.value) rows = rows.filter(r => r.status === filter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q)
    )
  }
  if (sortCol.value && sortDirection.value) {
    const col = sortCol.value
    const dir = sortDirection.value === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const av = a[col]
      const bv = b[col]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }
  return rows
})

const pageData = computed(() => {
  const start = page.value * PAGE_SIZE
  return filteredData.value.slice(start, start + PAGE_SIZE)
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / PAGE_SIZE))

function highlightSearch(text: string): string {
  if (!search.value) return text
  return text
}

let resizeState: { column: Column; startX: number; startWidth: number } | null = null

function onResizeStart(e: PointerEvent, col: Column) {
  resizeState = { column: col, startX: e.clientX, startWidth: colWidths.value[col] ?? 120 }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onResizeMove(e: PointerEvent) {
  if (!resizeState) return
  const dx = e.clientX - resizeState.startX
  emit(ColumnResized, { column: resizeState.column, width: resizeState.startWidth + dx })
}

function onResizeEnd() {
  resizeState = null
}
</script>

<template>
  <div>
    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }">
      <h1 :style="{ fontSize: '24px', fontWeight: 700, color: '#333' }">
        Data Table
        <span :style="{ fontSize: '14px', fontWeight: 400, color: '#888', marginLeft: '8px' }">
          {{ filteredData.length.toLocaleString() }} rows
        </span>
      </h1>
      <div :style="{ display: 'flex', gap: '8px' }">
        <button
          v-if="selected.size > 0"
          @click="emit(BulkDelete, undefined)"
          :style="{ background: '#d63031', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }"
        >Delete {{ selected.size }} selected</button>
        <button
          @click="emit(FetchData, undefined)"
          :style="{ background: '#4361ee', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }"
        >{{ isLoading ? 'Loading...' : 'Reload' }}</button>
      </div>
    </div>

    <!-- Filters -->
    <div :style="{ display: 'flex', gap: '12px', marginBottom: '16px' }">
      <input
        :value="search"
        @input="emit(SearchChanged, ($event.target as HTMLInputElement).value)"
        placeholder="Search name, email, dept, role..."
        :style="{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none' }"
      />
      <select
        :value="filter"
        @change="emit(FilterChanged, ($event.target as HTMLSelectElement).value)"
        :style="{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </select>
    </div>

    <!-- Table -->
    <div :style="{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'auto' }">
      <table :style="{ width: '100%', borderCollapse: 'collapse' }">
        <thead>
          <tr>
            <th :style="{ width: '40px', padding: '10px', borderBottom: '2px solid #e0e0e0', background: '#fafafa' }">
              <input type="checkbox" :checked="selected.size > 0" @change="emit(SelectAll, undefined)" />
            </th>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              @click="emit(SortChanged, col.key)"
              :style="{
                width: `${colWidths[col.key] ?? 120}px`,
                padding: '10px 12px', borderBottom: '2px solid #e0e0e0', background: '#fafafa',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#555',
                textAlign: 'left', position: 'relative', userSelect: 'none',
              }"
            >
              {{ col.label }}
              <span v-if="sortCol === col.key" :style="{ marginLeft: '4px' }">
                {{ sortDirection === 'asc' ? '\u25B2' : sortDirection === 'desc' ? '\u25BC' : '' }}
              </span>
              <!-- Resize handle -->
              <div
                @pointerdown.stop="(e) => onResizeStart(e, col.key)"
                @pointermove="onResizeMove"
                @pointerup="onResizeEnd"
                :style="{
                  position: 'absolute', right: '0', top: '0', bottom: '0', width: '4px',
                  cursor: 'col-resize', background: 'transparent',
                }"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in pageData" :key="row.id">
            <tr
              @click="emit(RowExpanded, row.id)"
              :style="{
                cursor: 'pointer',
                background: selected.has(row.id) ? '#e8f4f8' : expanded === row.id ? '#f8f8ff' : '#fff',
                borderBottom: '1px solid #f0f0f0',
              }"
            >
              <td :style="{ padding: '8px 10px' }">
                <input
                  type="checkbox"
                  :checked="selected.has(row.id)"
                  @click.stop
                  @change="emit(RowSelected, row.id)"
                />
              </td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', fontWeight: 500, color: '#333' }">
                <span :style="{ background: search && row.name.toLowerCase().includes(search.toLowerCase()) ? '#fdcb6e55' : 'transparent', padding: '0 2px' }">
                  {{ row.name }}
                </span>
              </td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', color: '#666' }">{{ row.email }}</td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', color: '#666' }">{{ row.department }}</td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', color: '#666' }">{{ row.role }}</td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', color: '#333', fontWeight: 500 }">${{ row.salary.toLocaleString() }}</td>
              <td :style="{ padding: '8px 12px' }">
                <span :style="{
                  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: STATUS_COLORS[row.status], padding: '2px 8px',
                  background: `${STATUS_COLORS[row.status]}15`, borderRadius: '4px',
                }">{{ row.status }}</span>
              </td>
              <td :style="{ padding: '8px 12px', fontSize: '13px', color: '#888' }">{{ row.joinDate }}</td>
            </tr>
            <!-- Expanded row -->
            <tr v-if="expanded === row.id">
              <td :colspan="COLUMNS.length + 1" :style="{
                padding: '16px 24px', background: '#f8f8ff', borderBottom: '1px solid #e0e0e0',
                opacity: expandVal,
              }">
                <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }">
                  <div><strong>ID:</strong> {{ row.id }}</div>
                  <div><strong>Email:</strong> {{ row.email }}</div>
                  <div><strong>Department:</strong> {{ row.department }}</div>
                  <div><strong>Role:</strong> {{ row.role }}</div>
                  <div><strong>Salary:</strong> ${{ row.salary.toLocaleString() }}</div>
                  <div><strong>Join Date:</strong> {{ row.joinDate }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }">
      <button
        @click="emit(PageChanged, Math.max(0, page - 1))"
        :disabled="page === 0"
        :style="{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: page === 0 ? 'default' : 'pointer', color: page === 0 ? '#ccc' : '#333', fontSize: '13px' }"
      >Prev</button>
      <span :style="{ fontSize: '13px', color: '#666' }">
        Page {{ page + 1 }} of {{ totalPages }}
      </span>
      <button
        @click="emit(PageChanged, Math.min(totalPages - 1, page + 1))"
        :disabled="page >= totalPages - 1"
        :style="{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', color: page >= totalPages - 1 ? '#ccc' : '#333', fontSize: '13px' }"
      >Next</button>
    </div>
  </div>
</template>
