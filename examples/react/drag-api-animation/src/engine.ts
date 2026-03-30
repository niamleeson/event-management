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

// Coalesce DragMove events to reduce processing (batches to next frame tick)
const DragMoveCoalesced = engine.event<DragMoveInfo>('DragMoveCoalesced')
engine.coalesce(DragMove, DragMoveCoalesced)
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
// Pipes
// ---------------------------------------------------------------------------

// DragEnd checks the last known position to determine drop target column
// We handle this in the UI layer since it needs DOM measurements

// CardMoved triggers async save
engine.pipe(CardMoved, SavePending, (move: MoveInfo) => move.cardId)

// SaveDone -> success flash animation
engine.pipe(SaveDone, FlashSuccess, (result: SaveResult) => result.cardId)

// SaveError -> error shake animation + auto-retry after 2s
engine.on(SaveError, (result: SaveResult) => {
  engine.emit(ShakeError, result.cardId)
  // Auto-retry after 2 seconds
  setTimeout(() => {
    engine.emit(SaveRetry, result.cardId)
  }, 2000)
})

// ---------------------------------------------------------------------------
// Async: save card move to API (mock with random failures)
// ---------------------------------------------------------------------------

engine.async(CardMoved, {
  pending: null,
  done: SaveDone,
  error: SaveError,
  strategy: 'latest',
  do: async (move: MoveInfo, { signal }) => {
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
    return { cardId: move.cardId, success: true }
  },
})

// Retry save: re-emit the move for the card that failed
engine.on(SaveRetry, (cardId: string) => {
  const card = cards.value.find((c) => c.id === cardId)
  if (card) {
    engine.emit(CardMoved, {
      cardId,
      fromColumn: card.column,
      toColumn: card.column,
    })
  }
})

// ---------------------------------------------------------------------------
// Join: [SaveDone, AnimationComplete] -> CardSettled
// Card is fully settled only after both save completes AND animation finishes
// ---------------------------------------------------------------------------

engine.join([SaveDone, FlashSuccessDone], CardSettled, {
  do: (saveResult: SaveResult) => saveResult.cardId,
})

// ---------------------------------------------------------------------------
// Undo: reverse a move
// ---------------------------------------------------------------------------

// Track previous positions for undo
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
    // The signal update for UndoComplete will move the card back
    // Then trigger a new save
    engine.emit(CardMoved, reverseMove)
  }
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const cards = engine.signal<KanbanCard[]>(
  CardMoved,
  INITIAL_CARDS,
  (prev, move) =>
    prev.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c)),
)

// Also handle undo reversals
engine.signalUpdate(cards, UndoComplete, (prev, move) =>
  prev.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c)),
)

// Drag state
export const dragState = engine.signal<DragInfo | null>(
  DragStart,
  null,
  (_prev, info) => info,
)
engine.signalUpdate(dragState, DragEnd, () => null)

// Drag position (uses coalesced DragMove for reduced update frequency)
export const dragPosition = engine.signal<{ x: number; y: number }>(
  DragMoveCoalesced,
  { x: 0, y: 0 },
  (_prev, pos) => pos,
)
engine.signalUpdate(dragPosition, DragStart, (_prev, info) => ({
  x: info.startX,
  y: info.startY,
}))

// Card statuses
export const cardStatuses = engine.signal<Record<string, CardStatus>>(
  SavePending,
  {},
  (prev, cardId) => ({ ...prev, [cardId]: 'saving' as CardStatus }),
)
engine.signalUpdate(cardStatuses, SaveDone, (prev, result) => ({
  ...prev,
  [result.cardId]: 'saved' as CardStatus,
}))
engine.signalUpdate(cardStatuses, SaveError, (prev, result) => ({
  ...prev,
  [result.cardId]: 'error' as CardStatus,
}))
engine.signalUpdate(cardStatuses, CardSettled, (prev, cardId) => ({
  ...prev,
  [cardId]: 'settled' as CardStatus,
}))

// Spring-driven drag position for smooth feel (uses coalesced events)
export const dragSpringX = engine.spring(
  (() => {
    const sig = engine.signal<number>(DragMoveCoalesced, 0, (_prev, pos) => pos.x)
    engine.signalUpdate(sig, DragStart, (_prev, info) => info.startX)
    return sig
  })(),
  { stiffness: 400, damping: 25, restThreshold: 0.5 },
)

export const dragSpringY = engine.spring(
  (() => {
    const sig = engine.signal<number>(DragMoveCoalesced, 0, (_prev, pos) => pos.y)
    engine.signalUpdate(sig, DragStart, (_prev, info) => info.startY)
    return sig
  })(),
  { stiffness: 400, damping: 25, restThreshold: 0.5 },
)

// Start frame loop for spring animations
engine.startFrameLoop()
