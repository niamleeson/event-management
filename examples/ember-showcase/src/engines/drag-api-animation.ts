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
// Event declarations
// ---------------------------------------------------------------------------

export const DragStart = engine.event<DragInfo>('DragStart')
export const DragMove = engine.event<DragMoveInfo>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const CardMoved = engine.event<MoveInfo>('CardMoved')
export const SavePending = engine.event<string>('SavePending')
export const SaveDone = engine.event<SaveResult>('SaveDone')
export const SaveError = engine.event<SaveResult>('SaveError')
export const UndoRequested = engine.event<string>('UndoRequested')
export const UndoComplete = engine.event<MoveInfo>('UndoComplete')
export const CardsChanged = engine.event<void>('CardsChanged')
export const StatusesChanged = engine.event<void>('StatusesChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _cards: KanbanCard[] = [...INITIAL_CARDS]
let _dragState: DragInfo | null = null
let _dragPosition = { x: 0, y: 0 }
let _cardStatuses: Record<string, CardStatus> = {}

// Spring-like smooth drag position
let _dragSpringX = 0
let _dragSpringY = 0

export function getCards(): KanbanCard[] { return _cards }
export function getDragState(): DragInfo | null { return _dragState }
export function getDragPosition() { return _dragPosition }
export function getCardStatuses(): Record<string, CardStatus> { return _cardStatuses }
export function getDragSpringX(): number { return _dragSpringX }
export function getDragSpringY(): number { return _dragSpringY }

// Undo history
const _undoHistory = new Map<string, MoveInfo>()

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(DragStart, (info: DragInfo) => {
  _dragState = info
  _dragPosition = { x: info.startX, y: info.startY }
  _dragSpringX = info.startX
  _dragSpringY = info.startY
  engine.emit(CardsChanged, undefined)
})

engine.on(DragMove, (pos: DragMoveInfo) => {
  _dragPosition = { x: pos.x, y: pos.y }
})

engine.on(DragEnd, () => {
  _dragState = null
  engine.emit(CardsChanged, undefined)
})

engine.on(CardMoved, (move: MoveInfo) => {
  _cards = _cards.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c))
  _undoHistory.set(move.cardId, move)
  _cardStatuses = { ..._cardStatuses, [move.cardId]: 'saving' }
  engine.emit(CardsChanged, undefined)
  engine.emit(StatusesChanged, undefined)

  // Async save with random failure
  const cardId = move.cardId
  setTimeout(() => {
    if (Math.random() < 0.3) {
      engine.emit(SaveError, { cardId, success: false })
    } else {
      engine.emit(SaveDone, { cardId, success: true })
    }
  }, 800 + Math.random() * 400)
})

engine.on(SaveDone, (result: SaveResult) => {
  _cardStatuses = { ..._cardStatuses, [result.cardId]: 'saved' }
  engine.emit(StatusesChanged, undefined)
  // Settle after flash
  setTimeout(() => {
    _cardStatuses = { ..._cardStatuses, [result.cardId]: 'settled' }
    engine.emit(StatusesChanged, undefined)
  }, 600)
})

engine.on(SaveError, (result: SaveResult) => {
  _cardStatuses = { ..._cardStatuses, [result.cardId]: 'error' }
  engine.emit(StatusesChanged, undefined)
  // Auto-retry after 2 seconds
  setTimeout(() => {
    const card = _cards.find((c) => c.id === result.cardId)
    if (card) {
      engine.emit(CardMoved, {
        cardId: result.cardId,
        fromColumn: card.column,
        toColumn: card.column,
      })
    }
  }, 2000)
})

engine.on(UndoRequested, (cardId: string) => {
  const lastMove = _undoHistory.get(cardId)
  if (lastMove) {
    const reverseMove: MoveInfo = {
      cardId,
      fromColumn: lastMove.toColumn,
      toColumn: lastMove.fromColumn,
    }
    _undoHistory.delete(cardId)
    _cards = _cards.map((c) => (c.id === cardId ? { ...c, column: reverseMove.toColumn } : c))
    engine.emit(CardsChanged, undefined)
    engine.emit(CardMoved, reverseMove)
  }
})

// ---------------------------------------------------------------------------
// Frame update (called from page via rAF)
// ---------------------------------------------------------------------------

export function updateFrame(): void {
  // Smooth drag spring
  if (_dragState) {
    _dragSpringX += (_dragPosition.x - _dragSpringX) * 0.3
    _dragSpringY += (_dragPosition.y - _dragSpringY) * 0.3
  }
}
