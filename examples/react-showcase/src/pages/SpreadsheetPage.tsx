import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/spreadsheet/src/engine'
import SpreadsheetApp from '../../../react/spreadsheet/src/App'

export default function SpreadsheetPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <SpreadsheetApp />
    </PulseProvider>
  )
}
