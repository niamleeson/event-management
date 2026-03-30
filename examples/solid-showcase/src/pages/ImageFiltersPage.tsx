import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/image-filters/src/engine'
import App from '../../../solid/image-filters/src/App'

export default function ImageFiltersPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <App />
      </div>
    </PulseProvider>
  )
}
