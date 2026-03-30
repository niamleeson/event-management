import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/gantt-chart/src/engine'
import GanttChartApp from '../../../react/gantt-chart/src/App'

export default function GanttChartPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <GanttChartApp />
    </PulseProvider>
  )
}
