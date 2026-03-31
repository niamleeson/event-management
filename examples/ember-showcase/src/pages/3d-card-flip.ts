import { engine, CARDS, CARD_COUNT, COLS, FlipCard, HoverCard, UnhoverCard, getFlipped, getRotation, getHoverScale, updateFrame } from '../engines/3d-card-flip'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  let rafId = 0

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #1a1a2e; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'
  wrapper.innerHTML = `<h1 style="color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;">3D Card Flip</h1><p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 40px; text-align: center;">Click to flip cards with tween animation. Hover for spring scale. CSS perspective transforms.</p>`

  const grid = document.createElement('div')
  grid.style.cssText = `display: grid; grid-template-columns: repeat(${COLS}, 200px); gap: 20px; perspective: 1000px;`

  const cardEls: HTMLElement[] = []
  for (let i = 0; i < CARD_COUNT; i++) {
    const card = CARDS[i]
    const scene = document.createElement('div')
    scene.style.cssText = 'width: 200px; height: 260px; perspective: 600px; cursor: pointer;'
    const cardEl = document.createElement('div')
    cardEl.style.cssText = 'position: relative; width: 100%; height: 100%; transform-style: preserve-3d;'
    const front = document.createElement('div')
    front.style.cssText = `position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, ${card.color}, ${card.color}cc); color: #fff; padding: 20px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.3);`
    front.innerHTML = `<div style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${card.front}</div><div style="font-size: 12px; opacity: 0.7;">Click to flip</div>`
    const back = document.createElement('div')
    back.style.cssText = `position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; color: #1a1a2e; padding: 20px; text-align: center; transform: rotateY(180deg); box-shadow: 0 8px 32px rgba(0,0,0,0.3);`
    back.innerHTML = `<div style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: ${card.color};">${card.front}</div><div style="font-size: 13px; color: #666; line-height: 1.4;">${card.back}</div>`
    cardEl.appendChild(front); cardEl.appendChild(back); scene.appendChild(cardEl)
    scene.addEventListener('click', () => engine.emit(FlipCard[i], i))
    scene.addEventListener('mouseenter', () => engine.emit(HoverCard[i], i))
    scene.addEventListener('mouseleave', () => engine.emit(UnhoverCard[i], i))
    grid.appendChild(scene); cardEls.push(cardEl)
  }
  wrapper.appendChild(grid)

  const stats = document.createElement('div')
  stats.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 24px; text-align: center;'
  wrapper.appendChild(stats)
  container.appendChild(wrapper)

  function frame(now: number) {
    updateFrame(now)
    let flippedCount = 0
    for (let i = 0; i < CARD_COUNT; i++) {
      const rotation = getRotation(i)
      const scale = getHoverScale(i)
      cardEls[i].style.transform = `rotateY(${rotation}deg) scale(${scale})`
      if (getFlipped(i)) flippedCount++
    }
    stats.textContent = `${flippedCount} of ${CARD_COUNT} cards flipped`
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId) }
}
