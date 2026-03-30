import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-particle-explosion/src/engine'
import ParticleExplosion3DApp from '../../../react/3d-particle-explosion/src/App'

export default function ParticleExplosion3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ParticleExplosion3DApp />
    </PulseProvider>
  )
}
