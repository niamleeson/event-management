import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  GRID_SIZE,
  CELL_COUNT,
  SHAPES,
  COLORS,
  CycleMorph,
  morphProgress,
  cellShapes,
  startAutoCycle,
  stopAutoCycle,
  type Shape,
} from './engine'

@Component({
  selector: 'app-3d-morphing-grid',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Morphing Grid</h1>
      <p class="subtitle">4x4 grid morphs between shapes with staggered tweens. Auto-cycles every 3s.</p>
      <button class="morph-btn" (click)="triggerMorph()">Morph Now</button>
      <div class="grid">
        @for (cell of cellIndices; track cell; let i = $index) {
          <div class="cell">
            <div
              class="shape"
              [style.background]="colors[i]"
              [style.border-radius]="getRadius(i)"
              [style.transform]="'rotate(' + getRotation(i) + 'deg) scale(' + getScale(i) + ')'"
              [style.opacity]="getOpacity(i)"
            ></div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #0f0f23;
      padding: 60px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 24px; }
    .morph-btn {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      background: #4361ee;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 32px;
      transition: opacity 0.2s;
    }
    .morph-btn:hover { opacity: 0.85; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 100px);
      grid-template-rows: repeat(4, 100px);
      gap: 16px;
    }
    .cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shape {
      width: 70px;
      height: 70px;
      transition: none;
    }
  `],
})
export class ThreeDMorphingGridComponent implements OnInit, OnDestroy, AfterViewInit {
  cellIndices = Array.from({ length: CELL_COUNT }, (_, i) => i)
  colors = COLORS
  shapes: WritableSignal<number[]>
  progresses: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    this.shapes = pulse.signal(cellShapes)
    for (let i = 0; i < CELL_COUNT; i++) {
      this.progresses.push(pulse.tween(morphProgress[i]))
    }
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    stopAutoCycle()
    engine.destroy()
  }

  ngAfterViewInit(): void {
    startAutoCycle()
    // Trigger initial morph
    setTimeout(() => this.pulse.emit(CycleMorph, undefined), 500)
  }

  triggerMorph(): void {
    this.pulse.emit(CycleMorph, undefined)
  }

  getRadius(index: number): string {
    const shapes = this.shapes()
    const shapeIdx = shapes[index]
    const shape = SHAPES[shapeIdx]
    const progress = this.progresses[index]()
    const nextShape = SHAPES[(shapeIdx + 1) % SHAPES.length]

    const radiusForShape = (s: Shape) => {
      switch (s) {
        case 'circle': return 50
        case 'square': return 8
        case 'diamond': return 8
        case 'triangle': return 8
      }
    }

    const from = radiusForShape(shape)
    const to = radiusForShape(nextShape)
    const r = from + (to - from) * progress
    return `${r}%`
  }

  getRotation(index: number): number {
    const shapes = this.shapes()
    const shapeIdx = shapes[index]
    const shape = SHAPES[shapeIdx]
    const progress = this.progresses[index]()

    if (shape === 'diamond') return 45 * (1 - progress)
    const nextShape = SHAPES[(shapeIdx + 1) % SHAPES.length]
    if (nextShape === 'diamond') return 45 * progress
    return 0
  }

  getScale(index: number): number {
    const progress = this.progresses[index]()
    // Slight bounce during morph
    if (progress > 0 && progress < 1) {
      return 0.9 + 0.2 * Math.sin(progress * Math.PI)
    }
    return 1
  }

  getOpacity(index: number): number {
    const progress = this.progresses[index]()
    if (progress > 0 && progress < 1) {
      return 0.7 + 0.3 * Math.sin(progress * Math.PI)
    }
    return 1
  }
}
