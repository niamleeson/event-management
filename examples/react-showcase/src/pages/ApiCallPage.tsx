import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/api-call/src/engine'
import ApiCallApp from '../../../react/api-call/src/App'

export default function ApiCallPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ApiCallApp />
    </PulseProvider>
  )
}
