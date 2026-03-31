import { engine, LAYERS, LAYER_COUNT, MouseMove, ToggleDayNight, EnterScene, getIsNight, getSpringCameraX, getSpringCameraY, getLayerOpacity, getLayerTranslateY, updateFrame } from '../engines/3d-layered-parallax'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  let rafId = 0; let lastTime = performance.now()

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #87CEEB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; transition: background 1s;'
  const h1 = document.createElement('h1'); h1.style.cssText = 'color: #1a1a2e; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center; transition: color 1s;'; h1.textContent = '3D Layered Parallax'; wrapper.appendChild(h1)
  const sub = document.createElement('p'); sub.style.cssText = 'color: rgba(0,0,0,0.5); font-size: 14px; margin-bottom: 20px; text-align: center; transition: color 1s;'; sub.textContent = 'Move mouse over scene for parallax. 5 layers at different depths. Toggle day/night.'; wrapper.appendChild(sub)

  const dayNightBtn = document.createElement('button'); dayNightBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; background: #264653; color: #fff; font-weight: 600; cursor: pointer; margin-bottom: 20px;'; dayNightBtn.textContent = 'Toggle Day/Night'; dayNightBtn.addEventListener('click', () => engine.emit(ToggleDayNight, undefined)); wrapper.appendChild(dayNightBtn)

  const scene = document.createElement('div'); scene.style.cssText = 'width: 100%; max-width: 700px; height: 450px; perspective: 800px; overflow: hidden; border-radius: 16px; position: relative; background: #87CEEB; transition: background 1s; cursor: crosshair;'
  const layerEls: HTMLElement[] = []
  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = LAYERS[i]; const layerEl = document.createElement('div'); layerEl.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transform-style: preserve-3d;'
    for (const elem of layer.elements) {
      const shape = document.createElement('div'); let ss = `position: absolute; left: ${elem.x}%; top: ${elem.y}%; width: ${elem.size}px; height: ${elem.size}px; transition: background 1s;`
      if (elem.shape === 'circle') ss += `border-radius: 50%; background: ${layer.color}; opacity: 0.6;`
      else if (elem.shape === 'triangle') ss += `width: 0; height: 0; border-left: ${elem.size / 2}px solid transparent; border-right: ${elem.size / 2}px solid transparent; border-bottom: ${elem.size}px solid ${layer.color}; background: transparent; opacity: 0.7;`
      else ss += `background: ${layer.color}; border-radius: 4px; opacity: 0.5;`
      shape.style.cssText = ss; layerEl.appendChild(shape)
    }
    layerEl.innerHTML += `<div style="position: absolute; bottom: 10px; left: 10px; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">L${i}: ${layer.label}</div>`
    scene.appendChild(layerEl); layerEls.push(layerEl)
  }
  scene.addEventListener('mousemove', (e) => { const rect = scene.getBoundingClientRect(); engine.emit(MouseMove, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }) })
  wrapper.appendChild(scene); container.appendChild(wrapper)

  setTimeout(() => engine.emit(EnterScene, undefined), 300)

  function frame(now: number) {
    const dt = now - lastTime; lastTime = now; updateFrame(dt, now)
    const cx = getSpringCameraX(); const cy = getSpringCameraY(); const night = getIsNight()
    wrapper.style.background = night ? '#0d1117' : '#87CEEB'; scene.style.background = night ? '#0d1117' : '#87CEEB'; h1.style.color = night ? '#fff' : '#1a1a2e'; sub.style.color = night ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
    for (let i = 0; i < LAYER_COUNT; i++) { const layer = LAYERS[i]; layerEls[i].style.opacity = String(getLayerOpacity(i)); layerEls[i].style.transform = `translate3d(${cx * layer.depth * 0.1}px, ${cy * layer.depth * 0.05 + getLayerTranslateY(i)}px, ${layer.depth}px)` }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId) }
}
