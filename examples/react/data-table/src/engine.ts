import { createEngine } from '@pulse/core'

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
// DAG
// ---------------------------------------------------------------------------
// SortChanged ──→ SortStateChanged
// FilterChanged ┬──→ FiltersChanged
//               └──→ CurrentPageChanged
// PageChanged ──→ CurrentPageChanged
// RowSelected ──→ SelectedRowsChanged
// RowExpanded ──→ ExpandedRowsChanged
// SelectAll ──→ SelectedRowsChanged
// DeselectAll ──→ SelectedRowsChanged
// BulkAction ──→ SelectedRowsChanged
// ColumnResized ──→ ColumnWidthsChanged
// SearchChanged ┬──→ SearchQueryChanged
//               └──→ CurrentPageChanged
// ---------------------------------------------------------------------------

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

// State-changed events for React subscriptions
export const SortStateChanged = engine.event<SortState>('SortStateChanged')
export const FiltersChanged = engine.event<FilterState>('FiltersChanged')
export const CurrentPageChanged = engine.event<number>('CurrentPageChanged')
export const SelectedRowsChanged = engine.event<Set<string>>('SelectedRowsChanged')
export const ExpandedRowsChanged = engine.event<Set<string>>('ExpandedRowsChanged')
export const SearchQueryChanged = engine.event<string>('SearchQueryChanged')
export const ColumnWidthsChanged = engine.event<Record<string, number>>('ColumnWidthsChanged')
export const IsLoadingChanged = engine.event<boolean>('IsLoadingChanged')

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
// State
// ---------------------------------------------------------------------------

let sortState: SortState = { column: '', direction: null }
let filters: FilterState = {}
let currentPage = 1
export const pageSize = 20
let selectedRows: Set<string> = new Set()
let expandedRows: Set<string> = new Set()
let searchQuery = ''
let columnWidths: Record<string, number> = {
  id: 60,
  name: 160,
  email: 200,
  role: 100,
  status: 90,
  created: 110,
  revenue: 110,
  actions: 80,
}
let isLoading = false

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
  const query = searchQuery.toLowerCase()
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
  for (const [col, val] of Object.entries(filters)) {
    if (!val) continue
    result = result.filter((row) => {
      const cellVal = String((row as any)[col]).toLowerCase()
      return cellVal.includes(val.toLowerCase())
    })
  }

  // Sort
  if (sortState.column && sortState.direction) {
    const sort = sortState
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
  const start = (currentPage - 1) * pageSize
  const rows = result.slice(start, start + pageSize)

  return { rows, totalRows, totalPages }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SortChanged, [SortStateChanged], (state, setSortState) => {
  sortState = state
  setSortState(sortState)
  simulateLoad()
})

engine.on(FilterChanged, [FiltersChanged, CurrentPageChanged], ({ column, value }, setFilters, setPage) => {
  const current = { ...filters }
  if (value) {
    current[column] = value
  } else {
    delete current[column]
  }
  filters = current
  setFilters(filters)
  // Reset to page 1 on filter change
  currentPage = 1
  setPage(currentPage)
})

engine.on(PageChanged, [CurrentPageChanged], (page, setPage) => {
  currentPage = page
  setPage(currentPage)
  simulateLoad()
})

engine.on(RowSelected, [SelectedRowsChanged], (id, setSelected) => {
  const current = new Set(selectedRows)
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  selectedRows = current
  setSelected(selectedRows)
})

engine.on(RowExpanded, [ExpandedRowsChanged], (id, setExpanded) => {
  const current = new Set(expandedRows)
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  expandedRows = current
  setExpanded(expandedRows)
})

engine.on(SelectAll, [SelectedRowsChanged], (_, setSelected) => {
  const { rows } = getProcessedData()
  const allIds = new Set(rows.map((r) => r.id))
  const current = new Set(selectedRows)
  const allSelected = rows.every((r) => current.has(r.id))
  if (allSelected) {
    for (const id of allIds) current.delete(id)
  } else {
    for (const id of allIds) current.add(id)
  }
  selectedRows = current
  setSelected(selectedRows)
})

engine.on(DeselectAll, [SelectedRowsChanged], (_, setSelected) => {
  selectedRows = new Set()
  setSelected(selectedRows)
})

engine.on(BulkAction, [SelectedRowsChanged], ({ action, ids }, setSelected) => {
  console.log(`Bulk action: ${action} on ${ids.length} rows`)
  selectedRows = new Set()
  setSelected(selectedRows)
})

engine.on(ColumnResized, [ColumnWidthsChanged], ({ column, width }, setWidths) => {
  columnWidths = { ...columnWidths, [column]: Math.max(50, width) }
  setWidths(columnWidths)
})

engine.on(SearchChanged, [SearchQueryChanged, CurrentPageChanged], (query, setSearchQuery, setPage) => {
  searchQuery = query
  setSearchQuery(searchQuery)
  currentPage = 1
  setPage(currentPage)
  simulateLoad()
})

// Simulate async data fetch delay on sort/filter/page change
function simulateLoad() {
  isLoading = true
  engine.emit(IsLoadingChanged, isLoading)
  setTimeout(() => {
    isLoading = false
    engine.emit(IsLoadingChanged, isLoading)
  }, 200)
}

export function startLoop() {}
export function stopLoop() {}
