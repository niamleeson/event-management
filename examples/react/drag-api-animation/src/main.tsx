import React from 'react'
import ReactDOM from 'react-dom/client'
import { PulseProvider } from '@pulse/react'
import { engine } from './engine'
import App from './App'

// Devtools integration hint:
// import { connectDevtools } from '@pulse/devtools'
// connectDevtools(engine)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PulseProvider engine={engine}>
      <App />
    </PulseProvider>
  </React.StrictMode>,
)
