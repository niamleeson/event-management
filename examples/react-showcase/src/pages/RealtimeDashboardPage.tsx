import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/realtime-dashboard/src/engine'
import RealtimeDashboardApp from '../../../react/realtime-dashboard/src/App'

export default function RealtimeDashboardPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <RealtimeDashboardApp />
    </PulseProvider>
  )
}
