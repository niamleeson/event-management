import Component from '@glimmer/component'
import { action } from '@ember/object'
import { tracked } from '@glimmer/tracking'
import { TrackedSignal, TrackedTween } from '@pulse/ember'
import {
  pulse,
  startLoop,
  cardTweens,
  allEntered,
  isAnimating,
  EntranceTriggered,
  ResetTriggered,
  type CardData,
} from './engine'

// ---------------------------------------------------------------------------
// TrackedCard — holds tracked tweens for a single card
// ---------------------------------------------------------------------------

class TrackedCard {
  card: CardData
  opacity: TrackedTween
  translateY: TrackedTween
  scale: TrackedTween

  constructor(
    card: CardData,
    opacity: TrackedTween,
    translateY: TrackedTween,
    scale: TrackedTween,
  ) {
    this.card = card
    this.opacity = opacity
    this.translateY = translateY
    this.scale = scale
  }

  get style(): string {
    return [
      `opacity: ${this.opacity.value}`,
      `transform: translateY(${this.translateY.value}px) scale(${this.scale.value})`,
      `border-left: 4px solid ${this.card.color}`,
    ].join('; ')
  }

  destroy(): void {
    this.opacity.destroy()
    this.translateY.destroy()
    this.scale.destroy()
  }
}

// ---------------------------------------------------------------------------
// StaggeredCardsApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class StaggeredCardsApp extends Component {
  trackedCards: TrackedCard[]
  allEnteredSignal: TrackedSignal<boolean>
  animatingSignal: TrackedSignal<boolean>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()

    this.trackedCards = cardTweens.map((ct) => {
      const opacity = pulse.createTween(ct.opacity)
      const translateY = pulse.createTween(ct.translateY)
      const scale = pulse.createTween(ct.scale)
      return new TrackedCard(ct.card, opacity, translateY, scale)
    })

    this.allEnteredSignal = pulse.createSignal(allEntered)
    this.animatingSignal = pulse.createSignal(isAnimating)
  }

  get canTrigger(): boolean {
    return !this.animatingSignal.value && !this.allEnteredSignal.value
  }

  get showSuccessMessage(): boolean {
    return this.allEnteredSignal.value
  }

  @action
  triggerEntrance(): void {
    pulse.emit(EntranceTriggered, undefined)
  }

  @action
  reset(): void {
    pulse.emit(ResetTriggered, undefined)
    // Reset tween visual state — in a real app you would also reset
    // the tween internal state or recreate them
  }

  willDestroy(): void {
    super.willDestroy()
    for (const tc of this.trackedCards) {
      tc.destroy()
    }
    this.allEnteredSignal.destroy()
    this.animatingSignal.destroy()
  }
}
