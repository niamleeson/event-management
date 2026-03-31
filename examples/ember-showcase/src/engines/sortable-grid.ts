import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridItem {
  id: number
  label: string
  color: string
  order: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GRID_COLS = 4
export const CELL_SIZE = 100
export const GAP = 12
export const ITEM_COUNT = 12

const COLORS = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#2a9d8f', '#e76f51', '#f4a261', '#264653', '#ff6b6b', '#51cf66', '#fcc419', '#845ef7']

const INITIAL_ITEMS: GridItem[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  label: String(i + 1),
  color: COLORS[i % COLORS.length],
  order: i,
}))

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const DragStart = engine.event<number>('DragStart')
export const DragOver = engine.event<number>('DragOver')
export const DragEnd = engine.event<void>('DragEnd')
export const Shuffle = engine.event<void>('Shuffle')
export const Reset = engine.event<void>('Reset')
export const GridChanged = engine.event<void>('GridChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _items: GridItem[] = [...INITIAL_ITEMS]
let _draggedItem: number | null = null

// Spring positions per item
const _springX = new Float64Array(ITEM_COUNT)
const _springY = new Float64Array(ITEM_COUNT)
const _targetX = new Float64Array(ITEM_COUNT)
const _targetY = new Float64Array(ITEM_COUNT)

// Initialize positions
for (let i = 0; i < ITEM_COUNT; i++) {
  const pos = getPosition(i)
  _springX[i] = pos.x
  _springY[i] = pos.y
  _targetX[i] = pos.x
  _targetY[i] = pos.y
}

export function getItems(): GridItem[] { return _items }
export function getDraggedItem(): number | null { return _draggedItem }
export function getSpringX(i: number): number { return _springX[i] }
export function getSpringY(i: number): number { return _springY[i] }

export function getPosition(order: number): { x: number; y: number } {
  const col = order % GRID_COLS
  const row = Math.floor(order / GRID_COLS)
  return {
    x: col * (CELL_SIZE + GAP),
    y: row * (CELL_SIZE + GAP),
  }
}

function updateTargets() {
  for (let i = 0; i < ITEM_COUNT; i++) {
    const item = _items.find((it) => it.id === i)
    if (item) {
      const pos = getPosition(item.order)
      _targetX[i] = pos.x
      _targetY[i] = pos.y
    }
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(DragStart, (id: number) => {
  _draggedItem = id
  engine.emit(GridChanged, undefined)
})

engine.on(DragOver, (targetOrder: number) => {
  if (_draggedItem === null) return
  const dragItem = _items.find((it) => it.id === _draggedItem)
  if (!dragItem) return

  const fromOrder = dragItem.order
  if (fromOrder === targetOrder) return

  _items = _items.map((it) => {
    if (it.id === _draggedItem) return { ...it, order: targetOrder }
    if (fromOrder < targetOrder) {
      if (it.order > fromOrder && it.order <= targetOrder) return { ...it, order: it.order - 1 }
    } else {
      if (it.order >= targetOrder && it.order < fromOrder) return { ...it, order: it.order + 1 }
    }
    return it
  })
  updateTargets()
  engine.emit(GridChanged, undefined)
})

engine.on(DragEnd, () => {
  _draggedItem = null
  engine.emit(GridChanged, undefined)
})

engine.on(Shuffle, () => {
  const orders = _items.map((_, i) => i)
  for (let i = orders.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
  }
  _items = _items.map((it, i) => ({ ...it, order: orders[i] }))
  updateTargets()
  engine.emit(GridChanged, undefined)
})

engine.on(Reset, () => {
  _items = _items.map((it) => ({ ...it, order: it.id }))
  updateTargets()
  engine.emit(GridChanged, undefined)
})

// ---------------------------------------------------------------------------
// Frame update
// ---------------------------------------------------------------------------

export function updateFrame(): void {
  for (let i = 0; i < ITEM_COUNT; i++) {
    _springX[i] += (_targetX[i] - _springX[i]) * 0.15
    _springY[i] += (_targetY[i] - _springY[i]) * 0.15
  }
}
