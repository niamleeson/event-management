import { Component, computed, type WritableSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  CardDragEnd,
  CardMoved,
  RetryLastSave,
  cardsSig,
  savingSig,
  saveErrorSig,
  lastMoveSig,
  snapSpring,
  type KanbanCard,
  type ColumnId,
  type MovePayload,
} from './engine'

interface Column {
  id: ColumnId
  title: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>Kanban Board</h1>
      <p class="subtitle">Drag cards between columns. Spring animation + async save with retry.</p>

      @if (saving()) {
        <div class="status saving">Saving...</div>
      }
      @if (saveError()) {
        <div class="status error">
          {{ saveError() }}
          <button (click)="retry()">Retry</button>
        </div>
      }

      <div class="board">
        @for (col of columns; track col.id) {
          <div
            class="column"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event, col.id)"
          >
            <h2>{{ col.title }} ({{ getColumnCards(col.id).length }})</h2>
            <div class="card-list">
              @for (card of getColumnCards(col.id); track card.id) {
                <div
                  class="card"
                  draggable="true"
                  (dragstart)="onDragStart($event, card)"
                  (dragend)="onDragEndEvent($event)"
                  [style.transform]="'scale(' + springScale() + ')'"
                  [attr.data-card-id]="card.id"
                >
                  <span class="card-title">{{ card.title }}</span>
                  <span class="card-id">#{{ card.id }}</span>
                </div>
              } @empty {
                <div class="empty-col">Drop cards here</div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { text-align: center; margin-bottom: 0.25rem; }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .status {
      text-align: center;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .status.saving {
      background: #fef9e7;
      color: #f39c12;
    }
    .status.error {
      background: #fce4e4;
      color: #c0392b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }
    .status.error button {
      padding: 0.25rem 0.75rem;
      border: 1px solid #c0392b;
      border-radius: 4px;
      background: white;
      color: #c0392b;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .column {
      background: #e8eaed;
      border-radius: 8px;
      padding: 1rem;
      min-height: 300px;
    }
    .column h2 {
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #555;
      margin-bottom: 0.75rem;
    }
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .card {
      background: white;
      border-radius: 6px;
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: grab;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: box-shadow 0.2s;
      will-change: transform;
    }
    .card:hover {
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    }
    .card:active {
      cursor: grabbing;
    }
    .card-title {
      font-size: 0.9rem;
      font-weight: 500;
    }
    .card-id {
      font-size: 0.75rem;
      color: #aaa;
    }
    .empty-col {
      text-align: center;
      color: #aaa;
      padding: 2rem 0;
      font-size: 0.85rem;
      border: 2px dashed #ccc;
      border-radius: 6px;
    }
  `],
})
export class AppComponent {
  columns: Column[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ]

  cards: WritableSignal<KanbanCard[]>
  saving: WritableSignal<boolean>
  saveError: WritableSignal<string | null>
  lastMove: WritableSignal<MovePayload | null>
  springVal: WritableSignal<number>

  springScale = computed(() => {
    // Use the spring value to create a subtle scale bounce on drop
    const v = this.springVal()
    return 1 + v * 0.05
  })

  private draggedCardId: number | null = null

  constructor(private pulse: PulseService) {
    this.cards = pulse.signal(cardsSig)
    this.saving = pulse.signal(savingSig)
    this.saveError = pulse.signal(saveErrorSig)
    this.lastMove = pulse.signal(lastMoveSig)
    this.springVal = pulse.spring(snapSpring)
  }

  getColumnCards(columnId: ColumnId): KanbanCard[] {
    return this.cards().filter((c) => c.column === columnId)
  }

  onDragStart(event: DragEvent, card: KanbanCard): void {
    this.draggedCardId = card.id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(card.id))
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  onDrop(event: DragEvent, toColumn: ColumnId): void {
    event.preventDefault()
    const cardId = this.draggedCardId
    if (cardId == null) return

    // Only move if the card is not already in this column
    const card = this.cards().find((c) => c.id === cardId)
    if (card && card.column !== toColumn) {
      this.pulse.emit(CardDragEnd, { cardId, toColumn })
    }
    this.draggedCardId = null
  }

  onDragEndEvent(_event: DragEvent): void {
    this.draggedCardId = null
  }

  retry(): void {
    const last = this.lastMove()
    if (last) {
      this.pulse.emit(CardMoved, last)
    }
  }
}
