import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-carousel/src/engine'
import Carousel3DApp from '../../../react/3d-carousel/src/App'

export default function Carousel3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <Carousel3DApp />
    </PulseProvider>
  )
}
