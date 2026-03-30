import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal, TrackedSpring, TrackedTween } from '@pulse/ember'
import {
  pulse,
  boardCards,
  dragState,
  dragPosition,
  isSaving,
  saveError,
  canUndo,
  dragSpringX,
  shakeTween,
  CardMoved,
  DragStarted,
  DragUpdated,
  DragEnded,
  UndoRequested,
  type KanbanCard,
  type ColumnId,
  type DragState,
} from './engine'

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

// ---------------------------------------------------------------------------
// KanbanApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class KanbanApp extends Component {
  cards: TrackedSignal<KanbanCard[]>
  drag: TrackedSignal<DragState>
  position: TrackedSignal<{ x: number; y: number }>
  saving: TrackedSignal<boolean>
  error: TrackedSignal<string | null>
  undoAvailable: TrackedSignal<boolean>
  springX: TrackedSpring
  shake: TrackedTween

  columns = COLUMNS

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    this.cards = pulse.createSignal(boardCards)
    this.drag = pulse.createSignal(dragState)
    this.position = pulse.createSignal(dragPosition)
    this.saving = pulse.createSignal(isSaving)
    this.error = pulse.createSignal(saveError)
    this.undoAvailable = pulse.createSignal(canUndo)
    this.springX = pulse.createSpring(dragSpringX)
    this.shake = pulse.createTween(shakeTween)
  }

  get isDragging(): boolean {
    return this.drag.value.cardId !== null
  }

  get shakeTransform(): string {
    if (!this.shake.active) return ''
    // Oscillating shake based on tween progress
    const t = this.shake.value
    const offset = Math.sin(t * Math.PI * 4) * (1 - t) * 8
    return `translateX(${offset}px)`
  }

  cardsForColumn(columnId: ColumnId): KanbanCard[] {
    return this.cards.value.filter((c) => c.column === columnId)
  }

  @action
  startDrag(cardId: string, event: MouseEvent): void {
    pulse.emit(DragStarted, {
      cardId,
      x: event.clientX,
      y: event.clientY,
    })

    const handleMove = (e: MouseEvent) => {
      pulse.emit(DragUpdated, { x: e.clientX, y: e.clientY })
    }

    const handleUp = () => {
      pulse.emit(DragEnded, undefined)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  @action
  moveCard(cardId: string, toColumn: ColumnId): void {
    const card = this.cards.value.find((c) => c.id === cardId)
    if (!card || card.column === toColumn) return

    pulse.emit(CardMoved, {
      cardId,
      fromColumn: card.column,
      toColumn,
    })
  }

  @action
  undo(): void {
    pulse.emit(UndoRequested, undefined)
  }

  willDestroy(): void {
    super.willDestroy()
    this.cards.destroy()
    this.drag.destroy()
    this.position.destroy()
    this.saving.destroy()
    this.error.destroy()
    this.undoAvailable.destroy()
    this.springX.destroy()
    this.shake.destroy()
  }
}
