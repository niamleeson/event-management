import { createEngine } from '@pulse/core'
import type { Engine, EventType, TweenValue, SpringValue, Signal } from '@pulse/core'

export const engine = createEngine()
engine.startFrameLoop()

/* ------------------------------------------------------------------ */
/*  Card data                                                         */
/* ------------------------------------------------------------------ */

export const CARDS = [
  { title: 'Aurora', color: '#6c5ce7', desc: 'Northern lights dancing across the sky', views: 2340, likes: 891 },
  { title: 'Nebula', color: '#00b894', desc: 'A stellar nursery of gas and dust', views: 1856, likes: 723 },
  { title: 'Eclipse', color: '#e17055', desc: 'When the moon embraces the sun', views: 3102, likes: 1247 },
  { title: 'Cascade', color: '#0984e3', desc: 'Water falling through mountain rock', views: 1543, likes: 602 },
  { title: 'Ember', color: '#d63031', desc: 'The last glow of a dying fire', views: 2018, likes: 834 },
  { title: 'Glacier', color: '#00cec9', desc: 'Ancient ice meeting the warming sea', views: 1789, likes: 695 },
  { title: 'Monsoon', color: '#a29bfe', desc: 'Seasonal rains that reshape the land', views: 2567, likes: 978 },
  { title: 'Zenith', color: '#fdcb6e', desc: 'The highest point in the celestial sphere', views: 1934, likes: 756 },
]

/* ------------------------------------------------------------------ */
/*  Per-card events, tweens, springs                                  */
/* ------------------------------------------------------------------ */

export interface CardAnimations {
  CardClicked: EventType<number>
  CardFlipped: EventType<{ index: number; flipped: boolean }>
  CardFlipDone: EventType<number>
  HoverIn: EventType<number>
  HoverOut: EventType<number>
  flipTweens: TweenValue[]
  unflipTweens: TweenValue[]
  hoverTargets: Signal<number>[]
  hoverSprings: SpringValue[]
  flippedStates: boolean[]
}

function createCardAnimations(eng: Engine): CardAnimations {
  const CardClicked = eng.event<number>('CardClicked')
  const CardFlipped = eng.event<{ index: number; flipped: boolean }>('CardFlipped')
  const CardFlipDone = eng.event<number>('CardFlipDone')
  const HoverIn = eng.event<number>('HoverIn')
  const HoverOut = eng.event<number>('HoverOut')

  const flipStarts: EventType[] = []
  const unflipStarts: EventType[] = []
  const flipTweens: TweenValue[] = []
  const unflipTweens: TweenValue[] = []
  const hoverTargets: Signal<number>[] = []
  const hoverSprings: SpringValue[] = []
  const flippedStates: boolean[] = []

  for (let i = 0; i < 8; i++) {
    const flipStart = eng.event(`FlipStart_${i}`)
    const flipDone = eng.event(`FlipDone_${i}`)
    const unflipStart = eng.event(`UnflipStart_${i}`)
    const unflipDone = eng.event(`UnflipDone_${i}`)

    flipStarts.push(flipStart)
    unflipStarts.push(unflipStart)

    const ft = eng.tween({
      start: flipStart,
      done: flipDone,
      cancel: unflipStart,
      from: 0,
      to: 180,
      duration: 600,
      easing: 'easeOutBack',
    })
    flipTweens.push(ft)

    const uft = eng.tween({
      start: unflipStart,
      done: unflipDone,
      cancel: flipStart,
      from: 180,
      to: 0,
      duration: 600,
      easing: 'easeOutBack',
    })
    unflipTweens.push(uft)

    eng.on(flipDone, () => eng.emit(CardFlipDone, i))
    eng.on(unflipDone, () => eng.emit(CardFlipDone, i))

    const ht = eng.signal(HoverIn, 1.0 as number, (prev, idx) => idx === i ? 1.05 : prev)
    eng.signalUpdate(ht, HoverOut, (prev, idx) => idx === i ? 1.0 : prev)
    hoverTargets.push(ht)

    const hs = eng.spring(ht, { stiffness: 300, damping: 20 })
    hoverSprings.push(hs)

    flippedStates.push(false)
  }

  eng.on(CardClicked, (index) => {
    const isFlipped = flippedStates[index]
    if (isFlipped) {
      eng.emit(unflipStarts[index], undefined)
    } else {
      eng.emit(flipStarts[index], undefined)
    }
    flippedStates[index] = !isFlipped
    eng.emit(CardFlipped, { index, flipped: !isFlipped })
  })

  return { CardClicked, CardFlipped, CardFlipDone, HoverIn, HoverOut, flipTweens, unflipTweens, hoverTargets, hoverSprings, flippedStates }
}

export const anims = createCardAnimations(engine)
