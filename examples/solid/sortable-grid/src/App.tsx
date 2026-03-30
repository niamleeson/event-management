import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useSpring } from '@pulse/solid'
import type { Signal, SpringValue } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface GridItem {
  id: number
  label: string
  color: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const COLS = 4
const CELL_SIZE = 140
const GAP = 12

function getPosition(index: number): { x: number; y: number } {
  return {
    x: (index % COLS) * (CELL_SIZE + GAP),
    y: Math.floor(index / COLS) * (CELL_SIZE + GAP),
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const DragItemStart = engine.event<number>('DragItemStart')
const DragItemMove = engine.event<{ id: number; x: number; y: number }>('DragItemMove')
const DragItemEnd = engine.event<number>('DragItemEnd')
const ShuffleItems = engine.event('ShuffleItems')
const AddItem = engine.event('AddItem')
const RemoveItem = engine.event<number>('RemoveItem')
const Reorder = engine.event<{ fromIdx: number; toIdx: number }>('Reorder')

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const COLORS = ['#6c5ce7', '#0984e3', '#00b894', '#e17055', '#d63031', '#fdcb6e', '#a29bfe', '#00cec9', '#ff6b6b', '#54a0ff', '#5f27cd', '#01a3a4']
let nextItemId = 12

const INITIAL_ITEMS: GridItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: i, label: `Item ${i + 1}`, color: COLORS[i % COLORS.length],
}))

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const items = engine.signal<GridItem[]>(Reorder, INITIAL_ITEMS, (prev, { fromIdx, toIdx }) => {
  const next = [...prev]
  const [item] = next.splice(fromIdx, 1)
  next.splice(toIdx, 0, item)
  return next
})

engine.signalUpdate(items, ShuffleItems, (prev) => {
  const shuffled = [...prev]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
})

engine.signalUpdate(items, AddItem, (prev) => {
  nextItemId++
  return [...prev, { id: nextItemId, label: `Item ${nextItemId}`, color: COLORS[nextItemId % COLORS.length] }]
})

engine.signalUpdate(items, RemoveItem, (prev, id) => prev.filter(item => item.id !== id))

const draggingId = engine.signal<number>(DragItemStart, -1, (_prev, id) => id)
engine.signalUpdate(draggingId, DragItemEnd, () => -1)

const dragPos = engine.signal<{ x: number; y: number }>(DragItemMove, { x: 0, y: 0 }, (_prev, { x, y }) => ({ x, y }))

// Per-item spring positions
const positionTargets: Map<number, { x: Signal<number>; y: Signal<number> }> = new Map()
const positionSprings: Map<number, { x: SpringValue; y: SpringValue }> = new Map()

function ensureSpring(id: number, targetX: number, targetY: number) {
  if (!positionTargets.has(id)) {
    const xt = engine.signal(Reorder, targetX, () => targetX)
    const yt = engine.signal(Reorder, targetY, () => targetY)
    positionTargets.set(id, { x: xt, y: yt })
    positionSprings.set(id, {
      x: engine.spring(xt, { stiffness: 200, damping: 22 }),
      y: engine.spring(yt, { stiffness: 200, damping: 22 }),
    })
  }
}

// Update spring targets when items reorder
function updatePositions() {
  const currentItems = items.value
  currentItems.forEach((item, idx) => {
    const pos = getPosition(idx)
    const targets = positionTargets.get(item.id)
    if (targets) {
      targets.x._set(pos.x)
      targets.y._set(pos.y)
    }
  })
}

engine.on(Reorder, updatePositions)
engine.on(ShuffleItems, () => setTimeout(updatePositions, 10))
engine.on(AddItem, () => setTimeout(updatePositions, 10))
engine.on(RemoveItem, () => setTimeout(updatePositions, 10))

// Determine drop target during drag
engine.on(DragItemMove, ({ id, x, y }) => {
  const currentItems = items.value
  const dragIdx = currentItems.findIndex(i => i.id === id)
  if (dragIdx < 0) return

  const col = Math.round(x / (CELL_SIZE + GAP))
  const row = Math.round(y / (CELL_SIZE + GAP))
  const targetIdx = Math.min(currentItems.length - 1, Math.max(0, row * COLS + col))

  if (targetIdx !== dragIdx) {
    engine.emit(Reorder, { fromIdx: dragIdx, toIdx: targetIdx })
  }
})

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function DraggableItem(props: { item: GridItem; index: number }) {
  const emit = useEmit()
  const isDragging = useSignal(draggingId)
  const dp = useSignal(dragPos)

  const pos = () => getPosition(props.index)
  const isActive = () => isDragging() === props.item.id

  // Use springs for position if available
  const sp = positionSprings.get(props.item.id)
  const springX = sp ? useSpring(sp.x) : () => pos().x
  const springY = sp ? useSpring(sp.y) : () => pos().y

  const x = () => isActive() ? dp().x : springX()
  const y = () => isActive() ? dp().y : springY()

  let startPos = { x: 0, y: 0 }
  let offsetX = 0
  let offsetY = 0

  const onPointerDown = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect()
    offsetX = e.clientX - rect.left - pos().x
    offsetY = e.clientY - rect.top - pos().y
    startPos = { x: e.clientX - rect.left - offsetX, y: e.clientY - rect.top - offsetY }

    emit(DragItemStart, props.item.id)
    emit(DragItemMove, { id: props.item.id, x: startPos.x, y: startPos.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      const rx = ev.clientX - rect.left - offsetX
      const ry = ev.clientY - rect.top - offsetY
      emit(DragItemMove, { id: props.item.id, x: rx, y: ry })
    }
    const up = () => {
      emit(DragItemEnd, props.item.id)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: `${x()}px`,
        top: `${y()}px`,
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
        background: `linear-gradient(135deg, ${props.item.color}cc, ${props.item.color}66)`,
        'border-radius': '16px',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '8px',
        cursor: isActive() ? 'grabbing' : 'grab',
        'z-index': isActive() ? '100' : '1',
        'box-shadow': isActive()
          ? `0 12px 40px ${props.item.color}44`
          : `0 4px 12px rgba(0,0,0,0.3)`,
        transform: isActive() ? 'scale(1.05)' : 'scale(1)',
        opacity: isActive() ? '0.9' : '1',
        transition: isActive() ? 'none' : 'box-shadow 0.2s, transform 0.2s',
        'user-select': 'none',
        border: `1px solid ${props.item.color}88`,
      }}
    >
      <div style={{ 'font-size': '28px', 'font-weight': '700', color: '#fff' }}>
        {props.item.label.split(' ')[1]}
      </div>
      <div style={{ 'font-size': '11px', color: 'rgba(255,255,255,0.7)', 'text-transform': 'uppercase', 'letter-spacing': '1px' }}>
        {props.item.label}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); emit(RemoveItem, props.item.id) }}
        style={{
          position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.3)',
          border: 'none', color: '#fff', width: '20px', height: '20px', 'border-radius': '50%',
          cursor: 'pointer', 'font-size': '10px', display: 'flex', 'align-items': 'center', 'justify-content': 'center',
        }}
      >\u2715</button>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const allItems = useSignal(items)

  // Initialize springs
  onMount(() => {
    allItems().forEach((item, idx) => {
      const pos = getPosition(idx)
      ensureSpring(item.id, pos.x, pos.y)
    })
  })

  const gridWidth = () => COLS * (CELL_SIZE + GAP) - GAP
  const gridHeight = () => Math.ceil(allItems().length / COLS) * (CELL_SIZE + GAP) - GAP

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px', 'margin-bottom': '24px' }}>
        Sortable Grid
      </h1>

      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '32px' }}>
        <button
          onClick={() => emit(ShuffleItems, undefined)}
          style={{ padding: '10px 24px', 'border-radius': '8px', border: 'none', background: '#6c5ce7', color: '#fff', cursor: 'pointer', 'font-size': '14px', 'font-weight': '500' }}
        >Shuffle</button>
        <button
          onClick={() => { emit(AddItem, undefined); const newItem = items.value[items.value.length - 1]; if (newItem) { const pos = getPosition(items.value.length - 1); ensureSpring(newItem.id, pos.x, pos.y) } }}
          style={{ padding: '10px 24px', 'border-radius': '8px', border: 'none', background: '#00b894', color: '#fff', cursor: 'pointer', 'font-size': '14px', 'font-weight': '500' }}
        >+ Add Item</button>
      </div>

      <div style={{
        position: 'relative', width: `${gridWidth()}px`, height: `${gridHeight() + 20}px`,
      }}>
        <For each={allItems()}>
          {(item, i) => <DraggableItem item={item} index={i()} />}
        </For>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', 'font-size': '13px', 'margin-top': '32px' }}>
        Drag items to reorder &middot; Spring-animated positions &middot; {allItems().length} items
      </p>
    </div>
  )
}
