import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, signal as ngSignal } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, GRID_SIZE, CELL_COUNT, SHAPES, COLORS, CycleMorph, CellShapesChanged, MorphProgressChanged, startAutoCycle, stopAutoCycle, type Shape } from './engine'

@Component({
  selector: 'app-3d-morphing-grid', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Morphing Grid</h1><p class="subtitle">4x4 grid morphs between shapes. Auto-cycles every 3s.</p><button class="morph-btn" (click)="triggerMorph()">Morph Now</button><div class="grid">@for (cell of cellIndices; track cell; let i = $index) {<div class="cell"><div class="shape" [style.background]="colors[i]" [style.border-radius]="getRadius(i)" [style.transform]="'rotate(' + getRotation(i) + 'deg) scale(' + getScale(i) + ')'" [style.opacity]="getOpacity(i)"></div></div>}</div></div>`,
  styles: [`.page{min-height:100vh;background:#0f0f23;padding:60px 20px;font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:32px;font-weight:800;color:#fff;margin-bottom:8px}.subtitle{color:rgba(255,255,255,.5);font-size:14px;margin-bottom:24px}.morph-btn{padding:10px 24px;border:none;border-radius:8px;background:#4361ee;color:#fff;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:32px}.grid{display:grid;grid-template-columns:repeat(4,100px);grid-template-rows:repeat(4,100px);gap:16px}.cell{display:flex;align-items:center;justify-content:center}.shape{width:70px;height:70px}`],
})
export class ThreeDMorphingGridComponent implements OnInit, OnDestroy, AfterViewInit {
  cellIndices = Array.from({ length: CELL_COUNT }, (_, i) => i)
  colors = COLORS
  shapes = this.pulse.use(CellShapesChanged, Array(CELL_COUNT).fill(0) as number[])
  progresses: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    for (let i = 0; i < CELL_COUNT; i++) {
      const p = ngSignal(0); this.progresses.push(p)
      engine.on(MorphProgressChanged[i], (e) => p.set(e.value))
    }
  }

  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; stopAutoCycle(); engine.destroy() }
  ngAfterViewInit(): void { startAutoCycle(); setTimeout(() => this.pulse.emit(CycleMorph, undefined), 500) }
  triggerMorph(): void { this.pulse.emit(CycleMorph, undefined) }

  getRadius(index: number): string {
    const shapeIdx = this.shapes()[index]; const shape = SHAPES[shapeIdx]; const progress = this.progresses[index]()
    const nextShape = SHAPES[(shapeIdx + 1) % SHAPES.length]
    const r = (s: Shape) => s === 'circle' ? 50 : 8
    return r(shape) + (r(nextShape) - r(shape)) * progress + '%'
  }
  getRotation(index: number): number {
    const shapeIdx = this.shapes()[index]; const shape = SHAPES[shapeIdx]; const progress = this.progresses[index]()
    if (shape === 'diamond') return 45 * (1 - progress)
    if (SHAPES[(shapeIdx + 1) % SHAPES.length] === 'diamond') return 45 * progress
    return 0
  }
  getScale(i: number): number { const p = this.progresses[i](); return p > 0 && p < 1 ? 0.9 + 0.2 * Math.sin(p * Math.PI) : 1 }
  getOpacity(i: number): number { const p = this.progresses[i](); return p > 0 && p < 1 ? 0.7 + 0.3 * Math.sin(p * Math.PI) : 1 }
}
