import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-layered-parallax/src/engine'
import LayeredParallax3DApp from '../../../react/3d-layered-parallax/src/App'

export default function LayeredParallax3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <LayeredParallax3DApp />
    </PulseProvider>
  )
}
