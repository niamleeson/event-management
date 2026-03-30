import { onMount, onCleanup } from 'solid-js'
import { PulseProvider } from '@pulse/solid'
import { engine } from '../../../solid/form-wizard/src/engine'
import FormWizardApp from '../../../solid/form-wizard/src/App'

export default function FormWizardPage() {
  onMount(() => {
    ;(window as any).__pulseEngine = engine
  })
  onCleanup(() => {
    ;(window as any).__pulseEngine = null
  })

  return (
    <PulseProvider engine={engine}>
      <div class="example-container" style={{ 'min-height': '100%' }}>
        <FormWizardApp />
      </div>
    </PulseProvider>
  )
}
