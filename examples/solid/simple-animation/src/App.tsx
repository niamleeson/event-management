import { usePulse, useEmit } from '@pulse/solid'
import {
  CountChanged,
  AnimatedCountChanged,
  ColorIntensityChanged,
  BounceScaleChanged,
  Increment,
  Decrement,
} from './engine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): string {
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function getBackgroundColor(intensity: number): string {
  if (intensity <= 0) {
    const t = Math.abs(intensity)
    return lerpColor(248, 249, 250, 255, 200, 200, t)
  } else {
    return lerpColor(248, 249, 250, 200, 255, 210, intensity)
  }
}

function getTextColor(intensity: number): string {
  if (intensity <= -0.3) return '#c0392b'
  if (intensity >= 0.3) return '#27ae60'
  return '#1a1a2e'
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const currentCount = usePulse(CountChanged, 0)
  const animCount = usePulse(AnimatedCountChanged, 0)
  const colorT = usePulse(ColorIntensityChanged, 0)
  const bounce = usePulse(BounceScaleChanged, 1)

  const bgColor = getBackgroundColor(colorT())
  const textColor = getTextColor(colorT())

  return (
    <div
      style={{
        'min-height': '100vh',
        background: bgColor,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'background 0.1s',
      }}
    >
      <h1
        style={{
          'font-size': 28,
          'font-weight': 700,
          color: '#1a1a2e',
          'margin-bottom': 8,
        }}
      >
        Animated Counter
      </h1>
      <p
        style={{
          color: '#6c757d',
          'font-size': 14,
          'margin-bottom': 48,
        }}
      >
        Spring physics smoothly animate the count and background color
      </p>

      {/* Counter display */}
      <div
        style={{
          transform: `scale(${bounce})`,
          'margin-bottom': 48,
        }}
      >
        <div
          style={{
            'font-size': 120,
            'font-weight': 800,
            color: textColor,
            'line-height': 1,
            'text-align': 'center',
            'font-variant-numeric': 'tabular-nums',
            transition: 'color 0.3s',
            'user-select': 'none',
          }}
        >
          {Math.round(animCount())}
        </div>
        <div
          style={{
            'text-align': 'center',
            'font-size': 14,
            color: '#aaa',
            'margin-top': 8,
          }}
        >
          actual: {currentCount} | animated: {animCount().toFixed(1)}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16 }}>
        <button
          onClick={() => emit(Decrement, undefined)}
          style={{
            width: 80,
            height: 80,
            'border-radius': 20,
            border: 'none',
            background: '#e63946',
            color: '#fff',
            'font-size': 36,
            'font-weight': 700,
            cursor: 'pointer',
            'box-shadow': '0 4px 12px rgba(230, 57, 70, 0.3)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          -
        </button>
        <button
          onClick={() => emit(Increment, undefined)}
          style={{
            width: 80,
            height: 80,
            'border-radius': 20,
            border: 'none',
            background: '#4361ee',
            color: '#fff',
            'font-size': 36,
            'font-weight': 700,
            cursor: 'pointer',
            'box-shadow': '0 4px 12px rgba(67, 97, 238, 0.3)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          +
        </button>
      </div>

      {/* Hint */}
      <p
        style={{
          'margin-top': 48,
          color: '#bbb',
          'font-size': 13,
        }}
      >
        Color shifts green for positive, red for negative (saturates at +/-10)
      </p>
    </div>
  )
}
