import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/notification-system/src/engine'
import NotificationSystemApp from '../../../react/notification-system/src/App'

export default function NotificationSystemPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <NotificationSystemApp />
    </PulseProvider>
  )
}
