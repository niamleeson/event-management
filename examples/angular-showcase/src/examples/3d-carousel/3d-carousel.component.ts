import { Component, type WritableSignal, OnInit, OnDestroy, HostListener } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, ITEMS, ITEM_COUNT, DragStart, DragMove, DragEnd, SelectItem, RotationChanged, SelectedChanged, type CarouselItem } from './engine'

@Component({
  selector: 'app-3d-carousel',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">3D Carousel</h1>
      <p class="subtitle">Auto-rotates. Drag to override. Click to select.</p>
      <div class="scene" (mousedown)="onMouseDown($event)">
        <div class="carousel" [style.transform]="'rotateY(' + rot() + 'deg)'">
          @for (item of items; track item.id; let i = $index) {
            <div class="card" [style.background]="item.color" [style.transform]="getCardTransform(i)" [class.selected]="selected() === i" (click)="selectCard(i, $event)">
              <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
            </div>
          }
        </div>
      </div>
      @if (selected() >= 0) { <div class="selected-info">Selected: <strong>{{ items[selected()].title }}</strong></div> }
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #0f0f23; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .title { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 48px; }
    .scene { width: 100%; max-width: 700px; height: 350px; perspective: 1200px; display: flex; align-items: center; justify-content: center; cursor: grab; user-select: none; }
    .scene:active { cursor: grabbing; }
    .carousel { width: 180px; height: 220px; position: relative; transform-style: preserve-3d; }
    .card { position: absolute; width: 180px; height: 220px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; padding: 20px; box-sizing: border-box; text-align: center; cursor: pointer; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 2px solid transparent; }
    .card.selected { border-color: rgba(255,255,255,0.8); }
    .card h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; }
    .card p { margin: 0; font-size: 13px; opacity: 0.8; }
    .selected-info { margin-top: 32px; color: rgba(255,255,255,0.7); font-size: 16px; }
    .selected-info strong { color: #4361ee; }
  `],
})
export class ThreeDCarouselComponent implements OnInit, OnDestroy {
  items: CarouselItem[] = ITEMS
  rot = this.pulse.use(RotationChanged, 0)
  selected = this.pulse.use(SelectedChanged, -1)
  private dragging = false
  private dragStartX = 0

  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }

  getCardTransform(index: number): string {
    const angle = (360 / ITEM_COUNT) * index
    return `rotateY(${angle}deg) translateZ(320px)`
  }

  onMouseDown(e: MouseEvent): void { this.dragging = true; this.dragStartX = e.clientX; this.pulse.emit(DragStart, e.clientX) }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void { if (!this.dragging) return; this.pulse.emit(DragMove, e.clientX - this.dragStartX) }

  @HostListener('window:mouseup')
  onMouseUp(): void { if (!this.dragging) return; this.dragging = false; this.pulse.emit(DragEnd, undefined) }

  selectCard(index: number, e: MouseEvent): void { e.stopPropagation(); this.pulse.emit(SelectItem, index) }
}
