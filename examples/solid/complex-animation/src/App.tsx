import { For, Show, onMount } from 'solid-js'
import { useSignal, useTween, useSpring, useEmit } from '@pulse/solid'
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

function AnimatedCard(props: { card: CardData; index: number }) {
  const emit = useEmit()
  const opacity = useTween(cardOpacity[props.index])
  const translateY = useTween(cardTranslateY[props.index])
  const scale = useTween(cardHoverScale[props.index])
  const shadowSize = useSpring(cardHoverShadow[props.index])

  return (
    <div
      style={{
        opacity: opacity(),
        transform: `translateY(${translateY()}px) scale(${scale()})`,
        background: '#fff',
        'border-radius': '16px',
        padding: '28px',
        'box-shadow': `0 ${2 + shadowSize() * 0.5}px ${8 + shadowSize()}px rgba(0,0,0,${0.06 + shadowSize() * 0.008})`,
        cursor: 'pointer',
        'border-top': `4px solid ${props.card.color}`,
        transition: 'box-shadow 0.05s',
      }}
      onMouseEnter={() => emit(HoverCard[props.index], props.index)}
      onMouseLeave={() => emit(UnhoverCard[props.index], props.index)}
    >
      <div
        style={{
          'font-size': '36px',
          'margin-bottom': '12px',
        }}
      >
        {props.card.icon}
      </div>
      <h3
        style={{
          margin: '0',
          'font-size': '20px',
          'font-weight': '700',
          color: '#1a1a2e',
          'margin-bottom': '8px',
        }}
      >
        {props.card.title}
      </h3>
      <p
        style={{
          margin: '0',
          'font-size': '14px',
          color: '#6c757d',
          'line-height': '1.5',
        }}
      >
        {props.card.description}
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

  return (
    <Show when={entered() || opacity() > 0}>
      <div
        style={{
          opacity: opacity(),
          transform: `translateY(${translateY()}px)`,
          'text-align': 'center',
          'margin-top': '48px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
          'border-radius': '16px',
          color: '#fff',
        }}
      >
        <h2 style={{ margin: '0', 'font-size': '28px', 'font-weight': '700' }}>
          Welcome to Pulse
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            'font-size': '16px',
            opacity: '0.9',
          }}
        >
          All {CARD_COUNT} cards have entered — this message was triggered by a
          join rule
        </p>
      </div>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()

  // Fire PageLoaded on mount
  onMount(() => {
    // Small delay to ensure everything is mounted
    const timer = setTimeout(() => {
      emit(PageLoaded, undefined)
    }, 300)
    // Note: no cleanup needed in onMount for this use case
  })

  return (
    <div
      style={{
        'min-height': '100vh',
        background: '#f8f9fa',
        padding: '60px 20px',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ 'max-width': '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 'text-align': 'center', 'margin-bottom': '48px' }}>
          <h1
            style={{
              'font-size': '42px',
              'font-weight': '800',
              color: '#1a1a2e',
              margin: '0',
            }}
          >
            Staggered Card Entrance
          </h1>
          <p
            style={{
              color: '#6c757d',
              'font-size': '16px',
              'margin-top': '8px',
              'max-width': '500px',
              'margin-left': 'auto',
              'margin-right': 'auto',
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
            'grid-template-columns': 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}
        >
          <For each={CARDS}>
            {(card, i) => <AnimatedCard card={card} index={i()} />}
          </For>
        </div>

        {/* Welcome message after all cards enter */}
        <WelcomeMessage />
      </div>
    </div>
  )
}
