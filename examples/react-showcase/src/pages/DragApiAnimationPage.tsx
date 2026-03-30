import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/drag-api-animation/src/engine'
import DragApiAnimationApp from '../../../react/drag-api-animation/src/App'

export default function DragApiAnimationPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <DragApiAnimationApp />
    </PulseProvider>
  )
}
