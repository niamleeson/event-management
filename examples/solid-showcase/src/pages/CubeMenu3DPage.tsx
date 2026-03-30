import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/3d-cube-menu/src/engine'
import App from '../../../solid/3d-cube-menu/src/App'

export default function CubeMenu3DPage() {
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
