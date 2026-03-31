import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Track {
  id: number
  title: string
  artist: string
  duration: number
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BAR_COUNT = 32

export const PLAYLIST: Track[] = [
  { id: 0, title: 'Electric Dreams', artist: 'Pulse Orchestra', duration: 234, color: '#4361ee' },
  { id: 1, title: 'Spring Physics', artist: 'The Dampers', duration: 198, color: '#7209b7' },
  { id: 2, title: 'Event Horizon', artist: 'DAG Collective', duration: 267, color: '#f72585' },
  { id: 3, title: 'Async Groove', artist: 'Promise Band', duration: 182, color: '#4cc9f0' },
  { id: 4, title: 'Signal Flow', artist: 'Reactive Waves', duration: 221, color: '#2a9d8f' },
  { id: 5, title: 'Tween Machine', artist: 'Easing Function', duration: 156, color: '#e76f51' },
]

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const Play = engine.event<void>('Play')
export const Pause = engine.event<void>('Pause')
export const NextTrack = engine.event<void>('NextTrack')
export const PrevTrack = engine.event<void>('PrevTrack')
export const SelectTrack = engine.event<number>('SelectTrack')
export const Seek = engine.event<number>('Seek')
export const PlayerStateChanged = engine.event<void>('PlayerStateChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _isPlaying = false
let _currentTrackIndex = 0
let _currentTime = 0
let _visualizerBars = new Array(BAR_COUNT).fill(0.1)
let _beatScale = 1
let _beatStart = 0
let _beatActive = false

export function getIsPlaying(): boolean { return _isPlaying }
export function getCurrentTrackIndex(): number { return _currentTrackIndex }
export function getCurrentTime(): number { return _currentTime }
export function getVisualizerBars(): number[] { return _visualizerBars }
export function getBeatScale(): number { return _beatScale }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(Play, () => {
  _isPlaying = true
  engine.emit(PlayerStateChanged, undefined)
})

engine.on(Pause, () => {
  _isPlaying = false
  engine.emit(PlayerStateChanged, undefined)
})

engine.on(SelectTrack, (idx: number) => {
  _currentTrackIndex = idx % PLAYLIST.length
  _currentTime = 0
  engine.emit(PlayerStateChanged, undefined)
})

engine.on(NextTrack, () => {
  _currentTrackIndex = (_currentTrackIndex + 1) % PLAYLIST.length
  _currentTime = 0
  engine.emit(PlayerStateChanged, undefined)
})

engine.on(PrevTrack, () => {
  _currentTrackIndex = (_currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length
  _currentTime = 0
  engine.emit(PlayerStateChanged, undefined)
})

engine.on(Seek, (time: number) => {
  _currentTime = time
  engine.emit(PlayerStateChanged, undefined)
})

// ---------------------------------------------------------------------------
// Frame update
// ---------------------------------------------------------------------------

export function updateFrame(dt: number, now: number): void {
  if (!_isPlaying) return

  const dtSec = dt / 1000
  const track = PLAYLIST[_currentTrackIndex]
  const newTime = _currentTime + dtSec

  if (newTime >= track.duration) {
    _currentTrackIndex = (_currentTrackIndex + 1) % PLAYLIST.length
    _currentTime = 0
    _isPlaying = true
    return
  }

  _currentTime = newTime

  // Visualizer bars
  const bars = new Array(BAR_COUNT)
  for (let i = 0; i < BAR_COUNT; i++) {
    const freq = (i / BAR_COUNT) * Math.PI * 2
    const base = 0.3 + 0.3 * Math.sin(newTime * 3 + freq)
    const noise = Math.random() * 0.4
    bars[i] = Math.min(1, Math.max(0.05, base + noise))
  }
  _visualizerBars = bars

  // Beat pulse every ~0.5 seconds
  if (Math.floor(newTime * 2) !== Math.floor((newTime - dtSec) * 2)) {
    _beatStart = now
    _beatActive = true
  }

  if (_beatActive) {
    const elapsed = now - _beatStart
    const t = Math.min(1, elapsed / 300)
    const e = 1 - Math.pow(1 - t, 3)
    _beatScale = 1.08 + (1 - 1.08) * e
    if (t >= 1) {
      _beatActive = false
      _beatScale = 1
    }
  }
}
