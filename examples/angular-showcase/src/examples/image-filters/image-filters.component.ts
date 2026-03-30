import { Component, type WritableSignal, OnInit, OnDestroy, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  FILTERS,
  UpdateFilter,
  Undo,
  Redo,
  ResetAll,
  ToggleSplit,
  PushHistory,
  ReorderFilters,
  filterValues,
  filterOrder,
  splitView,
  canUndo,
  canRedo,
  type FilterConfig,
} from './engine'

@Component({
  selector: 'app-image-filters',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Image Filters</h1>
      <p class="subtitle">CSS filter pipeline with drag reorder, sliders, undo/redo, and split view.</p>
      <div class="toolbar">
        <button class="tool-btn" (click)="undo()" [disabled]="!undoable()">Undo</button>
        <button class="tool-btn" (click)="redo()" [disabled]="!redoable()">Redo</button>
        <button class="tool-btn" (click)="reset()">Reset</button>
        <button class="tool-btn" [class.active]="split()" (click)="toggleSplit()">Split View</button>
      </div>
      <div class="content">
        <div class="preview-area">
          <div class="image-wrapper">
            @if (split()) {
              <div class="split-container">
                <div class="split-half original">
                  <div class="split-image" [style.background-image]="'url(' + imageUrl + ')'"></div>
                  <span class="split-label">Original</span>
                </div>
                <div class="split-half filtered">
                  <div class="split-image" [style.background-image]="'url(' + imageUrl + ')'" [style.filter]="filterString()"></div>
                  <span class="split-label">Filtered</span>
                </div>
              </div>
            } @else {
              <div class="image" [style.background-image]="'url(' + imageUrl + ')'" [style.filter]="filterString()"></div>
            }
          </div>
          <div class="filter-code">
            <code>filter: {{ filterString() }}</code>
          </div>
        </div>
        <div class="controls">
          @for (filterId of order(); track filterId; let i = $index) {
            <div class="filter-row" draggable="true" (dragstart)="onDragStart(i)" (dragover)="onDragOver($event, i)" (drop)="onDrop(i)">
              <div class="drag-handle">&#8942;&#8942;</div>
              <div class="filter-info">
                <span class="filter-name">{{ getFilter(filterId)!.name }}</span>
                <span class="filter-value">{{ values()[filterId] }}{{ getFilter(filterId)!.unit }}</span>
              </div>
              <input
                type="range"
                class="slider"
                [min]="getFilter(filterId)!.min"
                [max]="getFilter(filterId)!.max"
                [value]="values()[filterId]"
                (input)="onSliderChange(filterId, $event)"
                (change)="pushHistory()"
              />
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 20px; text-align: center; }
    .toolbar {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
    }
    .tool-btn {
      padding: 8px 16px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tool-btn:hover:not(:disabled) { background: #f1f3f5; }
    .tool-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .tool-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
    .content { display: flex; gap: 24px; max-width: 1000px; margin: 0 auto; }
    .preview-area { flex: 1; }
    .image-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .image {
      width: 100%;
      height: 350px;
      background-size: cover;
      background-position: center;
    }
    .split-container { display: flex; height: 350px; }
    .split-half { flex: 1; position: relative; overflow: hidden; }
    .split-image {
      width: 200%;
      height: 100%;
      background-size: cover;
      background-position: center;
    }
    .split-half.filtered .split-image { margin-left: -100%; }
    .split-label {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.6);
      color: #fff;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 11px;
    }
    .filter-code {
      margin-top: 12px;
      padding: 10px;
      background: #1a1a2e;
      border-radius: 8px;
      overflow-x: auto;
    }
    .filter-code code { color: #4cc9f0; font-size: 12px; }
    .controls { width: 320px; }
    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      cursor: grab;
    }
    .filter-row:active { cursor: grabbing; }
    .drag-handle { color: #adb5bd; font-size: 14px; cursor: grab; }
    .filter-info { min-width: 100px; }
    .filter-name { display: block; font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .filter-value { font-size: 11px; color: #6c757d; }
    .slider {
      flex: 1;
      -webkit-appearance: none;
      height: 4px;
      border-radius: 2px;
      background: #dee2e6;
      outline: none;
    }
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4361ee;
      cursor: pointer;
    }
  `],
})
export class ImageFiltersComponent implements OnInit, OnDestroy {
  imageUrl = 'https://picsum.photos/seed/pulse/800/400'

  values: WritableSignal<Record<string, number>>
  order: WritableSignal<string[]>
  split: WritableSignal<boolean>
  undoable: WritableSignal<boolean>
  redoable: WritableSignal<boolean>

  filterString = computed(() => {
    const vals = this.values()
    const ord = this.order()
    return ord
      .map((id) => {
        const f = FILTERS.find((fi) => fi.id === id)!
        return `${f.property}(${vals[id]}${f.unit})`
      })
      .join(' ')
  })

  private dragFromIndex = -1

  constructor(private pulse: PulseService) {
    this.values = pulse.signal(filterValues)
    this.order = pulse.signal(filterOrder)
    this.split = pulse.signal(splitView)
    this.undoable = pulse.signal(canUndo)
    this.redoable = pulse.signal(canRedo)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  getFilter(id: string): FilterConfig | undefined {
    return FILTERS.find((f) => f.id === id)
  }

  onSliderChange(filterId: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value)
    this.pulse.emit(UpdateFilter, { id: filterId, value })
  }

  pushHistory(): void {
    this.pulse.emit(PushHistory, undefined)
  }

  undo(): void { this.pulse.emit(Undo, undefined) }
  redo(): void { this.pulse.emit(Redo, undefined) }
  reset(): void {
    this.pushHistory()
    this.pulse.emit(ResetAll, undefined)
  }
  toggleSplit(): void { this.pulse.emit(ToggleSplit, undefined) }

  onDragStart(index: number): void {
    this.dragFromIndex = index
  }

  onDragOver(e: DragEvent, index: number): void {
    e.preventDefault()
  }

  onDrop(toIndex: number): void {
    if (this.dragFromIndex < 0 || this.dragFromIndex === toIndex) return
    const order = [...this.order()]
    const [moved] = order.splice(this.dragFromIndex, 1)
    order.splice(toIndex, 0, moved)
    this.pulse.emit(ReorderFilters, order)
    this.pushHistory()
    this.dragFromIndex = -1
  }
}
