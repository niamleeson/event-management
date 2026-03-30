import {
  engine,
  PLAYLIST,
  BAR_COUNT,
  Play,
  Pause,
  NextTrack,
  PrevTrack,
  SelectTrack,
  Seek,
  isPlaying,
  currentTrackIndex,
  currentTime,
  visualizerBars,
  beatScale,
} from '../engines/music-player'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Music Player'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 24px;'
  sub.textContent = '32-bar visualizer, progress tracking, playlist, and beat-synchronized album art pulse.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Album art
  const albumSection = document.createElement('div')
  albumSection.style.cssText = 'text-align: center; margin-bottom: 24px;'

  const albumArt = document.createElement('div')
  albumArt.style.cssText = 'width: 180px; height: 180px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 64px; transition: background 0.3s;'

  const trackTitle = document.createElement('div')
  trackTitle.style.cssText = 'font-size: 22px; font-weight: 700; color: #1a1a2e;'
  const trackArtist = document.createElement('div')
  trackArtist.style.cssText = 'font-size: 14px; color: #667085; margin-top: 4px;'

  albumSection.appendChild(albumArt)
  albumSection.appendChild(trackTitle)
  albumSection.appendChild(trackArtist)
  wrapper.appendChild(albumSection)

  // Visualizer
  const vizContainer = document.createElement('div')
  vizContainer.style.cssText = 'display: flex; align-items: flex-end; gap: 2px; height: 80px; background: #f8f9fa; border-radius: 8px; padding: 8px; margin-bottom: 16px;'

  const barEls: HTMLElement[] = []
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div')
    bar.style.cssText = 'flex: 1; border-radius: 2px 2px 0 0; min-height: 4px; transition: none;'
    vizContainer.appendChild(bar)
    barEls.push(bar)
  }
  wrapper.appendChild(vizContainer)

  // Progress
  const progressRow = document.createElement('div')
  progressRow.style.cssText = 'margin-bottom: 16px;'

  const progressBar = document.createElement('div')
  progressBar.style.cssText = 'height: 6px; background: #e4e7ec; border-radius: 3px; overflow: hidden; cursor: pointer;'
  const progressFill = document.createElement('div')
  progressFill.style.cssText = 'height: 100%; background: #4361ee; border-radius: 3px; width: 0%;'
  progressBar.appendChild(progressFill)

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const track = PLAYLIST[currentTrackIndex.value]
    engine.emit(Seek, pct * track.duration)
  })

  const timeRow = document.createElement('div')
  timeRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: #98a2b3; margin-top: 4px;'
  const currentTimeEl = document.createElement('span')
  const durationEl = document.createElement('span')
  timeRow.appendChild(currentTimeEl)
  timeRow.appendChild(durationEl)

  progressRow.appendChild(progressBar)
  progressRow.appendChild(timeRow)
  wrapper.appendChild(progressRow)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 12px; justify-content: center; align-items: center; margin-bottom: 24px;'

  const prevBtn = document.createElement('button')
  prevBtn.style.cssText = 'padding: 10px 16px; border: none; border-radius: 50%; background: #e4e7ec; color: #344054; font-size: 18px; cursor: pointer; width: 44px; height: 44px;'
  prevBtn.textContent = '\u23EE'
  prevBtn.addEventListener('click', () => engine.emit(PrevTrack, undefined))

  const playBtn = document.createElement('button')
  playBtn.style.cssText = 'padding: 12px 20px; border: none; border-radius: 50%; background: #4361ee; color: #fff; font-size: 22px; cursor: pointer; width: 56px; height: 56px;'
  playBtn.addEventListener('click', () => {
    if (isPlaying.value) engine.emit(Pause, undefined)
    else engine.emit(Play, undefined)
  })

  const nextBtn = document.createElement('button')
  nextBtn.style.cssText = 'padding: 10px 16px; border: none; border-radius: 50%; background: #e4e7ec; color: #344054; font-size: 18px; cursor: pointer; width: 44px; height: 44px;'
  nextBtn.textContent = '\u23ED'
  nextBtn.addEventListener('click', () => engine.emit(NextTrack, undefined))

  controls.appendChild(prevBtn)
  controls.appendChild(playBtn)
  controls.appendChild(nextBtn)
  wrapper.appendChild(controls)

  // Playlist
  const playlistEl = document.createElement('div')
  playlistEl.style.cssText = 'border: 1px solid #e4e7ec; border-radius: 10px; overflow: hidden;'
  const playlistTitle = document.createElement('div')
  playlistTitle.style.cssText = 'padding: 10px 16px; background: #f8f9fa; font-weight: 700; font-size: 14px; color: #344054; border-bottom: 1px solid #e4e7ec;'
  playlistTitle.textContent = 'Playlist'
  playlistEl.appendChild(playlistTitle)

  const trackEls: HTMLElement[] = []
  for (let i = 0; i < PLAYLIST.length; i++) {
    const track = PLAYLIST[i]
    const trackEl = document.createElement('div')
    trackEl.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 10px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f0f2f5;'

    const num = document.createElement('div')
    num.style.cssText = `width: 24px; height: 24px; border-radius: 50%; background: ${track.color}20; color: ${track.color}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;`
    num.textContent = String(i + 1)

    const info = document.createElement('div')
    info.style.cssText = 'flex: 1;'
    const name = document.createElement('div')
    name.style.cssText = 'font-size: 14px; font-weight: 600; color: #1a1a2e;'
    name.textContent = track.title
    const artist = document.createElement('div')
    artist.style.cssText = 'font-size: 12px; color: #98a2b3;'
    artist.textContent = track.artist
    info.appendChild(name)
    info.appendChild(artist)

    const dur = document.createElement('div')
    dur.style.cssText = 'font-size: 12px; color: #98a2b3;'
    dur.textContent = formatTime(track.duration)

    trackEl.appendChild(num)
    trackEl.appendChild(info)
    trackEl.appendChild(dur)

    trackEl.addEventListener('click', () => {
      engine.emit(SelectTrack, i)
      engine.emit(Play, undefined)
    })
    trackEl.addEventListener('mouseenter', () => { trackEl.style.background = '#f8f9fa' })
    trackEl.addEventListener('mouseleave', () => { trackEl.style.background = '' })

    playlistEl.appendChild(trackEl)
    trackEls.push(trackEl)
  }
  wrapper.appendChild(playlistEl)

  container.appendChild(wrapper)

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Frame loop for visualizer and progress
  unsubs.push(engine.on(engine.frame, () => {
    const trackIdx = currentTrackIndex.value
    const track = PLAYLIST[trackIdx]
    const time = currentTime.value
    const playing = isPlaying.value
    const bars = visualizerBars.value
    const scale = beatScale.value

    // Album art
    albumArt.style.background = `linear-gradient(135deg, ${track.color}, ${track.color}88)`
    albumArt.style.transform = `scale(${scale})`
    albumArt.textContent = '\u{266B}'
    if (playing) {
      albumArt.style.animation = ''
    }

    trackTitle.textContent = track.title
    trackArtist.textContent = track.artist

    // Progress
    const pct = (time / track.duration) * 100
    progressFill.style.width = `${pct}%`
    progressFill.style.background = track.color
    currentTimeEl.textContent = formatTime(time)
    durationEl.textContent = formatTime(track.duration)

    // Play button
    playBtn.textContent = playing ? '\u23F8' : '\u25B6'

    // Visualizer bars
    for (let i = 0; i < BAR_COUNT; i++) {
      const height = playing ? bars[i] * 64 : 4
      barEls[i].style.height = `${Math.max(4, height)}px`
      barEls[i].style.background = track.color
      barEls[i].style.opacity = playing ? String(0.5 + bars[i] * 0.5) : '0.3'
    }

    // Playlist active track
    for (let i = 0; i < trackEls.length; i++) {
      trackEls[i].style.background = i === trackIdx ? `${PLAYLIST[i].color}10` : ''
      trackEls[i].style.borderLeft = i === trackIdx ? `3px solid ${PLAYLIST[i].color}` : '3px solid transparent'
    }
  }))

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}
