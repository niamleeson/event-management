import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal, TrackedTween } from '@pulse/ember'
import {
  pulse,
  count,
  displayTween,
  IncrementClicked,
  DecrementClicked,
  ResetClicked,
} from './engine'

// ---------------------------------------------------------------------------
// AnimatedCounterApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs
//
// The key pattern: TrackedTween.value updates on every animation frame,
// triggering Ember to re-render the displayed number smoothly.

export default class AnimatedCounterApp extends Component {
  // Discrete count (immediate updates)
  countSignal: TrackedSignal<number>

  // Animated display value (smooth tween)
  tweenedDisplay: TrackedTween

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    this.countSignal = pulse.createSignal(count)
    this.tweenedDisplay = pulse.createTween(displayTween)
  }

  get displayValue(): string {
    return this.tweenedDisplay.value.toFixed(1)
  }

  get isAnimating(): boolean {
    return this.tweenedDisplay.active
  }

  get progressPercent(): string {
    return `${(this.tweenedDisplay.progress * 100).toFixed(0)}%`
  }

  get isZero(): boolean {
    return this.countSignal.value === 0
  }

  @action
  increment(): void {
    pulse.emit(IncrementClicked, undefined)
  }

  @action
  decrement(): void {
    pulse.emit(DecrementClicked, undefined)
  }

  @action
  reset(): void {
    pulse.emit(ResetClicked, undefined)
  }

  willDestroy(): void {
    super.willDestroy()
    this.countSignal.destroy()
    this.tweenedDisplay.destroy()
  }
}
