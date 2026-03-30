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
} from '../engines/complex-animation'

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  // Build the static DOM structure
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #f8f9fa; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  const inner = document.createElement('div')
  inner.style.cssText = 'max-width: 900px; margin: 0 auto;'

  // Header
  const headerDiv = document.createElement('div')
  headerDiv.style.cssText = 'text-align: center; margin-bottom: 48px;'
  const h1 = document.createElement('h1')
  h1.style.cssText = 'font-size: 42px; font-weight: 800; color: #1a1a2e; margin: 0;'
  h1.textContent = 'Staggered Card Entrance'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #6c757d; font-size: 16px; margin-top: 8px; max-width: 500px; margin-left: auto; margin-right: auto;'
  sub.textContent = 'Cards cascade in with staggered tweens. Hover for spring-driven shadows. A join rule fires after all cards enter.'
  headerDiv.appendChild(h1)
  headerDiv.appendChild(sub)
  inner.appendChild(headerDiv)

  // Card grid
  const grid = document.createElement('div')
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;'

  const cardElements: HTMLElement[] = []

  for (let i = 0; i < CARD_COUNT; i++) {
    const card = CARDS[i]
    const cardEl = document.createElement('div')
    cardEl.style.cssText = `opacity: 0; background: #fff; border-radius: 16px; padding: 28px; cursor: pointer; border-top: 4px solid ${card.color}; transition: box-shadow 0.05s;`

    const iconDiv = document.createElement('div')
    iconDiv.style.cssText = 'font-size: 36px; margin-bottom: 12px;'
    iconDiv.textContent = card.icon

    const titleEl = document.createElement('h3')
    titleEl.style.cssText = 'margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px;'
    titleEl.textContent = card.title

    const descEl = document.createElement('p')
    descEl.style.cssText = 'margin: 0; font-size: 14px; color: #6c757d; line-height: 1.5;'
    descEl.textContent = card.description

    cardEl.appendChild(iconDiv)
    cardEl.appendChild(titleEl)
    cardEl.appendChild(descEl)

    // Hover events
    cardEl.addEventListener('mouseenter', () => engine.emit(HoverCard[i], i))
    cardEl.addEventListener('mouseleave', () => engine.emit(UnhoverCard[i], i))

    grid.appendChild(cardEl)
    cardElements.push(cardEl)
  }

  inner.appendChild(grid)

  // Welcome message (hidden initially)
  const welcomeEl = document.createElement('div')
  welcomeEl.style.cssText = 'opacity: 0; text-align: center; margin-top: 48px; padding: 32px 24px; background: linear-gradient(135deg, #4361ee 0%, #7209b7 100%); border-radius: 16px; color: #fff;'

  const welcomeTitle = document.createElement('h2')
  welcomeTitle.style.cssText = 'margin: 0; font-size: 28px; font-weight: 700;'
  welcomeTitle.textContent = 'Welcome to Pulse'

  const welcomeMsg = document.createElement('p')
  welcomeMsg.style.cssText = 'margin: 8px 0 0; font-size: 16px; opacity: 0.9;'
  welcomeMsg.textContent = `All ${CARD_COUNT} cards have entered \u2014 this message was triggered by a join rule`

  welcomeEl.appendChild(welcomeTitle)
  welcomeEl.appendChild(welcomeMsg)
  inner.appendChild(welcomeEl)

  wrapper.appendChild(inner)
  container.appendChild(wrapper)

  // Use engine.on(engine.frame) to update all animated values each frame
  unsubs.push(engine.on(engine.frame, () => {
    for (let i = 0; i < CARD_COUNT; i++) {
      const el = cardElements[i]
      const opacity = cardOpacity[i].value
      const translateY = cardTranslateY[i].value
      const scale = cardHoverScale[i].value
      const shadowSize = cardHoverShadow[i].value

      el.style.opacity = String(opacity)
      el.style.transform = `translateY(${translateY}px) scale(${scale})`
      el.style.boxShadow = `0 ${2 + shadowSize * 0.5}px ${8 + shadowSize}px rgba(0,0,0,${0.06 + shadowSize * 0.008})`
    }

    // Update welcome message
    const wOpacity = welcomeOpacity.value
    const wTranslateY = welcomeTranslateY.value
    welcomeEl.style.opacity = String(wOpacity)
    welcomeEl.style.transform = `translateY(${wTranslateY}px)`
  }))

  // Fire PageLoaded after a small delay to ensure everything is mounted
  const loadTimer = setTimeout(() => {
    engine.emit(PageLoaded, undefined)
  }, 300)

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    clearTimeout(loadTimer)
    unsubs.forEach((u) => u())
  }
}
