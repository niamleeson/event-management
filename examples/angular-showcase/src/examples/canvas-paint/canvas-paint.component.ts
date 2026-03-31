import { Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, StrokeStart, StrokeMove, StrokeEnd, SetTool, SetColor, SetSize, UndoDraw, RedoDraw, ClearCanvas, ToolChanged, ColorChanged, SizeChanged, StrokesChanged, LiveStrokeChanged, CanUndoChanged, CanRedoChanged, type Tool, type DrawStroke } from './engine'
@Component({ selector: 'app-canvas-paint', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Canvas Paint</h1><p class="subtitle">Draw tools, undo/redo.</p><div class="tb">@for (t of tools; track t) {<button class="tbtn" [class.active]="tool() === t" (click)="setTool(t)">{{ t }}</button>}<input type="color" [value]="color()" (input)="setColor($event)" /><input type="range" min="1" max="20" [value]="size()" (input)="setSize($event)" /><button class="tbtn" (click)="undo()" [disabled]="!canUndo()">Undo</button><button class="tbtn" (click)="redo()" [disabled]="!canRedo()">Redo</button><button class="tbtn" (click)="clear()">Clear</button></div><canvas #canvas width="800" height="500" class="cv" (mousedown)="onDown($event)" (mousemove)="onMove($event)" (mouseup)="onUp()" (mouseleave)="onUp()"></canvas></div>`,
  styles: [`.page{min-height:100vh;background:#f8f9fa;padding:40px 20px;font-family:sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:8px}.subtitle{color:#6c757d;font-size:14px;margin-bottom:16px}.tb{display:flex;gap:6px;margin-bottom:16px;align-items:center}.tbtn{padding:6px 14px;border:1px solid #dee2e6;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;text-transform:capitalize}.tbtn.active{background:#4361ee;color:#fff;border-color:#4361ee}.tbtn:disabled{opacity:.4}.cv{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);cursor:crosshair}`],
})
export class CanvasPaintComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>
  tools: Tool[] = ['brush', 'eraser', 'line', 'rect']
  tool = this.pulse.use(ToolChanged, 'brush' as Tool)
  color = this.pulse.use(ColorChanged, '#4361ee')
  size = this.pulse.use(SizeChanged, 4)
  canUndo = this.pulse.use(CanUndoChanged, false)
  canRedo = this.pulse.use(CanRedoChanged, false)
  private ctx!: CanvasRenderingContext2D; private drawing = false
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!
    engine.on(StrokesChanged, (strokes) => this.redraw(strokes))
    engine.on(LiveStrokeChanged, (stroke) => { if (stroke) this.drawStroke(stroke) })
  }
  private getPoint(e: MouseEvent) { const r = this.canvasRef.nativeElement.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, pressure: 1 } }
  onDown(e: MouseEvent): void { this.drawing = true; this.pulse.emit(StrokeStart, this.getPoint(e)) }
  onMove(e: MouseEvent): void { if (this.drawing) this.pulse.emit(StrokeMove, this.getPoint(e)) }
  onUp(): void { if (this.drawing) { this.drawing = false; this.pulse.emit(StrokeEnd, undefined) } }
  setTool(t: Tool): void { this.pulse.emit(SetTool, t) }
  setColor(e: Event): void { this.pulse.emit(SetColor, (e.target as HTMLInputElement).value) }
  setSize(e: Event): void { this.pulse.emit(SetSize, parseInt((e.target as HTMLInputElement).value)) }
  undo(): void { this.pulse.emit(UndoDraw, undefined) }
  redo(): void { this.pulse.emit(RedoDraw, undefined) }
  clear(): void { this.pulse.emit(ClearCanvas, undefined) }
  private redraw(strokes: DrawStroke[]): void { this.ctx.clearRect(0, 0, 800, 500); for (const s of strokes) this.drawStroke(s) }
  private drawStroke(s: DrawStroke): void {
    if (s.points.length < 2) return; const ctx = this.ctx; ctx.strokeStyle = s.color; ctx.lineWidth = s.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(s.points[0].x, s.points[0].y); for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y); ctx.stroke()
  }
}
