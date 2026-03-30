import { Component, computed, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  Increment,
  Decrement,
  count,
  animatedCount,
  colorIntensity,
  bounceScale,
} from './engine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): string {
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function getBackgroundColor(intensity: number): string {
  if (intensity <= 0) {
    const t = Math.abs(intensity)
    return lerpColor(248, 249, 250, 255, 200, 200, t)
  } else {
    return lerpColor(248, 249, 250, 200, 255, 210, intensity)
  }
}

function getTextColor(intensity: number): string {
  if (intensity <= -0.3) return '#c0392b'
  if (intensity >= 0.3) return '#27ae60'
  return '#1a1a2e'
}

@Component({
  selector: 'app-simple-animation',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div
      class="page"
      [style.background]="bgColor()"
    >
      <h1 class="title">Animated Counter</h1>
      <p class="subtitle">Tweens smoothly animate the count and background color</p>

      <div class="counter-area" [style.transform]="'scale(' + bounce() + ')'">
        <div class="counter-number" [style.color]="textColor()">
          {{ displayCount() }}
        </div>
        <div class="counter-detail">
          actual: {{ currentCount() }} | animated: {{ animCount().toFixed(1) }}
        </div>
      </div>

      <div class="buttons">
        <button class="btn decrement" (click)="decrement()">-</button>
        <button class="btn increment" (click)="increment()">+</button>
      </div>

      <p class="hint">
        Color shifts green for positive, red for negative (saturates at +/-10)
      </p>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background 0.1s;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 48px;
    }
    .counter-area {
      margin-bottom: 48px;
    }
    .counter-number {
      font-size: 120px;
      font-weight: 800;
      line-height: 1;
      text-align: center;
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;
      user-select: none;
    }
    .counter-detail {
      text-align: center;
      font-size: 14px;
      color: #aaa;
      margin-top: 8px;
    }
    .buttons {
      display: flex;
      gap: 16px;
    }
    .btn {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      border: none;
      color: #fff;
      font-size: 36px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn:active {
      transform: scale(0.95);
    }
    .decrement {
      background: #e63946;
      box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
    }
    .increment {
      background: #4361ee;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }
    .hint {
      margin-top: 48px;
      color: #bbb;
      font-size: 13px;
    }
  `],
})
export class SimpleAnimationComponent implements OnInit, OnDestroy {
  currentCount: WritableSignal<number>
  animCount: WritableSignal<number>
  colorT: WritableSignal<number>
  bounce: WritableSignal<number>

  displayCount = computed(() => Math.round(this.animCount()))

  bgColor = computed(() => getBackgroundColor(this.colorT()))
  textColor = computed(() => getTextColor(this.colorT()))

  constructor(private pulse: PulseService) {
    this.currentCount = pulse.signal(count)
    this.animCount = pulse.tween(animatedCount)
    this.colorT = pulse.tween(colorIntensity)
    this.bounce = pulse.tween(bounceScale)
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
    engine.destroy()
  }

  increment(): void {
    this.pulse.emit(Increment, undefined)
  }

  decrement(): void {
    this.pulse.emit(Decrement, undefined)
  }
}
