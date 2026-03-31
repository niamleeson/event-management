import { createEngine } from '@pulse/core'

export const engine = createEngine()

export interface Track { id: number; title: string; artist: string; duration: number; color: string }
export const BAR_COUNT = 32
export const PLAYLIST: Track[] = [
  { id: 0, title: 'Reactive Beats', artist: 'Pulse', duration: 180, color: '#4361ee' },
  { id: 1, title: 'Event Horizon', artist: 'Engine', duration: 210, color: '#7209b7' },
  { id: 2, title: 'Spring Motion', artist: 'Physics', duration: 195, color: '#f72585' },
  { id: 3, title: 'Tween Dreams', artist: 'Animation', duration: 240, color: '#4cc9f0' },
  { id: 4, title: 'Signal Flow', artist: 'Data', duration: 165, color: '#2a9d8f' },
]

export const Play = engine.event<void>('Play')
export const Pause = engine.event<void>('Pause')
export const NextTrack = engine.event<void>('NextTrack')
export const PrevTrack = engine.event<void>('PrevTrack')
export const SelectTrack = engine.event<number>('SelectTrack')
export const Seek = engine.event<number>('Seek')

export const IsPlayingChanged = engine.event<boolean>('IsPlayingChanged')
export const TrackIdxChanged = engine.event<number>('TrackIdxChanged')
export const ProgressChanged = engine.event<number>('ProgressChanged')
export const BarHeightsChanged = engine.event<number[]>('BarHeightsChanged')
export const AlbumRotationChanged = engine.event<number>('AlbumRotationChanged')

let isPlaying = false, currentTrackIdx = 0, progress = 0, albumRotation = 0

engine.on(Play, () => { isPlaying = true; engine.emit(IsPlayingChanged, true) })
engine.on(Pause, () => { isPlaying = false; engine.emit(IsPlayingChanged, false) })
engine.on(SelectTrack, (idx) => { currentTrackIdx = idx; progress = 0; engine.emit(TrackIdxChanged, idx); engine.emit(ProgressChanged, 0) })
engine.on(NextTrack, () => { currentTrackIdx = (currentTrackIdx + 1) % PLAYLIST.length; progress = 0; engine.emit(TrackIdxChanged, currentTrackIdx); engine.emit(ProgressChanged, 0) })
engine.on(PrevTrack, () => { currentTrackIdx = (currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length; progress = 0; engine.emit(TrackIdxChanged, currentTrackIdx); engine.emit(ProgressChanged, 0) })
engine.on(Seek, (val) => { progress = val; engine.emit(ProgressChanged, val) })

let lastTime = performance.now()
function animLoop() {
  const now = performance.now(); const dt = now - lastTime; lastTime = now
  if (isPlaying) {
    const track = PLAYLIST[currentTrackIdx]
    progress += (dt / 1000) / track.duration
    if (progress >= 1) { engine.emit(NextTrack, undefined); progress = 0 }
    engine.emit(ProgressChanged, progress)
    const time = Date.now() / 1000
    const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
      const freq = 0.5 + i * 0.3, phase = i * 0.4
      const base = 10 + Math.sin(time * freq + phase) * 30
      const beat = Math.sin(time * 8 + i * 0.2) > 0.7 ? 25 : 0
      return Math.max(5, base + beat + Math.random() * 10)
    })
    engine.emit(BarHeightsChanged, bars)
    albumRotation += dt * 0.05
    engine.emit(AlbumRotationChanged, albumRotation)
  }
  requestAnimationFrame(animLoop)
}
requestAnimationFrame(animLoop)
