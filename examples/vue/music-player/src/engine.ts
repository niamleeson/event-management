// DAG
// SelectTrack ──→ CurrentTrackChanged
//             └──→ ProgressChanged
// NextTrack ──→ CurrentTrackChanged
//           └──→ ProgressChanged
// PrevTrack ──→ CurrentTrackChanged
//           └──→ ProgressChanged
// Play ──→ IsPlayingChanged
//      └──→ ProgressAnimStart
// Pause ──→ IsPlayingChanged
// Tick ──→ ProgressChanged
// VisualizerUpdated ──→ AlbumRotationChanged
// engine.frame ──→ Tick
//              └──→ VisualizerUpdated

import { createEngine } from '@pulse/core'
export const engine = createEngine()
/* ------------------------------------------------------------------ */
/*  Playlist data                                                     */
/* ------------------------------------------------------------------ */

export interface Track {
  title: string
  artist: string
  duration: number // seconds
  color: string
}

export const PLAYLIST: Track[] = [
  { title: 'Neon Dreams', artist: 'Synthwave Collective', duration: 234, color: '#6c5ce7' },
  { title: 'Midnight Drive', artist: 'Retrowave FM', duration: 198, color: '#00b894' },
  { title: 'Digital Sunrise', artist: 'Pixel Beats', duration: 267, color: '#e17055' },
  { title: 'Cosmic Dust', artist: 'Starfield Audio', duration: 312, color: '#0984e3' },
  { title: 'Electric Heart', artist: 'Neon Pulse', duration: 189, color: '#d63031' },
  { title: 'Crystal Caves', artist: 'Ambient Works', duration: 278, color: '#00cec9' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

export const Play = engine.event('Play')
export const Pause = engine.event('Pause')
export const NextTrack = engine.event('NextTrack')
export const PrevTrack = engine.event('PrevTrack')
export const SelectTrack = engine.event<number>('SelectTrack')
export const Tick = engine.event<number>('Tick') // progress tick
export const BeatDetected = engine.event<number>('BeatDetected')
export const VisualizerUpdated = engine.event('VisualizerUpdated')

/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */

export let currentTrack = 0
export const CurrentTrackChanged = engine.event('CurrentTrackChanged')
engine.on(SelectTrack, [CurrentTrackChanged], (idx, setTrack) => {
  currentTrack = idx
  setTrack(currentTrack)
})
engine.on(NextTrack, [CurrentTrackChanged], (_payload, setTrack) => {
  currentTrack = (currentTrack + 1) % PLAYLIST.length
  setTrack(currentTrack)
})
engine.on(PrevTrack, [CurrentTrackChanged], (_payload, setTrack) => {
  currentTrack = (currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length
  setTrack(currentTrack)
})

export let isPlaying = false
export const IsPlayingChanged = engine.event('IsPlayingChanged')
engine.on(Play, [IsPlayingChanged], (_payload, setPlaying) => {
  isPlaying = true
  setPlaying(isPlaying)
})
engine.on(Pause, [IsPlayingChanged], (_payload, setPlaying) => {
  isPlaying = false
  setPlaying(isPlaying)
})

export let progress = 0
export const ProgressChanged = engine.event('ProgressChanged')
engine.on(Tick, [ProgressChanged], (val, setProgress) => {
  progress = val
  setProgress(progress)
})
engine.on(SelectTrack, [ProgressChanged], (_payload, setProgress) => {
  progress = 0
  setProgress(progress)
})
engine.on(NextTrack, [ProgressChanged], (_payload, setProgress) => {
  progress = 0
  setProgress(progress)
})
engine.on(PrevTrack, [ProgressChanged], (_payload, setProgress) => {
  progress = 0
  setProgress(progress)
})

/* ------------------------------------------------------------------ */
/*  Visualizer bars (32 bars, driven by frame)                        */
/* ------------------------------------------------------------------ */

export const visualizerBars: number[] = new Array(32).fill(0)
let beatPhase = 0

engine.on(engine.frame, [Tick, VisualizerUpdated, BeatDetected], ({ dt }, setTick, setVis, setBeat) => {
  if (!isPlaying) {
    for (let i = 0; i < 32; i++) {
      visualizerBars[i] *= 0.95
    }
    setVis(undefined)
    return
  }

  const dtSec = dt / 1000
  const track = PLAYLIST[currentTrack]
  const newProgress = Math.min(1, progress + dtSec / track.duration)
  setTick(newProgress)

  if (newProgress >= 1) {
    engine.emit(NextTrack, undefined)
    engine.emit(Play, undefined)
    return
  }

  // Simulated beat detection
  beatPhase += dt * 0.008
  const isBeat = Math.sin(beatPhase) > 0.9

  for (let i = 0; i < 32; i++) {
    const freq = (i / 32) * Math.PI * 2
    const base = Math.sin(beatPhase * 0.5 + freq) * 0.3 + 0.3
    const beat = isBeat ? Math.random() * 0.5 : 0
    visualizerBars[i] = Math.max(0, Math.min(1, base + beat + Math.random() * 0.1))
  }

  if (isBeat) {
    setBeat(beatPhase)
  }

  setVis(undefined)
})

/* ------------------------------------------------------------------ */
/*  Progress tween for smooth bar                                     */
/* ------------------------------------------------------------------ */

const ProgressAnimStart = engine.event('ProgressAnimStart')
engine.on(Play, [ProgressAnimStart], (_payload, setStart) => {
  setStart(undefined)
})

export let progressTween = { value: 0, active: false }
export const ProgressTweenVal = engine.event<number>('ProgressTweenVal')
{
  const _tc = {
  start: ProgressAnimStart,
  from: () => progress,
  to: 1,
  duration: () => {
    const track = PLAYLIST[currentTrack]
    return (1 - progress) * track.duration * 1000
  },
  easing: (t: number) => t,
}
  const _te = typeof _tc.easing === 'function' ? _tc.easing : ((t: number) => t)
  engine.on(_tc.start, () => {
    const f = typeof _tc.from === 'function' ? _tc.from() : _tc.from
    const t = typeof _tc.to === 'function' ? _tc.to() : _tc.to
    const d = typeof _tc.duration === 'function' ? _tc.duration() : _tc.duration
    let el = 0; progressTween.active = true
    let last = performance.now()
    function tick(now: number) {
      if (!progressTween.active) return
      el += now - last; last = now
      const p = Math.min(1, el / d)
      progressTween.value = f + (t - f) * _te(p)
      engine.emit(ProgressTweenVal, progressTween.value)
      if (p >= 1) { progressTween.active = false; if (_tc.done) engine.emit(_tc.done, undefined) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  if (_tc.cancel) { const cc = Array.isArray(_tc.cancel) ? _tc.cancel : [_tc.cancel]; cc.forEach((e: any) => engine.on(e, () => { progressTween.active = false })) }
}

/* ------------------------------------------------------------------ */
/*  Album art spin signal                                             */
/* ------------------------------------------------------------------ */

export let albumRotation = 0
export const AlbumRotationChanged = engine.event('AlbumRotationChanged')
engine.on(VisualizerUpdated, [AlbumRotationChanged], (_payload, setRotation) => {
  if (!isPlaying) return
  albumRotation = albumRotation + 0.5
  setRotation(albumRotation)
})

export function startLoop() {}
export function stopLoop() {}
