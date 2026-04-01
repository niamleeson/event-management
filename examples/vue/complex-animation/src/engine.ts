// DAG
// PageLoaded ──→ CardEnter[i] (staggered)
// CardEntered[i] (join all) ──→ AllCardsEntered
// AllCardsEntered ──→ WelcomeFadeStart
//                 └──→ AllEnteredChanged
// HoverCard[i] ──→ HoverSignalChanged
// UnhoverCard[i] ──→ HoverSignalChanged

import { createEngine, type EventType } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CARD_COUNT = 6

export interface CardData {
  id: number
  title: string
  description: string
  color: string
  icon: string
}

export const CARDS: CardData[] = [
  { id: 0, title: 'Lightning Fast', description: 'Reactive event-driven architecture for blazing performance', color: '#4361ee', icon: '\u26A1' },
  { id: 1, title: 'Type Safe', description: 'Full TypeScript support with precise type inference', color: '#7209b7', icon: '\uD83D\uDEE1' },
  { id: 2, title: 'Composable', description: 'Build complex flows from simple, reusable primitives', color: '#f72585', icon: '\uD83E\uDDE9' },
  { id: 3, title: 'Animated', description: 'Built-in tweens and springs for fluid animations', color: '#4cc9f0', icon: '\u2728' },
  { id: 4, title: 'Async Ready', description: 'First-class async handling with cancellation and retry', color: '#2a9d8f', icon: '\uD83D\uDD04' },
  { id: 5, title: 'Framework Agnostic', description: 'Works with React, Vue, Solid, and more', color: '#e76f51', icon: '\uD83C\uDF10' },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const PageLoaded = engine.event<void>('PageLoaded')
export const AllCardsEntered = engine.event<void>('AllCardsEntered')
export const WelcomeFadeStart = engine.event<void>('WelcomeFadeStart')
export const WelcomeFadeDone = engine.event<void>('WelcomeFadeDone')

// Per-card events
export const CardEnter: EventType<number>[] = []
export const CardEntered: EventType<number>[] = []
export const HoverCard: EventType<number>[] = []
export const UnhoverCard: EventType<number>[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  CardEnter.push(engine.event<number>(`CardEnter_${i}`))
  CardEntered.push(engine.event<number>(`CardEntered_${i}`))
  HoverCard.push(engine.event<number>(`HoverCard_${i}`))
  UnhoverCard.push(engine.event<number>(`UnhoverCard_${i}`))
}

// ---------------------------------------------------------------------------
// Pipe: PageLoaded -> staggered CardEnter events
// Each card fires after a delay, creating a cascade effect
// ---------------------------------------------------------------------------

engine.on(PageLoaded, () => {
  for (let i = 0; i < CARD_COUNT; i++) {
    setTimeout(() => {
      engine.emit(CardEnter[i], i)
    }, i * 150) // 150ms stagger between each card
  }
})

// ---------------------------------------------------------------------------
// Per-card tweens: opacity and translateY for entrance
// ---------------------------------------------------------------------------

export const cardOpacity: any[] = []
export const cardTranslateY: any[] = []
export const cardHoverScale: any[] = []
export const cardHoverShadow: any[] = []

for (let i = 0; i < CARD_COUNT; i++) {
  // Entrance opacity: 0 -> 1
  let opacity = { value: 0, active: false }
const OpacityVal = engine.event<number>('OpacityVal')
{
  const _tc = {
    start: CardEnter[i],
    done: CardEntered[i],
    from: 0,
    to: 1,
    duration: 500,
    easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
  }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; opacity.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!opacity.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      opacity.value = f + (t - f) * _te(p)
      engine.emit(OpacityVal, opacity.value)
      if (p >= 1) { opacity.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { opacity.active = false })) }
}
  cardOpacity.push(opacity)

  // Entrance translateY: 40px -> 0px
  let translateY = { value: 0, active: false }
const TranslateYVal = engine.event<number>('TranslateYVal')
{
  const _tc = {
    start: CardEnter[i],
    from: 40,
    to: 0,
    duration: 500,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; translateY.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!translateY.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      translateY.value = f + (t - f) * _te(p)
      engine.emit(TranslateYVal, translateY.value)
      if (p >= 1) { translateY.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { translateY.active = false })) }
}
  cardTranslateY.push(translateY)

  // Hover scale: driven by hover/unhover events
  let scale = { value: 0, active: false }
const ScaleVal = engine.event<number>('ScaleVal')
{
  const _tc = {
    start: HoverCard[i],
    cancel: UnhoverCard[i],
    from: 1,
    to: 1.05,
    duration: 200,
    easing: (t: number) => t * (2 - t), // easeOutQuad
  }
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; scale.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!scale.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      scale.value = f + (t - f) * _te(p)
      engine.emit(ScaleVal, scale.value)
      if (p >= 1) { scale.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { scale.active = false })) }
}
  cardHoverScale.push(scale)

  // Hover shadow: spring-driven for smooth tracking
  let hoverSignal = 0
const HoverSignalChanged = engine.event('HoverSignalChanged')
engine.on(HoverCard[i], [HoverSignalChanged], (_payload, setSignal) => {
  hoverSignal = 20
  setSignal(hoverSignal)
})
  engine.on(UnhoverCard[i], [HoverSignalChanged], (_payload, setSignal) => {
  hoverSignal = 0
  setSignal(hoverSignal)
})
  let shadow = { value: 0, velocity: 0, settled: true }
const ShadowVal = engine.event<number>('ShadowVal')
{
  const _sc = {
    stiffness: 300,
    damping: 20,
    restThreshold: 0.1,
  }
  let _sv = 0, _sa = false
  function _ss() {
    if (_sa) return; _sa = true
    let _sl = performance.now()
    function _st(now: number) {
      if (!_sa) return
      const dt = Math.min((now - _sl) / 1000, 0.064); _sl = now
      const tgt = hoverSignal
      const tgtVal = typeof tgt === 'number' ? tgt : (tgt?.value ?? 0)
      const dx = shadow.value - tgtVal
      const sf = -(_sc.stiffness ?? 170) * dx
      const df = -(_sc.damping ?? 26) * _sv
      _sv += (sf + df) * dt
      shadow.value += _sv * dt
      shadow.velocity = _sv
      engine.emit(ShadowVal, shadow.value)
      const rt = _sc.restThreshold ?? 0.01
      if (Math.abs(dx) < rt && Math.abs(_sv) < rt) {
        shadow.value = tgtVal; _sv = 0; _sa = false; shadow.settled = true
        engine.emit(ShadowVal, shadow.value)
        if (_sc.done) engine.emit(_sc.done, undefined)
        return
      }
      shadow.settled = false
      requestAnimationFrame(_st)
    }
    requestAnimationFrame(_st)
  }
  engine.on(HoverSignalChanged, () => _ss())
}
  cardHoverShadow.push(shadow)
}

// ---------------------------------------------------------------------------
// Join: all CardEntered -> AllCardsEntered
// Fires when every card has completed its entrance animation
// ---------------------------------------------------------------------------

{
  const _ji = CardEntered
  const _jr = new Set<number>()
  const _jc = {
    do: () => undefined,
  }
  _ji.forEach((e: any, i: number) => engine.on(e, () => {
    _jr.add(i)
    if (_jr.size === _ji.length) { _jr.clear(); engine.emit(AllCardsEntered, _jc.do()) }
  }))
}

// After all cards enter, trigger welcome fade
engine.on(AllCardsEntered, [WelcomeFadeStart], (_payload, setFade) => {
  setFade(undefined)
})

// ---------------------------------------------------------------------------
// Welcome message tween
// ---------------------------------------------------------------------------

export let welcomeOpacity = { value: 0, active: false }
export const WelcomeOpacityVal = engine.event<number>('WelcomeOpacityVal')
{
  const _tc = {
  start: WelcomeFadeStart,
  done: WelcomeFadeDone,
  from: 0,
  to: 1,
  duration: 800,
  easing: (t: number) => t * t * (3 - 2 * t), // smoothstep
}
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; welcomeOpacity.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!welcomeOpacity.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      welcomeOpacity.value = f + (t - f) * _te(p)
      engine.emit(WelcomeOpacityVal, welcomeOpacity.value)
      if (p >= 1) { welcomeOpacity.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { welcomeOpacity.active = false })) }
}

export let welcomeTranslateY = { value: 0, active: false }
export const WelcomeTranslateYVal = engine.event<number>('WelcomeTranslateYVal')
{
  const _tc = {
  start: WelcomeFadeStart,
  from: 20,
  to: 0,
  duration: 800,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
}
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; welcomeTranslateY.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!welcomeTranslateY.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      welcomeTranslateY.value = f + (t - f) * _te(p)
      engine.emit(WelcomeTranslateYVal, welcomeTranslateY.value)
      if (p >= 1) { welcomeTranslateY.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { welcomeTranslateY.active = false })) }
}

// ---------------------------------------------------------------------------
// Signals to track state
// ---------------------------------------------------------------------------

export let allEntered = false
export const AllEnteredChanged = engine.event('AllEnteredChanged')
engine.on(AllCardsEntered, [AllEnteredChanged], (_payload, setEntered) => {
  allEntered = true
  setEntered(allEntered)
})

// Start the frame loop for animations

export function startLoop() {}
export function stopLoop() {}
