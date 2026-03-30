import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/simple-animation/src/engine'
import SimpleAnimationApp from '../../../solid/simple-animation/src/App'

export default function SimpleAnimationPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <SimpleAnimationApp />
      </div>
    </PulseProvider>
  )
}
