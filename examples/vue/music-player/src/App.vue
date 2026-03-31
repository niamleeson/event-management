<script setup lang="ts">
import { providePulse, useEmit, usePulse, useSignal } from '@pulse/vue'
import {
  engine,
  PLAYLIST,
  Play,
  Pause,
  NextTrack,
  PrevTrack,
  SelectTrack,
  currentTrack,
  isPlaying,
  progress,
  visualizerBars,
  albumRotation,
  VisualizerUpdated,
  CurrentTrackChanged,
  IsPlayingChanged,
  ProgressChanged,
  AlbumRotationChanged,
} from './engine'

providePulse(engine)

const emit = useEmit()
const track = usePulse(CurrentTrackChanged, currentTrack)
const playing = usePulse(IsPlayingChanged, isPlaying)
const prog = usePulse(ProgressChanged, progress)
const rotation = usePulse(AlbumRotationChanged, albumRotation)

// Force re-render on visualizer update
const vizKey = useSignal(engine.signal(VisualizerUpdated, 0, (prev) => prev + 1))

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const current = () => PLAYLIST[track.value]
const elapsed = () => prog.value * current().duration
</script>

<template>
  <div :style="{ width: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }">
    <!-- Album Art -->
    <div :style="{ display: 'flex', justifyContent: 'center' }">
      <div :style="{
        width: '200px', height: '200px', borderRadius: '50%',
        background: `linear-gradient(145deg, ${current().color}cc, ${current().color}66)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        boxShadow: `0 0 40px ${current().color}44`,
        border: '4px solid rgba(255,255,255,0.1)',
      }">
        <div :style="{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.1)' }" />
      </div>
    </div>

    <!-- Track info -->
    <div :style="{ textAlign: 'center' }">
      <h2 :style="{ color: '#fff', fontSize: '22px', fontWeight: 700 }">{{ current().title }}</h2>
      <p :style="{ color: '#888', fontSize: '14px', marginTop: '4px' }">{{ current().artist }}</p>
    </div>

    <!-- Visualizer -->
    <div :style="{ display: 'flex', alignItems: 'flex-end', height: '80px', gap: '2px', padding: '0 10px' }">
      <div
        v-for="(_, i) in 32"
        :key="i + '-' + vizKey"
        :style="{
          flex: 1, borderRadius: '2px 2px 0 0',
          height: `${Math.max(4, visualizerBars[i] * 80)}px`,
          background: `linear-gradient(to top, ${current().color}88, ${current().color})`,
          transition: 'height 0.05s',
        }"
      />
    </div>

    <!-- Progress bar -->
    <div :style="{ padding: '0 10px' }">
      <div :style="{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }">
        <div :style="{ height: '100%', width: `${prog * 100}%`, background: current().color, borderRadius: '2px', transition: 'width 0.1s' }" />
      </div>
      <div :style="{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }">
        <span :style="{ color: '#888', fontSize: '12px' }">{{ formatTime(elapsed()) }}</span>
        <span :style="{ color: '#888', fontSize: '12px' }">{{ formatTime(current().duration) }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div :style="{ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center' }">
      <button @click="emit(PrevTrack, undefined)" :style="{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }">
        &laquo;
      </button>
      <button
        @click="playing ? emit(Pause, undefined) : emit(Play, undefined)"
        :style="{
          width: '56px', height: '56px', borderRadius: '50%',
          background: current().color, border: 'none', color: '#fff',
          fontSize: '20px', cursor: 'pointer',
          boxShadow: `0 4px 20px ${current().color}66`,
        }"
      >
        {{ playing ? '\u23F8' : '\u25B6' }}
      </button>
      <button @click="emit(NextTrack, undefined)" :style="{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }">
        &raquo;
      </button>
    </div>

    <!-- Playlist -->
    <div :style="{ display: 'flex', flexDirection: 'column', gap: '4px' }">
      <div
        v-for="(t, i) in PLAYLIST"
        :key="i"
        @click="emit(SelectTrack, i)"
        :style="{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
          background: track === i ? `${t.color}22` : 'transparent',
          borderRadius: '8px', cursor: 'pointer',
          border: track === i ? `1px solid ${t.color}44` : '1px solid transparent',
        }"
      >
        <div :style="{ width: '8px', height: '8px', borderRadius: '50%', background: track === i ? t.color : '#555' }" />
        <div :style="{ flex: 1 }">
          <div :style="{ color: track === i ? t.color : '#ccc', fontSize: '14px', fontWeight: track === i ? 600 : 400 }">{{ t.title }}</div>
          <div :style="{ color: '#666', fontSize: '12px' }">{{ t.artist }}</div>
        </div>
        <div :style="{ color: '#666', fontSize: '12px' }">{{ formatTime(t.duration) }}</div>
      </div>
    </div>
  </div>
</template>
