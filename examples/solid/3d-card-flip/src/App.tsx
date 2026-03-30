import { For } from 'solid-js'
import { useEmit, useTween, useSpring } from '@pulse/solid'
import type { Engine, EventType, TweenValue, SpringValue, Signal } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Card data                                                         */
/* ------------------------------------------------------------------ */

const CARDS = [
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

interface CardAnimations {
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

const anims = createCardAnimations(engine)

/* ------------------------------------------------------------------ */
/*  Card component                                                    */
/* ------------------------------------------------------------------ */

function Card(props: { index: number }) {
  const emit = useEmit()
  const card = CARDS[props.index]

  const flipVal = useTween(anims.flipTweens[props.index])
  const unflipVal = useTween(anims.unflipTweens[props.index])
  const scale = useSpring(anims.hoverSprings[props.index])

  const rotation = () => {
    if (anims.flipTweens[props.index].active) return flipVal()
    if (anims.unflipTweens[props.index].active) return unflipVal()
    return anims.flippedStates[props.index] ? 180 : 0
  }

  return (
    <div
      style={{
        perspective: '1000px',
        width: '260px',
        height: '340px',
        cursor: 'pointer',
      }}
      onClick={() => emit(anims.CardClicked, props.index)}
      onMouseEnter={() => emit(anims.HoverIn, props.index)}
      onMouseLeave={() => emit(anims.HoverOut, props.index)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          'transform-style': 'preserve-3d',
          transform: `scale(${scale()}) rotateY(${rotation()}deg)`,
          transition: 'box-shadow 0.2s',
          'border-radius': '16px',
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            'backface-visibility': 'hidden',
            'border-radius': '16px',
            background: `linear-gradient(145deg, ${card.color}dd, ${card.color}88)`,
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '140px',
              height: '140px',
              'border-radius': '12px',
              background: `linear-gradient(135deg, ${card.color}44, ${card.color})`,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': '48px',
              'margin-bottom': '20px',
            }}
          >
            {card.title[0]}
          </div>
          <h3 style={{ color: '#fff', 'font-size': '22px', 'font-weight': '700', 'letter-spacing': '1px' }}>
            {card.title}
          </h3>
        </div>

        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            'backface-visibility': 'hidden',
            'border-radius': '16px',
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            transform: 'rotateY(180deg)',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
            padding: '24px',
            gap: '16px',
          }}
        >
          <h3 style={{ color: card.color, 'font-size': '20px', 'font-weight': '700' }}>
            {card.title}
          </h3>
          <p style={{ color: '#ccc', 'font-size': '14px', 'text-align': 'center', 'line-height': '1.6', 'max-width': '200px' }}>
            {card.desc}
          </p>
          <div style={{ display: 'flex', gap: '24px', 'margin-top': '8px' }}>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ color: card.color, 'font-size': '24px', 'font-weight': '700' }}>
                {card.views.toLocaleString()}
              </div>
              <div style={{ color: '#888', 'font-size': '11px', 'text-transform': 'uppercase', 'letter-spacing': '1px' }}>
                Views
              </div>
            </div>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ color: card.color, 'font-size': '24px', 'font-weight': '700' }}>
                {card.likes.toLocaleString()}
              </div>
              <div style={{ color: '#888', 'font-size': '11px', 'text-transform': 'uppercase', 'letter-spacing': '1px' }}>
                Likes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <div>
      <h1 style={{ color: '#fff', 'text-align': 'center', 'margin-bottom': '32px', 'font-size': '28px', 'font-weight': '300', 'letter-spacing': '2px' }}>
        3D Card Flip Gallery
      </h1>
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(4, 260px)',
          gap: '24px',
        }}
      >
        <For each={CARDS}>
          {(_, i) => <Card index={i()} />}
        </For>
      </div>
    </div>
  )
}
