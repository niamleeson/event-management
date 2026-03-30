import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CellData {
  raw: string
  computed: string
  error?: string
}

export type Grid = CellData[][]

export interface CellCoord {
  row: number
  col: number
}

export interface CellEditPayload {
  row: number
  col: number
  value: string
}

export interface CellComputedPayload {
  row: number
  col: number
  result: number | string
}

export interface FormulaErrorPayload {
  row: number
  col: number
  error: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROWS = 8
const COLS = 8

function colLabel(c: number): string {
  return String.fromCharCode(65 + c)
}

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
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      coords.push({ row: r, col: c })
    }
  }
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

  // SUM function
  const sumMatch = expr.match(/^SUM\((.+)\)$/i)
  if (sumMatch) {
    const rangeCoords = parseRange(sumMatch[1])
    if (!rangeCoords) throw new Error('Invalid range in SUM')
    return rangeCoords.reduce((acc, c) => acc + getCellValue(grid, c.row, c.col), 0)
  }

  // AVG function
  const avgMatch = expr.match(/^AVG\((.+)\)$/i)
  if (avgMatch) {
    const rangeCoords = parseRange(avgMatch[1])
    if (!rangeCoords || rangeCoords.length === 0) throw new Error('Invalid range in AVG')
    const sum = rangeCoords.reduce((acc, c) => acc + getCellValue(grid, c.row, c.col), 0)
    return sum / rangeCoords.length
  }

  // MIN function
  const minMatch = expr.match(/^MIN\((.+)\)$/i)
  if (minMatch) {
    const rangeCoords = parseRange(minMatch[1])
    if (!rangeCoords || rangeCoords.length === 0) throw new Error('Invalid range in MIN')
    return Math.min(...rangeCoords.map(c => getCellValue(grid, c.row, c.col)))
  }

  // MAX function
  const maxMatch = expr.match(/^MAX\((.+)\)$/i)
  if (maxMatch) {
    const rangeCoords = parseRange(maxMatch[1])
    if (!rangeCoords || rangeCoords.length === 0) throw new Error('Invalid range in MAX')
    return Math.max(...rangeCoords.map(c => getCellValue(grid, c.row, c.col)))
  }

  // Simple arithmetic expression with cell references
  let resolved = expr.replace(/[A-H][1-8]/gi, (match) => {
    const ref = parseCellRef(match)
    if (!ref) return '0'
    if (ref.row === selfRow && ref.col === selfCol) throw new Error('Circular reference')
    return String(getCellValue(grid, ref.row, ref.col))
  })

  // Evaluate safe arithmetic
  try {
    // Only allow numbers, operators, parentheses, spaces, and decimal points
    if (!/^[\d\s+\-*/.()]+$/.test(resolved)) {
      throw new Error('Invalid formula expression')
    }
    const result = new Function(`return (${resolved})`)()
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result')
    return Math.round(result * 1000000) / 1000000
  } catch {
    throw new Error('Invalid formula')
  }
}

function makeEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ raw: '', computed: '' }))
  )
}

function recomputeGrid(grid: Grid): Grid {
  const newGrid: Grid = grid.map(row => row.map(cell => ({ ...cell })))
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const raw = newGrid[r][c].raw
      if (raw.startsWith('=')) {
        try {
          const result = evaluateFormula(raw, newGrid, r, c)
          newGrid[r][c] = { raw, computed: String(result), error: undefined }
        } catch (err: any) {
          newGrid[r][c] = { raw, computed: '#ERR', error: err.message }
        }
      } else {
        newGrid[r][c] = { raw, computed: raw, error: undefined }
      }
    }
  }
  return newGrid
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const CellEdited = engine.event<CellEditPayload>('CellEdited')
export const CellComputed = engine.event<CellComputedPayload>('CellComputed')
export const CellSelected = engine.event<CellCoord>('CellSelected')
export const FormulaError = engine.event<FormulaErrorPayload>('FormulaError')

// ---------------------------------------------------------------------------
// Pipe: CellEdited -> CellComputed (with formula evaluation)
// ---------------------------------------------------------------------------

engine.pipe(CellEdited, [CellComputed, FormulaError], (payload: CellEditPayload) => {
  // We trigger the grid recompute through the signal reducer below.
  // The pipe computes the immediate cell result.
  const currentGrid = cells.value
  const tempGrid = currentGrid.map(row => row.map(cell => ({ ...cell })))
  tempGrid[payload.row][payload.col] = { raw: payload.value, computed: payload.value }

  if (payload.value.startsWith('=')) {
    try {
      const result = evaluateFormula(payload.value, tempGrid, payload.row, payload.col)
      return [
        { row: payload.row, col: payload.col, result },
        undefined,
      ]
    } catch (err: any) {
      return [
        undefined,
        { row: payload.row, col: payload.col, error: err.message },
      ]
    }
  }
  return [
    { row: payload.row, col: payload.col, result: payload.value },
    undefined,
  ]
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const cells = engine.signal<Grid>(CellEdited, makeEmptyGrid(), (prev, payload) => {
  const newGrid = prev.map(row => row.map(cell => ({ ...cell })))
  newGrid[payload.row][payload.col] = {
    raw: payload.value,
    computed: payload.value,
  }
  // Recompute all formula cells
  return recomputeGrid(newGrid)
})

export const selectedCell = engine.signal<CellCoord>(
  CellSelected,
  { row: 0, col: 0 },
  (_prev, coord) => coord,
)

export { colLabel, ROWS, COLS }
