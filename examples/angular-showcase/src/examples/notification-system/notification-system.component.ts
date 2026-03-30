import { Component, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  AddNotification,
  DismissNotification,
  notifications,
  TYPE_CONFIG,
  type Notification,
  type NotificationType,
} from './engine'

@Component({
  selector: 'app-notification-system',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Notification System</h1>
      <p class="subtitle">Toast stack with 4 types, tweens, auto-dismiss, and spring reflow.</p>
      <div class="demo-controls">
        <button class="trigger-btn success" (click)="addNotif('success')">Success</button>
        <button class="trigger-btn error" (click)="addNotif('error')">Error</button>
        <button class="trigger-btn warning" (click)="addNotif('warning')">Warning</button>
        <button class="trigger-btn info" (click)="addNotif('info')">Info</button>
        <button class="trigger-btn random" (click)="addRandom()">Random</button>
      </div>
      <div class="toast-container">
        @for (notif of notifs(); track notif.id; let i = $index) {
          <div
            class="toast"
            [style.border-left-color]="getConfig(notif.type).color"
            [style.animation]="'slideIn 0.3s ease-out'"
          >
            <div class="toast-icon" [style.background]="getConfig(notif.type).color">
              {{ getConfig(notif.type).icon }}
            </div>
            <div class="toast-content">
              <div class="toast-title">{{ notif.title }}</div>
              <div class="toast-message">{{ notif.message }}</div>
              <div class="toast-time">{{ timeSince(notif.timestamp) }}</div>
            </div>
            <button class="toast-close" (click)="dismiss(notif.id)">x</button>
            @if (notif.autoDismiss) {
              <div class="toast-progress" [style.background]="getConfig(notif.type).color"></div>
            }
          </div>
        }
        @if (notifs().length === 0) {
          <div class="empty-state">
            <p>No notifications. Click a button above to add one.</p>
          </div>
        }
      </div>
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
    .demo-controls { display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }
    .trigger-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .trigger-btn:hover { opacity: 0.85; }
    .trigger-btn.success { background: #06d6a0; }
    .trigger-btn.error { background: #ef476f; }
    .trigger-btn.warning { background: #ffd166; color: #1a1a2e; }
    .trigger-btn.info { background: #4361ee; }
    .trigger-btn.random { background: #8338ec; }
    .toast-container {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    @keyframes slideIn {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast {
      background: #fff;
      border-radius: 12px;
      border-left: 4px solid;
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }
    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }
    .toast-content { flex: 1; min-width: 0; }
    .toast-title { font-size: 14px; font-weight: 700; color: #1a1a2e; }
    .toast-message { font-size: 13px; color: #6c757d; margin-top: 2px; line-height: 1.4; }
    .toast-time { font-size: 11px; color: #adb5bd; margin-top: 4px; }
    .toast-close {
      background: none;
      border: none;
      color: #adb5bd;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      line-height: 1;
    }
    .toast-close:hover { color: #495057; }
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      animation: shrink 4s linear forwards;
    }
    @keyframes shrink { from { width: 100%; } to { width: 0%; } }
    .empty-state { text-align: center; padding: 40px; color: #adb5bd; font-size: 14px; }
  `],
})
export class NotificationSystemComponent implements OnInit, OnDestroy {
  notifs: WritableSignal<Notification[]>

  private messages: Record<NotificationType, { title: string; message: string }[]> = {
    success: [
      { title: 'Saved!', message: 'Your changes have been saved successfully.' },
      { title: 'Deployed!', message: 'Application deployed to production.' },
      { title: 'Complete!', message: 'All tasks finished without errors.' },
    ],
    error: [
      { title: 'Connection Lost', message: 'Unable to connect to the server. Retrying...' },
      { title: 'Build Failed', message: 'TypeScript compilation error in engine.ts.' },
      { title: 'Permission Denied', message: 'You lack access to this resource.' },
    ],
    warning: [
      { title: 'High Memory', message: 'Memory usage is above 85%. Consider optimizing.' },
      { title: 'Slow Response', message: 'API response time exceeded 2 seconds.' },
      { title: 'Deprecated', message: 'This API endpoint will be removed in v3.' },
    ],
    info: [
      { title: 'Update Available', message: 'Pulse v2.1.0 is ready to install.' },
      { title: 'New Feature', message: 'Spring animations now support bounce mode.' },
      { title: 'Tip', message: 'Use engine.pipe() to transform events between types.' },
    ],
  }

  constructor(private pulse: PulseService) {
    this.notifs = pulse.signal(notifications)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
  }

  getConfig(type: NotificationType) {
    return TYPE_CONFIG[type]
  }

  addNotif(type: NotificationType): void {
    const msgs = this.messages[type]
    const msg = msgs[Math.floor(Math.random() * msgs.length)]
    this.pulse.emit(AddNotification, {
      type,
      title: msg.title,
      message: msg.message,
      autoDismiss: true,
    })
  }

  addRandom(): void {
    const types: NotificationType[] = ['success', 'error', 'warning', 'info']
    this.addNotif(types[Math.floor(Math.random() * types.length)])
  }

  dismiss(id: string): void {
    this.pulse.emit(DismissNotification, id)
  }

  timeSince(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 5) return 'Just now'
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
  }
}
