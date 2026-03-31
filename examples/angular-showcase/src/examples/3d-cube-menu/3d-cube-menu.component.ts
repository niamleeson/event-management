import { Component, type WritableSignal, OnInit, OnDestroy, HostListener } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, FACES, DragStart, DragEnd, SnapToFace, SelectFace, RotXChanged, RotYChanged, SelectedFaceChanged, GlowChanged, updateTargetRot, getTargetRotX, getTargetRotY } from './engine'

@Component({
  selector: 'app-3d-cube-menu',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">3D Cube Menu</h1>
      <p class="subtitle">Drag to rotate. Release to snap to nearest face. Click buttons to navigate.</p>
      <div class="scene" (mousedown)="onMouseDown($event)">
        <div class="cube" [style.transform]="'rotateX(' + rotX() + 'deg) rotateY(' + rotY() + 'deg)'">
          @for (face of faces; track $index; let i = $index) {
            <div class="face face-{{ i }}" [style.background]="face.color" [class.selected]="selected() === i" [style.box-shadow]="selected() === i ? '0 0 ' + (20 + glow() * 20) + 'px ' + face.color : 'none'">
              <span class="face-icon">{{ face.icon }}</span><span class="face-label">{{ face.label }}</span>
            </div>
          }
        </div>
      </div>
      <div class="nav-buttons">
        @for (face of faces; track $index; let i = $index) {
          <button class="nav-btn" [style.background]="face.color" [class.active]="selected() === i" (click)="goToFace(i)">{{ face.label }}</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #0f0f23; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .title { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 48px; }
    .scene { width: 250px; height: 250px; perspective: 800px; cursor: grab; user-select: none; }
    .scene:active { cursor: grabbing; }
    .cube { width: 250px; height: 250px; position: relative; transform-style: preserve-3d; }
    .face { position: absolute; width: 250px; height: 250px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-weight: 700; backface-visibility: hidden; border: 2px solid rgba(255,255,255,0.15); transition: box-shadow 0.3s; }
    .face.selected { border-color: rgba(255,255,255,0.6); }
    .face-icon { font-size: 48px; margin-bottom: 8px; }
    .face-label { font-size: 20px; }
    .face-0 { transform: translateZ(125px); } .face-1 { transform: rotateY(90deg) translateZ(125px); } .face-2 { transform: rotateY(180deg) translateZ(125px); } .face-3 { transform: rotateY(-90deg) translateZ(125px); } .face-4 { transform: rotateX(-90deg) translateZ(125px); } .face-5 { transform: rotateX(90deg) translateZ(125px); }
    .nav-buttons { display: flex; gap: 8px; margin-top: 48px; flex-wrap: wrap; justify-content: center; }
    .nav-btn { padding: 8px 16px; border: none; border-radius: 8px; color: #fff; font-weight: 600; font-size: 13px; cursor: pointer; opacity: 0.6; transition: opacity 0.2s, transform 0.2s; }
    .nav-btn:hover { opacity: 0.85; } .nav-btn.active { opacity: 1; transform: scale(1.1); }
  `],
})
export class ThreeDCubeMenuComponent implements OnInit, OnDestroy {
  faces = FACES
  rotX = this.pulse.use(RotXChanged, 0)
  rotY = this.pulse.use(RotYChanged, 0)
  selected = this.pulse.use(SelectedFaceChanged, 0)
  glow = this.pulse.use(GlowChanged, 0)

  private dragging = false
  private lastX = 0; private lastY = 0

  constructor(private pulse: PulseService) {}

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
    this.pulse.emit(SnapToFace, 0)
    this.pulse.emit(SelectFace, 0)
  }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }

  onMouseDown(e: MouseEvent): void {
    this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY
    this.pulse.emit(DragStart, { x: e.clientX, y: e.clientY })
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.dragging) return
    const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY
    this.lastX = e.clientX; this.lastY = e.clientY
    updateTargetRot(getTargetRotX() - dy * 0.5, getTargetRotY() + dx * 0.5)
  }

  @HostListener('window:mouseup')
  onMouseUp(): void { if (!this.dragging) return; this.dragging = false; this.pulse.emit(DragEnd, undefined) }
  goToFace(index: number): void { this.pulse.emit(SnapToFace, index); this.pulse.emit(SelectFace, index) }
}
