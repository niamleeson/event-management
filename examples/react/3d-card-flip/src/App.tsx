import { useEmit, useTween, useSpring } from '@pulse/react'
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
  flipTweens: TweenValue[]          // 0->180 tweens
  unflipTweens: TweenValue[]        // 180->0 tweens
  hoverTargets: Signal<number>[]    // 1.0 or 1.05
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

    // When flip/unflip done, emit CardFlipDone
    eng.on(flipDone, () => eng.emit(CardFlipDone, i))
    eng.on(unflipDone, () => eng.emit(CardFlipDone, i))

    // Hover spring: signal target tracks hover state
    const ht = eng.signal(HoverIn, 1.0 as number, (prev: number, idx: number) => idx === i ? 1.05 : prev)
    eng.signalUpdate(ht, HoverOut, (prev: number, idx: number) => idx === i ? 1.0 : prev)
    hoverTargets.push(ht)

    const hs = eng.spring(ht, { stiffness: 300, damping: 20 })
    hoverSprings.push(hs)

    flippedStates.push(false)
  }

  // Route CardClicked -> per-card flip/unflip start
  eng.on(CardClicked, (index: number) => {
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

/* ------------------------------------------------------------------ */
/*  Singleton animations                                              */
/* ------------------------------------------------------------------ */

const anims = createCardAnimations(engine)

/* ------------------------------------------------------------------ */
/*  Card component                                                    */
/* ------------------------------------------------------------------ */

function Card({ index }: { index: number }) {
  const emit = useEmit()
  const card = CARDS[index]

  const flipVal = useTween(anims.flipTweens[index])
  const unflipVal = useTween(anims.unflipTweens[index])
  const scale = useSpring(anims.hoverSprings[index])

  // Determine actual rotation: if flip tween is active, use it; if unflip is active, use it
  const flipActive = anims.flipTweens[index].active
  const unflipActive = anims.unflipTweens[index].active

  let rotation: number
  if (flipActive) {
    rotation = flipVal
  } else if (unflipActive) {
    rotation = unflipVal
  } else {
    // At rest: use whichever has the non-default value
    rotation = anims.flippedStates[index] ? 180 : 0
  }

  return (
    <div
      style={{
        perspective: '1000px',
        width: 260,
        height: 340,
        cursor: 'pointer',
      }}
      onClick={() => emit(anims.CardClicked, index)}
      onMouseEnter={() => emit(anims.HoverIn, index)}
      onMouseLeave={() => emit(anims.HoverOut, index)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `scale(${scale}) rotateY(${rotation}deg)`,
          transition: 'box-shadow 0.2s',
          borderRadius: 16,
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: 16,
            background: `linear-gradient(145deg, ${card.color}dd, ${card.color}88)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: 24,
          }}
        >
          {/* Image placeholder */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${card.color}44, ${card.color})`,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              marginBottom: 20,
            }}
          >
            {card.title[0]}
          </div>
          <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
            {card.title}
          </h3>
        </div>

        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: 16,
            background: `linear-gradient(145deg, #1a1a2e, #16213e)`,
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            padding: 24,
            gap: 16,
          }}
        >
          <h3 style={{ color: card.color, fontSize: 20, fontWeight: 700 }}>
            {card.title}
          </h3>
          <p style={{ color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 1.6, maxWidth: 200 }}>
            {card.desc}
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: card.color, fontSize: 24, fontWeight: 700 }}>
                {card.views.toLocaleString()}
              </div>
              <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                Views
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: card.color, fontSize: 24, fontWeight: 700 }}>
                {card.likes.toLocaleString()}
              </div>
              <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
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
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 32, fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>
        3D Card Flip Gallery
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 260px)',
          gap: 24,
        }}
      >
        {CARDS.map((_, i) => (
          <Card key={i} index={i} />
        ))}
      </div>
    </div>
  )
}
