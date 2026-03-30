import { Component, computed, type WritableSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  Increment,
  Decrement,
  Reset,
  counterSig,
  counterTween,
  isAnimatingSig,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>Animated Counter</h1>
      <p class="subtitle">Tween-powered smooth number transitions</p>

      <div class="display" [class.animating]="isAnimating()">
        <span class="number">{{ displayValue() }}</span>
        <span class="actual">(actual: {{ counter() }})</span>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          [style.width.%]="progressWidth()"
        ></div>
      </div>

      <div class="controls">
        <button class="btn decrement" (click)="decrement()">-</button>
        <button class="btn increment" (click)="increment()">+</button>
      </div>

      <div class="controls secondary">
        <button (click)="incrementBy(5)">+5</button>
        <button (click)="incrementBy(10)">+10</button>
        <button (click)="incrementBy(50)">+50</button>
        <button class="reset" (click)="reset()">Reset</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 { margin-bottom: 0.25rem; }
    .subtitle { color: #888; margin-bottom: 1.5rem; font-size: 0.9rem; }
    .display {
      padding: 2rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      background: #f8f9fa;
      transition: background 0.3s;
    }
    .display.animating {
      background: #e8f4fd;
    }
    .number {
      display: block;
      font-size: 4rem;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }
    .actual {
      display: block;
      font-size: 0.85rem;
      color: #aaa;
      margin-top: 0.5rem;
    }
    .progress-bar {
      height: 4px;
      background: #eee;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .progress-fill {
      height: 100%;
      background: #3498db;
      transition: width 0.05s linear;
      border-radius: 2px;
    }
    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .controls.secondary {
      gap: 0.5rem;
    }
    .btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      color: white;
    }
    .increment { background: #27ae60; }
    .decrement { background: #e74c3c; }
    .btn:active { transform: scale(0.95); }
    .controls.secondary button {
      padding: 0.4rem 0.8rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      background: white;
      color: #333;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .controls.secondary button:hover {
      border-color: #3498db;
      color: #3498db;
    }
    .reset {
      border-color: #e74c3c !important;
      color: #e74c3c !important;
    }
  `],
})
export class AppComponent {
  counter: WritableSignal<number>
  tweenValue: WritableSignal<number>
  isAnimating: WritableSignal<boolean>

  displayValue = computed(() => Math.round(this.tweenValue()))
  progressWidth = computed(() => {
    const target = this.counter()
    if (target === 0) return 0
    return Math.min(100, (this.tweenValue() / Math.max(target, 1)) * 100)
  })

  constructor(private pulse: PulseService) {
    this.counter = pulse.signal(counterSig)
    this.tweenValue = pulse.tween(counterTween)
    this.isAnimating = pulse.signal(isAnimatingSig)
  }

  increment(): void {
    this.pulse.emit(Increment, undefined)
  }

  decrement(): void {
    this.pulse.emit(Decrement, undefined)
  }

  incrementBy(n: number): void {
    for (let i = 0; i < n; i++) {
      this.pulse.emit(Increment, undefined)
    }
  }

  reset(): void {
    this.pulse.emit(Reset, undefined)
  }
}
