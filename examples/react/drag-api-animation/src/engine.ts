import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface KanbanCard {
  id: string
  title: string
  description: string
  column: ColumnId
  priority: 'low' | 'medium' | 'high'
}

export interface DragInfo {
  cardId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

export interface DragMoveInfo {
  x: number
  y: number
}

export interface MoveInfo {
  cardId: string
  fromColumn: ColumnId
  toColumn: ColumnId
}

export interface SaveResult {
  cardId: string
  success: boolean
}

export type CardStatus = 'idle' | 'saving' | 'saved' | 'error' | 'settled'

// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------

const INITIAL_CARDS: KanbanCard[] = [
  { id: 'card-1', title: 'Design system audit', description: 'Review and update component library', column: 'todo', priority: 'high' },
  { id: 'card-2', title: 'API rate limiting', description: 'Implement rate limiting middleware', column: 'todo', priority: 'medium' },
  { id: 'card-3', title: 'User onboarding flow', description: 'Create multi-step wizard', column: 'todo', priority: 'low' },
  { id: 'card-4', title: 'Database migration', description: 'Migrate user table schema', column: 'in-progress', priority: 'high' },
  { id: 'card-5', title: 'Search indexing', description: 'Set up Elasticsearch pipeline', column: 'in-progress', priority: 'medium' },
  { id: 'card-6', title: 'CI/CD pipeline', description: 'Configure GitHub Actions', column: 'done', priority: 'low' },
]

// ---------------------------------------------------------------------------
// DAG (4 levels deep)
// ---------------------------------------------------------------------------
// DragStart ──→ DragStateChanged ──→ DragPositionChanged
// DragEnd ──→ DragStateChanged
// DragMove (updates target position for spring physics)
//
// CardMoved ──→ CardsChanged ──→ CardStatusesChanged (saving)
//                                    └──→ CardStatusesChanged (saved/error → settled)
//
// UndoRequested ──→ CardMoved (re-emits)
// Frame ──→ DragPositionChanged (spring physics)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const DragStart = engine.event<DragInfo>('DragStart')
export const DragMove = engine.event<DragMoveInfo>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const CardMoved = engine.event<MoveInfo>('CardMoved')
export const UndoRequested = engine.event<string>('UndoRequested')
export const Frame = engine.event<number>('Frame')

// Layer 1: Primary state events
export const DragStateChanged = engine.event<DragInfo | null>('DragStateChanged')
export const CardsChanged = engine.event<KanbanCard[]>('CardsChanged')

// Layer 2: Derived state events (from drag state / cards)
export const DragPositionChanged = engine.event<{ x: number; y: number }>('DragPositionChanged')

// Layer 3: Async-derived state (from cards save operation)
export const CardStatusesChanged = engine.event<Record<string, CardStatus>>('CardStatusesChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cards = [...INITIAL_CARDS]
let dragState: DragInfo | null = null
let dragPos = { x: 0, y: 0 }
let springX = 0, springY = 0, springVelX = 0, springVelY = 0
let cardStatuses: Record<string, CardStatus> = {}
const undoHistory = new Map<string, MoveInfo>()

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(DragStart, [DragStateChanged], (info, setDragState) => {
  dragState = info
  dragPos = { x: info.startX, y: info.startY }
  springX = info.startX
  springY = info.startY
  springVelX = 0
  springVelY = 0
  setDragState(dragState)
})

engine.on(DragMove, (pos) => {
  dragPos = pos
})

engine.on(DragEnd, [DragStateChanged], (_, setDragState) => {
  dragState = null
  setDragState(null)
})

engine.on(CardMoved, [CardsChanged], (move, setCards) => {
  cards = cards.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c))
  setCards([...cards])
  undoHistory.set(move.cardId, move)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → derived state
// ---------------------------------------------------------------------------

// DragStateChanged → DragPositionChanged (initial position from drag start)
engine.on(DragStateChanged, [DragPositionChanged], (state, setDragPos) => {
  if (state) {
    setDragPos({ x: state.startX, y: state.startY })
  }
})

// CardsChanged → CardStatusesChanged (trigger async save)
engine.on(CardsChanged, [CardStatusesChanged], async (_cards, setStatuses) => {
  // Find cards that were just moved (check undoHistory for recent moves)
  const recentMoves = Array.from(undoHistory.entries())
  if (recentMoves.length === 0) return

  const lastMove = recentMoves[recentMoves.length - 1]
  const cardId = lastMove[0]

  // Update status to saving
  cardStatuses = { ...cardStatuses, [cardId]: 'saving' as CardStatus }
  setStatuses({ ...cardStatuses })

  // Mock async save
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

  // 30% chance of failure
  if (Math.random() < 0.3) {
    cardStatuses = { ...cardStatuses, [cardId]: 'error' as CardStatus }
    setStatuses({ ...cardStatuses })
    // Auto-retry after 2 seconds
    setTimeout(() => {
      const card = cards.find((c) => c.id === cardId)
      if (card) {
        engine.emit(CardMoved, { cardId, fromColumn: card.column, toColumn: card.column })
      }
    }, 2000)
  } else {
    cardStatuses = { ...cardStatuses, [cardId]: 'saved' as CardStatus }
    setStatuses({ ...cardStatuses })
    // Settle after animation
    setTimeout(() => {
      cardStatuses = { ...cardStatuses, [cardId]: 'settled' as CardStatus }
      engine.emit(CardStatusesChanged, { ...cardStatuses })
    }, 600)
  }
})

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

engine.on(UndoRequested, [CardMoved], (cardId, cardMoved) => {
  const lastMove = undoHistory.get(cardId)
  if (lastMove) {
    undoHistory.delete(cardId)
    cardMoved({
      cardId,
      fromColumn: lastMove.toColumn,
      toColumn: lastMove.fromColumn,
    })
  }
})

// ---------------------------------------------------------------------------
// Frame loop: spring physics for drag ghost (Layer 0 → Layer 2)
// ---------------------------------------------------------------------------

engine.on(Frame, [DragPositionChanged], (_, setDragPos) => {
  if (!dragState) return

  const dx = dragPos.x - springX
  const dy = dragPos.y - springY
  springVelX += dx * 0.2
  springVelY += dy * 0.2
  springVelX *= 0.7
  springVelY *= 0.7
  springX += springVelX
  springY += springVelY

  setDragPos({ x: springX, y: springY })
})

// Start frame loop
let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}

// Emit initial state
engine.emit(CardsChanged, [...cards])
