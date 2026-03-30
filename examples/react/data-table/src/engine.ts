import { createEngine, createSignal } from '@pulse/core'
import type { Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string
  direction: SortDirection
}

export interface RowData {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Inactive' | 'Pending'
  created: string
  revenue: number
}

export interface FilterState {
  [column: string]: string
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SortChanged = engine.event<{ column: string; direction: SortDirection }>('SortChanged')
export const FilterChanged = engine.event<{ column: string; value: string }>('FilterChanged')
export const PageChanged = engine.event<number>('PageChanged')
export const RowSelected = engine.event<string>('RowSelected')
export const RowExpanded = engine.event<string>('RowExpanded')
export const BulkAction = engine.event<{ action: string; ids: string[] }>('BulkAction')
export const SearchChanged = engine.event<string>('SearchChanged')
export const ColumnResized = engine.event<{ column: string; width: number }>('ColumnResized')
export const ExportRequested = engine.event<void>('ExportRequested')
export const SelectAll = engine.event<void>('SelectAll')
export const DeselectAll = engine.event<void>('DeselectAll')

// Internal for async loading simulation
const DataLoading = engine.event<void>('DataLoading')
const DataLoaded = engine.event<void>('DataLoaded')

// ---------------------------------------------------------------------------
// Generate mock data (1000 rows)
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter',
  'Quinn', 'Rose', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yara', 'Zack',
]

const LAST_NAMES = [
  'Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Fisher', 'Garcia',
  'Harris', 'Irwin', 'Jones', 'King', 'Lewis', 'Miller', 'Nelson',
  'Owen', 'Parker', 'Quinn', 'Roberts', 'Smith', 'Taylor', 'Underwood',
  'Vance', 'Wilson', 'Xu', 'Young', 'Zhang',
]

const ROLES = ['Admin', 'Editor', 'Viewer', 'Manager', 'Developer', 'Designer', 'Analyst']
const STATUSES: Array<'Active' | 'Inactive' | 'Pending'> = ['Active', 'Inactive', 'Pending']

function randomDate(): string {
  const start = new Date(2020, 0, 1).getTime()
  const end = new Date(2024, 11, 31).getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

function generateData(): RowData[] {
  const rows: RowData[] = []
  for (let i = 1; i <= 1000; i++) {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    rows.push({
      id: `row-${i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      created: randomDate(),
      revenue: Math.round(Math.random() * 100000) / 100,
    })
  }
  return rows
}

const ALL_DATA = generateData()

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const data: Signal<RowData[]> = createSignal<RowData[]>(ALL_DATA)
engine['_signals'].push(data)

export const sortState = engine.signal<SortState>(
  SortChanged,
  { column: '', direction: null },
  (_prev, state) => state,
)

export const filters: Signal<FilterState> = createSignal<FilterState>({})
engine['_signals'].push(filters)

export const currentPage = engine.signal<number>(
  PageChanged,
  1,
  (_prev, page) => page,
)

export const pageSize = 20

export const selectedRows: Signal<Set<string>> = createSignal<Set<string>>(new Set())
engine['_signals'].push(selectedRows)

export const expandedRows: Signal<Set<string>> = createSignal<Set<string>>(new Set())
engine['_signals'].push(expandedRows)

export const searchQuery = engine.signal<string>(
  SearchChanged,
  '',
  (_prev, query) => query,
)

export const columnWidths: Signal<Record<string, number>> = createSignal<Record<string, number>>({
  id: 60,
  name: 160,
  email: 200,
  role: 100,
  status: 90,
  created: 110,
  revenue: 110,
  actions: 80,
})
engine['_signals'].push(columnWidths)

export const isLoading: Signal<boolean> = createSignal<boolean>(false)
engine['_signals'].push(isLoading)

// ---------------------------------------------------------------------------
// Data processing: sort, filter, search, paginate
// ---------------------------------------------------------------------------

export function getProcessedData(): {
  rows: RowData[]
  totalRows: number
  totalPages: number
} {
  let result = [...ALL_DATA]

  // Search
  const query = searchQuery.value.toLowerCase()
  if (query) {
    result = result.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    )
  }

  // Filters
  const f = filters.value
  for (const [col, val] of Object.entries(f)) {
    if (!val) continue
    result = result.filter((row) => {
      const cellVal = String((row as any)[col]).toLowerCase()
      return cellVal.includes(val.toLowerCase())
    })
  }

  // Sort
  const sort = sortState.value
  if (sort.column && sort.direction) {
    result.sort((a, b) => {
      const aVal = (a as any)[sort.column]
      const bVal = (b as any)[sort.column]
      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal))
      }
      return sort.direction === 'desc' ? -cmp : cmp
    })
  }

  const totalRows = result.length
  const totalPages = Math.ceil(totalRows / pageSize)

  // Paginate
  const page = currentPage.value
  const start = (page - 1) * pageSize
  const rows = result.slice(start, start + pageSize)

  return { rows, totalRows, totalPages }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(FilterChanged, ({ column, value }) => {
  const current = { ...filters.value }
  if (value) {
    current[column] = value
  } else {
    delete current[column]
  }
  filters.set(current)
  // Reset to page 1 on filter change
  engine.emit(PageChanged, 1)
})

engine.on(RowSelected, (id) => {
  const current = new Set(selectedRows.value)
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  selectedRows.set(current)
})

engine.on(RowExpanded, (id) => {
  const current = new Set(expandedRows.value)
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  expandedRows.set(current)
})

engine.on(SelectAll, () => {
  const { rows } = getProcessedData()
  const allIds = new Set(rows.map((r) => r.id))
  const current = new Set(selectedRows.value)
  const allSelected = rows.every((r) => current.has(r.id))
  if (allSelected) {
    // Deselect all visible
    for (const id of allIds) current.delete(id)
  } else {
    // Select all visible
    for (const id of allIds) current.add(id)
  }
  selectedRows.set(current)
})

engine.on(DeselectAll, () => {
  selectedRows.set(new Set())
})

engine.on(BulkAction, ({ action, ids }) => {
  // In a real app, this would trigger an API call
  console.log(`Bulk action: ${action} on ${ids.length} rows`)
  selectedRows.set(new Set())
})

engine.on(ColumnResized, ({ column, width }) => {
  columnWidths.set({ ...columnWidths.value, [column]: Math.max(50, width) })
})

// Simulate async data fetch delay on sort/filter/page change
function simulateLoad() {
  isLoading.set(true)
  setTimeout(() => {
    isLoading.set(false)
  }, 200)
}

engine.on(SortChanged, () => simulateLoad())
engine.on(PageChanged, () => simulateLoad())
engine.on(SearchChanged, () => {
  engine.emit(PageChanged, 1)
  simulateLoad()
})

// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------

engine.startFrameLoop()
