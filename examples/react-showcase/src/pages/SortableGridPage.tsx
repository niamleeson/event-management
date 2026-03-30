import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/sortable-grid/src/engine'
import SortableGridApp from '../../../react/sortable-grid/src/App'

export default function SortableGridPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <SortableGridApp />
    </PulseProvider>
  )
}
