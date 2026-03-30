import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-card-flip/src/engine'
import CardFlip3DApp from '../../../react/3d-card-flip/src/App'

export default function CardFlip3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <CardFlip3DApp />
    </PulseProvider>
  )
}
