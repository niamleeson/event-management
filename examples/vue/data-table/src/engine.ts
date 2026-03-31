import { createEngine } from '@pulse/core'
export const engine = createEngine()
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

export let allData = [] as DataRow[]
export const AllDataChanged = engine.event('AllDataChanged')
engine.on(DataLoaded, (v: any) => { allData = ((_prev, data) => data)(allData, v); engine.emit(AllDataChanged, allData) })
export let loading = false
export const LoadingChanged = engine.event('LoadingChanged')
engine.on(FetchPending, (v: any) => { loading = (() => true)(loading, v); engine.emit(LoadingChanged, loading) })
engine.on(DataLoaded, (v: any) => { loading = (() => false)(loading, v); engine.emit(LoadingChanged, loading) })

export let sortColumn = null as Column | null
export const SortColumnChanged = engine.event('SortColumnChanged')
engine.on(SortChanged, (v: any) => { sortColumn = ((prev, col) => prev === col ? col : col)(sortColumn, v); engine.emit(SortColumnChanged, sortColumn) })
export let sortDir = null as SortDir
export const SortDirChanged = engine.event('SortDirChanged')
engine.on(SortChanged, (v: any) => { sortDir = ((prev, col) => {
  if (sortColumn !== col) return 'asc'
  if (prev === 'asc') return 'desc'
  if (prev === 'desc') return null
  return 'asc'
})(sortDir, v); engine.emit(SortDirChanged, sortDir) })

export let filterStatus = ''
export const FilterStatusChanged = engine.event('FilterStatusChanged')
engine.on(FilterChanged, (v: any) => { filterStatus = ((_prev, val) => val)(filterStatus, v); engine.emit(FilterStatusChanged, filterStatus) })
export let searchQuery = ''
export const SearchQueryChanged = engine.event('SearchQueryChanged')
engine.on(SearchChanged, (v: any) => { searchQuery = ((_prev, q) => q)(searchQuery, v); engine.emit(SearchQueryChanged, searchQuery) })
export let currentPage = 0
export const CurrentPageChanged = engine.event('CurrentPageChanged')
engine.on(PageChanged, (v: any) => { currentPage = ((_prev, page) => page)(currentPage, v); engine.emit(CurrentPageChanged, currentPage) })
engine.on(SearchChanged, (v: any) => { currentPage = (() => 0)(currentPage, v); engine.emit(CurrentPageChanged, currentPage) })
engine.on(FilterChanged, (v: any) => { currentPage = (() => 0)(currentPage, v); engine.emit(CurrentPageChanged, currentPage) })

export let expandedRow = -1
export const ExpandedRowChanged = engine.event('ExpandedRowChanged')
engine.on(RowExpanded, (v: any) => { expandedRow = ((prev, id) => prev === id ? -1 : id)(expandedRow, v); engine.emit(ExpandedRowChanged, expandedRow) })

export let selectedRows = new Set<number>()
const SelectedRowsChanged = engine.event('SelectedRowsChanged')
engine.on(RowSelected, (v: any) => { selectedRows = ((prev, id) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })(selectedRows, v); engine.emit(SelectedRowsChanged, selectedRows) })
engine.on(SelectAll, (v: any) => { selectedRows = ((prev) => {
  if (prev.size > 0) return new Set<number>()
  const all = new Set<number>()
  allData.forEach(r => all.add(r.id))
  return all
})(selectedRows, v); engine.emit(SelectedRowsChanged, selectedRows) })
engine.on(BulkDelete, (v: any) => { selectedRows = (() => new Set<number>())(selectedRows, v); engine.emit(SelectedRowsChanged, selectedRows) })

export let columnWidths: Record<string, number> = { name: 160, email: 220, department: 120, role: 120, salary: 100, status: 90, joinDate: 110 }
const ColumnWidthsChanged = engine.event('ColumnWidthsChanged')
engine.on(ColumnResized, (v: any) => { columnWidths = ((prev: Record<string, number>, { column, width }: { column: string; width: number }) => ({ ...prev, [column]: Math.max(60, width) }))(columnWidths, v); engine.emit(ColumnWidthsChanged, columnWidths) })

/* ------------------------------------------------------------------ */
/*  Expand row tween                                                  */
/* ------------------------------------------------------------------ */

const ExpandStart = engine.event('ExpandStart')
engine.on(RowExpanded, (v: any) => { engine.emit(ExpandStart, (() => undefined)(v)) })

export let expandTween = { value: 0, active: false }
export const ExpandTweenVal = engine.event<number>('ExpandTweenVal')
{
  const _tc = {
  start: ExpandStart,
  from: 0,
  to: 1,
  duration: 200,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
}
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; expandTween.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!expandTween.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      expandTween.value = f + (t - f) * _te(p)
      engine.emit(ExpandTweenVal, expandTween.value)
      if (p >= 1) { expandTween.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { expandTween.active = false })) }
}

/* ------------------------------------------------------------------ */
/*  Async data fetching                                               */
/* ------------------------------------------------------------------ */

{
  const _ac = {
  pending: FetchPending,
  done: DataLoaded,
  strategy: 'latest',
  do: async () => {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))
    return generateRows(1000)
  },
}
  let _aa: AbortController | null = null
  engine.on(FetchData, async (p: any) => {
    if (_ac.strategy === 'latest' && _aa) _aa.abort()
    _aa = new AbortController()
    if (_ac.pending) engine.emit(_ac.pending, p)
    try {
      const r = await _ac.do(p, { signal: _aa.signal, progress: () => {} })
      if (_ac.done) engine.emit(_ac.done, r)
    } catch (e: any) {
      if (e?.name !== 'AbortError' && _ac.error) engine.emit(_ac.error, e)
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Bulk delete                                                       */
/* ------------------------------------------------------------------ */

engine.on(BulkDelete, (v: any) => { engine.emit(DataLoaded, (() => {
  const sel = selectedRows
  return allData.filter(r => !sel.has(r.id))
})(v)) })

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

const STATUS_COLORS: Record<string, string> = {
  active: '#00b894',
  inactive: '#d63031',
  pending: '#fdcb6e',
}


export { STATUS_COLORS }

export { ColumnWidthsChanged, SelectedRowsChanged }
