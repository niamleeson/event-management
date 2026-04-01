import { render } from 'solid-js/web'
import { PulseProvider } from '@pulse/solid'
import { engine, startLoop } from './engine'
import App from './App'

render(
  () => (
    <PulseProvider engine={engine}>
      <App />
    </PulseProvider>
  ),
  document.getElementById('root')!,
)

startLoop()
