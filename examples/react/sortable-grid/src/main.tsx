import React from 'react'
import ReactDOM from 'react-dom/client'
import { PulseProvider } from '@pulse/react'
import { engine } from './engine'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PulseProvider engine={engine}>
      <App />
    </PulseProvider>
  </React.StrictMode>,
)
