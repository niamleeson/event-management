import { createEngine } from '@pulse/core'
import type { Signal, TweenValue } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface DataRow {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
}

export type SortDir = 'asc' | 'desc' | null
export type Column = 'name' | 'email' | 'department' | 'role' | 'salary' | 'status' | 'joinDate'

/* ------------------------------------------------------------------ */
/*  Data generation                                                   */
/* ------------------------------------------------------------------ */

const FIRST = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Oliver', 'Isabella',
  'Elijah', 'Mia', 'Lucas', 'Charlotte', 'Mason', 'Amelia', 'Ethan', 'Harper', 'Alexander', 'Evelyn']
const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
const DEPTS = ['Engineering', 'Marketing', 'Sales', 'Design', 'Product', 'HR', 'Finance', 'Operations']
const ROLES = ['Engineer', 'Manager', 'Director', 'Analyst', 'Coordinator', 'Lead', 'VP', 'Intern']
const STATUSES: DataRow['status'][] = ['active', 'inactive', 'pending']

function generateRows(count: number): DataRow[] {
  const rows: DataRow[] = []
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length]
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length]
    rows.push({
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@company.com`,
      department: DEPTS[i % DEPTS.length],
      role: ROLES[i % ROLES.length],
      salary: 50000 + Math.floor(Math.random() * 100000),
      status: STATUSES[i % 3],
      joinDate: `202${Math.floor(Math.random() * 4)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    })
  }
  return rows
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const FetchData = engine.event('FetchData')
export const DataLoaded = engine.event<DataRow[]>('DataLoaded')
export const FetchPending = engine.event('FetchPending')
export const SortChanged = engine.event<Column>('SortChanged')
export const FilterChanged = engine.event<string>('FilterChanged')
export const PageChanged = engine.event<number>('PageChanged')
export const RowExpanded = engine.event<number>('RowExpanded')
export const RowSelected = engine.event<number>('RowSelected')
export const SelectAll = engine.event('SelectAll')
export const BulkDelete = engine.event('BulkDelete')
export const SearchChanged = engine.event<string>('SearchChanged')
export const ColumnResized = engine.event<{ column: Column; width: number }>('ColumnResized')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export const allData: Signal<DataRow[]> = engine.signal(DataLoaded, [] as DataRow[], (_prev, data) => data)
export const loading: Signal<boolean> = engine.signal(FetchPending, false, () => true)
engine.signalUpdate(loading, DataLoaded, () => false)

export const sortColumn: Signal<Column | null> = engine.signal(SortChanged, null as Column | null, (prev, col) => prev === col ? col : col)
export const sortDir: Signal<SortDir> = engine.signal(SortChanged, null as SortDir, (prev, col) => {
  if (sortColumn.value !== col) return 'asc'
  if (prev === 'asc') return 'desc'
  if (prev === 'desc') return null
  return 'asc'
})

export const filterStatus: Signal<string> = engine.signal(FilterChanged, '', (_prev, val) => val)
export const searchQuery: Signal<string> = engine.signal(SearchChanged, '', (_prev, q) => q)
export const currentPage: Signal<number> = engine.signal(PageChanged, 0, (_prev, page) => page)
engine.signalUpdate(currentPage, SearchChanged, () => 0)
engine.signalUpdate(currentPage, FilterChanged, () => 0)

export const expandedRow: Signal<number> = engine.signal(RowExpanded, -1, (prev, id) => prev === id ? -1 : id)

export const selectedRows: Signal<Set<number>> = engine.signal(
  RowSelected,
  new Set<number>(),
  (prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  },
)
engine.signalUpdate(selectedRows, SelectAll, (prev) => {
  if (prev.size > 0) return new Set<number>()
  const all = new Set<number>()
  allData.value.forEach(r => all.add(r.id))
  return all
})
engine.signalUpdate(selectedRows, BulkDelete, () => new Set<number>())

export const columnWidths: Signal<Record<string, number>> = engine.signal(
  ColumnResized,
  { name: 160, email: 220, department: 120, role: 120, salary: 100, status: 90, joinDate: 110 } as Record<string, number>,
  (prev, { column, width }) => ({ ...prev, [column]: Math.max(60, width) }),
)

/* ------------------------------------------------------------------ */
/*  Expand row tween                                                  */
/* ------------------------------------------------------------------ */

const ExpandStart = engine.event('ExpandStart')
engine.pipe(RowExpanded, ExpandStart, () => undefined)

export const expandTween = engine.tween({
  start: ExpandStart,
  from: 0,
  to: 1,
  duration: 200,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
})

/* ------------------------------------------------------------------ */
/*  Async data fetching                                               */
/* ------------------------------------------------------------------ */

engine.async(FetchData, {
  pending: FetchPending,
  done: DataLoaded,
  strategy: 'latest',
  do: async () => {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))
    return generateRows(1000)
  },
})

/* ------------------------------------------------------------------ */
/*  Bulk delete                                                       */
/* ------------------------------------------------------------------ */

engine.pipe(BulkDelete, DataLoaded, () => {
  const sel = selectedRows.value
  return allData.value.filter(r => !sel.has(r.id))
})

// Load initial data
engine.emit(FetchData, undefined)

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const PAGE_SIZE = 20
export const COLUMNS: { key: Column; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'status', label: 'Status' },
  { key: 'joinDate', label: 'Join Date' },
]

export const STATUS_COLORS: Record<string, string> = {
  active: '#00b894',
  inactive: '#d63031',
  pending: '#fdcb6e',
}
