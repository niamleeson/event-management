import { Component, ViewChild, ElementRef, type WritableSignal, OnInit, OnDestroy, AfterViewInit } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  ClickSpawn,
  ClearParticles,
  particles,
  particleCount,
  type Particle,
} from './engine'

@Component({
  selector: 'app-3d-particle-explosion',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Particle Explosion</h1>
      <p class="subtitle">Click anywhere on the canvas to spawn particles. Physics via engine.on(frame).</p>
      <div class="info">
        <span>Particles: {{ count() }}</span>
        <button class="clear-btn" (click)="clear()">Clear All</button>
      </div>
      <canvas
        #canvas
        class="canvas"
        [width]="800"
        [height]="500"
        (click)="spawn($event)"
      ></canvas>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #0f0f23;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 24px; }
    .info {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
      color: rgba(255,255,255,0.6);
      font-size: 14px;
    }
    .clear-btn {
      padding: 6px 16px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      background: transparent;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
    }
    .clear-btn:hover { background: rgba(255,255,255,0.1); }
    .canvas {
      border-radius: 12px;
      background: #1a1a2e;
      cursor: crosshair;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
  `],
})
export class ThreeDParticleExplosionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>

  count: WritableSignal<number>
  private ctx!: CanvasRenderingContext2D

  constructor(private pulse: PulseService) {
    this.count = pulse.signal(particleCount)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!
    // Draw loop driven by pulse frame
    this.pulse.on(engine.frame, () => this.draw())
  }

  spawn(e: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect()
    this.pulse.emit(ClickSpawn, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  clear(): void {
    this.pulse.emit(ClearParticles, undefined)
  }

  private draw(): void {
    const ctx = this.ctx
    const w = this.canvasRef.nativeElement.width
    const h = this.canvasRef.nativeElement.height

    // Fade effect
    ctx.fillStyle = 'rgba(26, 26, 46, 0.15)'
    ctx.fillRect(0, 0, w, h)

    const ps: Particle[] = particles.value
    for (const p of ps) {
      const alpha = Math.max(0, p.life)

      // Draw trail
      if (p.trail.length > 1) {
        ctx.beginPath()
        ctx.moveTo(p.trail[0].x, p.trail[0].y)
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y)
        }
        ctx.strokeStyle = p.color + Math.round(alpha * 80).toString(16).padStart(2, '0')
        ctx.lineWidth = p.size * 0.5
        ctx.stroke()
      }

      // Draw particle
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0')
      ctx.fill()
    }
  }
}
