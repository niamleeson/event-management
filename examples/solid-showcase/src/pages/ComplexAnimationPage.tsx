import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/complex-animation/src/engine'
import ComplexAnimationApp from '../../../solid/complex-animation/src/App'

export default function ComplexAnimationPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <ComplexAnimationApp />
      </div>
    </PulseProvider>
  )
}
