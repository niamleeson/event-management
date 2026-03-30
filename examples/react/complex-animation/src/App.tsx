import { useEffect } from 'react'
import { useSignal, useTween, useSpring, useEmit } from '@pulse/react'
import {
  engine,
  CARDS,
  CARD_COUNT,
  PageLoaded,
  HoverCard,
  UnhoverCard,
  cardOpacity,
  cardTranslateY,
  cardHoverScale,
  cardHoverShadow,
  welcomeOpacity,
  welcomeTranslateY,
  allEntered,
  type CardData,
} from './engine'

// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------

function AnimatedCard({ card, index }: { card: CardData; index: number }) {
  const emit = useEmit()
  const opacity = useTween(cardOpacity[index])
  const translateY = useTween(cardTranslateY[index])
  const scale = useTween(cardHoverScale[index])
  const shadowSize = useSpring(cardHoverShadow[index])

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        background: '#fff',
        borderRadius: 16,
        padding: 28,
        boxShadow: `0 ${2 + shadowSize * 0.5}px ${8 + shadowSize}px rgba(0,0,0,${0.06 + shadowSize * 0.008})`,
        cursor: 'pointer',
        borderTop: `4px solid ${card.color}`,
        transition: 'box-shadow 0.05s',
      }}
      onMouseEnter={() => emit(HoverCard[index], index)}
      onMouseLeave={() => emit(UnhoverCard[index], index)}
    >
      <div
        style={{
          fontSize: 36,
          marginBottom: 12,
        }}
      >
        {card.icon}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: '#1a1a2e',
          marginBottom: 8,
        }}
      >
        {card.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: '#6c757d',
          lineHeight: 1.5,
        }}
      >
        {card.description}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome message
// ---------------------------------------------------------------------------

function WelcomeMessage() {
  const entered = useSignal(allEntered)
  const opacity = useTween(welcomeOpacity)
  const translateY = useTween(welcomeTranslateY)

  if (!entered && opacity === 0) return null

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        textAlign: 'center',
        marginTop: 48,
        padding: '32px 24px',
        background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
        borderRadius: 16,
        color: '#fff',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
        Welcome to Pulse
      </h2>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 16,
          opacity: 0.9,
        }}
      >
        All {CARD_COUNT} cards have entered — this message was triggered by a
        join rule
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()

  // Fire PageLoaded on mount
  useEffect(() => {
    // Small delay to ensure everything is mounted
    const timer = setTimeout(() => {
      emit(PageLoaded, undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [emit])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '60px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#1a1a2e',
              margin: 0,
            }}
          >
            Staggered Card Entrance
          </h1>
          <p
            style={{
              color: '#6c757d',
              fontSize: 16,
              marginTop: 8,
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Cards cascade in with staggered tweens. Hover for spring-driven
            shadows. A join rule fires after all cards enter.
          </p>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {CARDS.map((card, i) => (
            <AnimatedCard key={card.id} card={card} index={i} />
          ))}
        </div>

        {/* Welcome message after all cards enter */}
        <WelcomeMessage />
      </div>
    </div>
  )
}
