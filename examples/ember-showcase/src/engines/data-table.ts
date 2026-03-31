import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataRow {
  id: number
  name: string
  email: string
  department: string
  salary: number
  startDate: string
  status: 'active' | 'inactive' | 'pending'
}

export type SortDirection = 'asc' | 'desc' | null
export type ColumnKey = keyof DataRow

export interface SortState {
  column: ColumnKey | null
  direction: SortDirection
}

export interface FilterState {
  search: string
  department: string | null
  status: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 20
export const TOTAL_ROWS = 1000

export const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Design', 'HR', 'Finance', 'Operations', 'Legal']
export const STATUSES: DataRow['status'][] = ['active', 'inactive', 'pending']

const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Leo', 'Mia', 'Nick', 'Olivia', 'Paul', 'Quinn', 'Rose', 'Sam', 'Tina']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore']

function generateRows(): DataRow[] {
  const rows: DataRow[] = []
  for (let i = 0; i < TOTAL_ROWS; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[i % LAST_NAMES.length]
    rows.push({
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      salary: 50000 + Math.floor(Math.random() * 100000),
      startDate: `202${Math.floor(Math.random() * 4)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      status: STATUSES[i % STATUSES.length],
    })
  }
  return rows
}

export const ALL_ROWS = generateRows()

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SortChanged = engine.event<ColumnKey>('SortChanged')
export const SearchChanged = engine.event<string>('SearchChanged')
export const DepartmentFilterChanged = engine.event<string | null>('DepartmentFilterChanged')
export const StatusFilterChanged = engine.event<string | null>('StatusFilterChanged')
export const PageChanged = engine.event<number>('PageChanged')
export const ToggleRowExpand = engine.event<number>('ToggleRowExpand')
export const ColumnResized = engine.event<{ column: ColumnKey; width: number }>('ColumnResized')
export const TableChanged = engine.event<void>('TableChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _sortState: SortState = { column: null, direction: null }
let _filterState: FilterState = { search: '', department: null, status: null }
let _currentPage = 0
let _expandedRows = new Set<number>()
let _columnWidths: Record<ColumnKey, number> = { id: 60, name: 160, email: 200, department: 120, salary: 100, startDate: 110, status: 90 }

export function getSortState(): SortState { return _sortState }
export function getFilterState(): FilterState { return _filterState }
export function getCurrentPage(): number { return _currentPage }
export function getExpandedRows(): Set<number> { return _expandedRows }
export function getColumnWidths(): Record<ColumnKey, number> { return _columnWidths }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(SortChanged, (column: ColumnKey) => {
  if (_sortState.column === column) {
    if (_sortState.direction === 'asc') _sortState = { column, direction: 'desc' }
    else if (_sortState.direction === 'desc') _sortState = { column: null, direction: null }
    else _sortState = { column, direction: 'asc' }
  } else {
    _sortState = { column, direction: 'asc' }
  }
  _currentPage = 0
  engine.emit(TableChanged, undefined)
})

engine.on(SearchChanged, (search: string) => {
  _filterState = { ..._filterState, search }
  _currentPage = 0
  engine.emit(TableChanged, undefined)
})

engine.on(DepartmentFilterChanged, (dept: string | null) => {
  _filterState = { ..._filterState, department: dept }
  _currentPage = 0
  engine.emit(TableChanged, undefined)
})

engine.on(StatusFilterChanged, (status: string | null) => {
  _filterState = { ..._filterState, status }
  _currentPage = 0
  engine.emit(TableChanged, undefined)
})

engine.on(PageChanged, (page: number) => {
  _currentPage = page
  engine.emit(TableChanged, undefined)
})

engine.on(ToggleRowExpand, (id: number) => {
  _expandedRows = new Set(_expandedRows)
  if (_expandedRows.has(id)) _expandedRows.delete(id)
  else _expandedRows.add(id)
  engine.emit(TableChanged, undefined)
})

engine.on(ColumnResized, ({ column, width }) => {
  _columnWidths = { ..._columnWidths, [column]: Math.max(60, width) }
  engine.emit(TableChanged, undefined)
})

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

export function getFilteredRows(): DataRow[] {
  const { search, department, status } = _filterState
  let rows = ALL_ROWS

  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q),
    )
  }

  if (department) {
    rows = rows.filter((r) => r.department === department)
  }

  if (status) {
    rows = rows.filter((r) => r.status === status)
  }

  const { column, direction } = _sortState
  if (column && direction) {
    rows = [...rows].sort((a, b) => {
      const aVal = a[column]
      const bVal = b[column]
      const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal))
      return direction === 'asc' ? cmp : -cmp
    })
  }

  return rows
}

export function getPageRows(): DataRow[] {
  const filtered = getFilteredRows()
  const start = _currentPage * PAGE_SIZE
  return filtered.slice(start, start + PAGE_SIZE)
}

export function getTotalPages(): number {
  return Math.ceil(getFilteredRows().length / PAGE_SIZE)
}
