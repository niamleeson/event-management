import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/modal-system/src/engine'
import ModalSystemApp from '../../../react/modal-system/src/App'

export default function ModalSystemPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ModalSystemApp />
    </PulseProvider>
  )
}
