import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CellData {
  raw: string       // what user typed (could be formula like =A1+B2)
  computed: string   // evaluated result
  error: boolean
}

export interface CellRef {
  row: number
  col: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ROWS = 8
export const COLS = 8

export function cellKey(row: number, col: number): string {
  return `${String.fromCharCode(65 + col)}${row + 1}`
}

export function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(/^([A-H])([1-8])$/)
  if (!match) return null
  return { col: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const CellEdited = engine.event<{ row: number; col: number; value: string }>('CellEdited')
export const CellSelected = engine.event<CellRef | null>('CellSelected')
export const FormulaBarChanged = engine.event<string>('FormulaBarChanged')
export const RecalcAll = engine.event<void>('RecalcAll')

// ---------------------------------------------------------------------------
// Formula evaluation
// ---------------------------------------------------------------------------

function evaluateFormula(formula: string, grid: Record<string, CellData>, visited: Set<string>): string {
  if (!formula.startsWith('=')) return formula

  const expr = formula.slice(1).toUpperCase()

  // Replace cell references with their values
  const resolved = expr.replace(/[A-H][1-8]/g, (ref) => {
    if (visited.has(ref)) return '#CIRC!'
    const cell = grid[ref]
    if (!cell) return '0'
    if (cell.raw.startsWith('=')) {
      visited.add(ref)
      const val = evaluateFormula(cell.raw, grid, visited)
      visited.delete(ref)
      return val
    }
    return cell.computed || '0'
  })

  try {
    // Support SUM(A1:A4) function
    const sumResolved = resolved.replace(/SUM\(([A-H])([1-8]):([A-H])([1-8])\)/g,
      (_match, c1, r1, c2, r2) => {
        let sum = 0
        const col1 = c1.charCodeAt(0) - 65
        const col2 = c2.charCodeAt(0) - 65
        const row1 = parseInt(r1) - 1
        const row2 = parseInt(r2) - 1
        for (let r = Math.min(row1, row2); r <= Math.max(row1, row2); r++) {
          for (let c = Math.min(col1, col2); c <= Math.max(col1, col2); c++) {
            const key = cellKey(r, c)
            const cell = grid[key]
            if (cell) {
              const val = parseFloat(cell.computed)
              if (!isNaN(val)) sum += val
            }
          }
        }
        return String(sum)
      })

    // Simple math eval (safe: only numbers and operators)
    const sanitized = sumResolved.replace(/[^0-9+\-*/.() ]/g, '')
    if (sanitized.length === 0) return '#ERR!'
    // eslint-disable-next-line no-eval
    const result = Function(`"use strict"; return (${sanitized})`)()
    return typeof result === 'number' ? (Number.isInteger(result) ? String(result) : result.toFixed(2)) : String(result)
  } catch {
    return '#ERR!'
  }
}

function recalculate(grid: Record<string, CellData>): Record<string, CellData> {
  const next: Record<string, CellData> = {}
  for (const key of Object.keys(grid)) {
    const cell = grid[key]
    if (cell.raw.startsWith('=')) {
      const visited = new Set<string>([key])
      const computed = evaluateFormula(cell.raw, grid, visited)
      next[key] = { raw: cell.raw, computed, error: computed.startsWith('#') }
    } else {
      const num = parseFloat(cell.raw)
      next[key] = { raw: cell.raw, computed: isNaN(num) ? cell.raw : String(num), error: false }
    }
  }
  return next
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Initialize grid with some default data
const initialGrid: Record<string, CellData> = {}
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    initialGrid[cellKey(r, c)] = { raw: '', computed: '', error: false }
  }
}
// Add some sample data
initialGrid['A1'] = { raw: '100', computed: '100', error: false }
initialGrid['B1'] = { raw: '200', computed: '200', error: false }
initialGrid['C1'] = { raw: '=A1+B1', computed: '300', error: false }
initialGrid['A2'] = { raw: '50', computed: '50', error: false }
initialGrid['B2'] = { raw: '75', computed: '75', error: false }
initialGrid['C2'] = { raw: '=A2*B2', computed: '3750', error: false }
initialGrid['A3'] = { raw: '=SUM(A1:A2)', computed: '150', error: false }

export const grid = engine.signal<Record<string, CellData>>(
  CellEdited, initialGrid,
  (prev, { row, col, value }) => {
    const key = cellKey(row, col)
    const next = { ...prev }
    const num = parseFloat(value)
    next[key] = {
      raw: value,
      computed: value.startsWith('=') ? '' : (isNaN(num) ? value : String(num)),
      error: false,
    }
    return recalculate(next)
  },
)

engine.signalUpdate(grid, RecalcAll, (prev) => recalculate(prev))

export const selectedCell = engine.signal<CellRef | null>(
  CellSelected, null, (_prev, cell) => cell,
)

export const formulaBarText = engine.signal<string>(
  FormulaBarChanged, '', (_prev, text) => text,
)

// Sync formula bar with selected cell
engine.on(CellSelected, (cell) => {
  if (cell) {
    const key = cellKey(cell.row, cell.col)
    const data = grid.value[key]
    engine.emit(FormulaBarChanged, data?.raw ?? '')
  } else {
    engine.emit(FormulaBarChanged, '')
  }
})
