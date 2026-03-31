import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, OpenModal, CloseModal, CloseAll, ModalStackChanged, type ModalConfig } from './engine'
@Component({ selector: 'app-modal-system', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Modal System</h1><p class="subtitle">Stacked modals, blur backdrop, escape to close.</p><div class="btns"><button class="btn" style="background:#4361ee" (click)="open('sm')">Small</button><button class="btn" style="background:#7209b7" (click)="open('md')">Medium</button><button class="btn" style="background:#f72585" (click)="open('lg')">Large</button><button class="btn" style="background:#666" (click)="closeAll()">Close All</button></div>@for (modal of stack(); track modal.id; let i = $index) {<div class="bk" [style.backdrop-filter]="'blur(' + ((i+1)*4) + 'px)'" (click)="close(modal.id)"><div class="md" [class]="'md-' + modal.size" [style.border-top-color]="modal.color" (click)="$event.stopPropagation()"><div class="mh"><h2>{{ modal.title }}</h2><button class="cb" (click)="close(modal.id)">x</button></div><div class="mb">{{ modal.content }}</div><div class="mf"><button class="btn" [style.background]="modal.color" (click)="open(modal.size)">Open Another</button></div></div></div>}</div>`,
  styles: [`.page{min-height:100vh;background:#f8f9fa;padding:40px 20px;font-family:sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:8px}.subtitle{color:#6c757d;font-size:14px;margin-bottom:24px}.btns{display:flex;gap:8px;margin-bottom:24px}.btn{padding:10px 20px;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer;font-size:14px}.bk{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:100}.md{background:#fff;border-radius:16px;border-top:4px solid;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fi .25s ease-out}.md-sm{width:320px}.md-md{width:480px}.md-lg{width:640px}@keyframes fi{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}.mh{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0}.mh h2{margin:0;font-size:20px;color:#1a1a2e}.cb{border:none;background:none;font-size:24px;color:#adb5bd;cursor:pointer}.mb{padding:16px 24px;color:#495057;font-size:14px;line-height:1.6}.mf{padding:0 24px 20px;display:flex;justify-content:flex-end}`],
})
export class ModalSystemComponent implements OnInit, OnDestroy {
  stack = this.pulse.use(ModalStackChanged, [] as ModalConfig[])
  private counter = 0
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  open(size: 'sm' | 'md' | 'lg'): void {
    const colors = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#2a9d8f']
    this.pulse.emit(OpenModal, { id: `modal-${++this.counter}`, title: `Modal ${this.counter}`, content: `This is modal #${this.counter}. Stack up to 5.`, size, color: colors[this.counter % colors.length] })
  }
  close(id: string): void { this.pulse.emit(CloseModal, id) }
  closeAll(): void { this.pulse.emit(CloseAll, undefined) }
  @HostListener('window:keydown.escape')
  onEscape(): void { const s = this.stack(); if (s.length > 0) this.close(s[s.length - 1].id) }
}
