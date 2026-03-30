import { Component, type WritableSignal, OnInit, OnDestroy, signal as ngSignal, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  COLS,
  CELL_SIZE,
  GAP,
  Reorder,
  Shuffle,
  AddItem,
  RemoveItem,
  items,
  getGridPosition,
  type GridItem,
} from './engine'

@Component({
  selector: 'app-sortable-grid',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Sortable Grid</h1>
      <p class="subtitle">4-col drag reorder with spring positions. Shuffle, add, and remove items.</p>
      <div class="controls">
        <button class="ctrl-btn" (click)="shuffle()">Shuffle</button>
        <button class="ctrl-btn add" (click)="addItem()">+ Add</button>
      </div>
      <div
        class="grid"
        [style.width.px]="gridWidth"
        [style.height.px]="gridHeight()"
      >
        @for (item of itemList(); track item.id; let i = $index) {
          <div
            class="cell"
            [style.width.px]="cellSize"
            [style.height.px]="cellSize"
            [style.transform]="'translate(' + getPos(i).x + 'px, ' + getPos(i).y + 'px)'"
            [style.background]="item.color"
            [class.dragging]="dragIndex() === i"
            draggable="true"
            (dragstart)="onDragStart(i)"
            (dragover)="onDragOver($event, i)"
            (drop)="onDrop(i)"
            (dragend)="onDragEnd()"
          >
            <span class="cell-label">{{ item.label }}</span>
            <button class="remove-btn" (click)="remove(item.id, $event)">x</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; }
    .controls { display: flex; gap: 8px; margin-bottom: 24px; }
    .ctrl-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #4361ee;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .ctrl-btn:hover { opacity: 0.85; }
    .ctrl-btn.add { background: #06d6a0; }
    .grid {
      position: relative;
    }
    .cell {
      position: absolute;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .cell:active { cursor: grabbing; }
    .cell.dragging {
      opacity: 0.5;
      transform: scale(0.95) !important;
    }
    .cell:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .cell-label {
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      user-select: none;
    }
    .remove-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .cell:hover .remove-btn { opacity: 1; }
    .remove-btn:hover { background: rgba(0,0,0,0.5); }
  `],
})
export class SortableGridComponent implements OnInit, OnDestroy {
  cellSize = CELL_SIZE
  gridWidth = COLS * (CELL_SIZE + GAP) - GAP

  itemList: WritableSignal<GridItem[]>
  dragIndex = ngSignal<number>(-1)

  gridHeight = computed(() => {
    const rows = Math.ceil(this.itemList().length / COLS)
    return rows * (CELL_SIZE + GAP) - GAP
  })

  constructor(private pulse: PulseService) {
    this.itemList = pulse.signal(items)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  getPos(index: number): { x: number; y: number } {
    return getGridPosition(index)
  }

  shuffle(): void {
    this.pulse.emit(Shuffle, undefined)
  }

  addItem(): void {
    this.pulse.emit(AddItem, undefined)
  }

  remove(id: string, e: MouseEvent): void {
    e.stopPropagation()
    e.preventDefault()
    this.pulse.emit(RemoveItem, id)
  }

  onDragStart(index: number): void {
    this.dragIndex.set(index)
  }

  onDragOver(e: DragEvent, index: number): void {
    e.preventDefault()
  }

  onDrop(toIndex: number): void {
    const fromIndex = this.dragIndex()
    if (fromIndex >= 0 && fromIndex !== toIndex) {
      this.pulse.emit(Reorder, { fromIndex, toIndex })
    }
    this.dragIndex.set(-1)
  }

  onDragEnd(): void {
    this.dragIndex.set(-1)
  }
}
