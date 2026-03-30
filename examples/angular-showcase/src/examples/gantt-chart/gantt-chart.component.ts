import { Component, type WritableSignal, OnInit, OnDestroy, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  DAYS,
  DAY_WIDTH,
  MoveTask,
  ResizeTask,
  ZoomChange,
  SelectTask,
  tasks,
  zoomLevel,
  selectedTaskId,
  type Task,
} from './engine'

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Gantt Chart</h1>
      <p class="subtitle">10 tasks with drag move/resize. SVG arrows for dependencies. Auto-shift on conflict.</p>
      <div class="controls">
        <label>Zoom:</label>
        <button class="zoom-btn" (click)="setZoom(0.5)">50%</button>
        <button class="zoom-btn" [class.active]="zoom() === 1" (click)="setZoom(1)">100%</button>
        <button class="zoom-btn" (click)="setZoom(1.5)">150%</button>
      </div>
      <div class="gantt-container">
        <div class="task-list">
          <div class="list-header">Tasks</div>
          @for (task of taskList(); track task.id) {
            <div
              class="task-name"
              [class.selected]="selected() === task.id"
              (click)="selectTask(task.id)"
            >
              <span class="task-dot" [style.background]="task.color"></span>
              {{ task.name }}
            </div>
          }
        </div>
        <div class="chart-area" [style.width.px]="days * dayW() + 40">
          <div class="day-headers">
            @for (day of dayIndices; track day) {
              <div class="day-header" [style.width.px]="dayW()">{{ day + 1 }}</div>
            }
          </div>
          <svg class="arrows" [attr.width]="days * dayW()" [attr.height]="taskList().length * 44">
            @for (dep of depLines(); track $index) {
              <line
                [attr.x1]="dep.x1"
                [attr.y1]="dep.y1"
                [attr.x2]="dep.x2"
                [attr.y2]="dep.y2"
                stroke="#adb5bd"
                stroke-width="1.5"
                marker-end="url(#arrowhead)"
              />
            }
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#adb5bd" />
              </marker>
            </defs>
          </svg>
          @for (task of taskList(); track task.id; let i = $index) {
            <div
              class="task-bar-row"
              [style.height.px]="44"
            >
              <div
                class="task-bar"
                [style.left.px]="task.start * dayW()"
                [style.width.px]="task.duration * dayW()"
                [style.background]="task.color"
                [class.selected]="selected() === task.id"
                (mousedown)="startDrag(task, $event)"
                (click)="selectTask(task.id)"
              >
                <span class="bar-label">{{ task.name }}</span>
                <div class="resize-handle" (mousedown)="startResize(task, $event)"></div>
              </div>
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
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: #495057;
    }
    .zoom-btn {
      padding: 4px 12px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
    }
    .zoom-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
    .gantt-container {
      display: flex;
      max-width: 1100px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow-x: auto;
    }
    .task-list {
      width: 160px;
      min-width: 160px;
      border-right: 1px solid #e9ecef;
    }
    .list-header {
      height: 32px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      border-bottom: 1px solid #e9ecef;
    }
    .task-name {
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      font-size: 13px;
      color: #1a1a2e;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
    }
    .task-name.selected { background: #e7f5ff; }
    .task-dot { width: 8px; height: 8px; border-radius: 50%; }
    .chart-area { position: relative; flex: 1; }
    .day-headers { display: flex; height: 32px; border-bottom: 1px solid #e9ecef; }
    .day-header {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #adb5bd;
      border-right: 1px solid #f1f3f5;
    }
    .arrows { position: absolute; top: 32px; left: 0; pointer-events: none; }
    .task-bar-row {
      position: relative;
      border-bottom: 1px solid #f8f9fa;
    }
    .task-bar {
      position: absolute;
      top: 6px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      cursor: grab;
      transition: box-shadow 0.15s;
    }
    .task-bar:active { cursor: grabbing; }
    .task-bar.selected { box-shadow: 0 0 0 2px rgba(67,97,238,0.5); }
    .bar-label { color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
      border-radius: 0 6px 6px 0;
    }
    .resize-handle:hover { background: rgba(255,255,255,0.3); }
  `],
})
export class GanttChartComponent implements OnInit, OnDestroy {
  days = DAYS
  dayIndices = Array.from({ length: DAYS }, (_, i) => i)

  taskList: WritableSignal<Task[]>
  zoom: WritableSignal<number>
  selected: WritableSignal<string | null>

  dayW = computed(() => DAY_WIDTH * this.zoom())

  depLines = computed(() => {
    const ts = this.taskList()
    const dw = this.dayW()
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
    for (let i = 0; i < ts.length; i++) {
      const task = ts[i]
      for (const depId of task.dependencies) {
        const depIdx = ts.findIndex((t) => t.id === depId)
        if (depIdx < 0) continue
        const dep = ts[depIdx]
        lines.push({
          x1: (dep.start + dep.duration) * dw,
          y1: depIdx * 44 + 22,
          x2: task.start * dw,
          y2: i * 44 + 22,
        })
      }
    }
    return lines
  })

  private dragInfo: { taskId: string; startX: number; origStart: number } | null = null
  private resizeInfo: { taskId: string; startX: number; origDuration: number } | null = null

  constructor(private pulse: PulseService) {
    this.taskList = pulse.signal(tasks)
    this.zoom = pulse.signal(zoomLevel)
    this.selected = pulse.signal(selectedTaskId)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    engine.destroy()
  }

  setZoom(z: number): void {
    this.pulse.emit(ZoomChange, z)
  }

  selectTask(id: string): void {
    this.pulse.emit(SelectTask, id)
  }

  startDrag(task: Task, e: MouseEvent): void {
    e.stopPropagation()
    this.dragInfo = { taskId: task.id, startX: e.clientX, origStart: task.start }
  }

  startResize(task: Task, e: MouseEvent): void {
    e.stopPropagation()
    e.preventDefault()
    this.resizeInfo = { taskId: task.id, startX: e.clientX, origDuration: task.duration }
  }

  private onMouseMove = (e: MouseEvent): void => {
    const dw = this.dayW()
    if (this.dragInfo) {
      const dx = e.clientX - this.dragInfo.startX
      const dayDelta = Math.round(dx / dw)
      this.pulse.emit(MoveTask, {
        id: this.dragInfo.taskId,
        start: this.dragInfo.origStart + dayDelta,
      })
    }
    if (this.resizeInfo) {
      const dx = e.clientX - this.resizeInfo.startX
      const dayDelta = Math.round(dx / dw)
      this.pulse.emit(ResizeTask, {
        id: this.resizeInfo.taskId,
        duration: this.resizeInfo.origDuration + dayDelta,
      })
    }
  }

  private onMouseUp = (): void => {
    this.dragInfo = null
    this.resizeInfo = null
  }
}
