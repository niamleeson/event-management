import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Sample playlist
// ---------------------------------------------------------------------------
export const samplePlaylist = [
    { id: '1', title: 'Midnight Pulse', artist: 'Neon Waves', album: 'Digital Dreams', duration: 234, color: '#e91e63' },
    { id: '2', title: 'Electric Dawn', artist: 'Synthscape', album: 'Horizons', duration: 198, color: '#9c27b0' },
    { id: '3', title: 'Deep Currents', artist: 'Bass Theory', album: 'Underwater', duration: 267, color: '#2196f3' },
    { id: '4', title: 'Solar Flare', artist: 'Cosmic Drift', album: 'Stardust', duration: 312, color: '#ff9800' },
    { id: '5', title: 'Urban Echo', artist: 'City Lights', album: 'Concrete Jungle', duration: 189, color: '#4caf50' },
    { id: '6', title: 'Crystal Rain', artist: 'Ambient Flow', album: 'Serenity', duration: 278, color: '#00bcd4' },
    { id: '7', title: 'Thunder Road', artist: 'Heavy Circuit', album: 'Voltage', duration: 245, color: '#f44336' },
    { id: '8', title: 'Velvet Night', artist: 'Dream Weaver', album: 'Lullabies', duration: 302, color: '#673ab7' },
];
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const Play = engine.event('Play');
export const Pause = engine.event('Pause');
export const NextTrack = engine.event('NextTrack');
export const PrevTrack = engine.event('PrevTrack');
export const Seek = engine.event('Seek');
export const VolumeChanged = engine.event('VolumeChanged');
export const ShuffleToggle = engine.event('ShuffleToggle');
export const RepeatToggle = engine.event('RepeatToggle');
export const TrackChanged = engine.event('TrackChanged');
export const BeatDetected = engine.event('BeatDetected');
export const ProgressTick = engine.event('ProgressTick');
export const VisualizerUpdate = engine.event('VisualizerUpdate');
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const currentTrack = engine.signal(TrackChanged, samplePlaylist[0], (_prev, track) => track);
export const isPlaying = engine.signal(Play, false, () => true);
engine.signalUpdate(isPlaying, Pause, () => false);
export const progress = engine.signal(ProgressTick, 0, (_prev, val) => Math.min(1, Math.max(0, val)));
engine.signalUpdate(progress, Seek, (_prev, val) => Math.min(1, Math.max(0, val)));
engine.signalUpdate(progress, TrackChanged, () => 0);
export const volume = engine.signal(VolumeChanged, 0.75, (_prev, val) => val);
export const shuffle = engine.signal(ShuffleToggle, false, (prev) => !prev);
export const repeat = engine.signal(RepeatToggle, false, (prev) => !prev);
export const playlist = engine.signal(TrackChanged, samplePlaylist, (prev) => prev);
export const visualizerBars = engine.signal(VisualizerUpdate, Array(32).fill(0), (_prev, bars) => bars);
// ---------------------------------------------------------------------------
// Frame-driven progress and visualizer
// ---------------------------------------------------------------------------
let beatTimer = 0;
engine.on(engine.frame, ({ dt }) => {
    if (!isPlaying.value)
        return;
    const track = currentTrack.value;
    if (!track)
        return;
    // Advance progress
    const increment = (dt / 1000) / track.duration;
    const newProgress = progress.value + increment;
    if (newProgress >= 1) {
        engine.emit(Pause, undefined);
        engine.emit(NextTrack, undefined);
        return;
    }
    engine.emit(ProgressTick, newProgress);
    // Beat detection (simulated every ~500ms)
    beatTimer += dt;
    if (beatTimer >= 500) {
        beatTimer -= 500;
        engine.emit(BeatDetected, undefined);
    }
    // Visualizer: generate random bars influenced by "beats"
    const isBeatFrame = beatTimer < dt;
    const bars = [];
    for (let i = 0; i < 32; i++) {
        const base = Math.random() * 0.5;
        const beatBoost = isBeatFrame ? Math.random() * 0.5 : 0;
        const freqBias = Math.sin((i / 32) * Math.PI) * 0.3;
        bars.push(Math.min(1, base + beatBoost + freqBias));
    }
    engine.emit(VisualizerUpdate, bars);
});
// ---------------------------------------------------------------------------
// Track navigation
// ---------------------------------------------------------------------------
engine.on(NextTrack, () => {
    const current = currentTrack.value;
    const pl = playlist.value;
    const idx = pl.findIndex(t => t.id === current.id);
    let nextIdx;
    if (shuffle.value) {
        nextIdx = Math.floor(Math.random() * pl.length);
        if (nextIdx === idx && pl.length > 1)
            nextIdx = (nextIdx + 1) % pl.length;
    }
    else {
        nextIdx = (idx + 1) % pl.length;
    }
    engine.emit(TrackChanged, pl[nextIdx]);
    if (isPlaying.value) {
        // Keep playing
        engine.emit(Play, undefined);
    }
});
engine.on(PrevTrack, () => {
    const current = currentTrack.value;
    const pl = playlist.value;
    const idx = pl.findIndex(t => t.id === current.id);
    if (progress.value > 0.05) {
        // Restart current track
        engine.emit(Seek, 0);
        return;
    }
    const prevIdx = idx <= 0 ? pl.length - 1 : idx - 1;
    engine.emit(TrackChanged, pl[prevIdx]);
    if (isPlaying.value) {
        engine.emit(Play, undefined);
    }
});
// Start frame loop
engine.startFrameLoop();
