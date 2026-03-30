import { createEngine, type Signal } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number // seconds
  color: string // accent color
}

// ---------------------------------------------------------------------------
// Sample playlist
// ---------------------------------------------------------------------------

export const samplePlaylist: Track[] = [
  { id: '1', title: 'Midnight Pulse', artist: 'Neon Waves', album: 'Digital Dreams', duration: 234, color: '#e91e63' },
  { id: '2', title: 'Electric Dawn', artist: 'Synthscape', album: 'Horizons', duration: 198, color: '#9c27b0' },
  { id: '3', title: 'Deep Currents', artist: 'Bass Theory', album: 'Underwater', duration: 267, color: '#2196f3' },
  { id: '4', title: 'Solar Flare', artist: 'Cosmic Drift', album: 'Stardust', duration: 312, color: '#ff9800' },
  { id: '5', title: 'Urban Echo', artist: 'City Lights', album: 'Concrete Jungle', duration: 189, color: '#4caf50' },
  { id: '6', title: 'Crystal Rain', artist: 'Ambient Flow', album: 'Serenity', duration: 278, color: '#00bcd4' },
  { id: '7', title: 'Thunder Road', artist: 'Heavy Circuit', album: 'Voltage', duration: 245, color: '#f44336' },
  { id: '8', title: 'Velvet Night', artist: 'Dream Weaver', album: 'Lullabies', duration: 302, color: '#673ab7' },
]

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

export const Play = engine.event<void>('Play')
export const Pause = engine.event<void>('Pause')
export const NextTrack = engine.event<void>('NextTrack')
export const PrevTrack = engine.event<void>('PrevTrack')
export const Seek = engine.event<number>('Seek')
export const VolumeChanged = engine.event<number>('VolumeChanged')
export const ShuffleToggle = engine.event<void>('ShuffleToggle')
export const RepeatToggle = engine.event<void>('RepeatToggle')
export const TrackChanged = engine.event<Track>('TrackChanged')
export const BeatDetected = engine.event<void>('BeatDetected')
export const ProgressTick = engine.event<number>('ProgressTick')
export const VisualizerUpdate = engine.event<number[]>('VisualizerUpdate')

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const currentTrack: Signal<Track> = engine.signal<Track>(
  TrackChanged,
  samplePlaylist[0],
  (_prev, track) => track,
)

export const isPlaying: Signal<boolean> = engine.signal<boolean>(
  Play,
  false,
  () => true,
)
engine.signalUpdate(isPlaying, Pause, () => false)

export const progress: Signal<number> = engine.signal<number>(
  ProgressTick,
  0,
  (_prev, val) => Math.min(1, Math.max(0, val)),
)
engine.signalUpdate(progress, Seek, (_prev, val) => Math.min(1, Math.max(0, val)))
engine.signalUpdate(progress, TrackChanged, () => 0)

export const volume: Signal<number> = engine.signal<number>(
  VolumeChanged,
  0.75,
  (_prev, val) => val,
)

export const shuffle: Signal<boolean> = engine.signal<boolean>(
  ShuffleToggle,
  false,
  (prev) => !prev,
)

export const repeat: Signal<boolean> = engine.signal<boolean>(
  RepeatToggle,
  false,
  (prev) => !prev,
)

export const playlist: Signal<Track[]> = engine.signal<Track[]>(
  TrackChanged,
  samplePlaylist,
  (prev) => prev, // Playlist stays the same, just tracking via signal
)

export const visualizerBars: Signal<number[]> = engine.signal<number[]>(
  VisualizerUpdate,
  Array(32).fill(0),
  (_prev, bars) => bars,
)

// ---------------------------------------------------------------------------
// Frame-driven progress and visualizer
// ---------------------------------------------------------------------------

let beatTimer = 0

engine.on(engine.frame, ({ dt }) => {
  if (!isPlaying.value) return

  const track = currentTrack.value
  if (!track) return

  // Advance progress
  const increment = (dt / 1000) / track.duration
  const newProgress = progress.value + increment
  if (newProgress >= 1) {
    engine.emit(Pause, undefined)
    engine.emit(NextTrack, undefined)
    return
  }
  engine.emit(ProgressTick, newProgress)

  // Beat detection (simulated every ~500ms)
  beatTimer += dt
  if (beatTimer >= 500) {
    beatTimer -= 500
    engine.emit(BeatDetected, undefined)
  }

  // Visualizer: generate random bars influenced by "beats"
  const isBeatFrame = beatTimer < dt
  const bars: number[] = []
  for (let i = 0; i < 32; i++) {
    const base = Math.random() * 0.5
    const beatBoost = isBeatFrame ? Math.random() * 0.5 : 0
    const freqBias = Math.sin((i / 32) * Math.PI) * 0.3
    bars.push(Math.min(1, base + beatBoost + freqBias))
  }
  engine.emit(VisualizerUpdate, bars)
})

// ---------------------------------------------------------------------------
// Track navigation
// ---------------------------------------------------------------------------

engine.on(NextTrack, () => {
  const current = currentTrack.value
  const pl = playlist.value
  const idx = pl.findIndex(t => t.id === current.id)
  let nextIdx: number

  if (shuffle.value) {
    nextIdx = Math.floor(Math.random() * pl.length)
    if (nextIdx === idx && pl.length > 1) nextIdx = (nextIdx + 1) % pl.length
  } else {
    nextIdx = (idx + 1) % pl.length
  }

  engine.emit(TrackChanged, pl[nextIdx])
  if (isPlaying.value) {
    // Keep playing
    engine.emit(Play, undefined)
  }
})

engine.on(PrevTrack, () => {
  const current = currentTrack.value
  const pl = playlist.value
  const idx = pl.findIndex(t => t.id === current.id)

  if (progress.value > 0.05) {
    // Restart current track
    engine.emit(Seek, 0)
    return
  }

  const prevIdx = idx <= 0 ? pl.length - 1 : idx - 1
  engine.emit(TrackChanged, pl[prevIdx])
  if (isPlaying.value) {
    engine.emit(Play, undefined)
  }
})

// Start frame loop
engine.startFrameLoop()
