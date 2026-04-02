import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

engine.onError = (error, rule, _event) => {
  console.warn(`[Pulse] Error in ${rule.name}:`, error.message)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CellData { raw: string; computed: string; error?: string }
export type Grid = CellData[][]
export interface CellCoord { row: number; col: number }
export interface CellEditPayload { row: number; col: number; value: string }
export interface FormulaErrorPayload { row: number; col: number; error: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const start = parseCellRef(parts[0].trim()), end = parseCellRef(parts[1].trim())
  if (!start || !end) return null
  const coords: CellCoord[] = []
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++)
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++)
      coords.push({ row: r, col: c })
  return coords
}

function getCellValue(grid: Grid, row: number, col: number): number {
  const cell = grid[row]?.[col]
  if (!cell) return 0
  const n = parseFloat(cell.computed)
  return isNaN(n) ? 0 : n
}

function evaluateFormula(formula: string, grid: Grid, selfRow: number, selfCol: number): number | string {
  const expr = formula.substring(1).trim()
  const sumMatch = expr.match(/^SUM\((.+)\)$/i)
  if (sumMatch) { const r = parseRange(sumMatch[1]); if (!r) throw new Error('Invalid range'); return r.reduce((a, c) => a + getCellValue(grid, c.row, c.col), 0) }
  const avgMatch = expr.match(/^AVG\((.+)\)$/i)
  if (avgMatch) { const r = parseRange(avgMatch[1]); if (!r || !r.length) throw new Error('Invalid range'); return r.reduce((a, c) => a + getCellValue(grid, c.row, c.col), 0) / r.length }
  const minMatch = expr.match(/^MIN\((.+)\)$/i)
  if (minMatch) { const r = parseRange(minMatch[1]); if (!r || !r.length) throw new Error('Invalid range'); return Math.min(...r.map(c => getCellValue(grid, c.row, c.col))) }
  const maxMatch = expr.match(/^MAX\((.+)\)$/i)
  if (maxMatch) { const r = parseRange(maxMatch[1]); if (!r || !r.length) throw new Error('Invalid range'); return Math.max(...r.map(c => getCellValue(grid, c.row, c.col))) }
  let resolved = expr.replace(/[A-H][1-8]/gi, (match) => {
    const ref = parseCellRef(match)
    if (!ref) return '0'
    if (ref.row === selfRow && ref.col === selfCol) throw new Error('Circular reference')
    return String(getCellValue(grid, ref.row, ref.col))
  })
  try {
    if (!/^[\d\s+\-*/.()]+$/.test(resolved)) throw new Error('Invalid formula')
    const result = new Function(`return (${resolved})`)()
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result')
    return Math.round(result * 1000000) / 1000000
  } catch { throw new Error('Invalid formula') }
}

function makeEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ raw: '', computed: '' })))
}

function recomputeGrid(grid: Grid): Grid {
  const g: Grid = grid.map(r => r.map(c => ({ ...c })))
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const raw = g[r][c].raw
    if (raw.startsWith('=')) {
      try { const result = evaluateFormula(raw, g, r, c); g[r][c] = { raw, computed: String(result) } }
      catch (e: any) { g[r][c] = { raw, computed: '#ERR', error: e.message } }
    } else { g[r][c] = { raw, computed: raw } }
  }
  return g
}

// ---------------------------------------------------------------------------
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
// CellEdited ──→ CellsChanged ──→ DependentCellsRecalculated ──→ FormulaError
// CellSelected ──→ SelectedCellChanged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const CellEdited = engine.event<CellEditPayload>('CellEdited')
export const CellSelected = engine.event<CellCoord>('CellSelected')

// Layer 1: Primary state events
export const CellsChanged = engine.event<Grid>('CellsChanged')
export const SelectedCellChanged = engine.event<CellCoord>('SelectedCellChanged')

// Layer 2: Derived state events (recalculation of dependent cells)
export const DependentCellsRecalculated = engine.event<Grid>('DependentCellsRecalculated')

// Layer 3: Error detection (derived from recalculated grid)
export const FormulaError = engine.event<FormulaErrorPayload>('FormulaError')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cells = makeEmptyGrid()
let selectedCell: CellCoord = { row: 0, col: 0 }

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(CellEdited, [CellsChanged], (payload, setCells) => {
  const newGrid = cells.map(r => r.map(c => ({ ...c })))
  newGrid[payload.row][payload.col] = { raw: payload.value, computed: payload.value }
  cells = newGrid
  setCells(cells)
})

engine.on(CellSelected, [SelectedCellChanged], (coord, setSelected) => {
  selectedCell = coord
  setSelected(coord)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → dependent cell recalculation
// ---------------------------------------------------------------------------

engine.on(CellsChanged, [DependentCellsRecalculated], (_grid, setRecalculated) => {
  cells = recomputeGrid(cells)
  setRecalculated(cells)
})

// ---------------------------------------------------------------------------
// Layer 2 → Layer 3: Recalculated grid → formula error detection
// ---------------------------------------------------------------------------

engine.on(DependentCellsRecalculated, [FormulaError], (grid, setError) => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c]
      if (cell.error) {
        setError({ row: r, col: c, error: cell.error })
        return
      }
    }
  }
})

// Emit initial state
engine.emit(CellsChanged, cells)
engine.emit(SelectedCellChanged, selectedCell)

export { colLabel, ROWS, COLS }

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  cells = makeEmptyGrid()
  selectedCell = { row: 0, col: 0 }
}
