import { usePulse, useEmit } from '@pulse/solid'
import { engine, Frame } from './engine'

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
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const CardClicked = engine.event<number>('CardClicked')
const HoverIn = engine.event<number>('HoverIn')
const HoverOut = engine.event<number>('HoverOut')
const AnimStateChanged = engine.event<{ rotations: number[]; scales: number[] }>('AnimStateChanged')

/* ------------------------------------------------------------------ */
/*  Animation state                                                   */
/* ------------------------------------------------------------------ */

const flippedStates: boolean[] = Array(8).fill(false)
const rotations: number[] = Array(8).fill(0)
const rotationTargets: number[] = Array(8).fill(0)
const rotationVels: number[] = Array(8).fill(0)
const scales: number[] = Array(8).fill(1)
const scaleTargets: number[] = Array(8).fill(1)
const scaleVels: number[] = Array(8).fill(0)

engine.on(CardClicked, (index: number) => {
  flippedStates[index] = !flippedStates[index]
  rotationTargets[index] = flippedStates[index] ? 180 : 0
})

engine.on(HoverIn, (index: number) => {
  scaleTargets[index] = 1.05
})

engine.on(HoverOut, (index: number) => {
  scaleTargets[index] = 1
})

engine.on(Frame, () => {
  let dirty = false
  for (let i = 0; i < 8; i++) {
    // Rotation spring
    const rDiff = rotationTargets[i] - rotations[i]
    if (Math.abs(rDiff) > 0.1 || Math.abs(rotationVels[i]) > 0.1) {
      rotationVels[i] += rDiff * 0.08
      rotationVels[i] *= 0.78
      rotations[i] += rotationVels[i]
      dirty = true
    }

    // Scale spring
    const sDiff = scaleTargets[i] - scales[i]
    if (Math.abs(sDiff) > 0.001 || Math.abs(scaleVels[i]) > 0.001) {
      scaleVels[i] += sDiff * 0.15
      scaleVels[i] *= 0.7
      scales[i] += scaleVels[i]
      dirty = true
    }
  }
  if (dirty) {
    engine.emit(AnimStateChanged, { rotations: [...rotations], scales: [...scales] })
  }
})

/* ------------------------------------------------------------------ */
/*  Card component                                                    */
/* ------------------------------------------------------------------ */

function Card({ index }: { index: number }) {
  const emit = useEmit()
  const card = CARDS[index]
  const anim = usePulse(AnimStateChanged, { rotations: Array(8).fill(0), scales: Array(8).fill(1) })
  const rotation = anim().rotations[index]
  const scale = anim().scales[index]

  return (
    <div
      style={{ perspective: '1000px', width: 260, height: 340, cursor: 'pointer' }}
      onClick={() => emit(CardClicked, index)}
      onMouseEnter={() => emit(HoverIn, index)}
      onMouseLeave={() => emit(HoverOut, index)}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative', 'transform-style': 'preserve-3d',
        transform: `scale(${scale}) rotateY(${rotation}deg)`, transition: 'box-shadow 0.2s', 'border-radius': 16,
      }}>
        {/* Front face */}
        <div style={{
          position: 'absolute', inset: 0, 'backface-visibility': 'hidden', 'border-radius': 16,
          background: `linear-gradient(145deg, ${card.color}dd, ${card.color}88)`,
          display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
          'box-shadow': '0 8px 32px rgba(0,0,0,0.4)', padding: 24,
        }}>
          <div style={{
            width: 140, height: 140, 'border-radius': 12,
            background: `linear-gradient(135deg, ${card.color}44, ${card.color})`,
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': 48, 'margin-bottom': 20,
          }}>{card.title[0]}</div>
          <h3 style={{ color: '#fff', 'font-size': 22, 'font-weight': 700, 'letter-spacing': 1 }}>{card.title}</h3>
        </div>
        {/* Back face */}
        <div style={{
          position: 'absolute', inset: 0, 'backface-visibility': 'hidden', 'border-radius': 16,
          background: 'linear-gradient(145deg, #1a1a2e, #16213e)', transform: 'rotateY(180deg)',
          display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
          'box-shadow': '0 8px 32px rgba(0,0,0,0.4)', padding: 24, gap: 16,
        }}>
          <h3 style={{ color: card.color, 'font-size': 20, 'font-weight': 700 }}>{card.title}</h3>
          <p style={{ color: '#ccc', 'font-size': 14, 'text-align': 'center', 'line-height': 1.6, 'max-width': 200 }}>{card.desc}</p>
          <div style={{ display: 'flex', gap: 24, 'margin-top': 8 }}>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ color: card.color, 'font-size': 24, 'font-weight': 700 }}>{card.views.toLocaleString()}</div>
              <div style={{ color: '#888', 'font-size': 11, 'text-transform': 'uppercase', 'letter-spacing': 1 }}>Views</div>
            </div>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ color: card.color, 'font-size': 24, 'font-weight': 700 }}>{card.likes.toLocaleString()}</div>
              <div style={{ color: '#888', 'font-size': 11, 'text-transform': 'uppercase', 'letter-spacing': 1 }}>Likes</div>
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
      <h1 style={{ color: '#fff', 'text-align': 'center', 'margin-bottom': 32, 'font-size': 28, 'font-weight': 300, 'letter-spacing': 2 }}>
        3D Card Flip Gallery
      </h1>
      <div style={{ display: 'grid', 'grid-template-columns': 'repeat(4, 260px)', gap: 24 }}>
        {CARDS.map((_, i) => <Card index={i} />)}
      </div>
    </div>
  )
}
