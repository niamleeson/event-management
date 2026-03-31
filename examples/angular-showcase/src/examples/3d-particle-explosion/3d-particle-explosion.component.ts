import { Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, ClickSpawn, ClearParticles, ParticlesChanged, ParticleCountChanged, FrameTick, type Particle } from './engine'

@Component({
  selector: 'app-3d-particle-explosion', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Particle Explosion</h1><p class="subtitle">Click canvas to spawn particles. Physics via engine.on().</p><div class="info"><span>Particles: {{ count() }}</span><button class="clear-btn" (click)="clear()">Clear All</button></div><canvas #canvas class="canvas" [width]="800" [height]="500" (click)="spawn($event)"></canvas></div>`,
  styles: [`.page{min-height:100vh;background:#0f0f23;padding:40px 20px;font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:32px;font-weight:800;color:#fff;margin-bottom:8px}.subtitle{color:rgba(255,255,255,.5);font-size:14px;margin-bottom:24px}.info{display:flex;gap:16px;align-items:center;margin-bottom:16px;color:rgba(255,255,255,.6);font-size:14px}.clear-btn{padding:6px 16px;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:transparent;color:#fff;cursor:pointer;font-size:13px}.canvas{border-radius:12px;background:#1a1a2e;cursor:crosshair;box-shadow:0 8px 32px rgba(0,0,0,.4)}`],
})
export class ThreeDParticleExplosionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>
  count = this.pulse.use(ParticleCountChanged, 0)
  private ctx!: CanvasRenderingContext2D
  private lastParticles: Particle[] = []

  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!
    engine.on(ParticlesChanged, (ps) => { this.lastParticles = ps })
    engine.on(FrameTick, () => this.draw())
  }

  spawn(e: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect()
    this.pulse.emit(ClickSpawn, { x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  clear(): void { this.pulse.emit(ClearParticles, undefined) }

  private draw(): void {
    const ctx = this.ctx, w = 800, h = 500
    ctx.fillStyle = 'rgba(26, 26, 46, 0.15)'; ctx.fillRect(0, 0, w, h)
    for (const p of this.lastParticles) {
      const alpha = Math.max(0, p.life)
      if (p.trail.length > 1) {
        ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y)
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y)
        ctx.strokeStyle = p.color + Math.round(alpha * 80).toString(16).padStart(2, '0')
        ctx.lineWidth = p.size * 0.5; ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0'); ctx.fill()
    }
  }
}
