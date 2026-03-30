import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/drag-api-animation/src/engine'
import DragApiAnimationApp from '../../../solid/drag-api-animation/src/App'

export default function DragApiAnimationPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <DragApiAnimationApp />
      </div>
    </PulseProvider>
  )
}
