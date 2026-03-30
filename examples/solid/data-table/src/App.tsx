import { For, Show, onMount, onCleanup, createSignal as solidSignal } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue, EventType } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Row {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  startDate: string
  status: 'active' | 'inactive' | 'onleave'
}

type SortField = 'name' | 'department' | 'salary' | 'startDate' | 'status'
type SortDir = 'asc' | 'desc'

/* ------------------------------------------------------------------ */
/*  Data generation                                                   */
/* ------------------------------------------------------------------ */

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal', 'Operations']
const ROLES = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP']
const STATUSES: Row['status'][] = ['active', 'inactive', 'onleave']
const FIRST = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Nate', 'Olivia', 'Pat', 'Quinn', 'Rose', 'Sam', 'Tina']
const LAST = ['Smith', 'Jones', 'Wilson', 'Brown', 'Davis', 'Miller', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall']

function generateRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length]
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length]
    const dept = DEPARTMENTS[i % DEPARTMENTS.length]
    const year = 2015 + (i % 9)
    const month = (i % 12) + 1
    return {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@company.com`,
      department: dept,
      role: ROLES[i % ROLES.length],
      salary: 50000 + Math.floor(Math.random() * 120000),
      startDate: `${year}-${String(month).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      status: STATUSES[i % 3],
    }
  })
}

const ALL_ROWS = generateRows(1000)

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const SetPage = engine.event<number>('SetPage')
const SetSort = engine.event<SortField>('SetSort')
const SetFilter = engine.event<string>('SetFilter')
const SetDeptFilter = engine.event<string>('SetDeptFilter')
const ToggleRowExpand = engine.event<number>('ToggleRowExpand')
const ToggleSelect = engine.event<number>('ToggleSelect')
const ToggleSelectAll = engine.event('ToggleSelectAll')
const BulkAction = engine.event<string>('BulkAction')
const ColumnResized = engine.event<{ col: string; width: number }>('ColumnResized')

// Async fetch simulation
const FetchPage = engine.event<number>('FetchPage')
const FetchPending = engine.event<number>('FetchPending')
const FetchDone = engine.event<{ page: number; rows: Row[]; total: number }>('FetchDone')
const FetchError = engine.event<{ error: string }>('FetchError')

// Row expand tween
const ExpandRowStart = engine.event('ExpandRowStart')
const expandRowTween: TweenValue = engine.tween({
  start: ExpandRowStart,
  from: 0,
  to: 1,
  duration: 250,
  easing: 'easeOut',
})

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20

const currentPage = engine.signal<number>(SetPage, 0, (_prev, p) => p)
const sortField = engine.signal<SortField>(SetSort, 'name', (_prev, f) => f)
const sortDir = engine.signal<SortDir>(SetSort, 'asc' as SortDir, (prev, f) => {
  if (sortField.value === f) return prev === 'asc' ? 'desc' : 'asc'
  return 'asc'
})
const filterText = engine.signal<string>(SetFilter, '', (_prev, q) => q)
const deptFilter = engine.signal<string>(SetDeptFilter, '', (_prev, d) => d)
const expandedRow = engine.signal<number>(ToggleRowExpand, -1, (prev, id) => prev === id ? -1 : id)
const selectedRows = engine.signal<Set<number>>(
  ToggleSelect, new Set<number>(),
  (prev, id) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s },
)
engine.signalUpdate(selectedRows, ToggleSelectAll, (prev) => {
  const pageRows = getPageRows()
  const allSelected = pageRows.every(r => prev.has(r.id))
  if (allSelected) return new Set<number>()
  return new Set(pageRows.map(r => r.id))
})
engine.signalUpdate(selectedRows, BulkAction, () => new Set<number>())

const isLoading = engine.signal<boolean>(FetchPending, false, () => true)
engine.signalUpdate(isLoading, FetchDone, () => false)
engine.signalUpdate(isLoading, FetchError, () => false)

const columnWidths = engine.signal<Record<string, number>>(
  ColumnResized, { name: 180, email: 220, department: 120, role: 100, salary: 100, startDate: 110, status: 90 },
  (prev, { col, width }) => ({ ...prev, [col]: Math.max(60, width) }),
)

engine.on(ToggleRowExpand, () => engine.emit(ExpandRowStart, undefined))

/* ------------------------------------------------------------------ */
/*  Async fetch                                                       */
/* ------------------------------------------------------------------ */

engine.async<number, { page: number; rows: Row[]; total: number }>(FetchPage, {
  pending: FetchPending,
  done: FetchDone,
  error: FetchError,
  strategy: 'latest',
  do: async (page) => {
    await new Promise(r => setTimeout(r, 150 + Math.random() * 200))
    const filtered = getFilteredSorted()
    const start = page * PAGE_SIZE
    return { page, rows: filtered.slice(start, start + PAGE_SIZE), total: filtered.length }
  },
})

/* ------------------------------------------------------------------ */
/*  Derived data helpers                                              */
/* ------------------------------------------------------------------ */

function getFilteredSorted(): Row[] {
  let rows = [...ALL_ROWS]
  const q = filterText.value.toLowerCase()
  const dept = deptFilter.value

  if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
  if (dept) rows = rows.filter(r => r.department === dept)

  const field = sortField.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir
    return ((av as number) - (bv as number)) * dir
  })

  return rows
}

function getPageRows(): Row[] {
  const filtered = getFilteredSorted()
  const start = currentPage.value * PAGE_SIZE
  return filtered.slice(start, start + PAGE_SIZE)
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = { active: '#00b894', inactive: '#d63031', onleave: '#fdcb6e' }

function SortHeader(props: { field: SortField; label: string }) {
  const emit = useEmit()
  const sf = useSignal(sortField)
  const sd = useSignal(sortDir)
  const widths = useSignal(columnWidths)

  let resizing = false
  let startX = 0
  let startW = 0

  const onResizeDown = (e: PointerEvent) => {
    e.stopPropagation()
    resizing = true
    startX = e.clientX
    startW = widths()[props.field] ?? 100
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      emit(ColumnResized, { col: props.field, width: startW + dx })
    }
    const up = () => { resizing = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <th
      onClick={() => emit(SetSort, props.field)}
      style={{
        width: `${widths()[props.field]}px`, padding: '10px 12px', 'text-align': 'left',
        'font-size': '12px', 'font-weight': '600', color: '#666', cursor: 'pointer',
        'text-transform': 'uppercase', 'letter-spacing': '0.5px',
        background: '#fafafa', 'border-bottom': '2px solid #e0e0e0',
        'user-select': 'none', position: 'relative',
      }}
    >
      {props.label}
      {sf() === props.field && <span style={{ 'margin-left': '4px' }}>{sd() === 'asc' ? '\u25B2' : '\u25BC'}</span>}
      <div
        onPointerDown={onResizeDown}
        style={{
          position: 'absolute', right: '0', top: '0', bottom: '0', width: '6px',
          cursor: 'col-resize', background: resizing ? '#4361ee' : 'transparent',
        }}
      />
    </th>
  )
}

function DataRow(props: { row: Row }) {
  const emit = useEmit()
  const expanded = useSignal(expandedRow)
  const selected = useSignal(selectedRows)
  const expandVal = useTween(expandRowTween)

  const isExpanded = () => expanded() === props.row.id
  const isSelected = () => selected().has(props.row.id)

  return (
    <>
      <tr
        onClick={() => emit(ToggleRowExpand, props.row.id)}
        style={{
          cursor: 'pointer',
          background: isSelected() ? '#e8f0fe' : isExpanded() ? '#f8f9fa' : '#fff',
          'border-bottom': '1px solid #f0f0f0',
          transition: 'background 0.15s',
        }}
      >
        <td style={{ padding: '10px 12px', 'text-align': 'center' }}>
          <input
            type="checkbox"
            checked={isSelected()}
            onClick={(e) => { e.stopPropagation(); emit(ToggleSelect, props.row.id) }}
          />
        </td>
        <td style={{ padding: '10px 12px', 'font-weight': '500', color: '#333', 'font-size': '13px' }}>{props.row.name}</td>
        <td style={{ padding: '10px 12px', color: '#666', 'font-size': '13px' }}>{props.row.email}</td>
        <td style={{ padding: '10px 12px', color: '#666', 'font-size': '13px' }}>{props.row.department}</td>
        <td style={{ padding: '10px 12px', color: '#666', 'font-size': '13px' }}>{props.row.role}</td>
        <td style={{ padding: '10px 12px', 'font-size': '13px', 'font-weight': '500' }}>${props.row.salary.toLocaleString()}</td>
        <td style={{ padding: '10px 12px', color: '#888', 'font-size': '12px' }}>{props.row.startDate}</td>
        <td style={{ padding: '10px 12px' }}>
          <span style={{
            padding: '2px 10px', 'border-radius': '10px', 'font-size': '11px', 'font-weight': '600',
            background: STATUS_COLORS[props.row.status] + '22', color: STATUS_COLORS[props.row.status],
          }}>{props.row.status}</span>
        </td>
      </tr>
      <Show when={isExpanded()}>
        <tr>
          <td colspan="8" style={{
            padding: '16px 24px', background: '#f8f9fa', 'border-bottom': '1px solid #e0e0e0',
            overflow: 'hidden',
            'max-height': `${expandVal() * 120}px`,
            opacity: String(expandVal()),
          }}>
            <div style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '12px', 'font-size': '13px' }}>
              <div><strong>Full Name:</strong> {props.row.name}</div>
              <div><strong>Email:</strong> {props.row.email}</div>
              <div><strong>Department:</strong> {props.row.department}</div>
              <div><strong>Role:</strong> {props.row.role}</div>
              <div><strong>Salary:</strong> ${props.row.salary.toLocaleString()}</div>
              <div><strong>Start Date:</strong> {props.row.startDate}</div>
              <div><strong>Status:</strong> {props.row.status}</div>
              <div><strong>Employee ID:</strong> #{props.row.id.toString().padStart(5, '0')}</div>
            </div>
          </td>
        </tr>
      </Show>
    </>
  )
}

export default function App() {
  const emit = useEmit()
  const page = useSignal(currentPage)
  const filter = useSignal(filterText)
  const dept = useSignal(deptFilter)
  const loading = useSignal(isLoading)
  const selected = useSignal(selectedRows)

  const pageRows = () => getPageRows()
  const totalFiltered = () => getFilteredSorted().length
  const totalPages = () => Math.ceil(totalFiltered() / PAGE_SIZE)

  return (
    <div style={{
      'min-height': '100vh', padding: '24px',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '16px' }}>
        <div>
          <h1 style={{ 'font-size': '24px', 'font-weight': '700', color: '#333', margin: '0' }}>Data Table</h1>
          <p style={{ 'font-size': '13px', color: '#888', margin: '4px 0 0' }}>1,000 rows &middot; Sort, filter, paginate, expand, bulk actions</p>
        </div>
        <Show when={selected().size > 0}>
          <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
            <span style={{ 'font-size': '13px', color: '#4361ee', 'font-weight': '600' }}>{selected().size} selected</span>
            <button onClick={() => emit(BulkAction, 'delete')} style={{ padding: '6px 16px', 'border-radius': '6px', border: 'none', background: '#d63031', color: '#fff', cursor: 'pointer', 'font-size': '12px' }}>Delete</button>
            <button onClick={() => emit(BulkAction, 'export')} style={{ padding: '6px 16px', 'border-radius': '6px', border: 'none', background: '#4361ee', color: '#fff', cursor: 'pointer', 'font-size': '12px' }}>Export</button>
          </div>
        </Show>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '16px' }}>
        <input
          placeholder="Search by name or email..."
          value={filter()}
          onInput={(e) => { emit(SetFilter, e.currentTarget.value); emit(SetPage, 0) }}
          style={{ flex: '1', padding: '10px 14px', 'font-size': '13px', border: '1px solid #ddd', 'border-radius': '8px', outline: 'none' }}
        />
        <select
          value={dept()}
          onChange={(e) => { emit(SetDeptFilter, e.currentTarget.value); emit(SetPage, 0) }}
          style={{ padding: '10px 14px', 'font-size': '13px', border: '1px solid #ddd', 'border-radius': '8px', outline: 'none', background: '#fff' }}
        >
          <option value="">All Departments</option>
          <For each={DEPARTMENTS}>{(d) => <option value={d}>{d}</option>}</For>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', 'border-radius': '8px', 'box-shadow': '0 1px 4px rgba(0,0,0,0.1)', overflow: 'auto', 'margin-bottom': '16px' }}>
        <table style={{ width: '100%', 'border-collapse': 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '10px', background: '#fafafa', 'border-bottom': '2px solid #e0e0e0' }}>
                <input type="checkbox" onChange={() => emit(ToggleSelectAll, undefined)} />
              </th>
              <SortHeader field="name" label="Name" />
              <th style={{ padding: '10px 12px', 'text-align': 'left', 'font-size': '12px', 'font-weight': '600', color: '#666', background: '#fafafa', 'border-bottom': '2px solid #e0e0e0' }}>Email</th>
              <SortHeader field="department" label="Department" />
              <th style={{ padding: '10px 12px', 'text-align': 'left', 'font-size': '12px', 'font-weight': '600', color: '#666', background: '#fafafa', 'border-bottom': '2px solid #e0e0e0' }}>Role</th>
              <SortHeader field="salary" label="Salary" />
              <SortHeader field="startDate" label="Start Date" />
              <SortHeader field="status" label="Status" />
            </tr>
          </thead>
          <tbody>
            <Show when={!loading()} fallback={
              <For each={Array.from({ length: 5 })}>{() => (
                <tr><td colspan="8" style={{ padding: '16px', 'text-align': 'center', color: '#888' }}>Loading...</td></tr>
              )}</For>
            }>
              <For each={pageRows()}>
                {(row) => <DataRow row={row} />}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
        <span style={{ 'font-size': '13px', color: '#888' }}>
          Showing {page() * PAGE_SIZE + 1}-{Math.min((page() + 1) * PAGE_SIZE, totalFiltered())} of {totalFiltered()}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            disabled={page() === 0}
            onClick={() => emit(SetPage, page() - 1)}
            style={{ padding: '6px 12px', 'border-radius': '6px', border: '1px solid #ddd', background: '#fff', cursor: page() > 0 ? 'pointer' : 'default', 'font-size': '13px' }}
          >Prev</button>
          <For each={Array.from({ length: Math.min(5, totalPages()) }, (_, i) => {
            const start = Math.max(0, Math.min(page() - 2, totalPages() - 5))
            return start + i
          })}>
            {(p) => (
              <button
                onClick={() => emit(SetPage, p)}
                style={{
                  padding: '6px 12px', 'border-radius': '6px', 'font-size': '13px',
                  border: page() === p ? 'none' : '1px solid #ddd',
                  background: page() === p ? '#4361ee' : '#fff',
                  color: page() === p ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >{p + 1}</button>
            )}
          </For>
          <button
            disabled={page() >= totalPages() - 1}
            onClick={() => emit(SetPage, page() + 1)}
            style={{ padding: '6px 12px', 'border-radius': '6px', border: '1px solid #ddd', background: '#fff', cursor: page() < totalPages() - 1 ? 'pointer' : 'default', 'font-size': '13px' }}
          >Next</button>
        </div>
      </div>
    </div>
  )
}
