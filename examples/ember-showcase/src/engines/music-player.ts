import { createEngine, type TweenValue } from '@pulse/core'

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
  duration: number // seconds
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
export const BeatPulse = engine.event<void>('BeatPulse')
export const BeatPulseDone = engine.event<void>('BeatPulseDone')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const isPlaying = engine.signal<boolean>(Play, false, () => true)
engine.signalUpdate(isPlaying, Pause, () => false)

export const currentTrackIndex = engine.signal<number>(
  SelectTrack, 0, (_prev, idx) => idx % PLAYLIST.length,
)
engine.signalUpdate(currentTrackIndex, NextTrack, (prev) => (prev + 1) % PLAYLIST.length)
engine.signalUpdate(currentTrackIndex, PrevTrack, (prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)

export const currentTime = engine.signal<number>(
  Seek, 0, (_prev, time) => time,
)

// Reset time on track change
engine.signalUpdate(currentTime, SelectTrack, () => 0)
engine.signalUpdate(currentTime, NextTrack, () => 0)
engine.signalUpdate(currentTime, PrevTrack, () => 0)

// Visualizer bars — randomized audio levels
export const visualizerBars = engine.signal<number[]>(
  Play, new Array(BAR_COUNT).fill(0.1),
  () => new Array(BAR_COUNT).fill(0.1),
)

// ---------------------------------------------------------------------------
// Tween — beat pulse (album art scale)
// ---------------------------------------------------------------------------

export const beatScale: TweenValue = engine.tween({
  start: BeatPulse,
  done: BeatPulseDone,
  from: 1.08,
  to: 1,
  duration: 300,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
})

// ---------------------------------------------------------------------------
// Frame loop — simulate audio playback and visualizer
// ---------------------------------------------------------------------------

engine.on(engine.frame, ({ dt }) => {
  if (!isPlaying.value) return

  const dtSec = dt / 1000
  const track = PLAYLIST[currentTrackIndex.value]
  const newTime = currentTime.value + dtSec

  if (newTime >= track.duration) {
    engine.emit(NextTrack, undefined)
    engine.emit(Play, undefined)
    return
  }

  currentTime._set(newTime)

  // Update visualizer bars with simulated audio data
  const bars = new Array(BAR_COUNT)
  for (let i = 0; i < BAR_COUNT; i++) {
    const freq = (i / BAR_COUNT) * Math.PI * 2
    const base = 0.3 + 0.3 * Math.sin(newTime * 3 + freq)
    const noise = Math.random() * 0.4
    bars[i] = Math.min(1, Math.max(0.05, base + noise))
  }
  visualizerBars._set(bars)

  // Beat pulse every ~0.5 seconds
  if (Math.floor(newTime * 2) !== Math.floor((newTime - dtSec) * 2)) {
    engine.emit(BeatPulse, undefined)
  }
})

// Start frame loop
engine.startFrameLoop()
