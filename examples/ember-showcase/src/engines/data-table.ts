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

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const sortState = engine.signal<SortState>(
  SortChanged, { column: null, direction: null },
  (prev, column) => {
    if (prev.column === column) {
      if (prev.direction === 'asc') return { column, direction: 'desc' as SortDirection }
      if (prev.direction === 'desc') return { column: null, direction: null }
    }
    return { column, direction: 'asc' as SortDirection }
  },
)

export const filterState = engine.signal<FilterState>(
  SearchChanged,
  { search: '', department: null, status: null },
  (prev, search) => ({ ...prev, search }),
)

engine.signalUpdate(filterState, DepartmentFilterChanged, (prev, dept) => ({ ...prev, department: dept }))
engine.signalUpdate(filterState, StatusFilterChanged, (prev, status) => ({ ...prev, status }))

export const currentPage = engine.signal<number>(
  PageChanged, 0, (_prev, page) => page,
)

// Reset to page 0 when filters change
engine.signalUpdate(currentPage, SearchChanged, () => 0)
engine.signalUpdate(currentPage, DepartmentFilterChanged, () => 0)
engine.signalUpdate(currentPage, StatusFilterChanged, () => 0)
engine.signalUpdate(currentPage, SortChanged, () => 0)

export const expandedRows = engine.signal<Set<number>>(
  ToggleRowExpand, new Set(),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  },
)

export const columnWidths = engine.signal<Record<ColumnKey, number>>(
  ColumnResized,
  { id: 60, name: 160, email: 200, department: 120, salary: 100, startDate: 110, status: 90 },
  (prev, { column, width }) => ({ ...prev, [column]: Math.max(60, width) }),
)

// ---------------------------------------------------------------------------
// Computed: filtered + sorted + paginated rows
// ---------------------------------------------------------------------------

export function getFilteredRows(): DataRow[] {
  const { search, department, status } = filterState.value
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

  const { column, direction } = sortState.value
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
  const start = currentPage.value * PAGE_SIZE
  return filtered.slice(start, start + PAGE_SIZE)
}

export function getTotalPages(): number {
  return Math.ceil(getFilteredRows().length / PAGE_SIZE)
}
