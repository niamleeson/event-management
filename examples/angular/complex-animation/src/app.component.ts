import { Component, type WritableSignal, signal as ngSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  StartEntrance,
  ResetCards,
  CARDS,
  cardOpacityTweens,
  cardTranslateTweens,
  allEnteredSig,
  entranceCountSig,
  type CardData,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>Staggered Card Entrance</h1>
      <p class="subtitle">Per-card tweens with join detection</p>

      <div class="controls">
        <button (click)="startAnimation()" class="btn-start">
          Animate Entrance
        </button>
        <button (click)="resetAnimation()" class="btn-reset">
          Reset
        </button>
      </div>

      @if (allEntered()) {
        <div class="banner">All cards entered! (run #{{ entranceCount() }})</div>
      }

      <div class="card-grid">
        @for (card of cards; track card.id) {
          <div
            class="card"
            [style.opacity]="cardOpacities[card.id]()"
            [style.transform]="'translateY(' + cardTranslates[card.id]() + 'px)'"
            [style.border-left-color]="card.color"
          >
            <h3 [style.color]="card.color">{{ card.title }}</h3>
            <p>{{ card.description }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: #888;
      margin-bottom: 1.5rem;
    }
    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    .btn-start {
      padding: 0.6rem 1.5rem;
      border: none;
      border-radius: 6px;
      background: #3498db;
      color: white;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-start:hover { background: #2980b9; }
    .btn-reset {
      padding: 0.6rem 1.5rem;
      border: 2px solid #555;
      border-radius: 6px;
      background: transparent;
      color: #ccc;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-reset:hover { border-color: #888; color: white; }
    .banner {
      background: #27ae60;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      display: inline-block;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .card {
      background: #16213e;
      border-radius: 8px;
      padding: 1.25rem;
      text-align: left;
      border-left: 4px solid transparent;
      will-change: transform, opacity;
    }
    .card h3 {
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }
    .card p {
      color: #aaa;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  `],
})
export class AppComponent {
  cards: CardData[] = CARDS
  allEntered: WritableSignal<boolean>
  entranceCount: WritableSignal<number>

  // Per-card Angular signals bridged from Pulse tweens
  cardOpacities: WritableSignal<number>[] = []
  cardTranslates: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    this.allEntered = pulse.signal(allEnteredSig)
    this.entranceCount = pulse.signal(entranceCountSig)

    // Bridge each card's tween pair to Angular signals
    for (let i = 0; i < CARDS.length; i++) {
      this.cardOpacities.push(pulse.tween(cardOpacityTweens[i]))
      this.cardTranslates.push(pulse.tween(cardTranslateTweens[i]))
    }
  }

  startAnimation(): void {
    this.pulse.emit(StartEntrance, undefined)
  }

  resetAnimation(): void {
    // Reset opacity and translate signals back to initial values
    for (let i = 0; i < CARDS.length; i++) {
      this.cardOpacities[i].set(0)
      this.cardTranslates[i].set(40)
    }
    this.pulse.emit(ResetCards, undefined)
  }
}
