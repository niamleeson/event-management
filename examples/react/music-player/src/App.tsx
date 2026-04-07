import { usePulse, useEmit } from '@pulse/react'
import {
  CurrentTrackChanged,
  IsPlayingChanged,
  ProgressChanged,
  VolumeChanged,
  ShuffleChanged,
  RepeatChanged,
  samplePlaylist,
  VisualizerChanged,
  Play,
  Pause,
  NextTrack,
  PrevTrack,
  Seek,
  VolumeSet,
  ShuffleToggle,
  RepeatToggle,
  TrackSelected,

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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#121212',
    color: '#fff',
  },
  sidebar: {
    width: 280,
    background: '#000',
    borderRight: '1px solid #282828',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px 16px 12px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    color: '#b3b3b3',
  },
  playlistItem: (isActive: boolean) => ({
    padding: '10px 16px',
    cursor: 'pointer',
    background: isActive ? '#282828' : 'transparent',
    borderLeft: isActive ? '3px solid #1db954' : '3px solid transparent',
    transition: 'background 0.2s',
  }),
  playlistTitle: (isActive: boolean) => ({
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#1db954' : '#fff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  }),
  playlistArtist: {
    fontSize: 12,
    color: '#b3b3b3',
    marginTop: 2,
  },
  playlistDuration: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  nowPlaying: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 40,
  },
  albumArt: (color: string, rotation: number) => ({
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: `conic-gradient(from ${rotation}deg, ${color}, ${color}88, ${color}44, ${color}88, ${color})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 8px 32px ${color}44`,
    transition: 'box-shadow 0.5s',
  }),
  albumInner: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#121212',
    border: '2px solid #333',
  },
  trackInfo: {
    textAlign: 'center' as const,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 700,
  },
  trackArtist: {
    fontSize: 16,
    color: '#b3b3b3',
    marginTop: 4,
  },
  trackAlbum: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  visualizer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    height: 80,
    padding: '0 40px',
    width: '100%',
    maxWidth: 500,
  },
  vizBar: (height: number, color: string) => ({
    flex: 1,
    height: `${height * 100}%`,
    background: `linear-gradient(to top, ${color}, ${color}88)`,
    borderRadius: '2px 2px 0 0',
    transition: 'height 0.08s ease-out',
    minHeight: 2,
  }),
  controls: {
    padding: '20px 40px 30px',
    background: '#181818',
    borderTop: '1px solid #282828',
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  progressTime: {
    fontSize: 11,
    color: '#b3b3b3',
    minWidth: 36,
    textAlign: 'center' as const,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: '#535353',
    borderRadius: 2,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  progressFill: (pct: number, color: string) => ({
    height: '100%',
    width: `${pct * 100}%`,
    background: color,
    borderRadius: 2,
    position: 'relative' as const,
  }),
  progressThumb: {
    position: 'absolute' as const,
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#fff',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlBtn: (active?: boolean) => ({
    background: 'none',
    border: 'none',
    color: active ? '#1db954' : '#b3b3b3',
    fontSize: 20,
    cursor: 'pointer',
    padding: 8,
    borderRadius: '50%',
    transition: 'color 0.2s',
  }),
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fff',
    border: 'none',
    color: '#000',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  volumeSlider: {
    width: 100,
    height: 4,
    background: '#535353',
    borderRadius: 2,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  volumeFill: (pct: number) => ({
    height: '100%',
    width: `${pct * 100}%`,
    background: '#1db954',
    borderRadius: 2,
  }),
  volumeLabel: {
    fontSize: 11,
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

  const handleSelect = (track: Track) => {
    emit(TrackSelected, track)
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>Queue</div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {pl.map((track) => (
          <div
            key={track.id}
            style={styles.playlistItem(track.id === current.id)}
            onClick={() => handleSelect(track)}
          >
            <div style={styles.playlistTitle(track.id === current.id)}>
              {track.title}
            </div>
            <div style={styles.playlistArtist}>{track.artist}</div>
            <div style={styles.playlistDuration}>{formatTime(track.duration)}</div>
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
  const rotation = playing ? (prog * track.duration * 3) % 360 : 0

  return (
    <div style={styles.albumArt(track.color, rotation)}>
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
      {bars.map((h, i) => (
        <div
          key={i}
          style={styles.vizBar(playing ? h : h * 0.1, track.color)}
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
        <div style={styles.trackTitle}>{track.title}</div>
        <div style={styles.trackArtist}>{track.artist}</div>
        <div style={styles.trackAlbum}>{track.album}</div>
      </div>
      <Visualizer />
    </div>
  )
}

function ProgressBar() {
  const emit = useEmit()
  const prog = usePulse(ProgressChanged, 0)
  const track = usePulse(CurrentTrackChanged, samplePlaylist[0])

  const elapsed = prog * track.duration
  const remaining = track.duration - elapsed

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    emit(Seek, Math.max(0, Math.min(1, pct)))
  }

  return (
    <div style={styles.progressBar}>
      <span style={styles.progressTime}>{formatTime(elapsed)}</span>
      <div style={styles.progressTrack} onClick={handleClick}>
        <div style={styles.progressFill(prog, track.color)}>
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

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
          onClick={() => emit(playing ? Pause : Play, undefined)}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
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
        <span style={styles.volumeLabel}>{Math.round(vol * 100)}%</span>
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
