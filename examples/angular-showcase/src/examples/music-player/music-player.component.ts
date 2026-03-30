import { Component, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  PLAYLIST,
  BAR_COUNT,
  Play,
  Pause,
  NextTrack,
  PrevTrack,
  SelectTrack,
  Seek,
  isPlaying,
  currentTrackIdx,
  progress,
  barHeights,
  albumRotation,
  type Track,
} from './engine'

@Component({
  selector: 'app-music-player',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <div class="player">
        <div class="album-area">
          <div
            class="album-art"
            [style.background]="currentTrack().color"
            [style.transform]="'rotate(' + rotation() + 'deg)'"
            [class.spinning]="playing()"
          >
            <div class="album-hole"></div>
          </div>
        </div>
        <div class="track-info">
          <h2>{{ currentTrack().title }}</h2>
          <p>{{ currentTrack().artist }}</p>
        </div>
        <div class="visualizer">
          @for (bar of barIndices; track bar; let i = $index) {
            <div
              class="bar"
              [style.height.px]="bars()[i] || 5"
              [style.background]="currentTrack().color"
              [style.opacity]="playing() ? 1 : 0.3"
            ></div>
          }
        </div>
        <div class="progress-area">
          <span class="time">{{ formatTime(prog() * currentTrack().duration) }}</span>
          <div class="progress-bar" (click)="seek($event)">
            <div class="progress-fill" [style.width.%]="prog() * 100" [style.background]="currentTrack().color"></div>
          </div>
          <span class="time">{{ formatTime(currentTrack().duration) }}</span>
        </div>
        <div class="controls">
          <button class="ctrl-btn" (click)="prev()">Prev</button>
          <button class="ctrl-btn play-btn" (click)="togglePlay()">
            {{ playing() ? 'Pause' : 'Play' }}
          </button>
          <button class="ctrl-btn" (click)="next()">Next</button>
        </div>
        <div class="playlist">
          @for (track of playlist; track track.id; let i = $index) {
            <div
              class="playlist-item"
              [class.active]="trackIdx() === i"
              (click)="selectTrack(i)"
            >
              <span class="pl-num">{{ i + 1 }}</span>
              <span class="pl-title">{{ track.title }}</span>
              <span class="pl-artist">{{ track.artist }}</span>
              <span class="pl-dur">{{ formatTime(track.duration) }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #0f0f23;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
    }
    .player {
      width: 420px;
      background: #1a1a2e;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    }
    .album-area { display: flex; justify-content: center; margin-bottom: 24px; }
    .album-art {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .album-hole {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #1a1a2e;
    }
    .track-info { text-align: center; margin-bottom: 20px; }
    .track-info h2 { margin: 0; font-size: 22px; color: #fff; font-weight: 700; }
    .track-info p { margin: 4px 0 0; color: rgba(255,255,255,0.5); font-size: 14px; }
    .visualizer {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
      height: 70px;
      margin-bottom: 20px;
    }
    .bar {
      width: 8px;
      min-height: 5px;
      border-radius: 2px;
      transition: height 0.05s, opacity 0.3s;
    }
    .progress-area {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .time { font-size: 11px; color: rgba(255,255,255,0.4); min-width: 35px; }
    .progress-bar {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      cursor: pointer;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.1s;
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .ctrl-btn {
      padding: 10px 20px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 24px;
      background: transparent;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ctrl-btn:hover { background: rgba(255,255,255,0.1); }
    .play-btn {
      background: #4361ee;
      border-color: #4361ee;
      padding: 10px 32px;
    }
    .play-btn:hover { background: #3451de; }
    .playlist { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }
    .playlist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      color: rgba(255,255,255,0.5);
      font-size: 13px;
      transition: background 0.15s;
    }
    .playlist-item:hover { background: rgba(255,255,255,0.05); }
    .playlist-item.active { background: rgba(67,97,238,0.15); color: #fff; }
    .pl-num { width: 20px; text-align: center; }
    .pl-title { flex: 1; font-weight: 600; }
    .pl-artist { opacity: 0.6; }
    .pl-dur { opacity: 0.4; font-size: 12px; }
  `],
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
  playlist = PLAYLIST
  barIndices = Array.from({ length: BAR_COUNT }, (_, i) => i)

  playing: WritableSignal<boolean>
  trackIdx: WritableSignal<number>
  prog: WritableSignal<number>
  bars: WritableSignal<number[]>
  rotation: WritableSignal<number>

  currentTrack = () => PLAYLIST[this.trackIdx()]

  constructor(private pulse: PulseService) {
    this.playing = pulse.signal(isPlaying)
    this.trackIdx = pulse.signal(currentTrackIdx)
    this.prog = pulse.signal(progress)
    this.bars = pulse.signal(barHeights)
    this.rotation = pulse.signal(albumRotation)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  togglePlay(): void {
    if (this.playing()) {
      this.pulse.emit(Pause, undefined)
    } else {
      this.pulse.emit(Play, undefined)
    }
  }

  next(): void { this.pulse.emit(NextTrack, undefined) }
  prev(): void { this.pulse.emit(PrevTrack, undefined) }

  selectTrack(idx: number): void {
    this.pulse.emit(SelectTrack, idx)
    this.pulse.emit(Play, undefined)
  }

  seek(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    this.pulse.emit(Seek, Math.max(0, Math.min(1, pct)))
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}
