import { Component, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, AddNotification, DismissNotification, NotificationsChanged, TYPE_CONFIG, type Notification, type NotificationType } from './engine'

@Component({
  selector: 'app-notification-system', standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Notification System</h1><p class="subtitle">Toast stack with 4 types, auto-dismiss.</p>
      <div class="demo-controls">
        <button class="trigger-btn success" (click)="addNotif('success')">Success</button>
        <button class="trigger-btn error" (click)="addNotif('error')">Error</button>
        <button class="trigger-btn warning" (click)="addNotif('warning')">Warning</button>
        <button class="trigger-btn info" (click)="addNotif('info')">Info</button>
        <button class="trigger-btn random" (click)="addRandom()">Random</button>
      </div>
      <div class="toast-container">
        @for (notif of notifs(); track notif.id) {
          <div class="toast" [style.border-left-color]="getConfig(notif.type).color" [style.animation]="'slideIn 0.3s ease-out'">
            <div class="toast-icon" [style.background]="getConfig(notif.type).color">{{ getConfig(notif.type).icon }}</div>
            <div class="toast-content"><div class="toast-title">{{ notif.title }}</div><div class="toast-message">{{ notif.message }}</div><div class="toast-time">{{ timeSince(notif.timestamp) }}</div></div>
            <button class="toast-close" (click)="dismiss(notif.id)">x</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
    .page { min-height: 100vh; background: #f8f9fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; } .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; }
    .demo-controls { display: flex; gap: 8px; margin-bottom: 32px; }
    .trigger-btn { padding: 10px 20px; border: none; border-radius: 8px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .success { background: #06d6a0; } .error { background: #ef476f; } .warning { background: #ffd166; color: #333; } .info { background: #4361ee; } .random { background: #333; }
    .toast-container { width: 400px; display: flex; flex-direction: column; gap: 8px; }
    .toast { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border-radius: 12px; border-left: 4px solid; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .toast-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .toast-content { flex: 1; } .toast-title { font-size: 14px; font-weight: 600; color: #1a1a2e; } .toast-message { font-size: 13px; color: #6c757d; margin-top: 2px; } .toast-time { font-size: 11px; color: #adb5bd; margin-top: 4px; }
    .toast-close { border: none; background: none; color: #adb5bd; font-size: 18px; cursor: pointer; padding: 4px; }
  `],
})
export class NotificationSystemComponent implements OnInit, OnDestroy {
  notifs = this.pulse.use(NotificationsChanged, [] as Notification[])
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  getConfig(type: NotificationType) { return TYPE_CONFIG[type] }
  addNotif(type: NotificationType): void {
    const titles: Record<NotificationType, string> = { success: 'Success!', error: 'Error!', warning: 'Warning', info: 'Info' }
    const msgs: Record<NotificationType, string> = { success: 'Operation completed.', error: 'Something went wrong.', warning: 'Check your input.', info: 'Some information.' }
    this.pulse.emit(AddNotification, { type, title: titles[type], message: msgs[type], autoDismiss: type !== 'error' })
  }
  addRandom(): void { const types: NotificationType[] = ['success', 'error', 'warning', 'info']; this.addNotif(types[Math.floor(Math.random() * types.length)]) }
  dismiss(id: string): void { this.pulse.emit(DismissNotification, id) }
  timeSince(ts: number): string { const s = Math.floor((Date.now() - ts) / 1000); return s < 5 ? 'just now' : `${s}s ago` }
}
