import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/collaborative-editor/src/engine'
import CollaborativeEditorApp from '../../../react/collaborative-editor/src/App'

export default function CollaborativeEditorPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <CollaborativeEditorApp />
    </PulseProvider>
  )
}
