import React from 'react'
import ReactDOM from 'react-dom/client'
import { startLoop } from './engine'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
startLoop()
