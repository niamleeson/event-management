import { createEngine } from '@pulse/core'

export const engine = createEngine()

// ---------------------------------------------------------------------------
// DAG (3 levels deep)
// ---------------------------------------------------------------------------
// Play ──→ IsPlayingChanged
// Pause ──→ IsPlayingChanged
// Seek ──→ ProgressChanged ──→ VisualizerChanged
// VolumeSet ──→ VolumeChanged
// ShuffleToggle ──→ ShuffleChanged
// RepeatToggle ──→ RepeatChanged
// NextTrack ──→ CurrentTrackChanged ──→ ProgressChanged ──→ VisualizerChanged
// PrevTrack ──→ CurrentTrackChanged ──→ ProgressChanged ──→ VisualizerChanged
// Frame ──→ ProgressChanged ──→ VisualizerChanged
// ---------------------------------------------------------------------------

export interface Track { id: string; title: string; artist: string; album: string; duration: number; color: string }

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

// Layer 0: User input / time events
export const Play = engine.event<void>('Play')
export const Pause = engine.event<void>('Pause')
export const NextTrack = engine.event<void>('NextTrack')
export const PrevTrack = engine.event<void>('PrevTrack')
export const Seek = engine.event<number>('Seek')
export const VolumeSet = engine.event<number>('VolumeSet')
export const ShuffleToggle = engine.event<void>('ShuffleToggle')
export const RepeatToggle = engine.event<void>('RepeatToggle')
export const Frame = engine.event<number>('Frame')

// Layer 1: Primary state events
export const CurrentTrackChanged = engine.event<Track>('CurrentTrackChanged')
export const IsPlayingChanged = engine.event<boolean>('IsPlayingChanged')
export const ProgressChanged = engine.event<number>('ProgressChanged')
export const VolumeChanged = engine.event<number>('VolumeChanged')
export const ShuffleChanged = engine.event<boolean>('ShuffleChanged')
export const RepeatChanged = engine.event<boolean>('RepeatChanged')

// Layer 2: Derived state events
export const VisualizerChanged = engine.event<number[]>('VisualizerChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentTrack = samplePlaylist[0]
let isPlaying = false
let progress = 0
let volume = 0.75
let shuffleOn = false
let repeatOn = false
let beatTimer = 0

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(Play, [IsPlayingChanged], (_, setPlaying) => { isPlaying = true; setPlaying(true) })
engine.on(Pause, [IsPlayingChanged], (_, setPlaying) => { isPlaying = false; setPlaying(false) })
engine.on(VolumeSet, [VolumeChanged], (v, setVolume) => { volume = v; setVolume(v) })
engine.on(ShuffleToggle, [ShuffleChanged], (_, setShuffle) => { shuffleOn = !shuffleOn; setShuffle(shuffleOn) })
engine.on(RepeatToggle, [RepeatChanged], (_, setRepeat) => { repeatOn = !repeatOn; setRepeat(repeatOn) })

engine.on(Seek, [ProgressChanged], (v, setProgress) => {
  progress = Math.min(1, Math.max(0, v))
  setProgress(progress)
})

engine.on(NextTrack, [CurrentTrackChanged], (_, setTrack) => {
  const idx = samplePlaylist.findIndex(t => t.id === currentTrack.id)
  let nextIdx = shuffleOn ? Math.floor(Math.random() * samplePlaylist.length) : (idx + 1) % samplePlaylist.length
  if (nextIdx === idx && samplePlaylist.length > 1) nextIdx = (nextIdx + 1) % samplePlaylist.length
  currentTrack = samplePlaylist[nextIdx]
  progress = 0
  setTrack(currentTrack)
  if (isPlaying) engine.emit(Play, undefined)
})

engine.on(PrevTrack, [CurrentTrackChanged], (_, setTrack) => {
  if (progress > 0.05) { engine.emit(Seek, 0); return }
  const idx = samplePlaylist.findIndex(t => t.id === currentTrack.id)
  currentTrack = samplePlaylist[idx <= 0 ? samplePlaylist.length - 1 : idx - 1]
  progress = 0
  setTrack(currentTrack)
  if (isPlaying) engine.emit(Play, undefined)
})

// CurrentTrackChanged resets progress to 0
engine.on(CurrentTrackChanged, [ProgressChanged], (_track, setProgress) => {
  setProgress(0)
})

engine.on(Frame, [ProgressChanged], (dt, setProgress) => {
  if (!isPlaying) return
  const increment = (dt / 1000) / currentTrack.duration
  progress += increment
  if (progress >= 1) { engine.emit(Pause, undefined); engine.emit(NextTrack, undefined); return }
  setProgress(progress)
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → derived state (visualizer)
// ---------------------------------------------------------------------------

engine.on(ProgressChanged, [VisualizerChanged], (_progress, setVisualizer) => {
  if (!isPlaying) return

  beatTimer += 16 // approximate frame dt
  const isBeatFrame = beatTimer >= 500
  if (isBeatFrame) beatTimer -= 500

  const bars: number[] = []
  for (let i = 0; i < 32; i++) {
    const base = Math.random() * 0.5
    const boost = isBeatFrame ? Math.random() * 0.5 : 0
    bars.push(Math.min(1, base + boost + Math.sin((i / 32) * Math.PI) * 0.3))
  }
  setVisualizer(bars)
})

let _rafId: number | null = null
export function startLoop() {
  if (_rafId !== null) return
  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    engine.emit(Frame, now - last)
    last = now
    _rafId = requestAnimationFrame(loop)
  }
  _rafId = requestAnimationFrame(loop)
}
export function stopLoop() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
}

export function resetState() {
  currentTrack = samplePlaylist[0]
  isPlaying = false
  progress = 0
  volume = 0.75
  shuffleOn = false
  repeatOn = false
  beatTimer = 0
  _rafId = null
}
