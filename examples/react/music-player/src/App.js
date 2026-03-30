import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { currentTrack, isPlaying, progress, volume, shuffle, repeat, playlist, visualizerBars, Play, Pause, NextTrack, PrevTrack, Seek, VolumeChanged, ShuffleToggle, RepeatToggle, TrackChanged, } from './engine';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        flexDirection: 'column',
        overflow: 'hidden',
    },
    sidebarHeader: {
        padding: '20px 16px 12px',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#b3b3b3',
    },
    playlistItem: (isActive) => ({
        padding: '10px 16px',
        cursor: 'pointer',
        background: isActive ? '#282828' : 'transparent',
        borderLeft: isActive ? '3px solid #1db954' : '3px solid transparent',
        transition: 'background 0.2s',
    }),
    playlistTitle: (isActive) => ({
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#1db954' : '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
        flexDirection: 'column',
        overflow: 'hidden',
    },
    nowPlaying: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 40,
    },
    albumArt: (color, rotation) => ({
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
        textAlign: 'center',
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
    vizBar: (height, color) => ({
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
        textAlign: 'center',
    },
    progressTrack: {
        flex: 1,
        height: 4,
        background: '#535353',
        borderRadius: 2,
        cursor: 'pointer',
        position: 'relative',
    },
    progressFill: (pct, color) => ({
        height: '100%',
        width: `${pct * 100}%`,
        background: color,
        borderRadius: 2,
        position: 'relative',
    }),
    progressThumb: {
        position: 'absolute',
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
    controlBtn: (active) => ({
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
        position: 'relative',
    },
    volumeFill: (pct) => ({
        height: '100%',
        width: `${pct * 100}%`,
        background: '#1db954',
        borderRadius: 2,
    }),
    volumeLabel: {
        fontSize: 11,
        color: '#b3b3b3',
    },
};
const globalStyle = `
body { margin: 0; overflow: hidden; }
`;
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function Sidebar() {
    const emit = useEmit();
    const pl = useSignal(playlist);
    const current = useSignal(currentTrack);
    const playing = useSignal(isPlaying);
    const handleSelect = (track) => {
        emit(TrackChanged, track);
        if (!playing) {
            emit(Play, undefined);
        }
    };
    return (_jsxs("div", { style: styles.sidebar, children: [_jsx("div", { style: styles.sidebarHeader, children: "Queue" }), _jsx("div", { style: { flex: 1, overflowY: 'auto' }, children: pl.map((track) => (_jsxs("div", { style: styles.playlistItem(track.id === current.id), onClick: () => handleSelect(track), children: [_jsx("div", { style: styles.playlistTitle(track.id === current.id), children: track.title }), _jsx("div", { style: styles.playlistArtist, children: track.artist }), _jsx("div", { style: styles.playlistDuration, children: formatTime(track.duration) })] }, track.id))) })] }));
}
function AlbumArt() {
    const track = useSignal(currentTrack);
    const playing = useSignal(isPlaying);
    const prog = useSignal(progress);
    // Vinyl rotation: full rotations based on progress
    const rotation = playing ? (prog * track.duration * 3) % 360 : 0;
    return (_jsx("div", { style: styles.albumArt(track.color, rotation), children: _jsx("div", { style: styles.albumInner }) }));
}
function Visualizer() {
    const bars = useSignal(visualizerBars);
    const track = useSignal(currentTrack);
    const playing = useSignal(isPlaying);
    return (_jsx("div", { style: styles.visualizer, children: bars.map((h, i) => (_jsx("div", { style: styles.vizBar(playing ? h : h * 0.1, track.color) }, i))) }));
}
function NowPlaying() {
    const track = useSignal(currentTrack);
    return (_jsxs("div", { style: styles.nowPlaying, children: [_jsx(AlbumArt, {}), _jsxs("div", { style: styles.trackInfo, children: [_jsx("div", { style: styles.trackTitle, children: track.title }), _jsx("div", { style: styles.trackArtist, children: track.artist }), _jsx("div", { style: styles.trackAlbum, children: track.album })] }), _jsx(Visualizer, {})] }));
}
function ProgressBar() {
    const emit = useEmit();
    const prog = useSignal(progress);
    const track = useSignal(currentTrack);
    const elapsed = prog * track.duration;
    const remaining = track.duration - elapsed;
    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        emit(Seek, Math.max(0, Math.min(1, pct)));
    };
    return (_jsxs("div", { style: styles.progressBar, children: [_jsx("span", { style: styles.progressTime, children: formatTime(elapsed) }), _jsx("div", { style: styles.progressTrack, onClick: handleClick, children: _jsx("div", { style: styles.progressFill(prog, track.color), children: _jsx("div", { style: styles.progressThumb }) }) }), _jsxs("span", { style: styles.progressTime, children: ["-", formatTime(remaining)] })] }));
}
function Controls() {
    const emit = useEmit();
    const playing = useSignal(isPlaying);
    const shuf = useSignal(shuffle);
    const rep = useSignal(repeat);
    const vol = useSignal(volume);
    const handleVolumeClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        emit(VolumeChanged, Math.max(0, Math.min(1, pct)));
    };
    return (_jsxs("div", { style: styles.controls, children: [_jsx(ProgressBar, {}), _jsxs("div", { style: styles.buttonRow, children: [_jsx("button", { style: styles.controlBtn(shuf), onClick: () => emit(ShuffleToggle, undefined), title: "Shuffle", children: '⇄' }), _jsx("button", { style: styles.controlBtn(), onClick: () => emit(PrevTrack, undefined), title: "Previous", children: '⏮' }), _jsx("button", { style: styles.playBtn, onClick: () => emit(playing ? Pause : Play, undefined), title: playing ? 'Pause' : 'Play', children: playing ? '⏸' : '▶' }), _jsx("button", { style: styles.controlBtn(), onClick: () => emit(NextTrack, undefined), title: "Next", children: '⏭' }), _jsx("button", { style: styles.controlBtn(rep), onClick: () => emit(RepeatToggle, undefined), title: "Repeat", children: '⟳' })] }), _jsxs("div", { style: styles.volumeRow, children: [_jsx("span", { style: styles.volumeLabel, children: '🔈' }), _jsx("div", { style: styles.volumeSlider, onClick: handleVolumeClick, children: _jsx("div", { style: styles.volumeFill(vol) }) }), _jsxs("span", { style: styles.volumeLabel, children: [Math.round(vol * 100), "%"] })] })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: globalStyle }), _jsxs("div", { style: styles.container, children: [_jsx(Sidebar, {}), _jsxs("div", { style: styles.main, children: [_jsx(NowPlaying, {}), _jsx(Controls, {})] })] })] }));
}
