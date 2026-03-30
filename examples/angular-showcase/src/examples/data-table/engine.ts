import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TableRow {
  id: number
  name: string
  email: string
  role: string
  department: string
  salary: number
  startDate: string
  status: 'active' | 'inactive' | 'pending'
}

export type SortDir = 'asc' | 'desc' | null
export type ColumnKey = keyof TableRow

export interface SortConfig {
  column: ColumnKey
  direction: SortDir
}

export interface FilterConfig {
  column: ColumnKey
  value: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 20

export const COLUMNS: { key: ColumnKey; label: string; resizable: boolean; width: number }[] = [
  { key: 'id', label: 'ID', resizable: false, width: 60 },
  { key: 'name', label: 'Name', resizable: true, width: 160 },
  { key: 'email', label: 'Email', resizable: true, width: 220 },
  { key: 'role', label: 'Role', resizable: true, width: 120 },
  { key: 'department', label: 'Department', resizable: true, width: 130 },
  { key: 'salary', label: 'Salary', resizable: true, width: 100 },
  { key: 'status', label: 'Status', resizable: false, width: 90 },
]

// Generate 1000 rows
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Legal']
const ROLES = ['Developer', 'Designer', 'Manager', 'Lead', 'VP', 'Analyst', 'Coordinator', 'Director']
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
const STATUSES: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending']

function generateRows(count: number): TableRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`,
    email: `user${i + 1}@example.com`,
    role: ROLES[i % ROLES.length],
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    salary: 50000 + Math.floor(Math.random() * 100000),
    startDate: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    status: STATUSES[i % STATUSES.length],
  }))
}

const ALL_ROWS = generateRows(1000)

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const SetSort = engine.event<SortConfig>('SetSort')
export const SetFilter = engine.event<FilterConfig>('SetFilter')
export const ClearFilters = engine.event<void>('ClearFilters')
export const SetPage = engine.event<number>('SetPage')
export const ToggleRowExpand = engine.event<number>('ToggleRowExpand')
export const ResizeColumn = engine.event<{ column: ColumnKey; width: number }>('ResizeColumn')
export const DataLoaded = engine.event<TableRow[]>('DataLoaded')
export const LoadPage = engine.event<number>('LoadPage')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const sort = engine.signal<SortConfig | null>(
  SetSort,
  null,
  (_prev, config) => config.direction ? config : null,
)

export const filters = engine.signal<Record<string, string>>(
  SetFilter,
  {},
  (prev, { column, value }) => value ? { ...prev, [column]: value } : (() => { const n = { ...prev }; delete n[column]; return n })(),
)
engine.signalUpdate(filters, ClearFilters, () => ({}))

export const currentPage = engine.signal<number>(SetPage, 0, (_prev, page) => page)
// Reset page on sort/filter change
engine.signalUpdate(currentPage, SetSort, () => 0)
engine.signalUpdate(currentPage, SetFilter, () => 0)
engine.signalUpdate(currentPage, ClearFilters, () => 0)

export const expandedRows = engine.signal<Set<number>>(
  ToggleRowExpand,
  new Set(),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  },
)

export const columnWidths = engine.signal<Record<string, number>>(
  ResizeColumn,
  Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])),
  (prev, { column, width }) => ({ ...prev, [column]: Math.max(50, width) }),
)

export const isLoading = engine.signal<boolean>(LoadPage, false, () => true)
engine.signalUpdate(isLoading, DataLoaded, () => false)

// ---------------------------------------------------------------------------
// Async: simulated page load
// ---------------------------------------------------------------------------

engine.async(LoadPage, {
  done: DataLoaded,
  strategy: 'latest',
  do: async (page: number, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 200 + Math.random() * 300)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })
    return ALL_ROWS
  },
})

// ---------------------------------------------------------------------------
// Derived: filtered + sorted + paginated data
// ---------------------------------------------------------------------------

export function getProcessedData(): { rows: TableRow[]; total: number } {
  let data = [...ALL_ROWS]

  // Apply filters
  const f = filters.value
  for (const [col, val] of Object.entries(f)) {
    const lower = val.toLowerCase()
    data = data.filter((row) => {
      const cellVal = String(row[col as ColumnKey]).toLowerCase()
      return cellVal.includes(lower)
    })
  }

  // Apply sort
  const s = sort.value
  if (s && s.direction) {
    data.sort((a, b) => {
      const aVal = a[s.column]
      const bVal = b[s.column]
      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal
      else cmp = String(aVal).localeCompare(String(bVal))
      return s.direction === 'desc' ? -cmp : cmp
    })
  }

  const total = data.length
  const page = currentPage.value
  const start = page * PAGE_SIZE
  const rows = data.slice(start, start + PAGE_SIZE)

  return { rows, total }
}

// Trigger initial load
engine.pipe(SetPage, LoadPage, () => currentPage.value)
engine.pipe(SetSort, LoadPage, () => 0)
engine.pipe(SetFilter, LoadPage, () => 0)

// Start frame loop
engine.startFrameLoop()
