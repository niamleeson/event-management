import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG
// ---------------------------------------------------------------------------
// DragStart ──→ DragStateChanged
// DragMove ──→ DragStateChanged
// DragOver ──→ DragStateChanged
// DragEnd ──┬──→ ItemsChanged
//           └──→ DragStateChanged
// ShuffleAll ──→ ItemsChanged
// AddItem ──┬──→ EnteringIdsChanged
//           └──→ ItemsChanged
// EnterAnimDone ──→ EnteringIdsChanged (clear entering flag)
// RemoveItem ──→ ExitingIdsChanged
// ExitAnimDone ──┬──→ ItemsChanged (remove)
//               └──→ ExitingIdsChanged (clear exiting flag)
// ---------------------------------------------------------------------------

export interface GridItem { id: string; color: string; label: string }
export interface DragState { active: boolean; dragIndex: number; overIndex: number; startX: number; startY: number; currentX: number; currentY: number; offsetX: number; offsetY: number }

export const DragStart = engine.event<{ index: number; x: number; y: number; offsetX: number; offsetY: number }>('DragStart')
export const DragMove = engine.event<{ x: number; y: number }>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const DragOver = engine.event<{ index: number }>('DragOver')
export const ShuffleAll = engine.event<void>('ShuffleAll')
export const AddItem = engine.event<void>('AddItem')
export const RemoveItem = engine.event<number>('RemoveItem')

// Internal animation transition events
const EnterAnimDone = engine.event<string>('EnterAnimDone')
const ExitAnimDone = engine.event<string>('ExitAnimDone')

export const ItemsChanged = engine.event<GridItem[]>('ItemsChanged')
export const DragStateChanged = engine.event<DragState>('DragStateChanged')
export const EnteringIdsChanged = engine.event<Set<string>>('EnteringIdsChanged')
export const ExitingIdsChanged = engine.event<Set<string>>('ExitingIdsChanged')

const COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#0ea5e9']

let idCounter = 0
function makeItem(): GridItem { const id = `item-${++idCounter}`; return { id, color: COLORS[idCounter % COLORS.length], label: `${idCounter}` } }

let items: GridItem[] = Array.from({ length: 12 }, () => makeItem())
let dragState: DragState = { active: false, dragIndex: -1, overIndex: -1, startX: 0, startY: 0, currentX: 0, currentY: 0, offsetX: 0, offsetY: 0 }
let enteringIds = new Set<string>()
let exitingIds = new Set<string>()

engine.on(DragStart, [DragStateChanged], ({ index, x, y, offsetX, offsetY }, setDrag) => {
  dragState = { active: true, dragIndex: index, overIndex: index, startX: x, startY: y, currentX: x, currentY: y, offsetX, offsetY }
  setDrag({ ...dragState })
})

engine.on(DragMove, [DragStateChanged], ({ x, y }, setDrag) => {
  if (!dragState.active) return
  dragState = { ...dragState, currentX: x, currentY: y }
  setDrag({ ...dragState })
})

engine.on(DragOver, [DragStateChanged], ({ index }, setDrag) => {
  if (!dragState.active) return
  dragState = { ...dragState, overIndex: index }
  setDrag({ ...dragState })
})

engine.on(DragEnd, [ItemsChanged, DragStateChanged], (_, setItems, setDrag) => {
  if (!dragState.active) return
  if (dragState.dragIndex !== dragState.overIndex) {
    const arr = [...items]; const [moved] = arr.splice(dragState.dragIndex, 1); arr.splice(dragState.overIndex, 0, moved)
    items = arr; setItems([...items])
  }
  dragState = { active: false, dragIndex: -1, overIndex: -1, startX: 0, startY: 0, currentX: 0, currentY: 0, offsetX: 0, offsetY: 0 }
  setDrag({ ...dragState })
})

engine.on(ShuffleAll, [ItemsChanged], (_, setItems) => {
  const arr = [...items]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }
  items = arr; setItems([...items])
})

engine.on(AddItem, [EnteringIdsChanged, ItemsChanged], (_, setEntering, setItems) => {
  const newItem = makeItem()
  enteringIds = new Set(enteringIds); enteringIds.add(newItem.id); setEntering(new Set(enteringIds))
  items = [...items, newItem]; setItems([...items])
  setTimeout(() => engine.emit(EnterAnimDone, newItem.id), 400)
})

engine.on(EnterAnimDone, [EnteringIdsChanged], (id, setEntering) => {
  enteringIds = new Set(enteringIds); enteringIds.delete(id); setEntering(new Set(enteringIds))
})

engine.on(RemoveItem, [ExitingIdsChanged], (index, setExiting) => {
  if (index < 0 || index >= items.length) return
  const item = items[index]
  exitingIds = new Set(exitingIds); exitingIds.add(item.id); setExiting(new Set(exitingIds))
  setTimeout(() => engine.emit(ExitAnimDone, item.id), 300)
})

engine.on(ExitAnimDone, [ItemsChanged, ExitingIdsChanged], (id, setItems, setExiting) => {
  items = items.filter((i) => i.id !== id); setItems([...items])
  exitingIds = new Set(exitingIds); exitingIds.delete(id); setExiting(new Set(exitingIds))
})

engine.emit(ItemsChanged, [...items])

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  idCounter = 0
  items = Array.from({ length: 12 }, () => makeItem())
  dragState = { active: false, dragIndex: -1, overIndex: -1, startX: 0, startY: 0, currentX: 0, currentY: 0, offsetX: 0, offsetY: 0 }
  enteringIds = new Set<string>()
  exitingIds = new Set<string>()
}
