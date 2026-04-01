// DAG
// Reorder ──→ ItemsChanged
// Shuffle ──→ ItemsChanged
// AddItem ──→ ItemsChanged
// RemoveItem ──→ ItemsChanged

import { createEngine } from '@pulse/core'

export const engine = createEngine()
export interface GridItem { id: string; label: string; color: string }
export const COLS = 4
const CELL_SIZE = 120, GAP = 12
let nextId = 8
const INITIAL_ITEMS: GridItem[] = [
  { id: 'a', label: 'Alpha', color: '#4361ee' }, { id: 'b', label: 'Beta', color: '#7209b7' },
  { id: 'c', label: 'Gamma', color: '#f72585' }, { id: 'd', label: 'Delta', color: '#4cc9f0' },
  { id: 'e', label: 'Epsilon', color: '#2a9d8f' }, { id: 'f', label: 'Zeta', color: '#e76f51' },
  { id: 'g', label: 'Eta', color: '#06d6a0' }, { id: 'h', label: 'Theta', color: '#ffd166' },
]
export const Reorder = engine.event<{ fromIndex: number; toIndex: number }>('Reorder')
export const Shuffle = engine.event<void>('Shuffle')
export const AddItem = engine.event<void>('AddItem')
export const RemoveItem = engine.event<string>('RemoveItem')
export const ItemsChanged = engine.event<GridItem[]>('ItemsChanged')
let items = [...INITIAL_ITEMS]
const NEW_COLORS = ['#8338ec', '#fb5607', '#ff006e', '#3a86a7', '#ffbe0b']

engine.on(Reorder, [ItemsChanged], ({ fromIndex, toIndex }, setItems) => { const r = [...items]; const [m] = r.splice(fromIndex, 1); r.splice(toIndex, 0, m); items = r; setItems(items) })
engine.on(Shuffle, [ItemsChanged], (_payload, setItems) => { const s = [...items]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]] }; items = s; setItems(items) })
engine.on(AddItem, [ItemsChanged], (_payload, setItems) => { const id = String.fromCharCode(97 + nextId); nextId++; items = [...items, { id, label: 'Item ' + id.toUpperCase(), color: NEW_COLORS[items.length % NEW_COLORS.length] }]; setItems(items) })
engine.on(RemoveItem, [ItemsChanged], (id, setItems) => { items = items.filter((i) => i.id !== id); setItems(items) })
export function getGridPosition(index: number): { x: number; y: number } { return { x: (index % COLS) * (CELL_SIZE + GAP), y: Math.floor(index / COLS) * (CELL_SIZE + GAP) } }
export { CELL_SIZE, GAP }

export function startLoop() {}
export function stopLoop() {}
