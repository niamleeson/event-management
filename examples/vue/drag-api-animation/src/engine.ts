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

export interface DropInfo {
  cardId: string
  targetColumn: ColumnId
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
export const DropTarget = engine.event<DropInfo>('DropTarget')
export const CardMoved = engine.event<MoveInfo>('CardMoved')
export const SavePending = engine.event<string>('SavePending')
export const SaveDone = engine.event<SaveResult>('SaveDone')
export const SaveError = engine.event<SaveResult>('SaveError')
export const SaveRetry = engine.event<string>('SaveRetry')
export const AnimationComplete = engine.event<string>('AnimationComplete')
export const CardSettled = engine.event<string>('CardSettled')
export const UndoRequested = engine.event<string>('UndoRequested')
export const UndoComplete = engine.event<MoveInfo>('UndoComplete')

// Status animation events
export const FlashSuccess = engine.event<string>('FlashSuccess')
export const FlashSuccessDone = engine.event<string>('FlashSuccessDone')
export const ShakeError = engine.event<string>('ShakeError')
export const ShakeErrorDone = engine.event<string>('ShakeErrorDone')

// ---------------------------------------------------------------------------
// State-changed events
// ---------------------------------------------------------------------------

export const CardsChanged = engine.event<KanbanCard[]>('CardsChanged')
export const DragStateChanged = engine.event<DragInfo | null>('DragStateChanged')
export const DragPositionChanged = engine.event<{ x: number; y: number }>('DragPositionChanged')
export const CardStatusesChanged = engine.event<Record<string, CardStatus>>('CardStatusesChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cards = INITIAL_CARDS
let dragState: DragInfo | null = null
let dragPosition = { x: 0, y: 0 }
let cardStatuses: Record<string, CardStatus> = {}

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

// CardMoved triggers async save
engine.on(CardMoved, (move) => {
  engine.emit(SavePending, move.cardId)
})

// SaveDone -> success flash animation
engine.on(SaveDone, (result) => {
  engine.emit(FlashSuccess, result.cardId)
})

// SaveError -> error shake animation
engine.on(SaveError, (result) => {
  engine.emit(ShakeError, result.cardId)
})

// SaveError -> auto-retry after 2s
engine.on(SaveError, (result: SaveResult) => {
  setTimeout(() => {
    engine.emit(SaveRetry, result.cardId)
  }, 2000)
})

// ---------------------------------------------------------------------------
// Async: save card move to API (mock with random failures)
// ---------------------------------------------------------------------------

{
  let _aa: AbortController | null = null
  engine.on(CardMoved, async (move: MoveInfo) => {
    if (_aa) _aa.abort()
    _aa = new AbortController()
    const signal = _aa.signal
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 800 + Math.random() * 400)
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
      // 30% chance of failure for demo purposes
      if (Math.random() < 0.3) {
        throw { cardId: move.cardId, success: false } as SaveResult
      }
      engine.emit(SaveDone, { cardId: move.cardId, success: true })
    } catch (e: any) {
      if (e?.name !== 'AbortError') engine.emit(SaveError, e)
    }
  })
}

// Retry save: re-emit the move for the card that failed
engine.on(SaveRetry, (cardId) => {
  const card = cards.find((c) => c.id === cardId)
  if (card) {
    engine.emit(CardMoved, { cardId, fromColumn: card.column, toColumn: card.column })
  }
})

// ---------------------------------------------------------------------------
// Join: [SaveDone, FlashSuccessDone] -> CardSettled
// ---------------------------------------------------------------------------

{
  const received = new Set<number>()
  let lastSaveResult: SaveResult | null = null
  engine.on(SaveDone, (result) => {
    lastSaveResult = result
    received.add(0)
    if (received.size === 2) {
      received.clear()
      engine.emit(CardSettled, lastSaveResult!.cardId)
    }
  })
  engine.on(FlashSuccessDone, () => {
    received.add(1)
    if (received.size === 2) {
      received.clear()
      engine.emit(CardSettled, lastSaveResult?.cardId ?? '')
    }
  })
}

// ---------------------------------------------------------------------------
// Undo: reverse a move
// ---------------------------------------------------------------------------

const undoHistory = new Map<string, MoveInfo>()

engine.on(CardMoved, (move: MoveInfo) => {
  undoHistory.set(move.cardId, move)
})

engine.on(UndoRequested, (cardId: string) => {
  const lastMove = undoHistory.get(cardId)
  if (lastMove) {
    const reverseMove: MoveInfo = {
      cardId,
      fromColumn: lastMove.toColumn,
      toColumn: lastMove.fromColumn,
    }
    undoHistory.delete(cardId)
    engine.emit(UndoComplete, reverseMove)
    engine.emit(CardMoved, reverseMove)
  }
})

// ---------------------------------------------------------------------------
// State reducers
// ---------------------------------------------------------------------------

// Cards state
engine.on(CardMoved, (move) => {
  cards = cards.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c))
  engine.emit(CardsChanged, cards)
})
engine.on(UndoComplete, (move) => {
  cards = cards.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c))
  engine.emit(CardsChanged, cards)
})

// Drag state
engine.on(DragStart, (info) => {
  dragState = info
  engine.emit(DragStateChanged, dragState)
})
engine.on(DragEnd, () => {
  dragState = null
  engine.emit(DragStateChanged, dragState)
})

// Drag position
engine.on(DragMove, (pos) => {
  dragPosition = pos
  engine.emit(DragPositionChanged, dragPosition)
})
engine.on(DragStart, (info) => {
  dragPosition = { x: info.startX, y: info.startY }
  engine.emit(DragPositionChanged, dragPosition)
})

// Card statuses
engine.on(SavePending, (cardId) => {
  cardStatuses = { ...cardStatuses, [cardId]: 'saving' as CardStatus }
  engine.emit(CardStatusesChanged, cardStatuses)
})
engine.on(SaveDone, (result) => {
  cardStatuses = { ...cardStatuses, [result.cardId]: 'saved' as CardStatus }
  engine.emit(CardStatusesChanged, cardStatuses)
})
engine.on(SaveError, (result) => {
  cardStatuses = { ...cardStatuses, [result.cardId]: 'error' as CardStatus }
  engine.emit(CardStatusesChanged, cardStatuses)
})
engine.on(CardSettled, (cardId) => {
  cardStatuses = { ...cardStatuses, [cardId]: 'settled' as CardStatus }
  engine.emit(CardStatusesChanged, cardStatuses)
})

// ---------------------------------------------------------------------------
// Initial values
// ---------------------------------------------------------------------------

export function getCards() { return cards }
export function getDragState() { return dragState }
export function getDragPosition() { return dragPosition }
export function getCardStatuses() { return cardStatuses }
