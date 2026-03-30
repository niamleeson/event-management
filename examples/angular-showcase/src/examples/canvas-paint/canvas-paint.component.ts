import { Component, ViewChild, ElementRef, type WritableSignal, OnInit, OnDestroy, AfterViewInit } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  StrokeStart,
  StrokeMove,
  StrokeEnd,
  SetTool,
  SetColor,
  SetSize,
  SetLayer,
  ToggleLayerVisibility,
  UndoDraw,
  RedoDraw,
  ClearCanvas,
  currentTool,
  currentColor,
  brushSize,
  activeLayer,
  layers,
  strokes,
  liveStroke,
  canUndo,
  canRedo,
  type Tool,
  type DrawStroke,
  type Layer,
} from './engine'

@Component({
  selector: 'app-canvas-paint',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Canvas Paint</h1>
      <div class="paint-layout">
        <div class="toolbar-left">
          <div class="tool-group">
            <h4>Tools</h4>
            @for (t of tools; track t.id) {
              <button class="tool-btn" [class.active]="tool() === t.id" (click)="setTool(t.id)">
                {{ t.label }}
              </button>
            }
          </div>
          <div class="tool-group">
            <h4>Color</h4>
            <div class="color-grid">
              @for (c of colors; track c) {
                <div
                  class="color-swatch"
                  [style.background]="c"
                  [class.active]="color() === c"
                  (click)="setColor(c)"
                ></div>
              }
            </div>
          </div>
          <div class="tool-group">
            <h4>Size: {{ size() }}px</h4>
            <input
              type="range"
              min="1"
              max="20"
              [value]="size()"
              (input)="onSizeChange($event)"
              class="size-slider"
            />
          </div>
          <div class="tool-group">
            <h4>Actions</h4>
            <button class="action-btn" (click)="undo()" [disabled]="!undoable()">Undo</button>
            <button class="action-btn" (click)="redo()" [disabled]="!redoable()">Redo</button>
            <button class="action-btn danger" (click)="clear()">Clear</button>
          </div>
        </div>
        <div class="canvas-area">
          <canvas
            #canvas
            class="draw-canvas"
            [width]="600"
            [height]="450"
            (mousedown)="onMouseDown($event)"
            (mousemove)="onMouseMove($event)"
            (mouseup)="onMouseUp()"
            (mouseleave)="onMouseUp()"
          ></canvas>
        </div>
        <div class="layers-panel">
          <h4>Layers</h4>
          @for (layer of layerList(); track layer.id) {
            <div
              class="layer-item"
              [class.active]="active() === layer.id"
              (click)="selectLayer(layer.id)"
            >
              <input
                type="checkbox"
                [checked]="layer.visible"
                (click)="toggleLayer(layer.id, $event)"
              />
              <span>{{ layer.name }}</span>
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
      padding: 32px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 20px; text-align: center; }
    .paint-layout { display: flex; gap: 16px; justify-content: center; }
    .toolbar-left {
      width: 160px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tool-group h4 { margin: 0 0 8px; font-size: 12px; color: #6c757d; text-transform: uppercase; }
    .tool-btn {
      display: block;
      width: 100%;
      padding: 8px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 4px;
      text-align: left;
    }
    .tool-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
    .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
    }
    .color-swatch.active { border-color: #1a1a2e; }
    .size-slider {
      width: 100%;
      -webkit-appearance: none;
      height: 4px;
      background: #dee2e6;
      border-radius: 2px;
    }
    .size-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4361ee;
      cursor: pointer;
    }
    .action-btn {
      display: block;
      width: 100%;
      padding: 8px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 4px;
    }
    .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .action-btn.danger { color: #ef476f; border-color: #ef476f; }
    .canvas-area {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .draw-canvas {
      background: #fff;
      cursor: crosshair;
      display: block;
    }
    .layers-panel {
      width: 140px;
    }
    .layers-panel h4 { margin: 0 0 8px; font-size: 12px; color: #6c757d; text-transform: uppercase; }
    .layer-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      margin-bottom: 4px;
      color: #495057;
    }
    .layer-item.active { background: #e7f5ff; color: #4361ee; font-weight: 600; }
    .layer-item input { cursor: pointer; }
  `],
})
export class CanvasPaintComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>

  tools: { id: Tool; label: string }[] = [
    { id: 'brush', label: 'Brush' },
    { id: 'eraser', label: 'Eraser' },
    { id: 'line', label: 'Line' },
    { id: 'rect', label: 'Rectangle' },
  ]

  colors = ['#4361ee', '#7209b7', '#f72585', '#ef476f', '#e76f51', '#ffd166', '#06d6a0', '#1a1a2e']

  tool: WritableSignal<Tool>
  color: WritableSignal<string>
  size: WritableSignal<number>
  active: WritableSignal<number>
  layerList: WritableSignal<Layer[]>
  strokeList: WritableSignal<DrawStroke[]>
  live: WritableSignal<DrawStroke | null>
  undoable: WritableSignal<boolean>
  redoable: WritableSignal<boolean>

  private ctx!: CanvasRenderingContext2D
  private drawing = false

  constructor(private pulse: PulseService) {
    this.tool = pulse.signal(currentTool)
    this.color = pulse.signal(currentColor)
    this.size = pulse.signal(brushSize)
    this.active = pulse.signal(activeLayer)
    this.layerList = pulse.signal(layers)
    this.strokeList = pulse.signal(strokes)
    this.live = pulse.signal(liveStroke)
    this.undoable = pulse.signal(canUndo)
    this.redoable = pulse.signal(canRedo)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!
    this.pulse.on(engine.frame, () => this.render())
  }

  setTool(t: Tool): void { this.pulse.emit(SetTool, t) }
  setColor(c: string): void { this.pulse.emit(SetColor, c) }
  onSizeChange(e: Event): void { this.pulse.emit(SetSize, parseInt((e.target as HTMLInputElement).value)) }
  selectLayer(id: number): void { this.pulse.emit(SetLayer, id) }
  toggleLayer(id: number, e: MouseEvent): void { e.stopPropagation(); this.pulse.emit(ToggleLayerVisibility, id) }
  undo(): void { this.pulse.emit(UndoDraw, undefined) }
  redo(): void { this.pulse.emit(RedoDraw, undefined) }
  clear(): void { this.pulse.emit(ClearCanvas, undefined) }

  onMouseDown(e: MouseEvent): void {
    this.drawing = true
    const pt = this.getPoint(e)
    this.pulse.emit(StrokeStart, pt)
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.drawing) return
    this.pulse.emit(StrokeMove, this.getPoint(e))
  }

  onMouseUp(): void {
    if (!this.drawing) return
    this.drawing = false
    this.pulse.emit(StrokeEnd, undefined)
  }

  private getPoint(e: MouseEvent): { x: number; y: number; pressure: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: 1 }
  }

  private render(): void {
    const ctx = this.ctx
    const w = this.canvasRef.nativeElement.width
    const h = this.canvasRef.nativeElement.height
    ctx.clearRect(0, 0, w, h)

    const visibleLayers = new Set(this.layerList().filter((l) => l.visible).map((l) => l.id))

    // Draw committed strokes
    for (const stroke of this.strokeList()) {
      if (!visibleLayers.has(stroke.layer)) continue
      this.drawStroke(ctx, stroke)
    }

    // Draw live stroke
    const ls = this.live()
    if (ls && visibleLayers.has(ls.layer)) {
      this.drawStroke(ctx, ls)
    }
  }

  private drawStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke): void {
    if (stroke.points.length < 1) return
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }

    if (stroke.tool === 'rect' && stroke.points.length >= 2) {
      const p0 = stroke.points[0]
      const p1 = stroke.points[stroke.points.length - 1]
      ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y)
    } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
      const p0 = stroke.points[0]
      const p1 = stroke.points[stroke.points.length - 1]
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }

    ctx.globalCompositeOperation = 'source-over'
  }
}
