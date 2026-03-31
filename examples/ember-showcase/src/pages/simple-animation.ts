import {
  engine,
  getCount,
  getAnimatedCount,
  getColorIntensity,
  getBounceScale,
  updateFrame,
  Increment,
  Decrement,
} from '../engines/simple-animation'

// ---------------------------------------------------------------------------
// Color helpers
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
// Mount
// ---------------------------------------------------------------------------

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  let rafId = 0

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; transition: background 0.1s;'
  wrapper.style.background = getBackgroundColor(getColorIntensity())

  const title = document.createElement('h1')
  title.style.cssText = 'font-size: 28px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px;'
  title.textContent = 'Animated Counter'
  wrapper.appendChild(title)

  const sub = document.createElement('p')
  sub.style.cssText = 'color: #6c757d; font-size: 14px; margin-bottom: 48px;'
  sub.textContent = 'Tweens smoothly animate the count and background color'
  wrapper.appendChild(sub)

  const bounceContainer = document.createElement('div')
  bounceContainer.style.cssText = 'margin-bottom: 48px;'

  const animCountEl = document.createElement('div')
  animCountEl.style.cssText = 'font-size: 120px; font-weight: 800; line-height: 1; text-align: center; font-variant-numeric: tabular-nums; transition: color 0.3s; user-select: none;'
  animCountEl.style.color = getTextColor(getColorIntensity())
  animCountEl.textContent = String(Math.round(getAnimatedCount()))
  bounceContainer.appendChild(animCountEl)

  const debugLine = document.createElement('div')
  debugLine.style.cssText = 'text-align: center; font-size: 14px; color: #aaa; margin-top: 8px;'
  const actualSpan = document.createElement('span')
  actualSpan.textContent = String(getCount())
  const animatedSpan = document.createElement('span')
  animatedSpan.textContent = getAnimatedCount().toFixed(1)
  debugLine.appendChild(document.createTextNode('actual: '))
  debugLine.appendChild(actualSpan)
  debugLine.appendChild(document.createTextNode(' | animated: '))
  debugLine.appendChild(animatedSpan)
  bounceContainer.appendChild(debugLine)

  wrapper.appendChild(bounceContainer)

  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'display: flex; gap: 16px;'

  const decBtn = document.createElement('button')
  decBtn.style.cssText = 'width: 80px; height: 80px; border-radius: 20px; border: none; background: #e63946; color: #fff; font-size: 36px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3); transition: transform 0.1s, box-shadow 0.1s;'
  decBtn.textContent = '-'
  decBtn.addEventListener('click', () => engine.emit(Decrement, undefined))
  decBtn.addEventListener('mousedown', () => { decBtn.style.transform = 'scale(0.95)' })
  decBtn.addEventListener('mouseup', () => { decBtn.style.transform = 'scale(1)' })
  decBtn.addEventListener('mouseleave', () => { decBtn.style.transform = 'scale(1)' })

  const incBtn = document.createElement('button')
  incBtn.style.cssText = 'width: 80px; height: 80px; border-radius: 20px; border: none; background: #4361ee; color: #fff; font-size: 36px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3); transition: transform 0.1s, box-shadow 0.1s;'
  incBtn.textContent = '+'
  incBtn.addEventListener('click', () => engine.emit(Increment, undefined))
  incBtn.addEventListener('mousedown', () => { incBtn.style.transform = 'scale(0.95)' })
  incBtn.addEventListener('mouseup', () => { incBtn.style.transform = 'scale(1)' })
  incBtn.addEventListener('mouseleave', () => { incBtn.style.transform = 'scale(1)' })

  btnRow.appendChild(decBtn)
  btnRow.appendChild(incBtn)
  wrapper.appendChild(btnRow)

  const hint = document.createElement('p')
  hint.style.cssText = 'margin-top: 48px; color: #bbb; font-size: 13px;'
  hint.textContent = 'Color shifts green for positive, red for negative (saturates at +/-10)'
  wrapper.appendChild(hint)

  container.appendChild(wrapper)

  // Animation loop
  function frame(now: number) {
    updateFrame(now)

    const animCount = getAnimatedCount()
    const colorT = getColorIntensity()
    const bounce = getBounceScale()

    animCountEl.textContent = String(Math.round(animCount))
    animatedSpan.textContent = animCount.toFixed(1)
    actualSpan.textContent = String(getCount())
    animCountEl.style.color = getTextColor(colorT)
    wrapper.style.background = getBackgroundColor(colorT)
    bounceContainer.style.transform = `scale(${bounce})`

    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    cancelAnimationFrame(rafId)
  }
}
