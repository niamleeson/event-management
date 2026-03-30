import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-morphing-grid/src/engine'
import MorphingGrid3DApp from '../../../react/3d-morphing-grid/src/App'

export default function MorphingGrid3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <MorphingGrid3DApp />
    </PulseProvider>
  )
}
