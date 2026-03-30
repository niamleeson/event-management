import { useEffect } from 'react'
import { PulseProvider } from '@pulse/react'
import { engine } from '../../../react/todo-list/src/engine'
import TodoListApp from '../../../react/todo-list/src/App'

export default function TodoListPage() {
  useEffect(() => {
    ;(window as any).__pulseEngine = engine
    return () => { ;(window as any).__pulseEngine = null }
  }, [])

  return (
    <PulseProvider engine={engine}>
      <TodoListApp />
    </PulseProvider>
  )
}
