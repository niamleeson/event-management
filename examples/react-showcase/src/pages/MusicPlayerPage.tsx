import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/music-player/src/engine'
import MusicPlayerApp from '../../../react/music-player/src/App'

export default function MusicPlayerPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <MusicPlayerApp />
    </PulseProvider>
  )
}
