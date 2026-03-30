import { Component, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  CARDS,
  CARD_COUNT,
  FlipCard,
  HoverCard,
  UnhoverCard,
  flipRotation,
  hoverScale,
  flippedState,
  type CardFace,
} from './engine'

@Component({
  selector: 'app-3d-card-flip',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">3D Card Flip</h1>
      <p class="subtitle">Click to flip cards with tween animation. Hover for spring scale.</p>
      <div class="grid">
        @for (card of cards; track $index; let i = $index) {
          <div
            class="card-container"
            (click)="flip(i)"
            (mouseenter)="hover(i)"
            (mouseleave)="unhover(i)"
            [style.perspective.px]="800"
            [style.transform]="'scale(' + scales[i]() + ')'"
          >
            <div class="card-inner" [style.transform]="'rotateY(' + rotations[i]() + 'deg)'">
              <div class="card-face front" [style.background]="card.front.color">
                <span class="card-label">{{ card.front.title }}</span>
              </div>
              <div class="card-face back" [style.background]="card.back.color">
                <span class="card-label">{{ card.back.title }}</span>
              </div>
            </div>
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
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 48px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 160px);
      grid-template-rows: repeat(2, 200px);
      gap: 20px;
    }
    .card-container {
      cursor: pointer;
    }
    .card-inner {
      width: 160px;
      height: 200px;
      position: relative;
      transform-style: preserve-3d;
      transition: none;
    }
    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      backface-visibility: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .back {
      transform: rotateY(180deg);
    }
    .card-label {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  `],
})
export class ThreeDCardFlipComponent implements OnInit, OnDestroy {
  cards: CardFace[] = CARDS
  rotations: WritableSignal<number>[] = []
  scales: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    for (let i = 0; i < CARD_COUNT; i++) {
      this.rotations.push(pulse.tween(flipRotation[i]))
      this.scales.push(pulse.spring(hoverScale[i]))
    }
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  flip(index: number): void {
    this.pulse.emit(FlipCard[index], index)
  }

  hover(index: number): void {
    this.pulse.emit(HoverCard[index], index)
  }

  unhover(index: number): void {
    this.pulse.emit(UnhoverCard[index], index)
  }
}
