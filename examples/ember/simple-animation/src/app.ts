import Component from '@glimmer/component'
import { action } from '@ember/object'
import { type PulseBinding } from '@pulse/ember'
import {
  pulse,
  startLoop,
  Increment,
  Decrement,
  CountChanged,
  AnimatedCountChanged,
  ColorIntensityChanged,
  BounceScaleChanged,
} from './engine'

// ---------------------------------------------------------------------------
// AnimatedCounterApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs
//
// The key pattern: PulseBinding<number> for AnimatedCountChanged updates
// on every animation frame, triggering Ember to re-render the displayed
// number smoothly.

export default class AnimatedCounterApp extends Component {
  // Discrete count (immediate updates)
  countBinding: PulseBinding<number>

  // Animated display value (smooth easing via Frame loop)
  animatedCount: PulseBinding<number>

  // Color intensity for visual feedback
  colorIntensity: PulseBinding<number>

  // Bounce scale for spring animation
  bounceScale: PulseBinding<number>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()
    this.countBinding = pulse.bind(CountChanged, 0)
    this.animatedCount = pulse.bind(AnimatedCountChanged, 0)
    this.colorIntensity = pulse.bind(ColorIntensityChanged, 0)
    this.bounceScale = pulse.bind(BounceScaleChanged, 1)
  }

  get displayValue(): string {
    return this.animatedCount.value.toFixed(1)
  }

  get isZero(): boolean {
    return this.countBinding.value === 0
  }

  get scaleTransform(): string {
    const s = this.bounceScale.value
    return `scale(${s.toFixed(3)})`
  }

  @action
  increment(): void {
    pulse.emit(Increment, undefined)
  }

  @action
  decrement(): void {
    pulse.emit(Decrement, undefined)
  }

  willDestroy(): void {
    super.willDestroy()
    this.countBinding.destroy()
    this.animatedCount.destroy()
    this.colorIntensity.destroy()
    this.bounceScale.destroy()
  }
}
