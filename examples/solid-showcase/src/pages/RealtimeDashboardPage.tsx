import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/realtime-dashboard/src/engine'
import RealtimeDashboardApp from '../../../solid/realtime-dashboard/src/App'

export default function RealtimeDashboardPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <RealtimeDashboardApp />
      </div>
    </PulseProvider>
  )
}
