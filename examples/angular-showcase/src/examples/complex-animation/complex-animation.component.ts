import { Component, type WritableSignal, AfterViewInit, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  CARDS,
  CARD_COUNT,
  PageLoaded,
  HoverCard,
  UnhoverCard,
  cardOpacity,
  cardTranslateY,
  cardHoverScale,
  cardHoverShadow,
  welcomeOpacity,
  welcomeTranslateY,
  allEntered,
  type CardData,
} from './engine'

@Component({
  selector: 'app-complex-animation',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <div class="wrapper">
        <div class="header">
          <h1 class="title">Staggered Card Entrance</h1>
          <p class="subtitle">
            Cards cascade in with staggered tweens. Hover for spring-driven
            shadows. A join rule fires after all cards enter.
          </p>
        </div>

        <div class="card-grid">
          @for (card of cards; track card.id; let i = $index) {
            <div
              class="card"
              [style.opacity]="cardOpacities[i]()"
              [style.transform]="'translateY(' + cardTranslates[i]() + 'px) scale(' + cardScales[i]() + ')'"
              [style.box-shadow]="'0 ' + (2 + cardShadows[i]() * 0.5) + 'px ' + (8 + cardShadows[i]()) + 'px rgba(0,0,0,' + (0.06 + cardShadows[i]() * 0.008) + ')'"
              [style.border-top]="'4px solid ' + card.color"
              (mouseenter)="onHover(i)"
              (mouseleave)="onUnhover(i)"
            >
              <div class="card-icon">{{ card.icon }}</div>
              <h3 class="card-title">{{ card.title }}</h3>
              <p class="card-desc">{{ card.description }}</p>
            </div>
          }
        </div>

        @if (allEnteredSig() || welcomeOp() > 0) {
          <div
            class="welcome"
            [style.opacity]="welcomeOp()"
            [style.transform]="'translateY(' + welcomeTy() + 'px)'"
          >
            <h2 class="welcome-title">Welcome to Pulse</h2>
            <p class="welcome-text">
              All {{ cardCount }} cards have entered — this message was triggered by a join rule
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 60px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .wrapper {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    .title {
      font-size: 42px;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0;
    }
    .subtitle {
      color: #6c757d;
      font-size: 16px;
      margin-top: 8px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 28px;
      cursor: pointer;
      transition: box-shadow 0.05s;
    }
    .card-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .card-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    .card-desc {
      margin: 0;
      font-size: 14px;
      color: #6c757d;
      line-height: 1.5;
    }
    .welcome {
      text-align: center;
      margin-top: 48px;
      padding: 32px 24px;
      background: linear-gradient(135deg, #4361ee 0%, #7209b7 100%);
      border-radius: 16px;
      color: #fff;
    }
    .welcome-title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .welcome-text {
      margin: 8px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
  `],
})
export class ComplexAnimationComponent implements AfterViewInit, OnInit, OnDestroy {
  cards: CardData[] = CARDS
  cardCount = CARD_COUNT

  allEnteredSig: WritableSignal<boolean>

  // Per-card Angular signals bridged from Pulse tweens/springs
  cardOpacities: WritableSignal<number>[] = []
  cardTranslates: WritableSignal<number>[] = []
  cardScales: WritableSignal<number>[] = []
  cardShadows: WritableSignal<number>[] = []

  welcomeOp: WritableSignal<number>
  welcomeTy: WritableSignal<number>

  constructor(private pulse: PulseService) {
    this.allEnteredSig = pulse.signal(allEntered)
    this.welcomeOp = pulse.tween(welcomeOpacity)
    this.welcomeTy = pulse.tween(welcomeTranslateY)

    // Bridge each card's tween/spring to Angular signals
    for (let i = 0; i < CARD_COUNT; i++) {
      this.cardOpacities.push(pulse.tween(cardOpacity[i]))
      this.cardTranslates.push(pulse.tween(cardTranslateY[i]))
      this.cardScales.push(pulse.tween(cardHoverScale[i]))
      this.cardShadows.push(pulse.spring(cardHoverShadow[i]))
    }
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
  }

  ngAfterViewInit(): void {
    // Fire PageLoaded after a small delay to ensure everything is mounted
    setTimeout(() => {
      this.pulse.emit(PageLoaded, undefined)
    }, 300)
  }

  onHover(index: number): void {
    this.pulse.emit(HoverCard[index], index)
  }

  onUnhover(index: number): void {
    this.pulse.emit(UnhoverCard[index], index)
  }
}
