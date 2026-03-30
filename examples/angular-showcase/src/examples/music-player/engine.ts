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
  duration: number // seconds
  color: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BAR_COUNT = 32

export const PLAYLIST: Track[] = [
  { id: 0, title: 'Reactive Beats', artist: 'Pulse', duration: 180, color: '#4361ee' },
  { id: 1, title: 'Event Horizon', artist: 'Engine', duration: 210, color: '#7209b7' },
  { id: 2, title: 'Spring Motion', artist: 'Physics', duration: 195, color: '#f72585' },
  { id: 3, title: 'Tween Dreams', artist: 'Animation', duration: 240, color: '#4cc9f0' },
  { id: 4, title: 'Signal Flow', artist: 'Data', duration: 165, color: '#2a9d8f' },
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

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const isPlaying = engine.signal<boolean>(Play, false, () => true)
engine.signalUpdate(isPlaying, Pause, () => false)

export const currentTrackIdx = engine.signal<number>(SelectTrack, 0, (_prev, idx) => idx)
engine.signalUpdate(currentTrackIdx, NextTrack, (prev) => (prev + 1) % PLAYLIST.length)
engine.signalUpdate(currentTrackIdx, PrevTrack, (prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)

export const progress = engine.signal<number>(Seek, 0, (_prev, val) => val)

// Visualizer bar heights (driven by frame)
export const barHeights = engine.signal<number[]>(
  Play,
  Array(BAR_COUNT).fill(5),
  () => Array(BAR_COUNT).fill(5),
)

// Album rotation
export const albumRotation = engine.signal<number>(Play, 0, () => 0)

// ---------------------------------------------------------------------------
// Frame-driven animation
// ---------------------------------------------------------------------------

engine.on(engine.frame, ({ dt }) => {
  if (!isPlaying.value) return

  // Advance progress
  const track = PLAYLIST[currentTrackIdx.value]
  const increment = (dt / 1000) / track.duration
  const newProgress = progress.value + increment
  if (newProgress >= 1) {
    engine.emit(NextTrack, undefined)
    progress.set(0)
  } else {
    progress.set(newProgress)
  }

  // Generate beat-reactive bar heights
  const time = Date.now() / 1000
  const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const freq = 0.5 + i * 0.3
    const phase = i * 0.4
    const base = 10 + Math.sin(time * freq + phase) * 30
    const beat = Math.sin(time * 8 + i * 0.2) > 0.7 ? 25 : 0
    return Math.max(5, base + beat + Math.random() * 10)
  })
  barHeights.set(newBars)

  // Rotate album art
  albumRotation.set(albumRotation.value + dt * 0.05)
})

// Reset on track change
engine.on(NextTrack, () => { progress.set(0) })
engine.on(PrevTrack, () => { progress.set(0) })
engine.on(SelectTrack, () => { progress.set(0) })

// ---------------------------------------------------------------------------
// Tween: progress bar
// ---------------------------------------------------------------------------

export const progressTween = engine.tween({
  start: Play,
  from: () => progress.value,
  to: () => progress.value,
  duration: 100,
  easing: (t: number) => t,
})

// Start frame loop
engine.startFrameLoop()
