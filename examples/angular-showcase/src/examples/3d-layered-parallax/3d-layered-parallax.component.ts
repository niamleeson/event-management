import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  LAYERS,
  LAYER_COUNT,
  MouseMove,
  ToggleTheme,
  PageEnter,
  cameraTiltX,
  cameraTiltY,
  layerOpacity,
  layerTranslateY,
  isDark,
  type Layer,
} from './engine'

@Component({
  selector: 'app-3d-layered-parallax',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page" [class.dark]="dark()" [class.light]="!dark()">
      <div class="header">
        <h1 class="title">Layered Parallax</h1>
        <p class="subtitle">Move mouse for spring-driven camera tilt. Layers at different Z depths.</p>
        <button class="theme-btn" (click)="toggleTheme()">
          {{ dark() ? 'Day Mode' : 'Night Mode' }}
        </button>
      </div>
      <div class="scene" [style.transform]="'perspective(1000px) rotateX(' + (tiltY() * 5) + 'deg) rotateY(' + (tiltX() * 8) + 'deg)'">
        @for (layer of layers; track $index; let i = $index) {
          <div
            class="layer"
            [style.transform]="'translateZ(' + layer.depth + 'px) translateY(' + translates[i]() + 'px)'"
            [style.opacity]="opacities[i]()"
            [style.background]="getLayerBg(i)"
          >
            <div class="layer-content">
              <span class="layer-label">{{ layer.label }}</span>
              <span class="layer-depth">Z: {{ layer.depth }}px</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background 0.5s, color 0.5s;
    }
    .dark { background: #0f0f23; color: #fff; }
    .light { background: #f0f4f8; color: #1a1a2e; }
    .header { text-align: center; margin-bottom: 40px; position: relative; z-index: 10; }
    .title { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .subtitle { opacity: 0.6; font-size: 14px; margin-bottom: 16px; }
    .theme-btn {
      padding: 8px 20px;
      border: 2px solid currentColor;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: opacity 0.2s;
    }
    .theme-btn:hover { opacity: 0.7; }
    .scene {
      width: 700px;
      height: 400px;
      position: relative;
      transform-style: preserve-3d;
    }
    .layer {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }
    .layer-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .layer-label {
      font-size: 16px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .layer-depth {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
    }
  `],
})
export class ThreeDLayeredParallaxComponent implements OnInit, OnDestroy, AfterViewInit {
  layers: Layer[] = LAYERS

  tiltX: WritableSignal<number>
  tiltY: WritableSignal<number>
  dark: WritableSignal<boolean>
  opacities: WritableSignal<number>[] = []
  translates: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    this.tiltX = pulse.spring(cameraTiltX)
    this.tiltY = pulse.spring(cameraTiltY)
    this.dark = pulse.signal(isDark)

    for (let i = 0; i < LAYER_COUNT; i++) {
      this.opacities.push(pulse.tween(layerOpacity[i]))
      this.translates.push(pulse.tween(layerTranslateY[i]))
    }
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.pulse.emit(PageEnter, undefined)
    }, 300)
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = (e.clientY / window.innerHeight) * 2 - 1
    this.pulse.emit(MouseMove, { x, y })
  }

  toggleTheme(): void {
    this.pulse.emit(ToggleTheme, undefined)
  }

  getLayerBg(index: number): string {
    const darkColors = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560']
    const lightColors = ['#e8f0fe', '#c5d8f0', '#a3bde0', '#7f9ec8', '#5a7fb0']
    return this.dark() ? darkColors[index] : lightColors[index]
  }
}
