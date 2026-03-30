import {
  engine,
  ITEMS,
  ITEM_COUNT,
  SelectItem,
  RotateLeft,
  RotateRight,
  ToggleAutoRotate,
  selectedIndex,
  autoRotate,
  springAngle,
  springScale,
  startAutoRotate,
  stopAutoRotate,
} from '../engines/3d-carousel'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #1a1a2e; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'

  const h1 = document.createElement('h1')
  h1.style.cssText = 'color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;'
  h1.textContent = '3D Carousel'
  wrapper.appendChild(h1)

  const sub = document.createElement('p')
  sub.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 40px; text-align: center;'
  sub.textContent = '8 items in a 3D circle. Auto-rotates with spring physics. Click items or use controls.'
  wrapper.appendChild(sub)

  // Carousel container
  const carouselScene = document.createElement('div')
  carouselScene.style.cssText = 'width: 100%; max-width: 600px; height: 320px; perspective: 1000px; margin-bottom: 40px; position: relative;'

  const carouselInner = document.createElement('div')
  carouselInner.style.cssText = 'width: 160px; height: 200px; position: relative; margin: 60px auto; transform-style: preserve-3d;'

  const radius = 280
  const itemEls: HTMLElement[] = []

  for (let i = 0; i < ITEM_COUNT; i++) {
    const item = ITEMS[i]
    const angle = (360 / ITEM_COUNT) * i

    const itemEl = document.createElement('div')
    itemEl.style.cssText = `position: absolute; width: 160px; height: 200px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${item.color}; color: #fff; cursor: pointer; transform: rotateY(${angle}deg) translateZ(${radius}px); backface-visibility: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: box-shadow 0.2s;`

    const icon = document.createElement('div')
    icon.style.cssText = 'font-size: 36px; margin-bottom: 12px;'
    icon.textContent = item.icon

    const title = document.createElement('div')
    title.style.cssText = 'font-size: 16px; font-weight: 700;'
    title.textContent = item.title

    const desc = document.createElement('div')
    desc.style.cssText = 'font-size: 11px; opacity: 0.7; margin-top: 4px;'
    desc.textContent = item.description

    itemEl.appendChild(icon)
    itemEl.appendChild(title)
    itemEl.appendChild(desc)

    itemEl.addEventListener('click', () => engine.emit(SelectItem, i))

    carouselInner.appendChild(itemEl)
    itemEls.push(itemEl)
  }

  carouselScene.appendChild(carouselInner)
  wrapper.appendChild(carouselScene)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 12px; align-items: center; margin-bottom: 24px;'

  const prevBtn = document.createElement('button')
  prevBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px;'
  prevBtn.textContent = '\u2190 Prev'
  prevBtn.addEventListener('click', () => engine.emit(RotateLeft, undefined))

  const autoBtn = document.createElement('button')
  autoBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 8px; background: #2a9d8f; color: #fff; font-weight: 600; cursor: pointer;'
  autoBtn.addEventListener('click', () => engine.emit(ToggleAutoRotate, undefined))

  const nextBtn = document.createElement('button')
  nextBtn.style.cssText = 'padding: 10px 20px; border: none; border-radius: 8px; background: #4361ee; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px;'
  nextBtn.textContent = 'Next \u2192'
  nextBtn.addEventListener('click', () => engine.emit(RotateRight, undefined))

  controls.appendChild(prevBtn)
  controls.appendChild(autoBtn)
  controls.appendChild(nextBtn)
  wrapper.appendChild(controls)

  // Selected item info
  const info = document.createElement('div')
  info.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; max-width: 300px; width: 100%;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  startAutoRotate()

  // Frame update
  unsubs.push(engine.on(engine.frame, () => {
    const angle = springAngle.value
    carouselInner.style.transform = `rotateY(${-angle}deg)`

    const sel = selectedIndex.value
    const item = ITEMS[sel]

    autoBtn.textContent = autoRotate.value ? 'Auto: ON' : 'Auto: OFF'
    autoBtn.style.background = autoRotate.value ? '#2a9d8f' : '#666'

    info.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">${item.icon}</div>
      <div style="color: #fff; font-size: 20px; font-weight: 700; margin-bottom: 4px;">${item.title}</div>
      <div style="color: rgba(255,255,255,0.5); font-size: 13px;">${item.description}</div>
    `
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    stopAutoRotate()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
