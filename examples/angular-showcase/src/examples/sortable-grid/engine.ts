import { createEngine, type SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridItem {
  id: string
  label: string
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COLS = 4

const INITIAL_ITEMS: GridItem[] = [
  { id: 'a', label: 'Alpha', color: '#4361ee' },
  { id: 'b', label: 'Beta', color: '#7209b7' },
  { id: 'c', label: 'Gamma', color: '#f72585' },
  { id: 'd', label: 'Delta', color: '#4cc9f0' },
  { id: 'e', label: 'Epsilon', color: '#2a9d8f' },
  { id: 'f', label: 'Zeta', color: '#e76f51' },
  { id: 'g', label: 'Eta', color: '#06d6a0' },
  { id: 'h', label: 'Theta', color: '#ffd166' },
]

const CELL_SIZE = 120
const GAP = 12

let nextId = INITIAL_ITEMS.length

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const Reorder = engine.event<{ fromIndex: number; toIndex: number }>('Reorder')
export const Shuffle = engine.event<void>('Shuffle')
export const AddItem = engine.event<void>('AddItem')
export const RemoveItem = engine.event<string>('RemoveItem')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const items = engine.signal<GridItem[]>(
  Reorder,
  INITIAL_ITEMS,
  (prev, { fromIndex, toIndex }) => {
    const result = [...prev]
    const [moved] = result.splice(fromIndex, 1)
    result.splice(toIndex, 0, moved)
    return result
  },
)

engine.signalUpdate(items, Shuffle, (prev) => {
  const shuffled = [...prev]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
})

const NEW_COLORS = ['#8338ec', '#fb5607', '#ff006e', '#3a86a7', '#ffbe0b']

engine.signalUpdate(items, AddItem, (prev) => {
  const id = String.fromCharCode(97 + nextId)
  nextId++
  return [...prev, {
    id,
    label: `Item ${id.toUpperCase()}`,
    color: NEW_COLORS[prev.length % NEW_COLORS.length],
  }]
})

engine.signalUpdate(items, RemoveItem, (prev, id) =>
  prev.filter((item) => item.id !== id),
)

// ---------------------------------------------------------------------------
// Spring positions: each item has X and Y spring tracking its grid position
// ---------------------------------------------------------------------------

export function getGridPosition(index: number): { x: number; y: number } {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return {
    x: col * (CELL_SIZE + GAP),
    y: row * (CELL_SIZE + GAP),
  }
}

// We track target positions as signals and use springs
// Since item count can change, we use a simpler approach:
// compute positions reactively based on current items signal

export { CELL_SIZE, GAP }

// Start frame loop
engine.startFrameLoop()
