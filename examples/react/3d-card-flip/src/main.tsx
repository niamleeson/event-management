import { createRoot } from 'react-dom/client'
import { PulseProvider } from '@pulse/react'
import { engine } from './engine'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <PulseProvider engine={engine}>
    <App />
  </PulseProvider>,
)
