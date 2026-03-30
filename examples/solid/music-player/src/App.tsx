import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useTween } from '@pulse/solid'
import type { Signal, TweenValue } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Playlist data                                                     */
/* ------------------------------------------------------------------ */

const PLAYLIST = [
  { title: 'Midnight Drive', artist: 'Neon Pulse', duration: 234, color: '#6c5ce7' },
  { title: 'Ocean Breeze', artist: 'Wave Collective', duration: 198, color: '#0984e3' },
  { title: 'Electric Dreams', artist: 'Synth Wave', duration: 267, color: '#e17055' },
  { title: 'Starlight', artist: 'Cosmic Echo', duration: 312, color: '#00b894' },
  { title: 'Urban Jungle', artist: 'Beat Factory', duration: 183, color: '#d63031' },
  { title: 'Crystal Cave', artist: 'Deep Ambient', duration: 289, color: '#00cec9' },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const Play = engine.event('Play')
const Pause = engine.event('Pause')
const NextTrack = engine.event('NextTrack')
const PrevTrack = engine.event('PrevTrack')
const SelectTrack = engine.event<number>('SelectTrack')
const ProgressUpdate = engine.event<number>('ProgressUpdate')
const BeatDetected = engine.event<number>('BeatDetected')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const isPlaying = engine.signal<boolean>(Play, false, () => true)
engine.signalUpdate(isPlaying, Pause, () => false)

const currentTrack = engine.signal<number>(SelectTrack, 0, (_prev, idx) => idx)
engine.signalUpdate(currentTrack, NextTrack, (prev) => (prev + 1) % PLAYLIST.length)
engine.signalUpdate(currentTrack, PrevTrack, (prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)

const progress = engine.signal<number>(ProgressUpdate, 0, (_prev, p) => p)
engine.signalUpdate(progress, SelectTrack, () => 0)

// Album art spin angle
const spinAngle = engine.signal<number>(ProgressUpdate, 0, (prev) => prev + 1)

// Visualizer bars (32 bars, updated on frame)
const visualizerData: number[] = new Array(32).fill(0)

// Progress tween
const progressStart = engine.event('ProgressStart')
const progressTween: TweenValue = engine.tween({
  start: progressStart,
  from: () => progress.value,
  to: () => progress.value,
  duration: 500,
  easing: 'easeOut',
})

/* ------------------------------------------------------------------ */
/*  Frame handler: simulate playback & visualizer                     */
/* ------------------------------------------------------------------ */

let playbackTime = 0

engine.on(engine.frame, ({ dt }) => {
  if (!isPlaying.value) return

  const track = PLAYLIST[currentTrack.value]
  playbackTime += dt / 1000
  const prog = Math.min(playbackTime / track.duration, 1)
  engine.emit(ProgressUpdate, prog)

  if (prog >= 1) {
    playbackTime = 0
    engine.emit(NextTrack, undefined)
    engine.emit(Play, undefined)
  }

  // Simulate visualizer bars with pseudo beat detection
  const time = playbackTime
  for (let i = 0; i < 32; i++) {
    const freq = (i + 1) / 32
    const base = Math.sin(time * freq * 8) * 0.5 + 0.5
    const beat = Math.sin(time * 2.5) > 0.8 ? 0.3 : 0
    visualizerData[i] = Math.min(1, base * 0.7 + Math.random() * 0.2 + beat)
  }

  // Beat detection
  if (Math.sin(time * 2.5) > 0.95 && Math.sin((time - dt / 1000) * 2.5) <= 0.95) {
    engine.emit(BeatDetected, time)
  }
})

engine.on(SelectTrack, () => { playbackTime = 0 })

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function Visualizer() {
  let canvasRef!: HTMLCanvasElement

  onMount(() => {
    const ctx = canvasRef.getContext('2d')!
    const dispose = engine.on(engine.frame, () => {
      const w = canvasRef.width
      const h = canvasRef.height
      ctx.clearRect(0, 0, w, h)

      const barW = w / 32 - 2
      const track = PLAYLIST[currentTrack.value]

      for (let i = 0; i < 32; i++) {
        const barH = visualizerData[i] * h * 0.8
        const x = i * (barW + 2) + 1
        const y = h - barH

        const gradient = ctx.createLinearGradient(x, y, x, h)
        gradient.addColorStop(0, track.color)
        gradient.addColorStop(1, track.color + '33')
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barW, barH)
      }
    })
    onCleanup(dispose)
  })

  return <canvas ref={canvasRef} width={500} height={120} style={{ width: '100%', height: '120px' }} />
}

function TrackList() {
  const emit = useEmit()
  const current = useSignal(currentTrack)
  const playing = useSignal(isPlaying)

  return (
    <div style={{ 'max-height': '200px', overflow: 'auto' }}>
      <For each={PLAYLIST}>
        {(track, i) => (
          <div
            onClick={() => { emit(SelectTrack, i()); emit(Play, undefined) }}
            style={{
              display: 'flex', 'align-items': 'center', gap: '12px', padding: '10px 16px',
              cursor: 'pointer', background: current() === i() ? 'rgba(255,255,255,0.08)' : 'transparent',
              'border-left': current() === i() ? `3px solid ${track.color}` : '3px solid transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '36px', height: '36px', 'border-radius': '8px',
              background: `linear-gradient(135deg, ${track.color}88, ${track.color}44)`,
              display: 'flex', 'align-items': 'center', 'justify-content': 'center',
              'font-size': '14px', color: '#fff',
            }}>
              {current() === i() && playing() ? '\u266B' : '\u25B6'}
            </div>
            <div style={{ flex: '1' }}>
              <div style={{ color: current() === i() ? track.color : '#fff', 'font-size': '14px', 'font-weight': '500' }}>{track.title}</div>
              <div style={{ color: '#888', 'font-size': '12px' }}>{track.artist}</div>
            </div>
            <div style={{ color: '#666', 'font-size': '12px' }}>{formatTime(track.duration)}</div>
          </div>
        )}
      </For>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const playing = useSignal(isPlaying)
  const current = useSignal(currentTrack)
  const prog = useSignal(progress)
  const spin = useSignal(spinAngle)

  const track = () => PLAYLIST[current()]
  const elapsed = () => prog() * track().duration
  const remaining = () => track().duration - elapsed()

  return (
    <div style={{
      'min-height': '100vh', display: 'flex', 'flex-direction': 'column',
      'max-width': '500px', margin: '0 auto', padding: '24px',
    }}>
      {/* Album art */}
      <div style={{ display: 'flex', 'justify-content': 'center', 'margin-bottom': '24px' }}>
        <div style={{
          width: '200px', height: '200px', 'border-radius': '50%',
          background: `linear-gradient(${spin()}deg, ${track().color}cc, ${track().color}44, #1a1a2e)`,
          display: 'flex', 'align-items': 'center', 'justify-content': 'center',
          'box-shadow': `0 0 40px ${track().color}44`,
          border: '4px solid rgba(255,255,255,0.1)',
          transition: 'background 0.5s',
        }}>
          <div style={{
            width: '60px', height: '60px', 'border-radius': '50%', background: '#121212',
            border: '2px solid rgba(255,255,255,0.1)',
          }} />
        </div>
      </div>

      {/* Track info */}
      <div style={{ 'text-align': 'center', 'margin-bottom': '16px' }}>
        <div style={{ 'font-size': '22px', 'font-weight': '700', color: track().color }}>{track().title}</div>
        <div style={{ 'font-size': '14px', color: '#888', 'margin-top': '4px' }}>{track().artist}</div>
      </div>

      {/* Visualizer */}
      <div style={{ 'margin-bottom': '16px', background: 'rgba(255,255,255,0.03)', 'border-radius': '12px', overflow: 'hidden' }}>
        <Visualizer />
      </div>

      {/* Progress bar */}
      <div style={{ 'margin-bottom': '16px' }}>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', 'border-radius': '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: track().color, width: `${prog() * 100}%`, transition: 'width 0.1s' }} />
        </div>
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-top': '4px', 'font-size': '11px', color: '#666' }}>
          <span>{formatTime(elapsed())}</span>
          <span>-{formatTime(remaining())}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', 'justify-content': 'center', 'align-items': 'center', gap: '24px', 'margin-bottom': '24px' }}>
        <button onClick={() => emit(PrevTrack, undefined)} style={{ background: 'none', border: 'none', color: '#fff', 'font-size': '24px', cursor: 'pointer' }}>{'\u23EE'}</button>
        <button
          onClick={() => emit(playing() ? Pause : Play, undefined)}
          style={{
            background: track().color, border: 'none', 'border-radius': '50%',
            width: '56px', height: '56px', cursor: 'pointer', color: '#fff',
            'font-size': '24px', display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            'box-shadow': `0 4px 16px ${track().color}44`,
          }}
        >{playing() ? '\u23F8' : '\u25B6'}</button>
        <button onClick={() => emit(NextTrack, undefined)} style={{ background: 'none', border: 'none', color: '#fff', 'font-size': '24px', cursor: 'pointer' }}>{'\u23ED'}</button>
      </div>

      {/* Playlist */}
      <div style={{ background: 'rgba(255,255,255,0.03)', 'border-radius': '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', 'font-size': '13px', color: '#888', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px' }}>
          Playlist
        </div>
        <TrackList />
      </div>
    </div>
  )
}
