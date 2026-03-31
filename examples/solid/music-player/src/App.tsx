import { usePulse, useEmit } from '@pulse/solid'
import {
  CurrentTrackChanged,
  IsPlayingChanged,
  ProgressChanged,
  ShuffleChanged,
  RepeatChanged,
  Play,
  Pause,
  NextTrack,
  PrevTrack,
  Seek,
  ShuffleToggle,
  RepeatToggle,
  type Track,
} from './engine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#121212',
    color: '#fff',
  },
  sidebar: {
    width: 280,
    background: '#000',
    'border-right': '1px solid #282828',
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px 16px 12px',
    'font-size': 12,
    'font-weight': 700,
    'text-transform': 'uppercase' as const,
    'letter-spacing': 1.5,
    color: '#b3b3b3',
  },
  playlistItem: (isActive: boolean) => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: isActive ? '#282828' : 'transparent',
    'border-left': isActive ? '3px solid #1db954' : '3px solid transparent',
    transition: 'background 0.2s',
  }),
  playlistTitle: (isActive: boolean) => ({
    'font-size': 14,
    'font-weight': isActive ? 600 : 400,
    color: isActive ? '#1db954' : '#fff',
    'white-space': 'nowrap' as const,
    overflow: 'hidden' as const,
    'text-overflow': 'ellipsis' as const,
  }),
  playlistArtist: {
    'font-size': 12,
    color: '#b3b3b3',
    'margin-top': 2,
  },
  playlistDuration: {
    'font-size': 11,
    color: '#666',
    'margin-top': 2,
  },
  main: {
    flex: 1,
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  nowPlaying: {
    flex: 1,
    display: 'flex',
    'flex-direction': 'column' as const,
    'align-items': 'center',
    'justify-content': 'center',
    gap: 24,
    padding: 40,
  },
  albumArt: (color: string, rotation: number) => ({
    width: 240,
    height: 240,
    'border-radius': '50%',
    background: `conic-gradient(from ${rotation}deg, ${color}, ${color}88, ${color}44, ${color}88, ${color})`,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'box-shadow': `0 8px 32px ${color}44`,
    transition: 'box-shadow 0.5s',
  }),
  albumInner: {
    width: 80,
    height: 80,
    'border-radius': '50%',
    background: '#121212',
    border: '2px solid #333',
  },
  trackInfo: {
    'text-align': 'center' as const,
  },
  trackTitle: {
    'font-size': 24,
    'font-weight': 700,
  },
  trackArtist: {
    'font-size': 16,
    color: '#b3b3b3',
    'margin-top': 4,
  },
  trackAlbum: {
    'font-size': 13,
    color: '#666',
    'margin-top': 4,
  },
  visualizer: {
    display: 'flex',
    'align-items': 'flex-end',
    gap: 2,
    height: 80,
    padding: '0 40px',
    width: '100%',
    'max-width': 500,
  },
  vizBar: (height: number, color: string) => ({
    flex: 1,
    height: `${height * 100}%`,
    background: `linear-gradient(to top, ${color}, ${color}88)`,
    'border-radius': '2px 2px 0 0',
    transition: 'height 0.08s ease-out',
    'min-height': 2,
  }),
  controls: {
    padding: '20px 40px 30px',
    background: '#181818',
    'border-top': '1px solid #282828',
  },
  progressBar: {
    display: 'flex',
    'align-items': 'center',
    gap: 10,
    'margin-bottom': 16,
  },
  progressTime: {
    'font-size': 11,
    color: '#b3b3b3',
    'min-width': 36,
    'text-align': 'center' as const,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: '#535353',
    'border-radius': 2,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  progressFill: (pct: number, color: string) => ({
    height: '100%',
    width: `${pct * 100}%`,
    background: color,
    'border-radius': 2,
    position: 'relative' as const,
  }),
  progressThumb: {
    position: 'absolute' as const,
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    'border-radius': '50%',
    background: '#fff',
  },
  buttonRow: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: 24,
  },
  controlBtn: (active?: boolean) => ({
    background: 'none',
    border: 'none',
    color: active ? '#1db954' : '#b3b3b3',
    'font-size': 20,
    cursor: 'pointer',
    padding: 8,
    'border-radius': '50%',
    transition: 'color 0.2s',
  }),
  playBtn: {
    width: 48,
    height: 48,
    'border-radius': '50%',
    background: '#fff',
    border: 'none',
    color: '#000',
    'font-size': 20,
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  },
  volumeRow: {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: 8,
    'margin-top': 12,
  },
  volumeSlider: {
    width: 100,
    height: 4,
    background: '#535353',
    'border-radius': 2,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  volumeFill: (pct: number) => ({
    height: '100%',
    width: `${pct * 100}%`,
    background: '#1db954',
    'border-radius': 2,
  }),
  volumeLabel: {
    'font-size': 11,
    color: '#b3b3b3',
  },
}

const globalStyle = `
body { margin: 0; overflow: hidden; }
`

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Sidebar() {
  const emit = useEmit()
  const pl = samplePlaylist
  const current = usePulse(CurrentTrackChanged, samplePlaylist[0])
  const playing = usePulse(IsPlayingChanged, false)

  const handleSelect = (track: Track) => {
    emit(TrackChanged, track())
    if (!playing()) {
      emit(Play, undefined)
    }
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>Queue</div>
      <div style={{ flex: 1, 'overflow-y': 'auto' }}>
        {pl.map((track) => (
          <div
            style={styles.playlistItem(track().id === current().id)}
            onClick={() => handleSelect(track)}
          >
            <div style={styles.playlistTitle(track().id === current().id)}>
              {track().title}
            </div>
            <div style={styles.playlistArtist}>{track().artist}</div>
            <div style={styles.playlistDuration}>{formatTime(track().duration)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlbumArt() {
  const track = usePulse(CurrentTrackChanged, samplePlaylist[0])
  const playing = usePulse(IsPlayingChanged, false)
  const prog = usePulse(ProgressChanged, 0)

  // Vinyl rotation: full rotations based on progress
  const rotation = playing() ? (prog() * track().duration * 3) % 360 : 0

  return (
    <div style={styles.albumArt(track().color, rotation)}>
      <div style={styles.albumInner} />
    </div>
  )
}

function Visualizer() {
  const bars = usePulse(VisualizerChanged, Array(32).fill(0) as number[])
  const track = usePulse(CurrentTrackChanged, samplePlaylist[0])
  const playing = usePulse(IsPlayingChanged, false)

  return (
    <div style={styles.visualizer}>
      {bars().map((h, i) => (
        <div
          style={styles.vizBar(playing() ? h : h * 0.1, track().color)}
        />
      ))}
    </div>
  )
}

function NowPlaying() {
  const track = usePulse(CurrentTrackChanged, samplePlaylist[0])

  return (
    <div style={styles.nowPlaying}>
      <AlbumArt />
      <div style={styles.trackInfo}>
        <div style={styles.trackTitle}>{track().title}</div>
        <div style={styles.trackArtist}>{track().artist}</div>
        <div style={styles.trackAlbum}>{track().album}</div>
      </div>
      <Visualizer />
    </div>
  )
}

function ProgressBar() {
  const emit = useEmit()
  const prog = usePulse(ProgressChanged, 0)
  const track = usePulse(CurrentTrackChanged, samplePlaylist[0])

  const elapsed = prog() * track().duration
  const remaining = track().duration - elapsed

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    emit(Seek, Math.max(0, Math.min(1, pct)))
  }

  return (
    <div style={styles.progressBar}>
      <span style={styles.progressTime}>{formatTime(elapsed)}</span>
      <div style={styles.progressTrack} onClick={handleClick}>
        <div style={styles.progressFill(prog, track().color)}>
          <div style={styles.progressThumb} />
        </div>
      </div>
      <span style={styles.progressTime}>-{formatTime(remaining)}</span>
    </div>
  )
}

function Controls() {
  const emit = useEmit()
  const playing = usePulse(IsPlayingChanged, false)
  const shuf = usePulse(ShuffleChanged, false)
  const rep = usePulse(RepeatChanged, false)
  const vol = usePulse(VolumeChanged, 0.75)

  const handleVolumeClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    emit(VolumeSet, Math.max(0, Math.min(1, pct)))
  }

  return (
    <div style={styles.controls}>
      <ProgressBar />
      <div style={styles.buttonRow}>
        <button style={styles.controlBtn(shuf)} onClick={() => emit(ShuffleToggle, undefined)} title="Shuffle">
          {'⇄'}
        </button>
        <button style={styles.controlBtn()} onClick={() => emit(PrevTrack, undefined)} title="Previous">
          {'⏮'}
        </button>
        <button
          style={styles.playBtn}
          onClick={() => emit(playing() ? Pause : Play, undefined)}
          title={playing() ? 'Pause' : 'Play'}
        >
          {playing() ? '⏸' : '▶'}
        </button>
        <button style={styles.controlBtn()} onClick={() => emit(NextTrack, undefined)} title="Next">
          {'⏭'}
        </button>
        <button style={styles.controlBtn(rep)} onClick={() => emit(RepeatToggle, undefined)} title="Repeat">
          {'⟳'}
        </button>
      </div>
      <div style={styles.volumeRow}>
        <span style={styles.volumeLabel}>{'🔈'}</span>
        <div style={styles.volumeSlider} onClick={handleVolumeClick}>
          <div style={styles.volumeFill(vol)} />
        </div>
        <span style={styles.volumeLabel}>{Math.round(vol() * 100)}%</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
      <style>{globalStyle}</style>
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.main}>
          <NowPlaying />
          <Controls />
        </div>
      </div>
    </>
  )
}
