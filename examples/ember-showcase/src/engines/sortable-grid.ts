import { createEngine, type SpringValue } from '@pulse/core'

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

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const items = engine.signal<GridItem[]>(
  DragOver, [...INITIAL_ITEMS],
  (prev, targetOrder) => {
    const dragging = draggedItem.value
    if (dragging === null) return prev
    const dragItem = prev.find((it) => it.id === dragging)
    if (!dragItem) return prev

    const fromOrder = dragItem.order
    if (fromOrder === targetOrder) return prev

    return prev.map((it) => {
      if (it.id === dragging) return { ...it, order: targetOrder }
      if (fromOrder < targetOrder) {
        if (it.order > fromOrder && it.order <= targetOrder) return { ...it, order: it.order - 1 }
      } else {
        if (it.order >= targetOrder && it.order < fromOrder) return { ...it, order: it.order + 1 }
      }
      return it
    })
  },
)

engine.signalUpdate(items, Shuffle, (prev) => {
  const orders = prev.map((_, i) => i)
  // Fisher-Yates shuffle
  for (let i = orders.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[orders[i], orders[j]] = [orders[j], orders[i]]
  }
  return prev.map((it, i) => ({ ...it, order: orders[i] }))
})

engine.signalUpdate(items, Reset, (prev) =>
  prev.map((it) => ({ ...it, order: it.id })),
)

export const draggedItem = engine.signal<number | null>(
  DragStart, null, (_prev, id) => id,
)
engine.signalUpdate(draggedItem, DragEnd, () => null)

// ---------------------------------------------------------------------------
// Springs — smooth position transitions
// Target positions computed from order
// ---------------------------------------------------------------------------

export function getPosition(order: number): { x: number; y: number } {
  const col = order % GRID_COLS
  const row = Math.floor(order / GRID_COLS)
  return {
    x: col * (CELL_SIZE + GAP),
    y: row * (CELL_SIZE + GAP),
  }
}

// Create spring pairs for each item
export const itemSpringsX: SpringValue[] = []
export const itemSpringsY: SpringValue[] = []

for (let i = 0; i < ITEM_COUNT; i++) {
  const pos = getPosition(i)
  const targetX = engine.signal<number>(DragOver, pos.x, () => {
    const item = items.value.find((it) => it.id === i)
    return item ? getPosition(item.order).x : pos.x
  })
  const targetY = engine.signal<number>(DragOver, pos.y, () => {
    const item = items.value.find((it) => it.id === i)
    return item ? getPosition(item.order).y : pos.y
  })

  // Also update on shuffle/reset
  engine.signalUpdate(targetX, Shuffle, () => {
    const item = items.value.find((it) => it.id === i)
    return item ? getPosition(item.order).x : pos.x
  })
  engine.signalUpdate(targetY, Shuffle, () => {
    const item = items.value.find((it) => it.id === i)
    return item ? getPosition(item.order).y : pos.y
  })
  engine.signalUpdate(targetX, Reset, () => getPosition(i).x)
  engine.signalUpdate(targetY, Reset, () => getPosition(i).y)

  itemSpringsX.push(engine.spring(targetX, { stiffness: 200, damping: 22, restThreshold: 0.5 }))
  itemSpringsY.push(engine.spring(targetY, { stiffness: 200, damping: 22, restThreshold: 0.5 }))
}

// Start frame loop for springs
engine.startFrameLoop()
