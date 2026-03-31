import { onMount } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
import {
  CellsChanged,
  SelectedCellChanged,
  CellEdited,
  CellSelected,
  FormulaError,
  colLabel,
  ROWS,
  COLS,
  type Grid,
  type CellCoord,
  type FormulaErrorPayload,
} from './engine'
import { engine } from './engine'

// ---------------------------------------------------------------------------
// Styles (same as original)
// ---------------------------------------------------------------------------

const styles = {
  container: { 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', height: '100vh', display: 'flex', 'flex-direction': 'column' as const, background: '#f5f5f5' },
  header: { background: '#217346', color: '#fff', padding: '8px 16px', 'font-size': 14, 'font-weight': 600, 'letter-spacing': 0.5 },
  formulaBar: { display: 'flex', 'align-items': 'center', background: '#fff', 'border-bottom': '1px solid #d0d0d0', padding: '4px 8px', gap: 8 },
  cellLabel: { 'font-weight': 600, 'font-size': 13, color: '#333', 'min-width': 40, 'text-align': 'center' as const, padding: '4px 8px', background: '#f0f0f0', border: '1px solid #d0d0d0', 'border-radius': 2 },
  formulaInput: { flex: 1, padding: '6px 10px', 'font-size': 13, border: '1px solid #d0d0d0', 'border-radius': 2, outline: 'none', 'font-family': 'Consolas, monospace' },
  gridContainer: { flex: 1, overflow: 'auto', padding: 16 },
  table: { 'border-collapse': 'collapse' as const, background: '#fff', 'box-shadow': '0 1px 4px rgba(0,0,0,0.1)', 'user-select': 'none' as const },
  colHeader: { background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '6px 0', 'text-align': 'center' as const, 'font-weight': 600, 'font-size': 12, color: '#555', width: 90, 'min-width': 90 },
  rowHeader: { background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '4px 10px', 'text-align': 'center' as const, 'font-weight': 600, 'font-size': 12, color: '#555', width: 36, 'min-width': 36 },
  cell: (isSelected: boolean, hasError: boolean) => ({
    border: isSelected ? '2px solid #217346' : '1px solid #d0d0d0', padding: isSelected ? '3px 5px' : '4px 6px',
    'font-size': 13, cursor: 'cell', width: 90, 'min-width': 90, height: 28, overflow: 'hidden' as const,
    'text-overflow': 'ellipsis', 'white-space': 'nowrap' as const,
    background: isSelected ? '#e8f5e9' : hasError ? '#fff5f5' : '#fff', color: hasError ? '#d32f2f' : '#222', position: 'relative' as const, outline: 'none',
  }),
  cornerCell: { background: '#e8e8e8', border: '1px solid #d0d0d0', width: 36, 'min-width': 36 },
  errorTooltip: { position: 'absolute' as const, bottom: '100%', left: 0, background: '#d32f2f', color: '#fff', 'font-size': 11, padding: '2px 6px', 'border-radius': 3, 'white-space': 'nowrap' as const, 'z-index': 10, 'pointer-events': 'none' as const },
  statusBar: { background: '#217346', color: '#fff', padding: '4px 16px', 'font-size': 12, display: 'flex', 'justify-content': 'space-between' },
}

const emptyGrid: Grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ raw: '', computed: '' })))

function FormulaBar() {
  const emit = useEmit()
  const grid = usePulse(CellsChanged, emptyGrid)
  const sel = usePulse(SelectedCellChanged, { row: 0, col: 0 } as CellCoord)
  let inputRef = null
  const currentCell = grid()[sel().row]?.[sel().col]
  const label = `${colLabel(sel.col)}${sel.row + 1}`

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); emit(CellEdited, { row: sel.row, col: sel.col, value: (e.target as HTMLInputElement).value }); if (sel().row < ROWS - 1) emit(CellSelected, { row: sel.row + 1, col: sel.col }) }
    else if (e.key === 'Tab') { e.preventDefault(); emit(CellEdited, { row: sel.row, col: sel.col, value: (e.target as HTMLInputElement).value }); if (sel().col < COLS - 1) emit(CellSelected, { row: sel.row, col: sel.col + 1 }); else if (sel().row < ROWS - 1) emit(CellSelected, { row: sel.row + 1, col: 0 }) }
    else if (e.key === 'Escape' && inputRef) { inputRef.value = currentCell?.raw ?? '' }
  }

  onMount(() => { if (inputRef) inputRef.value = currentCell?.raw ?? '' })

  return (
    <div style={styles.formulaBar}>
      <div style={styles.cellLabel}>{label}</div>
      <span style={{ color: '#999', 'font-size': 13 }}>fx</span>
      <input ref={inputRef} style={styles.formulaInput} defaultValue={currentCell?.raw ?? ''} onKeyDown={handleKeyDown}
        onBlur={(e) => { if (e.currentTarget.value !== currentCell?.raw) emit(CellEdited, { row: sel.row, col: sel.col, value: e.currentTarget.value }) }} />
    </div>
  )
}

function Cell({ row, col }: { row: number; col: number }) {
  const emit = useEmit()
  const grid = usePulse(CellsChanged, emptyGrid)
  const sel = usePulse(SelectedCellChanged, { row: 0, col: 0 } as CellCoord)
  const isSelected = sel().row === row && sel().col === col
  const cell = grid()[row][col]
  const hasError = !!cell.error

  return (
    <td style={styles.cell(isSelected, hasError)} onClick={() => emit(CellSelected, { row, col })} title={cell.error || cell.raw}>
      {cell.computed}
      {hasError && isSelected && <div style={styles.errorTooltip}>{cell.error}</div>}
    </td>
  )
}

function SpreadsheetGrid() {
  return (
    <div style={styles.gridContainer}>
      <table style={styles.table}>
        <thead><tr><th style={styles.cornerCell} />{Array.from({ length: COLS }, (_, c) => <th style={styles.colHeader}>{colLabel(c)}</th>)}</tr></thead>
        <tbody>{Array.from({ length: ROWS }, (_, r) => <tr><td style={styles.rowHeader}>{r + 1}</td>{Array.from({ length: COLS }, (_, c) => <Cell row={r} col={c} />)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function ErrorNotifier() {
  onMount(() => {
    const dispose = engine.on(FormulaError, (payload: FormulaErrorPayload) => {
      console.warn(`Formula error at ${colLabel(payload.col)}${payload.row + 1}: ${payload.error}`)
    })
    return dispose
  })
  return null
}

function StatusBar() {
  const grid = usePulse(CellsChanged, emptyGrid)
  const sel = usePulse(SelectedCellChanged, { row: 0, col: 0 } as CellCoord)
  const filledCount = grid().flat().filter(c => c.raw !== '').length
  const formulaCount = grid().flat().filter(c => c.raw.startsWith('=')).length
  const errorCount = grid().flat().filter(c => !!c.error).length
  const currentCell = grid()[sel().row]?.[sel().col]

  return (
    <div style={styles.statusBar}>
      <span>{filledCount} cells filled | {formulaCount} formulas | {errorCount} errors</span>
      <span>{currentCell?.raw.startsWith('=') ? `Formula: ${currentCell.raw} = ${currentCell.computed}` : currentCell?.computed ? `Value: ${currentCell.computed}` : 'Empty cell'}</span>
    </div>
  )
}

export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>Pulse Spreadsheet</div>
      <FormulaBar />
      <SpreadsheetGrid />
      <StatusBar />
      <ErrorNotifier />
    </div>
  )
}
