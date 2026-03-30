import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/file-tree/src/engine'
import FileTreeApp from '../../../react/file-tree/src/App'

export default function FileTreePage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <FileTreeApp />
    </PulseProvider>
  )
}
