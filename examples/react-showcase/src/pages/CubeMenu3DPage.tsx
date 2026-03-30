import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/3d-cube-menu/src/engine'
import CubeMenu3DApp from '../../../react/3d-cube-menu/src/App'

export default function CubeMenu3DPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <CubeMenu3DApp />
    </PulseProvider>
  )
}
