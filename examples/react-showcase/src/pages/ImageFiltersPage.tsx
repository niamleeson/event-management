import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/image-filters/src/engine'
import ImageFiltersApp from '../../../react/image-filters/src/App'

export default function ImageFiltersPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <ImageFiltersApp />
    </PulseProvider>
  )
}
