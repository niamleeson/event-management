import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/chat-app/src/engine'
import ChatAppApp from '../../../react/chat-app/src/App'

export default function ChatAppPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ChatAppApp />
    </PulseProvider>
  )
}
