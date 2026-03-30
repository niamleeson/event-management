import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal, SpringValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface KanbanCard {
  id: number
  title: string
  column: ColumnId
}

export interface MovePayload {
  cardId: number
  toColumn: ColumnId
}

export interface SaveResult {
  success: boolean
  cardId: number
  column: ColumnId
}

export interface DragState {
  cardId: number | null
  offsetX: number
  offsetY: number
}

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

export const CardDragStart: EventType<{ cardId: number; offsetX: number; offsetY: number }> =
  engine.event('CardDragStart')
export const CardDragEnd: EventType<{ cardId: number; toColumn: ColumnId }> =
  engine.event('CardDragEnd')
export const CardMoved: EventType<MovePayload> = engine.event('CardMoved')
export const SavePending: EventType<MovePayload> = engine.event('SavePending')
export const SaveDone: EventType<SaveResult> = engine.event('SaveDone')
export const SaveError: EventType<Error> = engine.event('SaveError')
export const RetryLastSave: EventType<void> = engine.event('RetryLastSave')

// Spring target signal for animation (0 = resting, 1 = in-flight bounce)
export const SpringTarget: EventType<number> = engine.event('SpringTarget')

// ---------------------------------------------------------------------------
// Process card move
// ---------------------------------------------------------------------------

engine.pipe(CardDragEnd, CardMoved, (payload) => ({
  cardId: payload.cardId,
  toColumn: payload.toColumn,
}))

// ---------------------------------------------------------------------------
// Mock API: save card move
// ---------------------------------------------------------------------------

let saveAttempt = 0

engine.async<MovePayload, SaveResult>(CardMoved, {
  pending: SavePending,
  done: SaveDone,
  error: SaveError,
  strategy: 'latest',
  do: async (payload, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 500 + Math.random() * 300)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    saveAttempt++
    // Fail every 3rd attempt to demonstrate retry
    if (saveAttempt % 3 === 0) {
      throw new Error('Network error: save failed. Try again.')
    }

    return { success: true, cardId: payload.cardId, column: payload.toColumn }
  },
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const initialCards: KanbanCard[] = [
  { id: 1, title: 'Design landing page', column: 'todo' },
  { id: 2, title: 'Set up CI/CD pipeline', column: 'todo' },
  { id: 3, title: 'Write API integration', column: 'in-progress' },
  { id: 4, title: 'Code review PR #42', column: 'in-progress' },
  { id: 5, title: 'Deploy v1.0', column: 'done' },
]

export const cardsSig: Signal<KanbanCard[]> = engine.signal<KanbanCard[]>(
  CardMoved,
  initialCards,
  (prev, move) =>
    prev.map((c) =>
      c.id === move.cardId ? { ...c, column: move.toColumn } : c,
    ),
)

export const savingSig: Signal<boolean> = engine.signal<boolean>(
  SavePending,
  false,
  () => true,
)
engine.signalUpdate(savingSig, SaveDone, () => false)
engine.signalUpdate(savingSig, SaveError, () => false)

export const saveErrorSig: Signal<string | null> = engine.signal<string | null>(
  SaveError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(saveErrorSig, SavePending, () => null)
engine.signalUpdate(saveErrorSig, SaveDone, () => null)

export const lastMoveSig: Signal<MovePayload | null> = engine.signal<MovePayload | null>(
  CardMoved,
  null,
  (_prev, move) => move,
)

export const dragStateSig: Signal<DragState> = engine.signal<DragState>(
  CardDragStart,
  { cardId: null, offsetX: 0, offsetY: 0 },
  (_prev, payload) => ({
    cardId: payload.cardId,
    offsetX: payload.offsetX,
    offsetY: payload.offsetY,
  }),
)
engine.signalUpdate(dragStateSig, CardDragEnd, () => ({
  cardId: null,
  offsetX: 0,
  offsetY: 0,
}))

// ---------------------------------------------------------------------------
// Spring animation for card snap-back
// ---------------------------------------------------------------------------

const springTargetSig: Signal<number> = engine.signal<number>(
  SpringTarget,
  0,
  (_prev, val) => val,
)

export const snapSpring: SpringValue = engine.spring(springTargetSig, {
  stiffness: 300,
  damping: 20,
  restThreshold: 0.01,
})

// Start frame loop for spring animation
engine.startFrameLoop()
