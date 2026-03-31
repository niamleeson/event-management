import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, HostListener, signal as ngSignal } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, LAYERS, LAYER_COUNT, MouseMove, ToggleTheme, PageEnter, CameraTiltXChanged, CameraTiltYChanged, IsDarkChanged, LayerOpacityChanged, LayerTranslateYChanged, type Layer } from './engine'

@Component({
  selector: 'app-3d-layered-parallax', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page" [class.dark]="dark()" [class.light]="!dark()"><div class="header"><h1 class="title">Layered Parallax</h1><p class="subtitle">Move mouse for spring-driven camera tilt.</p><button class="theme-btn" (click)="toggleTheme()">{{ dark() ? 'Day Mode' : 'Night Mode' }}</button></div><div class="scene" [style.transform]="'perspective(1000px) rotateX(' + (tiltY() * 5) + 'deg) rotateY(' + (tiltX() * 8) + 'deg)'">@for (layer of layers; track $index; let i = $index) {<div class="layer" [style.transform]="'translateZ(' + layer.depth + 'px) translateY(' + translates[i]() + 'px)'" [style.opacity]="opacities[i]()" [style.background]="getLayerBg(i)"><div class="layer-content"><span class="layer-label">{{ layer.label }}</span><span class="layer-depth">Z: {{ layer.depth }}px</span></div></div>}</div></div>`,
  styles: [`.page{min-height:100vh;padding:40px 20px;font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;transition:background .5s}.dark{background:#0f0f23;color:#fff}.light{background:#f0f4f8;color:#1a1a2e}.header{text-align:center;margin-bottom:40px;z-index:10;position:relative}.title{font-size:32px;font-weight:800;margin-bottom:8px}.subtitle{opacity:.6;font-size:14px;margin-bottom:16px}.theme-btn{padding:8px 20px;border:2px solid currentColor;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font-weight:600;font-size:13px}.scene{width:700px;height:400px;position:relative;transform-style:preserve-3d}.layer{position:absolute;width:100%;height:100%;border-radius:16px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:20px}.layer-content{display:flex;flex-direction:column;align-items:center;gap:4px}.layer-label{font-size:16px;font-weight:700;color:rgba(255,255,255,.9)}.layer-depth{font-size:11px;color:rgba(255,255,255,.5)}`],
})
export class ThreeDLayeredParallaxComponent implements OnInit, OnDestroy, AfterViewInit {
  layers: Layer[] = LAYERS
  tiltX = this.pulse.use(CameraTiltXChanged, 0)
  tiltY = this.pulse.use(CameraTiltYChanged, 0)
  dark = this.pulse.use(IsDarkChanged, true)
  opacities: WritableSignal<number>[] = []
  translates: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    for (let i = 0; i < LAYER_COUNT; i++) {
      const op = ngSignal(0); const tr = ngSignal(60)
      this.opacities.push(op); this.translates.push(tr)
      engine.on(LayerOpacityChanged[i], (e) => op.set(e.value))
      engine.on(LayerTranslateYChanged[i], (e) => tr.set(e.value))
    }
  }

  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  ngAfterViewInit(): void { setTimeout(() => this.pulse.emit(PageEnter, undefined), 300) }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void { this.pulse.emit(MouseMove, { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }) }
  toggleTheme(): void { this.pulse.emit(ToggleTheme, undefined) }
  getLayerBg(index: number): string {
    const d = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560']
    const l = ['#e8f0fe', '#c5d8f0', '#a3bde0', '#7f9ec8', '#5a7fb0']
    return this.dark() ? d[index] : l[index]
  }
}
