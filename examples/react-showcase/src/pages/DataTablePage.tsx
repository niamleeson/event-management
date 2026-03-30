import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/data-table/src/engine'
import DataTableApp from '../../../react/data-table/src/App'

export default function DataTablePage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <DataTableApp />
    </PulseProvider>
  )
}
