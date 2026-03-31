import { useEffect, useRef, useCallback } from 'react'
import {
  engine,
  npcs,
  mousePos,
  dragId,
  score,
  screenW,
  screenH,
  initGame,
  startLoop,
  stopLoop,
  MouseMoved,
  MouseDown,
  MouseUp,
  Frame,
  DIVIDER_X,
  QUEUE_HEIGHT,
  GROUND_Y,
  NPC_SIZE,
  type NPCState,
} from './engine'

const EXPRESSIONS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  terrified: '😱',
  pleading: '🥺',
  serene: '😇',
  grabbing: '😈',
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H

    // ── Background ──

    // Hell side (left) — dark red gradient
    const hellGrad = ctx.createLinearGradient(0, 0, W * DIVIDER_X, H)
    hellGrad.addColorStop(0, '#1a0505')
    hellGrad.addColorStop(0.5, '#2d0a0a')
    hellGrad.addColorStop(1, '#1a0000')
    ctx.fillStyle = hellGrad
    ctx.fillRect(0, 0, W * DIVIDER_X, H)

    // Heaven side (right) — soft gold/white gradient
    const heavenGrad = ctx.createLinearGradient(W * DIVIDER_X, 0, W, H)
    heavenGrad.addColorStop(0, '#0d1020')
    heavenGrad.addColorStop(0.3, '#141830')
    heavenGrad.addColorStop(1, '#0d1020')
    ctx.fillStyle = heavenGrad
    ctx.fillRect(W * DIVIDER_X, 0, W * (1 - DIVIDER_X), H)

    // ── Divider line ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(W * DIVIDER_X, H * QUEUE_HEIGHT + 50)
    ctx.lineTo(W * DIVIDER_X, H)
    ctx.stroke()
    ctx.setLineDash([])

    // ── Queue area ──
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.fillRect(0, 0, W, H * QUEUE_HEIGHT + 50)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, H * QUEUE_HEIGHT + 50)
    ctx.lineTo(W, H * QUEUE_HEIGHT + 50)
    ctx.stroke()

    // Queue label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '12px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('WAITING FOR JUDGMENT', W / 2, 14)

    // ── Zone labels ──
    ctx.font = 'bold 24px -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(200, 50, 50, 0.3)'
    ctx.fillText('HELL', W * 0.25, H * 0.2)
    ctx.fillStyle = 'rgba(200, 180, 100, 0.3)'
    ctx.fillText('HEAVEN', W * 0.75, H * 0.2)

    // ── Hell ground — flames ──
    const flameY = H * GROUND_Y
    ctx.fillStyle = 'rgba(180, 30, 0, 0.15)'
    ctx.fillRect(0, flameY, W * DIVIDER_X, H - flameY)

    // Animated flame tips
    for (let i = 0; i < 30; i++) {
      const fx = (i / 30) * W * DIVIDER_X
      const fh = 15 + Math.sin(Date.now() / 200 + i * 0.7) * 10
      const grad = ctx.createLinearGradient(fx, flameY - fh, fx, flameY)
      grad.addColorStop(0, 'rgba(255, 100, 0, 0)')
      grad.addColorStop(1, 'rgba(255, 50, 0, 0.3)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(fx - 8, flameY)
      ctx.quadraticCurveTo(fx, flameY - fh, fx + 8, flameY)
      ctx.fill()
    }

    // ── Heaven glow — soft light rays ──
    for (let i = 0; i < 5; i++) {
      const rx = W * DIVIDER_X + 50 + i * (W * 0.45 / 5)
      const rayW = 40 + Math.sin(Date.now() / 1500 + i) * 15
      const grad = ctx.createLinearGradient(rx, H * 0.15, rx, H * 0.7)
      grad.addColorStop(0, `rgba(255, 220, 150, ${0.03 + Math.sin(Date.now() / 2000 + i * 1.2) * 0.02})`)
      grad.addColorStop(1, 'rgba(255, 220, 150, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(rx - rayW / 2, H * 0.15, rayW, H * 0.55)
    }

    // ── Draw NPCs ──
    for (const [id, s] of npcs) {
      ctx.save()
      ctx.globalAlpha = s.opacity
      ctx.translate(s.x, s.y)
      ctx.rotate((s.rotation * Math.PI) / 180)
      ctx.scale(s.scale, s.scale)

      // ── Shadow ──
      if (s.zone === 'dragging') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetY = 10
      }

      // ── Body (circle) ──
      const bodyColor = s.zone === 'heaven' ? 'rgba(255, 220, 150, 0.2)'
        : s.zone === 'hell' ? 'rgba(200, 50, 30, 0.2)'
        : s.zone === 'clinging' ? 'rgba(150, 30, 30, 0.4)'
        : 'rgba(100, 100, 120, 0.2)'

      ctx.beginPath()
      ctx.arc(0, 0, NPC_SIZE / 2, 0, Math.PI * 2)
      ctx.fillStyle = bodyColor
      ctx.fill()
      ctx.strokeStyle = s.zone === 'heaven' ? 'rgba(255, 220, 150, 0.4)'
        : s.zone === 'hell' ? 'rgba(200, 50, 30, 0.4)'
        : s.zone === 'clinging' ? 'rgba(255, 50, 30, 0.6)'
        : 'rgba(150, 150, 170, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // ── Halo for heaven ──
      if (s.zone === 'heaven') {
        ctx.beginPath()
        ctx.ellipse(0, -NPC_SIZE / 2 - 5, 14, 5, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 220, 100, ${0.5 + Math.sin(Date.now() / 500) * 0.2})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // ── Arms for hell (reaching) ──
      if ((s.zone === 'hell' || s.zone === 'clinging') && s.reachAmount > 0.05) {
        ctx.strokeStyle = s.zone === 'clinging' ? 'rgba(255, 80, 50, 0.8)' : 'rgba(200, 100, 80, 0.6)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        const armLen = NPC_SIZE * 0.6 * s.reachAmount
        // Left arm
        ctx.beginPath()
        ctx.moveTo(-10, 0)
        ctx.lineTo(
          -10 + Math.cos(s.armAngle - 0.3) * armLen,
          Math.sin(s.armAngle - 0.3) * armLen
        )
        ctx.stroke()
        // Right arm
        ctx.beginPath()
        ctx.moveTo(10, 0)
        ctx.lineTo(
          10 + Math.cos(s.armAngle + 0.3) * armLen,
          Math.sin(s.armAngle + 0.3) * armLen
        )
        ctx.stroke()
        // Grabby hands
        if (s.reachAmount > 0.5) {
          const handX1 = -10 + Math.cos(s.armAngle - 0.3) * armLen
          const handY1 = Math.sin(s.armAngle - 0.3) * armLen
          const handX2 = 10 + Math.cos(s.armAngle + 0.3) * armLen
          const handY2 = Math.sin(s.armAngle + 0.3) * armLen
          ctx.fillStyle = ctx.strokeStyle
          ctx.beginPath(); ctx.arc(handX1, handY1, 4, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(handX2, handY2, 4, 0, Math.PI * 2); ctx.fill()
        }
      }

      // ── Bow for heaven ──
      if (s.zone === 'heaven' && s.bowAmount > 0.05) {
        // Tilt forward
        ctx.rotate(s.bowAmount * 0.4)
      }

      // ── Expression emoji ──
      ctx.font = `${NPC_SIZE * 0.6}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(EXPRESSIONS[s.expression] || s.npc.emoji, 0, -2)

      // ── Name tag ──
      ctx.font = 'bold 10px -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(s.npc.name, 0, NPC_SIZE / 2 + 4)

      // ── Sin label (show on hover / queue) ──
      if (s.zone === 'queue' || s.zone === 'dragging') {
        ctx.font = '9px -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillText(s.npc.sin, 0, NPC_SIZE / 2 + 17)
      }

      ctx.restore()
    }

    // ── Cursor indicator ──
    if (dragId) {
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fill()
    }

    // ── Score ──
    ctx.font = 'bold 16px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(200, 50, 50, 0.6)'
    ctx.fillText(`Hell: ${score.hell}`, 20, H - 20)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(200, 180, 100, 0.6)'
    ctx.fillText(`Heaven: ${score.heaven}`, W - 20, H - 20)

    // ── Instructions ──
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fillText('Drag souls to judge them. Hell dwellers will cling — shake to free yourself.', W / 2, H - 10)

  }, [])

  useEffect(() => {
    initGame()
    startLoop()

    // Subscribe to frame for redraw
    const unsub = engine.on(Frame, () => draw())

    const handleMouseMove = (e: MouseEvent) => engine.emit(MouseMoved, { x: e.clientX, y: e.clientY })
    const handleMouseDown = (e: MouseEvent) => engine.emit(MouseDown, { x: e.clientX, y: e.clientY })
    const handleMouseUp = (e: MouseEvent) => engine.emit(MouseUp, { x: e.clientX, y: e.clientY })

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      stopLoop()
      unsub()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draw])

  return <canvas ref={canvasRef} style={{ display: 'block', cursor: dragId ? 'grabbing' : 'grab' }} />
}
