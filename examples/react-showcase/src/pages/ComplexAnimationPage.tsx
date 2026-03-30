import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/complex-animation/src/engine'
import ComplexAnimationApp from '../../../react/complex-animation/src/App'

export default function ComplexAnimationPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ComplexAnimationApp />
    </PulseProvider>
  )
}
