import { usePulse, useEmit } from '@pulse/solid'
import {
  pageSize,
  SortChanged,
  FilterChanged,
  PageChanged,
  RowSelected,
  RowExpanded,
  BulkAction,
  SearchChanged,
  ColumnResized,
  SelectAll,
  DeselectAll,
  getProcessedData,
} from './engine'
import type { SortDirection, RowData } from './engine'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
    Inactive: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
    Pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  }
  const c = colors[status] || { bg: '#334155', text: '#94a3b8' }
  return (
    <span
      style={{
        padding: '2px 8px',
        'border-radius': 10,
        background: c.bg,
        color: c.text,
        'font-size': 11,
        'font-weight': 600,
      }}
    >
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Highlight matching text
// ---------------------------------------------------------------------------

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: '#fbbf2440', color: '#fbbf24', 'border-radius': 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

// ---------------------------------------------------------------------------
// Column header with sort
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  column,
  width,
}: {
  label: string
  column: string
  width: number
}) {
  const emit = useEmit()
  const sort = usePulse(sortState)
  const widths = usePulse(columnWidths)
  let resizing = false
  let startX = 0
  let startWidth = 0

  const isActive = sort.column === column
  const direction = isActive ? sort.direction : null

  const handleSort = () => {
    let newDir: SortDirection
    if (!isActive) {
      newDir = 'asc'
    } else if (direction === 'asc') {
      newDir = 'desc'
    } else {
      newDir = null
    }
    emit(SortChanged, { column, direction: newDir })
  }

  const handleResizeStart = 
    (e: MouseEvent) => {
      e.stopPropagation()
      resizing = true
      startX = e.clientX
      startWidth = widths[column] || width

      const handleMove = (me: MouseEvent) => {
        if (!resizing) return
        const diff = me.clientX - startX
        emit(ColumnResized, { column, width: startWidth + diff })
      }

      const handleUp = () => {
        resizing = false
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
    }
  return (
    <th
      style={{
        width: widths[column] || width,
        'min-width': 50,
        padding: '10px 12px',
        'text-align': 'left',
        'font-size': 11,
        'font-weight': 700,
        color: '#64748b',
        'text-transform': 'uppercase',
        'letter-spacing': 0.5,
        cursor: 'pointer',
        'user-select': 'none',
        position: 'relative',
        'border-bottom': '1px solid #1e293b',
        'white-space': 'nowrap',
      }}
      onClick={handleSort}
    >
      {label}{' '}
      <span style={{ color: isActive ? '#3b82f6' : '#334155', 'font-size': 10 }}>
        {direction === 'asc' ? '\u25B2' : direction === 'desc' ? '\u25BC' : '\u25B2'}
      </span>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      />
    </th>
  )
}

// ---------------------------------------------------------------------------
// Expanded row detail
// ---------------------------------------------------------------------------

function ExpandedDetail({ row }: { row: RowData }) {
  return (
    <tr>
      <td
        colSpan={9}
        style={{
          padding: '16px 24px',
          background: '#111827',
          'border-bottom': '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 16, 'font-size': 13 }}>
          <div>
            <div style={{ color: '#64748b', 'margin-bottom': 4 }}>Full Details</div>
            <div style={{ color: '#e2e8f0' }}>
              <strong>Name:</strong> {row.name}<br />
              <strong>Email:</strong> {row.email}<br />
              <strong>Role:</strong> {row.role}<br />
              <strong>Status:</strong> {row.status}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', 'margin-bottom': 4 }}>Activity</div>
            <div style={{ color: '#e2e8f0' }}>
              <strong>Created:</strong> {row.created}<br />
              <strong>Revenue:</strong> ${row.revenue.toLocaleString()}<br />
              <strong>ID:</strong> {row.id}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const sort = usePulse(sortState)
  const filterState = usePulse(filters)
  const page = usePulse(currentPage)
  const selected = usePulse(selectedRows)
  const expanded = usePulse(expandedRows)
  const search = usePulse(searchQuery)
  const widths = usePulse(columnWidths)
  const loading = usePulse(isLoading)

  const { rows, totalRows, totalPages } = getProcessedData()
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  return (
    <div
      style={{
        'min-height': '100vh',
        background: '#0a0e17',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': 20,
        }}
      >
        <div>
          <h1 style={{ 'font-size': 24, 'font-weight': 700, margin: 0 }}>Data Table</h1>
          <p style={{ color: '#64748b', 'font-size': 13, 'margin-top': 4 }}>
            {totalRows.toLocaleString()} records | Page {page} of {totalPages}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, 'align-items': 'center' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => emit(SearchChanged, e.currentTarget.value)}
            style={{
              padding: '8px 12px',
              'border-radius': 8,
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#e2e8f0',
              'font-size': 13,
              width: 220,
              outline: 'none',
            }}
          />

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 6, 'align-items': 'center' }}>
              <span style={{ 'font-size': 12, color: '#3b82f6' }}>
                {selected.size} selected
              </span>
              <select
                onChange={(e) => {
                  if (e.currentTarget.value) {
                    emit(BulkAction, {
                      action: e.currentTarget.value,
                      ids: Array.from(selected),
                    })
                    e.currentTarget.value = ''
                  }
                }}
                style={{
                  padding: '6px 10px',
                  'border-radius': 6,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#94a3b8',
                  'font-size': 12,
                }}
              >
                <option value="">Bulk Actions...</option>
                <option value="delete">Delete</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="export">Export</option>
              </select>
              <button
                onClick={() => emit(DeselectAll, undefined)}
                style={{
                  padding: '4px 8px',
                  'border-radius': 4,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#64748b',
                  'font-size': 11,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div
          style={{
            height: 2,
            background: '#3b82f6',
            'border-radius': 1,
            'margin-bottom': 2,
            animation: 'loading-bar 0.8s ease infinite',
          }}
        />
      )}

      {/* Table */}
      <div
        style={{
          background: '#111827',
          'border-radius': 12,
          border: '1px solid #1e293b',
          overflow: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            'border-collapse': 'collapse',
            'font-size': 13,
          }}
        >
          <thead
            style={{
              position: 'sticky',
              top: 0,
              background: '#111827',
              'z-index': 10,
            }}
          >
            <tr>
              {/* Checkbox column */}
              <th
                style={{
                  width: 40,
                  padding: '10px 12px',
                  'border-bottom': '1px solid #1e293b',
                }}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => emit(SelectAll, undefined)}
                  style={{ 'accent-color': '#3b82f6', cursor: 'pointer' }}
                />
              </th>
              <SortHeader label="ID" column="id" width={60} />
              <SortHeader label="Name" column="name" width={160} />
              <SortHeader label="Email" column="email" width={200} />
              <SortHeader label="Role" column="role" width={100} />
              <SortHeader label="Status" column="status" width={90} />
              <SortHeader label="Created" column="created" width={110} />
              <SortHeader label="Revenue" column="revenue" width={110} />
              <th
                style={{
                  width: 80,
                  padding: '10px 12px',
                  'text-align': 'left',
                  'font-size': 11,
                  'font-weight': 700,
                  color: '#64748b',
                  'text-transform': 'uppercase',
                  'letter-spacing': 0.5,
                  'border-bottom': '1px solid #1e293b',
                }}
              >
                Actions
              </th>
            </tr>
            {/* Filter row */}
            <tr>
              <td style={{ padding: '6px 12px', 'border-bottom': '1px solid #1e293b' }} />
              <td style={{ padding: '6px 12px', 'border-bottom': '1px solid #1e293b' }} />
              {['name', 'email', 'role', 'status', 'created'].map((col) => (
                <td
                  style={{ padding: '6px 8px', 'border-bottom': '1px solid #1e293b' }}
                >
                  <input
                    type="text"
                    placeholder={`Filter...`}
                    value={filterState[col] || ''}
                    onChange={(e) =>
                      emit(FilterChanged, { column: col, value: e.currentTarget.value })
                    }
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      'border-radius': 4,
                      border: '1px solid #1e293b',
                      background: '#0a0e17',
                      color: '#94a3b8',
                      'font-size': 11,
                      outline: 'none',
                    }}
                  />
                </td>
              ))}
              <td style={{ padding: '6px 12px', 'border-bottom': '1px solid #1e293b' }} />
              <td style={{ padding: '6px 12px', 'border-bottom': '1px solid #1e293b' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSelected = selected.has(row.id)
              const isExpanded = expanded.has(row.id)
              const isEven = i % 2 === 0
              return (
                <RowGroup
                  row={row}
                  isSelected={isSelected}
                  isExpanded={isExpanded}
                  isEven={isEven}
                  search={search}
                />
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div
            style={{
              padding: 40,
              'text-align': 'center',
              color: '#475569',
              'font-size': 14,
            }}
          >
            No results found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-top': 16,
          'font-size': 13,
          color: '#64748b',
        }}
      >
        <span>
          Showing {(page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, totalRows)} of {totalRows}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <PageButton
            label="\u00AB"
            disabled={page <= 1}
            onClick={() => emit(PageChanged, 1)}
          />
          <PageButton
            label="\u2039"
            disabled={page <= 1}
            onClick={() => emit(PageChanged, page - 1)}
          />
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === -1 ? (
              <span style={{ padding: '6px 4px', color: '#475569' }}>
                ...
              </span>
            ) : (
              <PageButton
                label={String(p)}
                active={p === page}
                disabled={false}
                onClick={() => emit(PageChanged, p)}
              />
            ),
          )}
          <PageButton
            label="\u203A"
            disabled={page >= totalPages}
            onClick={() => emit(PageChanged, page + 1)}
          />
          <PageButton
            label="\u00BB"
            disabled={page >= totalPages}
            onClick={() => emit(PageChanged, totalPages)}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row group (row + optional expansion)
// ---------------------------------------------------------------------------

function RowGroup({
  row,
  isSelected,
  isExpanded,
  isEven,
  search,
}: {
  row: RowData
  isSelected: boolean
  isExpanded: boolean
  isEven: boolean
  search: string
}) {
  const emit = useEmit()

  return (
    <>
      <tr
        style={{
          background: isSelected
            ? 'rgba(59, 130, 246, 0.08)'
            : isEven
              ? '#0d1424'
              : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = isEven ? '#0d1424' : 'transparent'
          }
        }}
      >
        <td style={{ padding: '10px 12px', 'border-bottom': '1px solid #1e293b11' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => emit(RowSelected, row.id)}
            style={{ 'accent-color': '#3b82f6', cursor: 'pointer' }}
          />
        </td>
        <td
          style={{
            padding: '10px 12px',
            'border-bottom': '1px solid #1e293b11',
            color: '#475569',
            'font-family': 'monospace',
            'font-size': 11,
          }}
        >
          {row.id.split('-')[1]}
        </td>
        <td
          style={{
            padding: '10px 12px',
            'border-bottom': '1px solid #1e293b11',
            'font-weight': 500,
          }}
        >
          <HighlightText text={row.name} query={search} />
        </td>
        <td
          style={{
            padding: '10px 12px',
            'border-bottom': '1px solid #1e293b11',
            color: '#94a3b8',
          }}
        >
          <HighlightText text={row.email} query={search} />
        </td>
        <td style={{ padding: '10px 12px', 'border-bottom': '1px solid #1e293b11' }}>
          <HighlightText text={row.role} query={search} />
        </td>
        <td style={{ padding: '10px 12px', 'border-bottom': '1px solid #1e293b11' }}>
          <StatusBadge status={row.status} />
        </td>
        <td
          style={{
            padding: '10px 12px',
            'border-bottom': '1px solid #1e293b11',
            'font-family': 'monospace',
            'font-size': 12,
            color: '#94a3b8',
          }}
        >
          {row.created}
        </td>
        <td
          style={{
            padding: '10px 12px',
            'border-bottom': '1px solid #1e293b11',
            'font-family': 'monospace',
            'font-size': 12,
            color: row.revenue > 500 ? '#4ade80' : '#94a3b8',
            'font-weight': row.revenue > 500 ? 600 : 400,
          }}
        >
          ${row.revenue.toLocaleString()}
        </td>
        <td style={{ padding: '10px 12px', 'border-bottom': '1px solid #1e293b11' }}>
          <button
            onClick={() => emit(RowExpanded, row.id)}
            style={{
              padding: '4px 8px',
              'border-radius': 4,
              border: '1px solid #334155',
              background: isExpanded ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: isExpanded ? '#60a5fa' : '#64748b',
              'font-size': 11,
              cursor: 'pointer',
            }}
          >
            {isExpanded ? 'Close' : 'View'}
          </button>
        </td>
      </tr>
      {isExpanded && <ExpandedDetail row={row} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Page button
// ---------------------------------------------------------------------------

function PageButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active?: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 10px',
        'border-radius': 6,
        border: active ? '1px solid #3b82f6' : '1px solid #1e293b',
        background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        color: disabled ? '#334155' : active ? '#3b82f6' : '#94a3b8',
        'font-size': 12,
        'font-weight': active ? 700 : 400,
        cursor: disabled ? 'default' : 'pointer',
        'min-width': 32,
      }}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page number calculation
// ---------------------------------------------------------------------------

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: number[] = [1]

  if (current > 3) pages.push(-1) // ellipsis

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push(-1) // ellipsis

  pages.push(total)

  return pages
}
