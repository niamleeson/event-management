import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface GridItem {
  id: number
  label: string
  color: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const COLS = 4
const CELL_SIZE = 120
const GAP = 12
let nextItemId = 1

const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#d63031', '#fdcb6e', '#a29bfe', '#00cec9',
  '#f368e0', '#ff9f43', '#54a0ff', '#5f27cd']

function makeItem(): GridItem {
  const id = nextItemId++
  return { id, label: `Item ${id}`, color: COLORS[(id - 1) % COLORS.length] }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const DragStart = engine.event<{ id: number; x: number; y: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event('DragEnd')
export const ShuffleItems = engine.event('ShuffleItems')
export const AddItem = engine.event('AddItem')
export const RemoveItem = engine.event<number>('RemoveItem')

/* ------------------------------------------------------------------ */
/*  State-changed events                                              */
/* ------------------------------------------------------------------ */

export const ItemsChanged = engine.event<GridItem[]>('ItemsChanged')
export const DraggingIdChanged = engine.event<number>('DraggingIdChanged')
export const GhostPosChanged = engine.event<{ x: number; y: number }>('GhostPosChanged')
export const PositionsChanged = engine.event<{ x: number[]; y: number[] }>('PositionsChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const initialItems = Array.from({ length: 8 }, () => makeItem())

let items = initialItems
let draggingId = -1
let ghostPos = { x: 0, y: 0 }

function computePositions(): { x: number[]; y: number[] } {
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < 20; i++) {
    const idx = i < items.length ? i : 0
    xs.push((idx % COLS) * (CELL_SIZE + GAP))
    ys.push(Math.floor(idx / COLS) * (CELL_SIZE + GAP))
  }
  return { x: xs, y: ys }
}

let positions = computePositions()

// Dragging id state
engine.on(DragStart, ({ id }) => {
  draggingId = id
  engine.emit(DraggingIdChanged, draggingId)
})
engine.on(DragEnd, () => {
  draggingId = -1
  engine.emit(DraggingIdChanged, draggingId)
})

// Ghost position state
engine.on(DragMove, (pos) => {
  ghostPos = pos
  engine.emit(GhostPosChanged, ghostPos)
})
engine.on(DragStart, ({ x, y }) => {
  ghostPos = { x, y }
  engine.emit(GhostPosChanged, ghostPos)
})

/* ------------------------------------------------------------------ */
/*  Drag reorder logic                                                */
/* ------------------------------------------------------------------ */

engine.on(DragMove, ({ x, y }) => {
  if (draggingId < 0) return
  const col = Math.min(COLS - 1, Math.max(0, Math.round(x / (CELL_SIZE + GAP))))
  const row = Math.max(0, Math.round(y / (CELL_SIZE + GAP)))
  const targetIdx = Math.min(items.length - 1, row * COLS + col)
  const currentIdx = items.findIndex(it => it.id === draggingId)
  if (currentIdx >= 0 && currentIdx !== targetIdx) {
    const next = [...items]
    const [moved] = next.splice(currentIdx, 1)
    next.splice(targetIdx, 0, moved)
    items = next
    engine.emit(ItemsChanged, items)
    positions = computePositions()
    engine.emit(PositionsChanged, positions)
  }
})

/* ------------------------------------------------------------------ */
/*  Shuffle                                                           */
/* ------------------------------------------------------------------ */

engine.on(ShuffleItems, () => {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  items = shuffled
  engine.emit(ItemsChanged, items)
  positions = computePositions()
  engine.emit(PositionsChanged, positions)
})

/* ------------------------------------------------------------------ */
/*  Add / Remove                                                      */
/* ------------------------------------------------------------------ */

engine.on(AddItem, () => {
  if (items.length >= 20) return
  items = [...items, makeItem()]
  engine.emit(ItemsChanged, items)
  positions = computePositions()
  engine.emit(PositionsChanged, positions)
})

engine.on(RemoveItem, (id) => {
  items = items.filter(it => it.id !== id)
  engine.emit(ItemsChanged, items)
  positions = computePositions()
  engine.emit(PositionsChanged, positions)
})

/* ------------------------------------------------------------------ */
/*  Initial values                                                    */
/* ------------------------------------------------------------------ */

export function getItems() { return items }
export function getDraggingId() { return draggingId }
export function getGhostPos() { return ghostPos }
export function getPositions() { return positions }

export { COLS, CELL_SIZE, GAP }
