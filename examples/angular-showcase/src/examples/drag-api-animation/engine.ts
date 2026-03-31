import { createEngine } from '@pulse/core'

export const engine = createEngine()

// Types
export type ColumnId = 'todo' | 'in-progress' | 'done'
export interface KanbanCard { id: string; title: string; description: string; column: ColumnId; priority: 'low' | 'medium' | 'high' }
export interface DragInfo { cardId: string; startX: number; startY: number; offsetX: number; offsetY: number }
export interface DragMoveInfo { x: number; y: number }
export interface MoveInfo { cardId: string; fromColumn: ColumnId; toColumn: ColumnId }
export interface SaveResult { cardId: string; success: boolean }
export type CardStatus = 'idle' | 'saving' | 'saved' | 'error' | 'settled'

const INITIAL_CARDS: KanbanCard[] = [
  { id: 'card-1', title: 'Design system audit', description: 'Review and update component library', column: 'todo', priority: 'high' },
  { id: 'card-2', title: 'API rate limiting', description: 'Implement rate limiting middleware', column: 'todo', priority: 'medium' },
  { id: 'card-3', title: 'User onboarding flow', description: 'Create multi-step wizard', column: 'todo', priority: 'low' },
  { id: 'card-4', title: 'Database migration', description: 'Migrate user table schema', column: 'in-progress', priority: 'high' },
  { id: 'card-5', title: 'Search indexing', description: 'Set up Elasticsearch pipeline', column: 'in-progress', priority: 'medium' },
  { id: 'card-6', title: 'CI/CD pipeline', description: 'Configure GitHub Actions', column: 'done', priority: 'low' },
]

// Events
export const DragStart = engine.event<DragInfo>('DragStart')
export const DragMove = engine.event<DragMoveInfo>('DragMove')
export const DragEnd = engine.event<void>('DragEnd')
export const CardMoved = engine.event<MoveInfo>('CardMoved')
export const UndoRequested = engine.event<string>('UndoRequested')

// State events
export const CardsChanged = engine.event<KanbanCard[]>('CardsChanged')
export const DragStateChanged = engine.event<DragInfo | null>('DragStateChanged')
export const DragPositionChanged = engine.event<{ x: number; y: number }>('DragPositionChanged')
export const CardStatusesChanged = engine.event<Record<string, CardStatus>>('CardStatusesChanged')

// State
let cards = [...INITIAL_CARDS]
let dragInfo: DragInfo | null = null
let cardStatuses: Record<string, CardStatus> = {}
const undoHistory = new Map<string, MoveInfo>()

engine.on(DragStart, (info) => {
  dragInfo = info
  engine.emit(DragStateChanged, info)
  engine.emit(DragPositionChanged, { x: info.startX, y: info.startY })
})

engine.on(DragMove, (pos) => {
  engine.emit(DragPositionChanged, pos)
})

engine.on(DragEnd, () => {
  dragInfo = null
  engine.emit(DragStateChanged, null)
})

engine.on(CardMoved, async (move) => {
  cards = cards.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c))
  engine.emit(CardsChanged, cards)
  undoHistory.set(move.cardId, move)

  // Save with mock API
  cardStatuses = { ...cardStatuses, [move.cardId]: 'saving' }
  engine.emit(CardStatusesChanged, cardStatuses)

  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))

  if (Math.random() < 0.3) {
    cardStatuses = { ...cardStatuses, [move.cardId]: 'error' }
    engine.emit(CardStatusesChanged, cardStatuses)
    // Auto-retry after 2s
    setTimeout(() => {
      const card = cards.find((c) => c.id === move.cardId)
      if (card) engine.emit(CardMoved, { cardId: move.cardId, fromColumn: card.column, toColumn: card.column })
    }, 2000)
  } else {
    cardStatuses = { ...cardStatuses, [move.cardId]: 'saved' }
    engine.emit(CardStatusesChanged, cardStatuses)
    setTimeout(() => {
      cardStatuses = { ...cardStatuses, [move.cardId]: 'settled' }
      engine.emit(CardStatusesChanged, cardStatuses)
    }, 600)
  }
})

engine.on(UndoRequested, (cardId) => {
  const lastMove = undoHistory.get(cardId)
  if (lastMove) {
    undoHistory.delete(cardId)
    const reverseMove: MoveInfo = { cardId, fromColumn: lastMove.toColumn, toColumn: lastMove.fromColumn }
    cards = cards.map((c) => (c.id === cardId ? { ...c, column: reverseMove.toColumn } : c))
    engine.emit(CardsChanged, cards)
    engine.emit(CardMoved, reverseMove)
  }
})
