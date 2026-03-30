import {
  engine,
  LAYERS,
  LAYER_COUNT,
  MouseMove,
  ToggleDayNight,
  EnterScene,
  isNight,
  springCameraX,
  springCameraY,
  layerOpacity,
  layerTranslateY,
} from '../engines/3d-layered-parallax'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #87CEEB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; transition: background 1s;'

  const h1 = document.createElement('h1')
  h1.style.cssText = 'color: #1a1a2e; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center; transition: color 1s;'
  h1.textContent = '3D Layered Parallax'
  wrapper.appendChild(h1)

  const sub = document.createElement('p')
  sub.style.cssText = 'color: rgba(0,0,0,0.5); font-size: 14px; margin-bottom: 20px; text-align: center; transition: color 1s;'
  sub.textContent = 'Move mouse over scene for parallax. 5 layers at different depths. Toggle day/night.'
  wrapper.appendChild(sub)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px;'
  const dayNightBtn = document.createElement('button')
  dayNightBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #264653; color: #fff; font-weight: 600; cursor: pointer;'
  dayNightBtn.textContent = 'Toggle Day/Night'
  dayNightBtn.addEventListener('click', () => engine.emit(ToggleDayNight, undefined))
  controls.appendChild(dayNightBtn)
  wrapper.appendChild(controls)

  // Scene
  const scene = document.createElement('div')
  scene.style.cssText = 'width: 100%; max-width: 700px; height: 450px; perspective: 800px; overflow: hidden; border-radius: 16px; position: relative; background: #87CEEB; transition: background 1s; cursor: crosshair;'

  const layerEls: HTMLElement[] = []

  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = LAYERS[i]
    const layerEl = document.createElement('div')
    layerEl.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transform-style: preserve-3d;`

    // Draw shapes for this layer
    for (const elem of layer.elements) {
      const shape = document.createElement('div')
      const size = elem.size

      let shapeStyle = `position: absolute; left: ${elem.x}%; top: ${elem.y}%; width: ${size}px; height: ${size}px; transition: background 1s;`

      if (elem.shape === 'circle') {
        shapeStyle += `border-radius: 50%; background: ${layer.color}; opacity: 0.6;`
      } else if (elem.shape === 'triangle') {
        shapeStyle += `width: 0; height: 0; border-left: ${size / 2}px solid transparent; border-right: ${size / 2}px solid transparent; border-bottom: ${size}px solid ${layer.color}; background: transparent; opacity: 0.7;`
      } else {
        shapeStyle += `background: ${layer.color}; border-radius: 4px; opacity: 0.5;`
      }

      shape.style.cssText = shapeStyle
      layerEl.appendChild(shape)
    }

    // Layer label
    const label = document.createElement('div')
    label.style.cssText = `position: absolute; bottom: 10px; left: 10px; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 1px; text-transform: uppercase;`
    label.textContent = `L${i}: ${layer.label}`
    layerEl.appendChild(label)

    scene.appendChild(layerEl)
    layerEls.push(layerEl)
  }

  scene.addEventListener('mousemove', (e) => {
    const rect = scene.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    engine.emit(MouseMove, { x, y })
  })

  wrapper.appendChild(scene)

  // Legend
  const legend = document.createElement('div')
  legend.style.cssText = 'display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; justify-content: center;'
  for (let i = 0; i < LAYER_COUNT; i++) {
    const item = document.createElement('div')
    item.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6);'
    const dot = document.createElement('div')
    dot.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background: ${LAYERS[i].color};`
    const text = document.createElement('span')
    text.textContent = `${LAYERS[i].label} (z: ${LAYERS[i].depth})`
    item.appendChild(dot)
    item.appendChild(text)
    legend.appendChild(item)
  }
  wrapper.appendChild(legend)

  container.appendChild(wrapper)

  // Trigger entrance
  setTimeout(() => engine.emit(EnterScene, undefined), 300)

  // Frame update
  unsubs.push(engine.on(engine.frame, () => {
    const cx = springCameraX.value
    const cy = springCameraY.value
    const night = isNight.value

    // Day/night theme
    wrapper.style.background = night ? '#0d1117' : '#87CEEB'
    scene.style.background = night ? '#0d1117' : '#87CEEB'
    h1.style.color = night ? '#fff' : '#1a1a2e'
    sub.style.color = night ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

    for (let i = 0; i < LAYER_COUNT; i++) {
      const layer = LAYERS[i]
      const parallaxX = cx * layer.depth * 0.1
      const parallaxY = cy * layer.depth * 0.05
      const opacity = layerOpacity[i].value
      const translateY = layerTranslateY[i].value

      layerEls[i].style.opacity = String(opacity)
      layerEls[i].style.transform = `translate3d(${parallaxX}px, ${parallaxY + translateY}px, ${layer.depth}px)`
    }
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
