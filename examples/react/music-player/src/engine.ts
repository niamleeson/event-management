import { createEngine } from '@pulse/core'

export const engine = createEngine()

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

// Events
export const Play = engine.event<void>('Play')
export const Pause = engine.event<void>('Pause')
export const NextTrack = engine.event<void>('NextTrack')
export const PrevTrack = engine.event<void>('PrevTrack')
export const Seek = engine.event<number>('Seek')
export const VolumeSet = engine.event<number>('VolumeSet')
export const ShuffleToggle = engine.event<void>('ShuffleToggle')
export const RepeatToggle = engine.event<void>('RepeatToggle')
export const Frame = engine.event<number>('Frame')

// State change events
export const CurrentTrackChanged = engine.event<Track>('CurrentTrackChanged')
export const IsPlayingChanged = engine.event<boolean>('IsPlayingChanged')
export const ProgressChanged = engine.event<number>('ProgressChanged')
export const VolumeChanged = engine.event<number>('VolumeChanged')
export const ShuffleChanged = engine.event<boolean>('ShuffleChanged')
export const RepeatChanged = engine.event<boolean>('RepeatChanged')
export const VisualizerChanged = engine.event<number[]>('VisualizerChanged')

// State
let currentTrack = samplePlaylist[0]
let isPlaying = false
let progress = 0
let volume = 0.75
let shuffleOn = false
let repeatOn = false
let beatTimer = 0

engine.on(Play, () => { isPlaying = true; engine.emit(IsPlayingChanged, true) })
engine.on(Pause, () => { isPlaying = false; engine.emit(IsPlayingChanged, false) })
engine.on(Seek, (v) => { progress = Math.min(1, Math.max(0, v)); engine.emit(ProgressChanged, progress) })
engine.on(VolumeSet, (v) => { volume = v; engine.emit(VolumeChanged, v) })
engine.on(ShuffleToggle, () => { shuffleOn = !shuffleOn; engine.emit(ShuffleChanged, shuffleOn) })
engine.on(RepeatToggle, () => { repeatOn = !repeatOn; engine.emit(RepeatChanged, repeatOn) })

function changeTrack(track: Track) {
  currentTrack = track; progress = 0
  engine.emit(CurrentTrackChanged, track); engine.emit(ProgressChanged, 0)
}

engine.on(NextTrack, () => {
  const idx = samplePlaylist.findIndex(t => t.id === currentTrack.id)
  let nextIdx = shuffleOn ? Math.floor(Math.random() * samplePlaylist.length) : (idx + 1) % samplePlaylist.length
  if (nextIdx === idx && samplePlaylist.length > 1) nextIdx = (nextIdx + 1) % samplePlaylist.length
  changeTrack(samplePlaylist[nextIdx])
  if (isPlaying) engine.emit(Play, undefined)
})

engine.on(PrevTrack, () => {
  if (progress > 0.05) { engine.emit(Seek, 0); return }
  const idx = samplePlaylist.findIndex(t => t.id === currentTrack.id)
  changeTrack(samplePlaylist[idx <= 0 ? samplePlaylist.length - 1 : idx - 1])
  if (isPlaying) engine.emit(Play, undefined)
})

engine.on(Frame, (dt) => {
  if (!isPlaying) return
  const increment = (dt / 1000) / currentTrack.duration
  progress += increment
  if (progress >= 1) { engine.emit(Pause, undefined); engine.emit(NextTrack, undefined); return }
  engine.emit(ProgressChanged, progress)

  beatTimer += dt
  const isBeatFrame = beatTimer >= 500
  if (isBeatFrame) beatTimer -= 500

  const bars: number[] = []
  for (let i = 0; i < 32; i++) {
    const base = Math.random() * 0.5
    const boost = isBeatFrame ? Math.random() * 0.5 : 0
    bars.push(Math.min(1, base + boost + Math.sin((i / 32) * Math.PI) * 0.3))
  }
  engine.emit(VisualizerChanged, bars)
})

let last = performance.now()
requestAnimationFrame(function loop() { const now = performance.now(); engine.emit(Frame, now - last); last = now; requestAnimationFrame(loop) })
