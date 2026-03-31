import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface TableRow { id: number; name: string; email: string; role: string; department: string; salary: number; startDate: string; status: 'active' | 'inactive' | 'pending' }
export type SortDir = 'asc' | 'desc' | null
export type ColumnKey = keyof TableRow
export interface SortConfig { column: ColumnKey; direction: SortDir }
export interface FilterConfig { column: ColumnKey; value: string }
export const PAGE_SIZE = 20
export const COLUMNS: { key: ColumnKey; label: string; width: number }[] = [
  { key: 'id', label: 'ID', width: 60 }, { key: 'name', label: 'Name', width: 160 },
  { key: 'email', label: 'Email', width: 220 }, { key: 'role', label: 'Role', width: 120 },
  { key: 'department', label: 'Department', width: 130 }, { key: 'salary', label: 'Salary', width: 100 },
  { key: 'status', label: 'Status', width: 90 },
]

const DEPTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Legal']
const ROLES = ['Developer', 'Designer', 'Manager', 'Lead', 'VP', 'Analyst', 'Coordinator', 'Director']
const FIRST = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack']
const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
const STS: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending']
const ALL_ROWS: TableRow[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1, name: FIRST[i % FIRST.length] + ' ' + LAST[Math.floor(i / FIRST.length) % LAST.length],
  email: 'user' + (i + 1) + '@example.com', role: ROLES[i % ROLES.length], department: DEPTS[i % DEPTS.length],
  salary: 50000 + Math.floor(Math.random() * 100000),
  startDate: '202' + Math.floor(Math.random() * 4) + '-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
  status: STS[i % STS.length],
}))

export const SetSort = engine.event<SortConfig>('SetSort')
export const SetFilter = engine.event<FilterConfig>('SetFilter')
export const ClearFilters = engine.event<void>('ClearFilters')
export const SetPage = engine.event<number>('SetPage')
export const SortChanged = engine.event<SortConfig | null>('SortChanged')
export const FiltersChanged = engine.event<Record<string, string>>('FiltersChanged')
export const PageChanged = engine.event<number>('PageChanged')
export const DataChanged = engine.event<{ rows: TableRow[]; total: number }>('DataChanged')

let sort: SortConfig | null = null, filters: Record<string, string> = {}, currentPage = 0

function recompute() {
  let data = [...ALL_ROWS]
  for (const [col, val] of Object.entries(filters)) { const l = val.toLowerCase(); data = data.filter((r) => String(r[col as ColumnKey]).toLowerCase().includes(l)) }
  if (sort && sort.direction) {
    const s = sort
    data.sort((a, b) => { const av = a[s.column], bv = b[s.column]; let cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv)); return s.direction === 'desc' ? -cmp : cmp })
  }
  engine.emit(DataChanged, { rows: data.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE), total: data.length })
}

engine.on(SetSort, (cfg) => { sort = cfg.direction ? cfg : null; currentPage = 0; engine.emit(SortChanged, sort); engine.emit(PageChanged, 0); recompute() })
engine.on(SetFilter, ({ column, value }) => { if (value) filters = { ...filters, [column]: value }; else { const f = { ...filters }; delete f[column]; filters = f }; currentPage = 0; engine.emit(FiltersChanged, filters); engine.emit(PageChanged, 0); recompute() })
engine.on(ClearFilters, () => { filters = {}; currentPage = 0; engine.emit(FiltersChanged, {}); engine.emit(PageChanged, 0); recompute() })
engine.on(SetPage, (page) => { currentPage = page; engine.emit(PageChanged, page); recompute() })
setTimeout(() => recompute(), 0)
