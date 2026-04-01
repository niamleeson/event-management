// DAG
// CellEdited ──→ CellsChanged
// SelectCell ──→ SelectedCellChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()

export const ROWS = 8
export const COLS = 8
export type CellId = string
export interface CellData { raw: string; computed: number | string; error?: string }

export function cellId(row: number, col: number): CellId { return String.fromCharCode(65 + col) + (row + 1) }
export function parseRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-H])([1-8])$/)
  if (!match) return null
  return { col: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 }
}

export const CellEdited = engine.event<{ id: CellId; raw: string }>('CellEdited')
export const SelectCell = engine.event<CellId | null>('SelectCell')
export const CellsChanged = engine.event<Record<CellId, CellData>>('CellsChanged')
export const SelectedCellChanged = engine.event<CellId | null>('SelectedCellChanged')

let cells: Record<CellId, CellData> = {}
const dependencyMap = new Map<CellId, Set<CellId>>()

function evaluateCell(raw: string, cells: Record<CellId, CellData>): { value: number | string; error?: string } {
  if (!raw) return { value: '' }
  if (!raw.startsWith('=')) { const num = Number(raw); return { value: isNaN(num) ? raw : num } }
  const formula = raw.slice(1).toUpperCase().trim()
  const sumMatch = formula.match(/^SUM\(([A-H][1-8]):([A-H][1-8])\)$/)
  if (sumMatch) {
    const start = parseRef(sumMatch[1]), end = parseRef(sumMatch[2])
    if (!start || !end) return { value: 0, error: 'Invalid range' }
    let sum = 0
    for (let r = start.row; r <= end.row; r++) for (let c = start.col; c <= end.col; c++) { const v = cells[cellId(r, c)]?.computed; if (typeof v === 'number') sum += v }
    return { value: sum }
  }
  try {
    let expr = formula.replace(/[A-H][1-8]/g, (ref) => { const v = cells[ref]?.computed; return typeof v === 'number' ? String(v) : '0' })
    const result = Function(`"use strict"; return (${expr})`)()
    return { value: typeof result === 'number' ? result : 0 }
  } catch { return { value: 0, error: 'Error' } }
}

function cascadeUpdate(id: CellId) {
  const cellData = cells[id]
  if (!cellData) return
  const result = evaluateCell(cellData.raw, cells)
  cells = { ...cells, [id]: { ...cellData, computed: result.value, error: result.error } }
  engine.emit(CellsChanged, cells)
  const deps = dependencyMap.get(id)
  if (deps) for (const dep of deps) cascadeUpdate(dep)
}

engine.on(CellEdited, [CellsChanged], ({ id, raw }, setCells) => {
  const result = evaluateCell(raw, cells)
  cells = { ...cells, [id]: { raw, computed: result.value, error: result.error } }
  setCells(cells)
  if (raw.startsWith('=')) {
    const refs = raw.toUpperCase().match(/[A-H][1-8]/g) || []
    for (const ref of refs) { if (!dependencyMap.has(ref)) dependencyMap.set(ref, new Set()); dependencyMap.get(ref)!.add(id) }
  }
  const deps = dependencyMap.get(id)
  if (deps) for (const dep of deps) cascadeUpdate(dep)
})

engine.on(SelectCell, [SelectedCellChanged], (id, setSelected) => setSelected(id))

export function startLoop() {}
export function stopLoop() {}
