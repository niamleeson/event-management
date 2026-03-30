import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/canvas-paint/src/engine'
import CanvasPaintApp from '../../../react/canvas-paint/src/App'

export default function CanvasPaintPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <CanvasPaintApp />
    </PulseProvider>
  )
}
