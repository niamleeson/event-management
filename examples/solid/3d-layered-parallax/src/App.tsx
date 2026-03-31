import { usePulse, useEmit } from '@pulse/solid'
import { engine, Frame } from './engine'

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const MouseMove = engine.event<{ x: number; y: number }>('MouseMove')
const DayNightToggle = engine.event('DayNightToggle')

const SceneStateChanged = engine.event<{
  camRotX: number; camRotY: number; isNight: boolean; nightBlend: number;
  cloudFloat: number; layerOpacities: number[]
}>('SceneStateChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let mouseXTarget = 0, mouseYTarget = 0
let camRotX = 0, camRotY = 0, camVelX = 0, camVelY = 0
let isNight = false, nightBlend = 0, nightTarget = 0
let cloudFloat = 0, cloudDir = 1, cloudPhase = 0
let layerOpacities = [0, 0, 0, 0, 0]
let entranceFrame = 0

engine.on(MouseMove, ({ x, y }) => {
  mouseXTarget = (x - 0.5) * 15
  mouseYTarget = (y - 0.5) * 10
})

engine.on(DayNightToggle, () => {
  isNight = !isNight
  nightTarget = isNight ? 1 : 0
})

engine.on(Frame, (dt) => {
  // Camera spring
  camVelX += (mouseYTarget - camRotX) * 0.02
  camVelX *= 0.85
  camRotX += camVelX
  camVelY += (mouseXTarget - camRotY) * 0.02
  camVelY *= 0.85
  camRotY += camVelY

  // Night blend
  nightBlend += (nightTarget - nightBlend) * 0.02

  // Cloud float
  cloudPhase += dt * 0.00025 * cloudDir
  cloudFloat = Math.sin(cloudPhase * Math.PI * 2) * 20
  if (cloudPhase > 1) { cloudPhase = 0; cloudDir *= -1 }

  // Entrance stagger
  entranceFrame++
  for (let i = 0; i < 5; i++) {
    const triggerFrame = 10 + i * 15
    if (entranceFrame >= triggerFrame && layerOpacities[i] < 1) {
      layerOpacities[i] += (1 - layerOpacities[i]) * 0.05
      if (layerOpacities[i] > 0.99) layerOpacities[i] = 1
    }
  }

  engine.emit(SceneStateChanged, {
    camRotX, camRotY, isNight, nightBlend, cloudFloat, layerOpacities: [...layerOpacities],
  })
})

/* ------------------------------------------------------------------ */
/*  Rendering helpers                                                 */
/* ------------------------------------------------------------------ */

function SkyLayer({ nightBlend }: { nightBlend: number }) {
  const d1 = [116, 185, 255], d2 = [223, 230, 233], n1 = [12, 12, 29], n2 = [45, 52, 54]
  const c1 = d1.map((d, i) => Math.round(d + (n1[i] - d) * nightBlend))
  const c2 = d2.map((d, i) => Math.round(d + (n2[i] - d) * nightBlend))
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgb(${c1.join(',')}) 0%, rgb(${c2.join(',')}) 100%)` }}>
      {nightBlend > 0.3 && Array.from({ length: 40 }, (_, i) => (
        <div style={{ position: 'absolute', left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 60}%`, width: 2, height: 2, 'border-radius': '50%', background: '#fff', opacity: Math.max(0, (nightBlend - 0.3) / 0.7) * (0.3 + (i % 3) * 0.3) }} />
      ))}
    </div>
  )
}

function FarMountains({ nightBlend }: { nightBlend: number }) {
  const r = Math.round(108 + (30 - 108) * nightBlend), g = Math.round(92 + (30 - 92) * nightBlend), b = Math.round(231 + (60 - 231) * nightBlend)
  return (
    <div style={{ position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '60%' }}>
      <svg viewBox="0 0 1200 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M0,400 L0,280 Q150,120 300,200 Q450,80 600,180 Q750,60 900,160 Q1050,100 1200,220 L1200,400 Z" fill={`rgb(${r},${g},${b})`} />
      </svg>
    </div>
  )
}

function NearMountains({ nightBlend }: { nightBlend: number }) {
  const r = Math.round(85 + (20 - 85) * nightBlend), g = Math.round(239 + (40 - 239) * nightBlend), b = Math.round(196 + (50 - 196) * nightBlend)
  return (
    <div style={{ position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '50%' }}>
      <svg viewBox="0 0 1200 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M0,400 L0,300 Q100,180 250,250 Q400,120 550,220 Q700,140 850,200 Q1000,150 1200,260 L1200,400 Z" fill={`rgb(${r},${g},${b})`} />
      </svg>
    </div>
  )
}

function Clouds({ nightBlend, floatOffset }: { nightBlend: number; floatOffset: number }) {
  const opacity = Math.max(0.2, 1 - nightBlend * 0.7)
  const clouds = [{ left: '10%', top: '15%', w: 180, h: 60 }, { left: '55%', top: '25%', w: 220, h: 70 }, { left: '75%', top: '10%', w: 150, h: 50 }, { left: '30%', top: '35%', w: 200, h: 55 }]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {clouds.map((c, i) => (
        <div style={{ position: 'absolute', left: c.left, top: c.top, width: c.w, height: c.h, 'border-radius': '50%', background: `radial-gradient(ellipse, rgba(255,255,255,${opacity * 0.8}) 0%, rgba(255,255,255,${opacity * 0.2}) 70%, transparent 100%)`, transform: `translateY(${floatOffset * (i % 2 === 0 ? 1 : -0.7)}px)`, filter: `blur(${2 + i}px)` }} />
      ))}
    </div>
  )
}

function Trees({ nightBlend }: { nightBlend: number }) {
  const r = Math.round(0 + 10 * nightBlend), g = Math.round(148 + (30 - 148) * nightBlend), b = Math.round(50 + (20 - 50) * nightBlend)
  const gr = Math.round(34 + (10 - 34) * nightBlend), gg = Math.round(139 + (20 - 139) * nightBlend), gb = Math.round(34 + (10 - 34) * nightBlend)
  return (
    <div style={{ position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '35%' }}>
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M0,300 L0,200 L30,120 L60,200 L80,100 L110,200 L140,140 L170,200 L200,80 L230,200 L260,150 L290,200 L320,110 L350,200 L380,130 L410,200 L440,90 L470,200 L500,160 L530,200 L560,100 L590,200 L620,140 L650,200 L680,70 L710,200 L740,150 L770,200 L800,120 L830,200 L860,90 L890,200 L920,160 L950,200 L980,110 L1010,200 L1040,130 L1070,200 L1100,80 L1130,200 L1160,140 L1200,200 L1200,300 Z" fill={`rgb(${r},${g},${b})`} />
        <rect x="0" y="200" width="1200" height="100" fill={`rgb(${gr},${gg},${gb})`} />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

const LAYER_Z = [-500, -400, -250, -150, -100]

export default function App() {
  const emit = useEmit()
  const s = usePulse(SceneStateChanged, { camRotX: 0, camRotY: 0, isNight: false, nightBlend: 0, cloudFloat: 0, layerOpacities: [0, 0, 0, 0, 0] })

  const onMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    emit(MouseMove, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
  }

  const layers = [
    <SkyLayer nightBlend={s().nightBlend} />,
    <FarMountains nightBlend={s().nightBlend} />,
    <NearMountains nightBlend={s().nightBlend} />,
    <Clouds nightBlend={s().nightBlend} floatOffset={s().cloudFloat} />,
    <Trees nightBlend={s().nightBlend} />,
  ]

  return (
    <div onMouseMove={onMouseMove} style={{ width: '100%', height: '100%', perspective: 1000, overflow: 'hidden', cursor: 'crosshair' }}>
      <div style={{ width: '100%', height: '100%', 'transform-style': 'preserve-3d', transform: `rotateX(${s.camRotX}deg) rotateY(${s.camRotY}deg)` }}>
        {LAYER_Z.map((z, i) => (
          <div style={{ position: 'absolute', inset: '-20%', transform: `translateZ(${z}px)`, opacity: s.layerOpacities[i] }}>{layers[i]}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', 'justify-content': 'center', 'align-items': 'center', gap: 24, 'z-index': 10 }}>
        <h1 style={{ color: '#fff', 'font-size': 22, 'font-weight': 300, 'letter-spacing': 2, 'text-shadow': '0 2px 8px rgba(0,0,0,0.5)' }}>3D Layered Parallax</h1>
        <button onClick={() => emit(DayNightToggle, undefined)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 20px', 'border-radius': 8, cursor: 'pointer', 'font-size': 13, 'letter-spacing': 1, 'backdrop-filter': 'blur(4px)' }}>
          {s().isNight ? '\u2600 Day' : '\u263E Night'}
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, 'text-align': 'center', color: 'rgba(255,255,255,0.4)', 'font-size': 13, 'z-index': 10, 'text-shadow': '0 1px 4px rgba(0,0,0,0.5)' }}>Move mouse to tilt scene</div>
    </div>
  )
}
