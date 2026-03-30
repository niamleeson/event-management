import { Component, computed, type WritableSignal, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  cards,
  dragState,
  cardStatuses,
  dragSpringX,
  dragSpringY,
  DragStart,
  DragMove,
  DragEnd,
  CardMoved,
  UndoRequested,
  type KanbanCard,
  type ColumnId,
  type CardStatus,
  type DragInfo,
} from './engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: '#4361ee' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

const STATUS_LABELS: Record<CardStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Error - retrying',
  settled: '',
}

@Component({
  selector: 'app-drag-api-animation',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="container">
      <style>
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes flashGreen {
          0% { background: #10b98122; }
          100% { background: #0f172a; }
        }
      </style>

      <div class="header">
        <h1 class="title">Pulse Kanban</h1>
        <p class="subtitle">
          Drag cards between columns. Spring physics follow your mouse.
          Saves auto-retry on failure.
        </p>
      </div>

      <div class="board">
        @for (col of columns; track col.id) {
          <div class="column" [style.border-top]="'3px solid ' + col.color">
            <div class="column-header">
              <span class="column-title">{{ col.title }}</span>
              <span
                class="column-count"
                [style.color]="col.color"
                [style.background]="col.color + '22'"
              >{{ getColumnCards(col.id).length }}</span>
            </div>
            @for (card of getColumnCards(col.id); track card.id) {
              <div
                class="card"
                [class.dragging]="drag()?.cardId === card.id"
                [class.saving]="getStatus(card.id) === 'saving'"
                [class.saved]="getStatus(card.id) === 'saved'"
                [class.error]="getStatus(card.id) === 'error'"
                [style.animation]="getStatus(card.id) === 'error' ? 'shake 0.5s ease-in-out' : getStatus(card.id) === 'saved' ? 'flashGreen 0.6s ease-out' : 'none'"
                (mousedown)="onCardMouseDown($event, card)"
              >
                <p class="card-title">{{ card.title }}</p>
                <p class="card-desc">{{ card.description }}</p>
                <div class="card-footer">
                  <span
                    class="priority-badge"
                    [style.color]="getPriorityColor(card.priority)"
                    [style.background]="getPriorityColor(card.priority) + '22'"
                  >{{ card.priority }}</span>
                  <span>
                    @if (getStatusLabel(card.id)) {
                      <span
                        class="status-label"
                        [style.color]="getStatusColor(card.id)"
                      >{{ getStatusLabel(card.id) }}</span>
                    }
                    @if (getStatus(card.id) === 'saved' || getStatus(card.id) === 'error') {
                      <button class="undo-btn" (click)="undo($event, card.id)">Undo</button>
                    }
                  </span>
                </div>
              </div>
            }
            @if (drag()) {
              <div
                class="drop-zone"
                (mouseenter)="onDropZoneEnter($event)"
                (mouseleave)="onDropZoneLeave($event)"
                (mouseup)="onDropZoneDrop(col.id)"
              >
                <div class="drop-text">Drop here</div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Ghost card (follows mouse via spring) -->
      @if (drag() && getCardById(drag()!.cardId)) {
        <div
          class="ghost-card"
          [style.left.px]="springX() - drag()!.offsetX"
          [style.top.px]="springY() - drag()!.offsetY"
        >
          <p class="card-title">{{ getCardById(drag()!.cardId)!.title }}</p>
          <p class="card-desc">{{ getCardById(drag()!.cardId)!.description }}</p>
        </div>
      }

      <div class="devtools-hint">
        <p class="devtools-text">
          This example integrates with
          <code class="devtools-code">&#64;pulse/devtools</code>. Import and
          connect to visualize event flow, signals, and the DAG in real-time.
        </p>
        <p class="devtools-text" style="margin-top: 8px;">
          <code class="devtools-code">import {{ '{' }} connectDevtools {{ '}' }} from '&#64;pulse/devtools'</code>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: #0f172a;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 36px;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 6px;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .column {
      background: #1e293b;
      border-radius: 16px;
      padding: 16px;
      min-height: 400px;
    }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;
    }
    .column-title {
      font-size: 16px;
      font-weight: 700;
      color: #e2e8f0;
    }
    .column-count {
      font-size: 13px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .card {
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 10px;
      cursor: grab;
      transition: border-color 0.3s, background 0.3s, opacity 0.15s;
      user-select: none;
    }
    .card.dragging {
      opacity: 0.4;
      cursor: grabbing;
    }
    .card.saving {
      border-color: #f59e0b;
    }
    .card.saved {
      border-color: #10b981;
      background: #10b98108;
    }
    .card.error {
      border-color: #ef4444;
      background: #ef444408;
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0 0 4px;
    }
    .card-desc {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 10px;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .priority-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 8px;
    }
    .status-label {
      font-size: 11px;
      font-weight: 600;
    }
    .undo-btn {
      font-size: 12px;
      color: #94a3b8;
      background: none;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 2px 8px;
      cursor: pointer;
      margin-left: 8px;
    }
    .ghost-card {
      position: fixed;
      pointer-events: none;
      z-index: 1000;
      width: 300px;
      background: #1e293b;
      border: 2px solid #4361ee;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .drop-zone {
      min-height: 60px;
      border: 2px dashed transparent;
      border-radius: 8px;
      transition: border-color 0.2s, background 0.2s;
    }
    .drop-zone:hover {
      border-color: #4361ee;
      background: #4361ee11;
    }
    .drop-text {
      padding: 20px;
      text-align: center;
      color: #475569;
      font-size: 13px;
    }
    .devtools-hint {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
      background: #1e293b;
      border-radius: 12px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    .devtools-text {
      color: #94a3b8;
      font-size: 13px;
    }
    .devtools-code {
      color: #4361ee;
      font-family: monospace;
      font-size: 12px;
    }
  `],
})
export class DragApiAnimationComponent implements OnInit, OnDestroy {
  columns = COLUMNS

  allCards: WritableSignal<KanbanCard[]>
  drag: WritableSignal<DragInfo | null>
  statuses: WritableSignal<Record<string, CardStatus>>
  springX: WritableSignal<number>
  springY: WritableSignal<number>

  constructor(private pulse: PulseService) {
    this.allCards = pulse.signal(cards)
    this.drag = pulse.signal(dragState)
    this.statuses = pulse.signal(cardStatuses)
    this.springX = pulse.spring(dragSpringX)
    this.springY = pulse.spring(dragSpringY)
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
  }

  getColumnCards(columnId: ColumnId): KanbanCard[] {
    return this.allCards().filter((c) => c.column === columnId)
  }

  getCardById(cardId: string): KanbanCard | undefined {
    return this.allCards().find((c) => c.id === cardId)
  }

  getStatus(cardId: string): CardStatus {
    return this.statuses()[cardId] ?? 'idle'
  }

  getStatusLabel(cardId: string): string {
    return STATUS_LABELS[this.getStatus(cardId)]
  }

  getStatusColor(cardId: string): string {
    const map: Record<CardStatus, string> = {
      idle: '#64748b',
      saving: '#f59e0b',
      saved: '#10b981',
      error: '#ef4444',
      settled: '#64748b',
    }
    return map[this.getStatus(cardId)]
  }

  getPriorityColor(priority: string): string {
    return PRIORITY_COLORS[priority] ?? '#94a3b8'
  }

  onCardMouseDown(e: MouseEvent, card: KanbanCard): void {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    this.pulse.emit(DragStart, {
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    })
  }

  onDropZoneEnter(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = '#4361ee'
    el.style.background = '#4361ee11'
  }

  onDropZoneLeave(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = 'transparent'
    el.style.background = 'transparent'
  }

  onDropZoneDrop(columnId: ColumnId): void {
    const d = this.drag()
    if (d) {
      const card = this.allCards().find((c) => c.id === d.cardId)
      if (card && card.column !== columnId) {
        this.pulse.emit(CardMoved, {
          cardId: d.cardId,
          fromColumn: card.column,
          toColumn: columnId,
        })
      }
      this.pulse.emit(DragEnd, undefined)
    }
  }

  undo(e: MouseEvent, cardId: string): void {
    e.stopPropagation()
    this.pulse.emit(UndoRequested, cardId)
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (this.drag()) {
      this.pulse.emit(DragMove, { x: e.clientX, y: e.clientY })
    }
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    if (this.drag()) {
      this.pulse.emit(DragEnd, undefined)
    }
  }
}
