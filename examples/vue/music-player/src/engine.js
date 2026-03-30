import { createEngine } from '@pulse/core';
export const engine = createEngine();
engine.startFrameLoop();
export const PLAYLIST = [
    { title: 'Neon Dreams', artist: 'Synthwave Collective', duration: 234, color: '#6c5ce7' },
    { title: 'Midnight Drive', artist: 'Retrowave FM', duration: 198, color: '#00b894' },
    { title: 'Digital Sunrise', artist: 'Pixel Beats', duration: 267, color: '#e17055' },
    { title: 'Cosmic Dust', artist: 'Starfield Audio', duration: 312, color: '#0984e3' },
    { title: 'Electric Heart', artist: 'Neon Pulse', duration: 189, color: '#d63031' },
    { title: 'Crystal Caves', artist: 'Ambient Works', duration: 278, color: '#00cec9' },
];
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const Play = engine.event('Play');
export const Pause = engine.event('Pause');
export const NextTrack = engine.event('NextTrack');
export const PrevTrack = engine.event('PrevTrack');
export const SelectTrack = engine.event('SelectTrack');
export const Tick = engine.event('Tick'); // progress tick
export const BeatDetected = engine.event('BeatDetected');
export const VisualizerUpdated = engine.event('VisualizerUpdated');
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
export const currentTrack = engine.signal(SelectTrack, 0, (_prev, idx) => idx);
engine.signalUpdate(currentTrack, NextTrack, (prev) => (prev + 1) % PLAYLIST.length);
engine.signalUpdate(currentTrack, PrevTrack, (prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
export const isPlaying = engine.signal(Play, false, () => true);
engine.signalUpdate(isPlaying, Pause, () => false);
export const progress = engine.signal(Tick, 0, (_prev, val) => val);
engine.signalUpdate(progress, SelectTrack, () => 0);
engine.signalUpdate(progress, NextTrack, () => 0);
engine.signalUpdate(progress, PrevTrack, () => 0);
/* ------------------------------------------------------------------ */
/*  Visualizer bars (32 bars, driven by frame)                        */
/* ------------------------------------------------------------------ */
export const visualizerBars = new Array(32).fill(0);
let beatPhase = 0;
engine.on(engine.frame, ({ dt }) => {
    if (!isPlaying.value) {
        for (let i = 0; i < 32; i++) {
            visualizerBars[i] *= 0.95;
        }
        engine.emit(VisualizerUpdated, undefined);
        return;
    }
    const dtSec = dt / 1000;
    const track = PLAYLIST[currentTrack.value];
    const newProgress = Math.min(1, progress.value + dtSec / track.duration);
    engine.emit(Tick, newProgress);
    if (newProgress >= 1) {
        engine.emit(NextTrack, undefined);
        engine.emit(Play, undefined);
        return;
    }
    // Simulated beat detection
    beatPhase += dt * 0.008;
    const isBeat = Math.sin(beatPhase) > 0.9;
    for (let i = 0; i < 32; i++) {
        const freq = (i / 32) * Math.PI * 2;
        const base = Math.sin(beatPhase * 0.5 + freq) * 0.3 + 0.3;
        const beat = isBeat ? Math.random() * 0.5 : 0;
        visualizerBars[i] = Math.max(0, Math.min(1, base + beat + Math.random() * 0.1));
    }
    if (isBeat) {
        engine.emit(BeatDetected, beatPhase);
    }
    engine.emit(VisualizerUpdated, undefined);
});
/* ------------------------------------------------------------------ */
/*  Progress tween for smooth bar                                     */
/* ------------------------------------------------------------------ */
const ProgressAnimStart = engine.event('ProgressAnimStart');
engine.pipe(Play, ProgressAnimStart, () => undefined);
export const progressTween = engine.tween({
    start: ProgressAnimStart,
    from: () => progress.value,
    to: 1,
    duration: () => {
        const track = PLAYLIST[currentTrack.value];
        return (1 - progress.value) * track.duration * 1000;
    },
    easing: (t) => t,
});
/* ------------------------------------------------------------------ */
/*  Album art spin signal                                             */
/* ------------------------------------------------------------------ */
export const albumRotation = engine.signal(VisualizerUpdated, 0, (prev) => {
    if (!isPlaying.value)
        return prev;
    return prev + 0.5;
});
