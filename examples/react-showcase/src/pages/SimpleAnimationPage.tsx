import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/simple-animation/src/engine'
import SimpleAnimationApp from '../../../react/simple-animation/src/App'

export default function SimpleAnimationPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <SimpleAnimationApp />
    </PulseProvider>
  )
}
