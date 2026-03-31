import { engine, FACES, FACE_ROTATIONS, SelectFace, DragStart, DragMove, DragEnd, getSelectedFace, getIsDragging, getSpringRotationX, getSpringRotationY, getGlowIntensity, updateFrame } from '../engines/3d-cube-menu'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  let rafId = 0; let lastTime = performance.now()

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0d1117; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'
  wrapper.innerHTML = `<h1 style="color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;">3D Cube Menu</h1><p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 40px; text-align: center;">Drag to rotate the cube. Click faces or buttons to navigate. Spring physics snap to 90 degrees.</p>`

  const scene = document.createElement('div')
  scene.style.cssText = 'width: 250px; height: 250px; perspective: 600px; margin: 0 auto 40px; cursor: grab;'
  const cube = document.createElement('div')
  cube.style.cssText = 'width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transform: translateZ(-125px);'

  const faceEls: HTMLElement[] = []
  const faceTransforms = ['rotateY(0deg) translateZ(125px)','rotateY(90deg) translateZ(125px)','rotateY(180deg) translateZ(125px)','rotateY(-90deg) translateZ(125px)','rotateX(90deg) translateZ(125px)','rotateX(-90deg) translateZ(125px)']
  for (let i = 0; i < FACES.length; i++) {
    const face = FACES[i]
    const faceEl = document.createElement('div')
    faceEl.style.cssText = `position: absolute; width: 250px; height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${face.color}; border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; transform: ${faceTransforms[i]}; backface-visibility: visible; user-select: none;`
    faceEl.innerHTML = `<div style="font-size: 48px; margin-bottom: 12px;">${face.icon}</div><div style="color: #fff; font-size: 20px; font-weight: 700;">${face.label}</div>`
    cube.appendChild(faceEl); faceEls.push(faceEl)
  }
  scene.appendChild(cube); wrapper.appendChild(scene)

  let dragStartPos = { x: 0, y: 0 }; let dragStartRot = { x: 0, y: 0 }; let _targetX = 0; let _targetY = 0
  scene.addEventListener('mousedown', (e) => { e.preventDefault(); scene.style.cursor = 'grabbing'; dragStartPos = { x: e.clientX, y: e.clientY }; dragStartRot = { x: _targetX, y: _targetY }; engine.emit(DragStart, { x: e.clientX, y: e.clientY }) })
  const onMouseMove = (e: MouseEvent) => { if (!getIsDragging()) return; _targetX = dragStartRot.x - (e.clientY - dragStartPos.y) * 0.5; _targetY = dragStartRot.y + (e.clientX - dragStartPos.x) * 0.5; engine.emit(DragMove, { x: e.clientX, y: e.clientY }) }
  const onMouseUp = () => { if (!getIsDragging()) return; scene.style.cursor = 'grab'; engine.emit(DragEnd, undefined) }
  document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp)

  const btnRow = document.createElement('div'); btnRow.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px;'
  const faceBtns: HTMLButtonElement[] = []
  for (let i = 0; i < FACES.length; i++) {
    const btn = document.createElement('button')
    btn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: 2px solid ${FACES[i].color}; background: transparent; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;`
    btn.textContent = `${FACES[i].icon} ${FACES[i].label}`
    btn.addEventListener('click', () => engine.emit(SelectFace, i))
    btnRow.appendChild(btn); faceBtns.push(btn)
  }
  wrapper.appendChild(btnRow)
  const info = document.createElement('div'); info.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 13px; text-align: center;'; wrapper.appendChild(info)
  container.appendChild(wrapper)

  function frame(now: number) {
    const dt = now - lastTime; lastTime = now
    updateFrame(dt)
    const rx = getSpringRotationX(); const ry = getSpringRotationY()
    cube.style.transform = `translateZ(-125px) rotateX(${rx}deg) rotateY(${ry}deg)`
    const sel = getSelectedFace(); const glow = getGlowIntensity()
    for (let i = 0; i < FACES.length; i++) {
      faceEls[i].style.boxShadow = i === sel ? `0 0 ${glow}px ${glow / 2}px rgba(255,255,255,0.3)` : 'none'
      faceBtns[i].style.background = i === sel ? FACES[i].color : 'transparent'
    }
    info.textContent = `Selected: ${FACES[sel].label} | Rotation: (${rx.toFixed(0)}, ${ry.toFixed(0)})`
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
}
