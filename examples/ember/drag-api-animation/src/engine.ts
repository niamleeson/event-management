import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

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
  column: ColumnId
}

export interface MovePayload {
  cardId: string
  fromColumn: ColumnId
  toColumn: ColumnId
}

export interface DragState {
  cardId: string | null
  offsetX: number
  offsetY: number
}

export interface SaveResult {
  cardId: string
  success: boolean
}

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const CardMoved = engine.event<MovePayload>('CardMoved')
export const DragStarted = engine.event<{ cardId: string; x: number; y: number }>('DragStarted')
export const DragUpdated = engine.event<{ x: number; y: number }>('DragUpdated')
export const DragEnded = engine.event<void>('DragEnded')
export const SavePending = engine.event<MovePayload>('SavePending')
export const SaveDone = engine.event<SaveResult>('SaveDone')
export const SaveError = engine.event<Error>('SaveError')
export const UndoRequested = engine.event<void>('UndoRequested')
export const ShakeStart = engine.event<void>('ShakeStart')
export const ShakeDone = engine.event<void>('ShakeDone')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Board state: list of cards in their columns
const INITIAL_CARDS: KanbanCard[] = [
  { id: '1', title: 'Design mockups', column: 'todo' },
  { id: '2', title: 'Set up CI/CD', column: 'todo' },
  { id: '3', title: 'Write API specs', column: 'in-progress' },
  { id: '4', title: 'Code review', column: 'in-progress' },
  { id: '5', title: 'Deploy staging', column: 'done' },
]

export const boardCards = engine.signal<KanbanCard[]>(
  CardMoved,
  INITIAL_CARDS,
  (prev, move) =>
    prev.map((c) =>
      c.id === move.cardId ? { ...c, column: move.toColumn } : c,
    ),
)

// Undo: revert the last move
const moveHistory: MovePayload[] = []

engine.on(CardMoved, (move) => {
  moveHistory.push(move)
})

engine.on(UndoRequested, () => {
  const lastMove = moveHistory.pop()
  if (lastMove) {
    engine.emit(CardMoved, {
      cardId: lastMove.cardId,
      fromColumn: lastMove.toColumn,
      toColumn: lastMove.fromColumn,
    })
    // Remove the undo move from history so it doesn't stack
    moveHistory.pop()
  }
})

// Drag position (raw pointer)
export const dragPosition = engine.signal<{ x: number; y: number }>(
  DragUpdated,
  { x: 0, y: 0 },
  (_prev, pos) => pos,
)

// Currently dragging card
export const dragState = engine.signal<DragState>(
  DragStarted,
  { cardId: null, offsetX: 0, offsetY: 0 },
  (_prev, { cardId, x, y }) => ({ cardId, offsetX: x, offsetY: y }),
)

engine.signalUpdate(dragState, DragEnded, () => ({
  cardId: null,
  offsetX: 0,
  offsetY: 0,
}))

// Saving state
export const isSaving = engine.signal<boolean>(
  SavePending,
  false,
  () => true,
)
engine.signalUpdate(isSaving, SaveDone, () => false)
engine.signalUpdate(isSaving, SaveError, () => false)

// Save error
export const saveError = engine.signal<string | null>(
  SaveError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(saveError, SaveDone, () => null)
engine.signalUpdate(saveError, CardMoved, () => null)

// Can undo
export const canUndo = engine.signal<boolean>(
  CardMoved,
  false,
  () => moveHistory.length > 0,
)
engine.signalUpdate(canUndo, UndoRequested, () => moveHistory.length > 0)

// ---------------------------------------------------------------------------
// Spring: drag position follows pointer with physics
// ---------------------------------------------------------------------------

const dragPosX = engine.signal<number>(DragUpdated, 0, (_prev, pos) => pos.x)
engine.signalUpdate(dragPosX, DragStarted, (_prev, info) => info.x)

const dragPosY = engine.signal<number>(DragUpdated, 0, (_prev, pos) => pos.y)
engine.signalUpdate(dragPosY, DragStarted, (_prev, info) => info.y)

export const dragSpringX = engine.spring(dragPosX, {
  stiffness: 300,
  damping: 25,
  restThreshold: 0.5,
})

export const dragSpringY = engine.spring(dragPosY, {
  stiffness: 300,
  damping: 25,
  restThreshold: 0.5,
})

// ---------------------------------------------------------------------------
// Tween: error shake animation
// ---------------------------------------------------------------------------

export const shakeTween = engine.tween({
  start: ShakeStart,
  done: ShakeDone,
  from: 0,
  to: 1,
  duration: 500,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Async: save card move to "server"
// ---------------------------------------------------------------------------

engine.async(CardMoved, {
  pending: SavePending,
  done: SaveDone,
  error: SaveError,
  strategy: 'latest',
  do: async (move: MovePayload, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 600)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    // Simulate occasional save failures
    if (Math.random() < 0.15) {
      throw new Error('Failed to save card position')
    }

    return { cardId: move.cardId, success: true }
  },
})

// Trigger shake on save error
engine.pipe(SaveError, ShakeStart, () => undefined)

// ---------------------------------------------------------------------------
// Start the frame loop for spring and tween updates
// ---------------------------------------------------------------------------

engine.startFrameLoop()

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)
