import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, signal as ngSignal } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, USERS, CursorMove, TextEdit, CursorsChanged, DocLinesChanged, EditHistoryChanged, CursorXChanged, CursorYChanged, startBots, stopBots, type CursorPosition, type HistoryEntry } from './engine'

@Component({
  selector: 'app-collaborative-editor',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Collaborative Editor</h1><p class="subtitle">Multi-user simulation with 2 bots. Cursor tracking and edit history.</p>
      <div class="layout">
        <div class="editor-area">
          <div class="user-indicators">@for (user of users; track user.name) { <span class="user-badge" [style.background]="user.color">{{ user.name }}</span> }</div>
          <div class="editor" (click)="handleEditorClick($event)">
            @for (line of lines(); track $index; let i = $index) { <div class="line"><span class="line-num">{{ i + 1 }}</span><span class="line-text">{{ line || ' ' }}</span></div> }
            @for (user of users; track user.name) { @if (getCursor(user.name)) { <div class="cursor" [style.left.px]="getCursorX(user.name) + 42" [style.top.px]="getCursorY(user.name)" [style.border-color]="user.color"><span class="cursor-label" [style.background]="user.color">{{ user.name }}</span></div> } }
          </div>
        </div>
        <div class="history-panel"><h3>Edit History</h3><div class="history-list">
          @for (entry of history(); track $index) { <div class="history-entry"><span class="history-user" [style.color]="getUserColor(entry.user)">{{ entry.user }}</span><span class="history-action">{{ entry.action }}</span><span class="history-time">{{ formatTime(entry.timestamp) }}</span></div> }
          @if (history().length === 0) { <div class="empty">No edits yet</div> }
        </div></div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f8f9fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; } .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; text-align: center; }
    .layout { display: flex; gap: 20px; max-width: 1000px; margin: 0 auto; } .editor-area { flex: 1; }
    .user-indicators { display: flex; gap: 8px; margin-bottom: 8px; } .user-badge { padding: 4px 10px; border-radius: 12px; color: #fff; font-size: 12px; font-weight: 600; }
    .editor { background: #1a1a2e; border-radius: 12px; padding: 16px 0; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; min-height: 400px; position: relative; overflow: hidden; cursor: text; }
    .line { display: flex; line-height: 24px; padding: 0 16px; } .line-num { color: rgba(255,255,255,0.2); width: 30px; text-align: right; margin-right: 12px; user-select: none; } .line-text { color: rgba(255,255,255,0.8); white-space: pre; }
    .cursor { position: absolute; width: 2px; height: 24px; border-left: 2px solid; animation: blink 1s infinite; pointer-events: none; }
    .cursor-label { position: absolute; top: -18px; left: -2px; font-size: 10px; color: #fff; padding: 1px 6px; border-radius: 4px; white-space: nowrap; font-family: -apple-system, sans-serif; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    .history-panel { width: 280px; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .history-panel h3 { margin: 0 0 12px; font-size: 16px; color: #1a1a2e; } .history-list { max-height: 400px; overflow-y: auto; }
    .history-entry { padding: 6px 0; border-bottom: 1px solid #f1f3f5; font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
    .history-user { font-weight: 700; } .history-action { color: #495057; } .history-time { color: #adb5bd; font-size: 11px; }
    .empty { color: #adb5bd; font-size: 13px; text-align: center; padding: 20px; }
  `],
})
export class CollaborativeEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  users = USERS
  lines = this.pulse.use(DocLinesChanged, ['import { createEngine } from "@pulse/core"', '', 'const engine = createEngine()'] as string[])
  cursorMap = this.pulse.use(CursorsChanged, {} as Record<string, CursorPosition>)
  history = this.pulse.use(EditHistoryChanged, [] as HistoryEntry[])
  private cursorXSignals: Record<string, WritableSignal<number>> = {}
  private cursorYSignals: Record<string, WritableSignal<number>> = {}

  constructor(private pulse: PulseService) {
    for (const user of USERS) {
      this.cursorXSignals[user.name] = ngSignal(0); this.cursorYSignals[user.name] = ngSignal(0)
    }
    engine.on(CursorXChanged, (e) => { const s = this.cursorXSignals[e.user]; if (s) s.set(e.value) })
    engine.on(CursorYChanged, (e) => { const s = this.cursorYSignals[e.user]; if (s) s.set(e.value) })
  }

  ngOnInit(): void { (window as any).__pulseEngine = engine; startBots() }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; stopBots(); engine.destroy() }
  ngAfterViewInit(): void { this.pulse.emit(CursorMove, { user: 'You', line: 0, col: 0, color: '#4361ee' }) }
  getCursor(user: string): CursorPosition | undefined { return this.cursorMap()[user] }
  getCursorX(user: string): number { return this.cursorXSignals[user]?.() ?? 0 }
  getCursorY(user: string): number { return this.cursorYSignals[user]?.() ?? 0 }
  getUserColor(user: string): string { return USERS.find((u) => u.name === user)?.color ?? '#495057' }
  handleEditorClick(e: MouseEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const line = Math.max(0, Math.floor((e.clientY - rect.top - 16) / 24)), col = Math.max(0, Math.floor((e.clientX - rect.left - 58) / 8.4))
    this.pulse.emit(CursorMove, { user: 'You', line, col, color: '#4361ee' })
  }
  formatTime(ts: number): string { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
}
