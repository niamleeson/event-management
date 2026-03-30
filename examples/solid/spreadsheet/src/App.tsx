import { For, createSignal as solidSignal } from 'solid-js'
import { useSignal, useEmit, useEvent } from '@pulse/solid'
import type { Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface CellData { raw: string; computed: string; error?: string }
type Grid = CellData[][]
interface CellCoord { row: number; col: number }
interface CellEditPayload { row: number; col: number; value: string }

const ROWS = 8
const COLS = 8

function colLabel(c: number): string { return String.fromCharCode(65 + c) }

function parseCellRef(ref: string): CellCoord | null {
  const match = ref.match(/^([A-H])([1-8])$/i)
  if (!match) return null
  const col = match[1].toUpperCase().charCodeAt(0) - 65
  const row = parseInt(match[2], 10) - 1
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
  return { row, col }
}

function parseRange(range: string): CellCoord[] | null {
  const parts = range.split(':')
  if (parts.length !== 2) return null
  const start = parseCellRef(parts[0].trim())
  const end = parseCellRef(parts[1].trim())
  if (!start || !end) return null
  const coords: CellCoord[] = []
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++)
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++)
      coords.push({ row: r, col: c })
  return coords
}

function getCellValue(grid: Grid, row: number, col: number): number {
  const n = parseFloat(grid[row]?.[col]?.computed ?? '')
  return isNaN(n) ? 0 : n
}

function evaluateFormula(formula: string, grid: Grid, selfRow: number, selfCol: number): number | string {
  const expr = formula.substring(1).trim()

  const sumMatch = expr.match(/^SUM\((.+)\)$/i)
  if (sumMatch) {
    const rc = parseRange(sumMatch[1])
    if (!rc) throw new Error('Invalid range')
    return rc.reduce((a, c) => a + getCellValue(grid, c.row, c.col), 0)
  }

  let resolved = expr.replace(/[A-H][1-8]/gi, (m) => {
    const ref = parseCellRef(m)
    if (!ref) return '0'
    if (ref.row === selfRow && ref.col === selfCol) throw new Error('Circular')
    return String(getCellValue(grid, ref.row, ref.col))
  })

  if (!/^[\d\s+\-*/.()]+$/.test(resolved)) throw new Error('Invalid expression')
  const result = new Function(`return (${resolved})`)()
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result')
  return Math.round(result * 1000000) / 1000000
}

function makeEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ raw: '', computed: '' })))
}

function recomputeGrid(grid: Grid): Grid {
  const ng: Grid = grid.map(r => r.map(c => ({ ...c })))
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const raw = ng[r][c].raw
    if (raw.startsWith('=')) {
      try { const res = evaluateFormula(raw, ng, r, c); ng[r][c] = { raw, computed: String(res) } }
      catch (e: any) { ng[r][c] = { raw, computed: '#ERR', error: e.message } }
    } else { ng[r][c] = { raw, computed: raw } }
  }
  return ng
}

/* ------------------------------------------------------------------ */
/*  Engine events + signals                                           */
/* ------------------------------------------------------------------ */

const CellEdited = engine.event<CellEditPayload>('CellEdited')
const CellSelected = engine.event<CellCoord>('CellSelected')
const FormulaError = engine.event<{ row: number; col: number; error: string }>('FormulaError')

engine.pipe(CellEdited, [FormulaError], (p: CellEditPayload) => {
  if (p.value.startsWith('=')) {
    try { evaluateFormula(p.value, cells.value, p.row, p.col); return [undefined] }
    catch (e: any) { return [{ row: p.row, col: p.col, error: e.message }] }
  }
  return [undefined]
})

const cells = engine.signal<Grid>(CellEdited, makeEmptyGrid(), (prev, p) => {
  const ng = prev.map(r => r.map(c => ({ ...c })))
  ng[p.row][p.col] = { raw: p.value, computed: p.value }
  return recomputeGrid(ng)
})

const selectedCell = engine.signal<CellCoord>(CellSelected, { row: 0, col: 0 }, (_prev, coord) => coord)

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function FormulaBar() {
  const emit = useEmit()
  const grid = useSignal(cells)
  const sel = useSignal(selectedCell)
  let inputRef!: HTMLInputElement

  const currentCell = () => grid()[sel().row]?.[sel().col]
  const label = () => `${colLabel(sel().col)}${sel().row + 1}`

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      emit(CellEdited, { row: sel().row, col: sel().col, value: inputRef.value })
      if (sel().row < ROWS - 1) emit(CellSelected, { row: sel().row + 1, col: sel().col })
    } else if (e.key === 'Tab') {
      e.preventDefault()
      emit(CellEdited, { row: sel().row, col: sel().col, value: inputRef.value })
      if (sel().col < COLS - 1) emit(CellSelected, { row: sel().row, col: sel().col + 1 })
      else if (sel().row < ROWS - 1) emit(CellSelected, { row: sel().row + 1, col: 0 })
    } else if (e.key === 'Escape') {
      inputRef.value = currentCell()?.raw ?? ''
    }
  }

  // Update input when selection changes
  const updateInput = () => { if (inputRef) inputRef.value = currentCell()?.raw ?? '' }
  // We track reactive dependencies by reading them
  const _trackSel = () => { sel(); updateInput(); return null }

  return (
    <div style={{
      display: 'flex', 'align-items': 'center', background: '#fff',
      'border-bottom': '1px solid #d0d0d0', padding: '4px 8px', gap: '8px',
    }}>
      {_trackSel()}
      <div style={{
        'font-weight': '600', 'font-size': '13px', color: '#333', 'min-width': '40px',
        'text-align': 'center', padding: '4px 8px', background: '#f0f0f0',
        border: '1px solid #d0d0d0', 'border-radius': '2px',
      }}>{label()}</div>
      <span style={{ color: '#999', 'font-size': '13px' }}>fx</span>
      <input
        ref={inputRef}
        style={{
          flex: '1', padding: '6px 10px', 'font-size': '13px',
          border: '1px solid #d0d0d0', 'border-radius': '2px', outline: 'none',
          'font-family': 'Consolas, monospace',
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const value = inputRef.value
          if (value !== currentCell()?.raw) emit(CellEdited, { row: sel().row, col: sel().col, value })
        }}
      />
    </div>
  )
}

function Cell(props: { row: number; col: number }) {
  const emit = useEmit()
  const grid = useSignal(cells)
  const sel = useSignal(selectedCell)

  const isSelected = () => sel().row === props.row && sel().col === props.col
  const cell = () => grid()[props.row][props.col]
  const hasError = () => !!cell().error

  return (
    <td
      style={{
        border: isSelected() ? '2px solid #217346' : '1px solid #d0d0d0',
        padding: isSelected() ? '3px 5px' : '4px 6px',
        'font-size': '13px', cursor: 'cell', width: '90px', 'min-width': '90px',
        height: '28px', overflow: 'hidden', 'text-overflow': 'ellipsis',
        'white-space': 'nowrap', position: 'relative', outline: 'none',
        background: isSelected() ? '#e8f5e9' : hasError() ? '#fff5f5' : '#fff',
        color: hasError() ? '#d32f2f' : '#222',
      }}
      onClick={() => emit(CellSelected, { row: props.row, col: props.col })}
      title={cell().error || cell().raw}
    >
      {cell().computed}
    </td>
  )
}

function StatusBar() {
  const grid = useSignal(cells)
  const sel = useSignal(selectedCell)

  const filledCount = () => grid().flat().filter(c => c.raw !== '').length
  const formulaCount = () => grid().flat().filter(c => c.raw.startsWith('=')).length
  const errorCount = () => grid().flat().filter(c => !!c.error).length
  const currentCell = () => grid()[sel().row]?.[sel().col]

  return (
    <div style={{
      background: '#217346', color: '#fff', padding: '4px 16px',
      'font-size': '12px', display: 'flex', 'justify-content': 'space-between',
    }}>
      <span>{filledCount()} cells filled | {formulaCount()} formulas | {errorCount()} errors</span>
      <span>
        {currentCell()?.raw.startsWith('=')
          ? `Formula: ${currentCell()!.raw} = ${currentCell()!.computed}`
          : currentCell()?.computed ? `Value: ${currentCell()!.computed}` : 'Empty cell'}
      </span>
    </div>
  )
}

export default function App() {
  useEvent(FormulaError, (p) => console.warn(`Formula error at ${colLabel(p.col)}${p.row + 1}: ${p.error}`))

  return (
    <div style={{
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      height: '100vh', display: 'flex', 'flex-direction': 'column', background: '#f5f5f5',
    }}>
      <div style={{ background: '#217346', color: '#fff', padding: '8px 16px', 'font-size': '14px', 'font-weight': '600', 'letter-spacing': '0.5px' }}>
        Pulse Spreadsheet
      </div>
      <FormulaBar />
      <div style={{ flex: '1', overflow: 'auto', padding: '16px' }}>
        <table style={{ 'border-collapse': 'collapse', background: '#fff', 'box-shadow': '0 1px 4px rgba(0,0,0,0.1)', 'user-select': 'none' }}>
          <thead>
            <tr>
              <th style={{ background: '#e8e8e8', border: '1px solid #d0d0d0', width: '36px', 'min-width': '36px' }} />
              <For each={Array.from({ length: COLS }, (_, c) => c)}>
                {(c) => <th style={{ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '6px 0', 'text-align': 'center', 'font-weight': '600', 'font-size': '12px', color: '#555', width: '90px', 'min-width': '90px' }}>{colLabel(c)}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={Array.from({ length: ROWS }, (_, r) => r)}>
              {(r) => (
                <tr>
                  <td style={{ background: '#f0f0f0', border: '1px solid #d0d0d0', padding: '4px 10px', 'text-align': 'center', 'font-weight': '600', 'font-size': '12px', color: '#555' }}>{r + 1}</td>
                  <For each={Array.from({ length: COLS }, (_, c) => c)}>
                    {(c) => <Cell row={r} col={c} />}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <StatusBar />
    </div>
  )
}
