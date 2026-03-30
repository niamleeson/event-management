import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/form-wizard/src/engine'
import FormWizardApp from '../../../react/form-wizard/src/App'

export default function FormWizardPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <FormWizardApp />
    </PulseProvider>
  )
}
