import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ROWS = 8
export const COLS = 8

export type CellId = string // e.g. "A1", "B3"

export interface CellData {
  raw: string       // What user typed
  computed: number | string  // Evaluated value
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function cellId(row: number, col: number): CellId {
  return String.fromCharCode(65 + col) + (row + 1)
}

export function parseRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-H])([1-8])$/)
  if (!match) return null
  return { col: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const CellEdited = engine.event<{ id: CellId; raw: string }>('CellEdited')
export const CellUpdated = engine.event<{ id: CellId; data: CellData }>('CellUpdated')
export const CascadeUpdate = engine.event<CellId>('CascadeUpdate')
export const SelectCell = engine.event<CellId | null>('SelectCell')

// ---------------------------------------------------------------------------
// Evaluate a cell formula
// ---------------------------------------------------------------------------

function evaluateCell(raw: string, cells: Record<CellId, CellData>): { value: number | string; error?: string } {
  if (!raw) return { value: '' }
  if (!raw.startsWith('=')) {
    const num = Number(raw)
    return { value: isNaN(num) ? raw : num }
  }

  const formula = raw.slice(1).toUpperCase().trim()

  // Handle SUM(A1:A8)
  const sumMatch = formula.match(/^SUM\(([A-H][1-8]):([A-H][1-8])\)$/)
  if (sumMatch) {
    const start = parseRef(sumMatch[1])
    const end = parseRef(sumMatch[2])
    if (!start || !end) return { value: 0, error: 'Invalid range' }
    let sum = 0
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        const id = cellId(r, c)
        const v = cells[id]?.computed
        if (typeof v === 'number') sum += v
      }
    }
    return { value: sum }
  }

  // Handle simple references and arithmetic: =A1+B1, =A1*2
  try {
    let expr = formula
    // Replace cell references with their values
    expr = expr.replace(/[A-H][1-8]/g, (ref) => {
      const v = cells[ref]?.computed
      return typeof v === 'number' ? String(v) : '0'
    })
    // Simple safe eval for arithmetic
    const result = Function(`"use strict"; return (${expr})`)()
    return { value: typeof result === 'number' ? result : 0 }
  } catch {
    return { value: 0, error: 'Error' }
  }
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const cells = engine.signal<Record<CellId, CellData>>(
  CellUpdated,
  {},
  (prev, { id, data }) => ({ ...prev, [id]: data }),
)

export const selectedCell = engine.signal<CellId | null>(
  SelectCell,
  null,
  (_prev, id) => id,
)

// ---------------------------------------------------------------------------
// Pipe: CellEdited -> evaluate -> CellUpdated -> cascade dependents
// ---------------------------------------------------------------------------

// Track which cells depend on which (simple tracking)
const dependencyMap = new Map<CellId, Set<CellId>>()

engine.on(CellEdited, ({ id, raw }) => {
  // Evaluate the cell
  const result = evaluateCell(raw, cells.value)
  engine.emit(CellUpdated, {
    id,
    data: { raw, computed: result.value, error: result.error },
  })

  // Update dependencies: if raw is a formula, find refs
  if (raw.startsWith('=')) {
    const refs = raw.toUpperCase().match(/[A-H][1-8]/g) || []
    for (const ref of refs) {
      if (!dependencyMap.has(ref)) dependencyMap.set(ref, new Set())
      dependencyMap.get(ref)!.add(id)
    }
  }

  // Cascade to dependents
  const deps = dependencyMap.get(id)
  if (deps) {
    for (const dep of deps) {
      engine.emit(CascadeUpdate, dep)
    }
  }
})

// CascadeUpdate -> re-evaluate cell
engine.on(CascadeUpdate, (id) => {
  const cellData = cells.value[id]
  if (!cellData) return
  const result = evaluateCell(cellData.raw, cells.value)
  engine.emit(CellUpdated, {
    id,
    data: { ...cellData, computed: result.value, error: result.error },
  })

  // Continue cascade
  const deps = dependencyMap.get(id)
  if (deps) {
    for (const dep of deps) {
      engine.emit(CascadeUpdate, dep)
    }
  }
})

// Start frame loop
engine.startFrameLoop()
