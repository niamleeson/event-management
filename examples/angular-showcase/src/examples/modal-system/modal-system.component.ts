import { Component, type WritableSignal, OnInit, OnDestroy, HostListener } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  OpenModal,
  CloseModal,
  CloseAll,
  modalStack,
  backdropBlur,
  modalOpacity,
  modalScale,
  type ModalConfig,
} from './engine'

let modalId = 0

@Component({
  selector: 'app-modal-system',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Modal System</h1>
      <p class="subtitle">Stacked modals with scale/fade tweens, backdrop blur, escape to close.</p>
      <div class="demo-buttons">
        <button class="open-btn" (click)="openModal('sm')">Open Small</button>
        <button class="open-btn med" (click)="openModal('md')">Open Medium</button>
        <button class="open-btn lg" (click)="openModal('lg')">Open Large</button>
        <button class="close-all-btn" (click)="closeAll()">Close All</button>
      </div>

      <div class="content-area" [style.filter]="'blur(' + blur() + 'px)'">
        <div class="placeholder-card">
          <h2>Background Content</h2>
          <p>This content blurs as modals stack. Open modals to see the effect.</p>
          <p>Stack depth: {{ stack().length }}</p>
        </div>
      </div>

      @for (modal of stack(); track modal.id; let i = $index) {
        <div class="modal-overlay" [style.z-index]="100 + i" (click)="closeTopModal()">
          <div
            class="modal-dialog"
            [class]="'modal-' + modal.size"
            [style.border-top-color]="modal.color"
            [style.opacity]="getOpacity(i)"
            [style.transform]="'scale(' + getScale(i) + ') translateY(' + (i * -8) + 'px)'"
            (click)="$event.stopPropagation()"
          >
            <div class="modal-header">
              <h3>{{ modal.title }}</h3>
              <button class="modal-close" (click)="closeModal(modal.id)">x</button>
            </div>
            <div class="modal-body">
              <p>{{ modal.content }}</p>
              <div class="modal-actions">
                <button class="action-btn" (click)="openModal('sm')">Open Nested</button>
                <button class="action-btn secondary" (click)="closeModal(modal.id)">Close</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; }
    .demo-buttons { display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }
    .open-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #4361ee;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .open-btn.med { background: #7209b7; }
    .open-btn.lg { background: #f72585; }
    .open-btn:hover { opacity: 0.9; }
    .close-all-btn {
      padding: 10px 20px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: #fff;
      color: #495057;
      font-weight: 600;
      cursor: pointer;
    }
    .content-area {
      width: 500px;
      transition: filter 0.3s;
    }
    .placeholder-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .placeholder-card h2 { margin: 0 0 12px; color: #1a1a2e; }
    .placeholder-card p { color: #6c757d; margin: 8px 0; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-dialog {
      background: #fff;
      border-radius: 16px;
      border-top: 4px solid;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      transition: opacity 0.25s, transform 0.25s;
    }
    .modal-sm { width: 360px; }
    .modal-md { width: 480px; }
    .modal-lg { width: 600px; }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e9ecef;
    }
    .modal-header h3 { margin: 0; font-size: 18px; color: #1a1a2e; }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #6c757d;
      cursor: pointer;
    }
    .modal-close:hover { color: #1a1a2e; }
    .modal-body { padding: 24px; }
    .modal-body p { color: #495057; line-height: 1.6; margin: 0 0 20px; }
    .modal-actions { display: flex; gap: 8px; }
    .action-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #4361ee;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    .action-btn.secondary { background: #e9ecef; color: #495057; }
    .action-btn:hover { opacity: 0.9; }
  `],
})
export class ModalSystemComponent implements OnInit, OnDestroy {
  stack: WritableSignal<ModalConfig[]>
  blur: WritableSignal<number>

  private opacitySigs: WritableSignal<number>[] = []
  private scaleSigs: WritableSignal<number>[] = []

  constructor(private pulse: PulseService) {
    this.stack = pulse.signal(modalStack)
    this.blur = pulse.signal(backdropBlur)

    for (let i = 0; i < 5; i++) {
      this.opacitySigs.push(pulse.tween(modalOpacity[i]))
      this.scaleSigs.push(pulse.tween(modalScale[i]))
    }
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeTopModal()
  }

  openModal(size: 'sm' | 'md' | 'lg'): void {
    const colors = ['#4361ee', '#7209b7', '#f72585', '#2a9d8f', '#e76f51']
    const titles = ['Confirm Action', 'Settings', 'User Profile', 'Notification', 'Details']
    const id = `modal-${++modalId}`
    const depth = this.stack().length
    this.pulse.emit(OpenModal, {
      id,
      title: `${titles[depth % titles.length]} (Level ${depth + 1})`,
      content: `This is a ${size} modal at depth ${depth + 1}. You can open nested modals or close this one. Press Escape to close the top modal.`,
      size,
      color: colors[depth % colors.length],
    })
  }

  closeModal(id: string): void {
    this.pulse.emit(CloseModal, id)
  }

  closeTopModal(): void {
    const s = this.stack()
    if (s.length > 0) {
      this.pulse.emit(CloseModal, s[s.length - 1].id)
    }
  }

  closeAll(): void {
    this.pulse.emit(CloseAll, undefined)
  }

  getOpacity(index: number): number {
    return this.opacitySigs[index % 5]?.() ?? 1
  }

  getScale(index: number): number {
    return this.scaleSigs[index % 5]?.() ?? 1
  }
}
