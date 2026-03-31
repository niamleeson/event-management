import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, SendMessage, MarkRead, MessagesChanged, TypingUsersChanged, UnreadCountChanged, startBots, stopBots, type Message } from './engine'

@Component({
  selector: 'app-chat-app',
  standalone: true,
  imports: [FormsModule],
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <div class="chat-container">
        <div class="chat-header"><h2>Pulse Chat</h2><span class="unread-badge" [class.visible]="unread() > 0">{{ unread() }}</span></div>
        <div class="messages" #messageList>
          @for (msg of msgs(); track msg.id) {
            <div class="message" [class.own]="msg.sender === 'You'" [class.bot]="msg.sender !== 'You'" (mouseenter)="markRead(msg)">
              <div class="msg-sender">{{ msg.sender }}</div><div class="msg-text">{{ msg.text }}</div>
              <div class="msg-meta"><span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                @if (msg.sender === 'You') { <span class="msg-status">{{ msg.read ? 'Read' : 'Sent' }}</span> }
                @if (msg.sender !== 'You') { <span class="msg-status" [class.unread]="!msg.read">{{ msg.read ? 'Read' : 'New' }}</span> }
              </div>
            </div>
          }
          @if (typingList().length > 0) { <div class="typing-indicator">{{ typingList().join(', ') }} {{ typingList().length === 1 ? 'is' : 'are' }} typing<span class="dots"><span>.</span><span>.</span><span>.</span></span></div> }
        </div>
        <div class="input-area"><input class="msg-input" [(ngModel)]="inputText" (keydown.enter)="send()" placeholder="Type a message..." /><button class="send-btn" (click)="send()">Send</button></div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f0f2f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; }
    .chat-container { width: 500px; height: 600px; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); display: flex; flex-direction: column; overflow: hidden; }
    .chat-header { background: #4361ee; color: #fff; padding: 16px 20px; display: flex; align-items: center; gap: 10px; }
    .chat-header h2 { margin: 0; font-size: 18px; }
    .unread-badge { background: #e63946; color: #fff; border-radius: 12px; padding: 2px 8px; font-size: 12px; font-weight: 700; opacity: 0; transition: opacity 0.2s; }
    .unread-badge.visible { opacity: 1; }
    .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .message { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 14px; }
    .message.own { align-self: flex-end; background: #4361ee; color: #fff; border-bottom-right-radius: 4px; }
    .message.bot { align-self: flex-start; background: #f1f3f5; color: #1a1a2e; border-bottom-left-radius: 4px; }
    .msg-sender { font-size: 11px; font-weight: 600; opacity: 0.7; margin-bottom: 2px; }
    .msg-text { line-height: 1.4; }
    .msg-meta { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; font-size: 10px; opacity: 0.6; }
    .msg-status.unread { color: #4361ee; font-weight: 600; }
    .typing-indicator { font-size: 13px; color: #6c757d; font-style: italic; padding: 4px 0; }
    .dots span { animation: blink 1.4s infinite; } .dots span:nth-child(2) { animation-delay: 0.2s; } .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
    .input-area { display: flex; padding: 12px; border-top: 1px solid #e9ecef; gap: 8px; }
    .msg-input { flex: 1; padding: 10px 14px; border: 1px solid #dee2e6; border-radius: 24px; outline: none; font-size: 14px; }
    .msg-input:focus { border-color: #4361ee; }
    .send-btn { padding: 10px 20px; background: #4361ee; color: #fff; border: none; border-radius: 24px; font-weight: 600; cursor: pointer; font-size: 14px; }
  `],
})
export class ChatAppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageList') messageListRef!: ElementRef<HTMLDivElement>
  msgs = this.pulse.use(MessagesChanged, [] as Message[])
  typing = this.pulse.use(TypingUsersChanged, new Set<string>())
  unread = this.pulse.use(UnreadCountChanged, 0)
  inputText = ''
  typingList = () => Array.from(this.typing())

  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine; startBots() }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; stopBots(); engine.destroy() }
  ngAfterViewInit(): void {
    // Auto-scroll
    let scrollTimer = setInterval(() => { const el = this.messageListRef?.nativeElement; if (el) el.scrollTop = el.scrollHeight }, 100)
    const origDestroy = this.ngOnDestroy.bind(this)
    this.ngOnDestroy = () => { clearInterval(scrollTimer); origDestroy() }
  }
  send(): void { const text = this.inputText.trim(); if (!text) return; this.pulse.emit(SendMessage, { text, sender: 'You' }); this.inputText = '' }
  markRead(msg: Message): void { if (!msg.read && msg.sender !== 'You') this.pulse.emit(MarkRead, msg.id) }
  formatTime(ts: number): string { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}
