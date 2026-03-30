import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/virtual-scroll/src/engine'
import VirtualScrollApp from '../../../react/virtual-scroll/src/App'

export default function VirtualScrollPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <VirtualScrollApp />
    </PulseProvider>
  )
}
