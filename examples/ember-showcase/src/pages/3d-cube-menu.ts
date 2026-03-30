import {
  engine,
  FACES,
  FACE_ROTATIONS,
  SelectFace,
  DragStart,
  DragMove,
  DragEnd,
  selectedFace,
  isDragging,
  targetRotationX,
  targetRotationY,
  springRotationX,
  springRotationY,
  springGlow,
} from '../engines/3d-cube-menu'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0d1117; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'

  const h1 = document.createElement('h1')
  h1.style.cssText = 'color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;'
  h1.textContent = '3D Cube Menu'
  wrapper.appendChild(h1)

  const sub = document.createElement('p')
  sub.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 40px; text-align: center;'
  sub.textContent = 'Drag to rotate the cube. Click faces or buttons to navigate. Spring physics snap to 90 degrees.'
  wrapper.appendChild(sub)

  // Cube scene
  const scene = document.createElement('div')
  scene.style.cssText = 'width: 250px; height: 250px; perspective: 600px; margin: 0 auto 40px; cursor: grab;'

  const cube = document.createElement('div')
  cube.style.cssText = 'width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transform: translateZ(-125px);'

  const faceEls: HTMLElement[] = []
  const faceTransforms = [
    'rotateY(0deg) translateZ(125px)',     // front
    'rotateY(90deg) translateZ(125px)',    // right
    'rotateY(180deg) translateZ(125px)',   // back
    'rotateY(-90deg) translateZ(125px)',   // left
    'rotateX(90deg) translateZ(125px)',    // top
    'rotateX(-90deg) translateZ(125px)',   // bottom
  ]

  for (let i = 0; i < FACES.length; i++) {
    const face = FACES[i]
    const faceEl = document.createElement('div')
    faceEl.style.cssText = `position: absolute; width: 250px; height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${face.color}; border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; transform: ${faceTransforms[i]}; backface-visibility: visible; user-select: none;`

    const icon = document.createElement('div')
    icon.style.cssText = 'font-size: 48px; margin-bottom: 12px;'
    icon.textContent = face.icon

    const label = document.createElement('div')
    label.style.cssText = 'color: #fff; font-size: 20px; font-weight: 700;'
    label.textContent = face.label

    faceEl.appendChild(icon)
    faceEl.appendChild(label)
    cube.appendChild(faceEl)
    faceEls.push(faceEl)
  }

  scene.appendChild(cube)
  wrapper.appendChild(scene)

  // Drag handling
  let dragStartPos = { x: 0, y: 0 }
  let dragStartRotation = { x: 0, y: 0 }

  scene.addEventListener('mousedown', (e) => {
    e.preventDefault()
    scene.style.cursor = 'grabbing'
    dragStartPos = { x: e.clientX, y: e.clientY }
    dragStartRotation = { x: targetRotationX.value, y: targetRotationY.value }
    engine.emit(DragStart, { x: e.clientX, y: e.clientY })
  })

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    const dx = e.clientX - dragStartPos.x
    const dy = e.clientY - dragStartPos.y
    const newX = dragStartRotation.x - dy * 0.5
    const newY = dragStartRotation.y + dx * 0.5
    targetRotationX._set(newX)
    targetRotationY._set(newY)
    engine.emit(DragMove, { x: e.clientX, y: e.clientY })
  }

  const onMouseUp = () => {
    if (!isDragging.value) return
    scene.style.cursor = 'grab'
    engine.emit(DragEnd, undefined)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)

  // Face selector buttons
  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px;'

  const faceBtns: HTMLButtonElement[] = []
  for (let i = 0; i < FACES.length; i++) {
    const btn = document.createElement('button')
    btn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: 2px solid ${FACES[i].color}; background: transparent; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;`
    btn.textContent = `${FACES[i].icon} ${FACES[i].label}`
    btn.addEventListener('click', () => engine.emit(SelectFace, i))
    btnRow.appendChild(btn)
    faceBtns.push(btn)
  }
  wrapper.appendChild(btnRow)

  // Info
  const info = document.createElement('div')
  info.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 13px; text-align: center;'
  wrapper.appendChild(info)

  container.appendChild(wrapper)

  // Frame update
  unsubs.push(engine.on(engine.frame, () => {
    const rx = springRotationX.value
    const ry = springRotationY.value
    cube.style.transform = `translateZ(-125px) rotateX(${rx}deg) rotateY(${ry}deg)`

    const sel = selectedFace.value
    const glow = springGlow.value
    for (let i = 0; i < FACES.length; i++) {
      faceEls[i].style.boxShadow = i === sel ? `0 0 ${glow}px ${glow / 2}px rgba(255,255,255,0.3)` : 'none'
      faceBtns[i].style.background = i === sel ? FACES[i].color : 'transparent'
    }

    info.textContent = `Selected: ${FACES[sel].label} | Rotation: (${rx.toFixed(0)}, ${ry.toFixed(0)})`
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
