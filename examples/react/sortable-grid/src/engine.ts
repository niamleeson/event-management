import { createEngine, createSignal } from '@pulse/core'
import type { Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridItem {
  id: string
  color: string
  label: string
}

export interface DragState {
  active: boolean
  dragIndex: number
  overIndex: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  offsetX: number
  offsetY: number
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const DragStart = engine.event<{ index: number; x: number; y: number; offsetX: number; offsetY: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const DragOver = engine.event<{ index: number }>('DragOver')
export const ItemMoved = engine.event<{ from: number; to: number }>('ItemMoved')
export const ShuffleAll = engine.event<void>('ShuffleAll')
export const AddItem = engine.event<void>('AddItem')
export const RemoveItem = engine.event<number>('RemoveItem')

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#0ea5e9',
]

// ---------------------------------------------------------------------------
// Initial items
// ---------------------------------------------------------------------------

let idCounter = 0

function makeItem(): GridItem {
  const id = `item-${++idCounter}`
  const color = COLORS[idCounter % COLORS.length]
  return { id, color, label: `${idCounter}` }
}

const INITIAL_ITEMS: GridItem[] = Array.from({ length: 12 }, () => makeItem())

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const items: Signal<GridItem[]> = createSignal<GridItem[]>(INITIAL_ITEMS)
engine['_signals'].push(items)

export const dragState: Signal<DragState> = createSignal<DragState>({
  active: false,
  dragIndex: -1,
  overIndex: -1,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  offsetX: 0,
  offsetY: 0,
})
engine['_signals'].push(dragState)

// Track entering/exiting items
export const enteringIds: Signal<Set<string>> = createSignal<Set<string>>(new Set())
engine['_signals'].push(enteringIds)

export const exitingIds: Signal<Set<string>> = createSignal<Set<string>>(new Set())
engine['_signals'].push(exitingIds)

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(DragStart, ({ index, x, y, offsetX, offsetY }) => {
  dragState._set({
    active: true,
    dragIndex: index,
    overIndex: index,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
    offsetX,
    offsetY,
  })
})

engine.on(DragMove, ({ x, y }) => {
  const ds = dragState.value
  if (!ds.active) return
  dragState._set({ ...ds, currentX: x, currentY: y })
})

engine.on(DragOver, ({ index }) => {
  const ds = dragState.value
  if (!ds.active) return
  dragState._set({ ...ds, overIndex: index })
})

engine.on(DragEnd, () => {
  const ds = dragState.value
  if (!ds.active) return

  if (ds.dragIndex !== ds.overIndex) {
    engine.emit(ItemMoved, { from: ds.dragIndex, to: ds.overIndex })
  }

  dragState._set({
    active: false,
    dragIndex: -1,
    overIndex: -1,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
  })
})

engine.on(ItemMoved, ({ from, to }) => {
  const arr = [...items.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
  items._set(arr)
})

engine.on(ShuffleAll, () => {
  const arr = [...items.value]
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  items._set(arr)
})

engine.on(AddItem, () => {
  const newItem = makeItem()
  const entering = new Set(enteringIds.value)
  entering.add(newItem.id)
  enteringIds._set(entering)
  items._set([...items.value, newItem])

  // Clear entering state after animation
  setTimeout(() => {
    const current = new Set(enteringIds.value)
    current.delete(newItem.id)
    enteringIds._set(current)
  }, 400)
})

engine.on(RemoveItem, (index) => {
  const arr = items.value
  if (index < 0 || index >= arr.length) return
  const item = arr[index]

  // Mark as exiting
  const exiting = new Set(exitingIds.value)
  exiting.add(item.id)
  exitingIds._set(exiting)

  // Actually remove after animation
  setTimeout(() => {
    items._set(items.value.filter((i) => i.id !== item.id))
    const current = new Set(exitingIds.value)
    current.delete(item.id)
    exitingIds._set(current)
  }, 300)
})

// ---------------------------------------------------------------------------
// Start frame loop
// ---------------------------------------------------------------------------

engine.startFrameLoop()
