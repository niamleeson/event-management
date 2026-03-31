import { engine, SpawnExplosion, ClearParticles, ToggleGravity, getParticles, getGravityEnabled, getExplosionCount, getActiveParticleCount, updateFrame } from '../engines/3d-particle-explosion'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  let rafId = 0; let lastTime = performance.now()

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'min-height: 100vh; background: #0a0a0a; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center;'
  wrapper.innerHTML = `<h1 style="color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 8px; text-align: center;">3D Particle Explosion</h1><p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 20px; text-align: center;">Click canvas to spawn particle explosions. Engine frame loop drives physics, gravity, and trails.</p>`

  const controls = document.createElement('div'); controls.style.cssText = 'display: flex; gap: 10px; margin-bottom: 16px;'
  const gravBtn = document.createElement('button'); gravBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: #2a9d8f; color: #fff; font-weight: 600; cursor: pointer;'; gravBtn.textContent = 'Gravity: ON'; gravBtn.addEventListener('click', () => engine.emit(ToggleGravity, undefined))
  const clearBtn = document.createElement('button'); clearBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: #e63946; color: #fff; font-weight: 600; cursor: pointer;'; clearBtn.textContent = 'Clear'; clearBtn.addEventListener('click', () => engine.emit(ClearParticles, undefined))
  controls.appendChild(gravBtn); controls.appendChild(clearBtn); wrapper.appendChild(controls)

  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 500
  canvas.style.cssText = 'border-radius: 12px; cursor: crosshair; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); max-width: 100%;'
  wrapper.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  canvas.addEventListener('click', (e) => { const rect = canvas.getBoundingClientRect(); engine.emit(SpawnExplosion, { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }) })

  const stats = document.createElement('div'); stats.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 12px; text-align: center;'
  wrapper.appendChild(stats); container.appendChild(wrapper)

  function frame(now: number) {
    const dt = now - lastTime; lastTime = now
    updateFrame(dt)
    ctx.fillStyle = 'rgba(10, 10, 10, 0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const p of getParticles()) {
      const alpha = Math.max(0, p.life)
      if (p.trail.length > 1) { ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y); for (let t = 1; t < p.trail.length; t++) ctx.lineTo(p.trail[t].x, p.trail[t].y); ctx.lineTo(p.x, p.y); ctx.strokeStyle = p.color + Math.floor(alpha * 0.4 * 255).toString(16).padStart(2, '0'); ctx.lineWidth = p.size * 0.5 * alpha; ctx.stroke() }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'); ctx.fill()
    }
    gravBtn.textContent = `Gravity: ${getGravityEnabled() ? 'ON' : 'OFF'}`; gravBtn.style.background = getGravityEnabled() ? '#2a9d8f' : '#666'
    stats.textContent = `Explosions: ${getExplosionCount()} | Active particles: ${getActiveParticleCount()}`
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); cancelAnimationFrame(rafId) }
}
