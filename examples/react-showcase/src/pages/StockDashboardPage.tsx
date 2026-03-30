import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/stock-dashboard/src/engine'
import StockDashboardApp from '../../../react/stock-dashboard/src/App'

export default function StockDashboardPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <StockDashboardApp />
    </PulseProvider>
  )
}
