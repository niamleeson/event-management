import { For, Show, onMount, onCleanup } from 'solid-js'
import { useSignal, useEmit, useSpring } from '@pulse/solid'
import type { Signal, SpringValue } from '@pulse/core'
import { engine } from './engine'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Cursor { userId: string; name: string; color: string; x: number; y: number; line: number; col: number }
interface Edit { userId: string; text: string; position: number; timestamp: number; type: 'insert' | 'delete' }

/* ------------------------------------------------------------------ */
/*  Bot config                                                        */
/* ------------------------------------------------------------------ */

const BOTS = [
  { id: 'bot-alice', name: 'Alice', color: '#6c5ce7', phrases: ['Hello world!', 'function foo() {}', 'const x = 42;', '// TODO: fix this', 'return result;'] },
  { id: 'bot-bob', name: 'Bob', color: '#00b894', phrases: ['import React from "react"', 'console.log("debug")', 'if (valid) {', 'export default App', '  await fetch(url)'] },
]

/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */

const LocalEdit = engine.event<string>('LocalEdit')
const RemoteEdit = engine.event<Edit>('RemoteEdit')
const CursorMoved = engine.event<Cursor>('CursorMoved')
const SelectionChanged = engine.event<{ line: number; col: number }>('SelectionChanged')

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

const documentText = engine.signal<string>(LocalEdit, '// Collaborative Editor\n// Start typing below...\n\n', (_prev, text) => text)
engine.signalUpdate(documentText, RemoteEdit, (prev, edit) => {
  if (edit.type === 'insert') {
    return prev.slice(0, edit.position) + edit.text + prev.slice(edit.position)
  }
  return prev.slice(0, edit.position) + prev.slice(edit.position + edit.text.length)
})

const cursors = engine.signal<Cursor[]>(CursorMoved, [], (prev, cursor) => {
  const idx = prev.findIndex(c => c.userId === cursor.userId)
  if (idx >= 0) { const next = [...prev]; next[idx] = cursor; return next }
  return [...prev, cursor]
})

const editHistory = engine.signal<Edit[]>(RemoteEdit, [], (prev, edit) => [...prev.slice(-50), edit])
engine.signalUpdate(editHistory, LocalEdit, (prev) => [...prev.slice(-50), { userId: 'local', text: '', position: 0, timestamp: Date.now(), type: 'insert' as const }])

const localCursor = engine.signal<{ line: number; col: number }>(SelectionChanged, { line: 0, col: 0 }, (_prev, pos) => pos)

// Spring cursors for bots
const botCursorXTargets: Signal<number>[] = []
const botCursorYTargets: Signal<number>[] = []
const botCursorXSprings: SpringValue[] = []
const botCursorYSprings: SpringValue[] = []

for (const bot of BOTS) {
  const xt = engine.signal(CursorMoved, 100, (prev, c) => c.userId === bot.id ? c.x : prev)
  const yt = engine.signal(CursorMoved, 100, (prev, c) => c.userId === bot.id ? c.y : prev)
  botCursorXTargets.push(xt)
  botCursorYTargets.push(yt)
  botCursorXSprings.push(engine.spring(xt, { stiffness: 150, damping: 18 }))
  botCursorYSprings.push(engine.spring(yt, { stiffness: 150, damping: 18 }))
}

/* ------------------------------------------------------------------ */
/*  Bot simulation                                                    */
/* ------------------------------------------------------------------ */

function startBotSimulation() {
  const intervals: number[] = []
  BOTS.forEach((bot, idx) => {
    let charIdx = 0
    const interval = setInterval(() => {
      const phrase = bot.phrases[Math.floor(Math.random() * bot.phrases.length)]
      const text = documentText.value
      const lines = text.split('\n')
      const targetLine = Math.min(3 + idx * 2, lines.length)
      let position = 0
      for (let i = 0; i < targetLine && i < lines.length; i++) position += lines[i].length + 1

      const edit: Edit = {
        userId: bot.id,
        text: phrase[charIdx % phrase.length],
        position: Math.min(position + charIdx, text.length),
        timestamp: Date.now(),
        type: 'insert',
      }
      engine.emit(RemoteEdit, edit)

      // Move cursor
      const lineLen = lines[targetLine]?.length ?? 0
      engine.emit(CursorMoved, {
        userId: bot.id, name: bot.name, color: bot.color,
        x: 80 + (charIdx % 40) * 8, y: 60 + targetLine * 22,
        line: targetLine, col: charIdx % 40,
      })

      charIdx++
      if (charIdx > 60) charIdx = 0
    }, 1500 + Math.random() * 2000) as unknown as number
    intervals.push(interval)
  })
  return () => intervals.forEach(clearInterval)
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function BotCursor(props: { index: number; bot: typeof BOTS[0] }) {
  const x = useSpring(botCursorXSprings[props.index])
  const y = useSpring(botCursorYSprings[props.index])

  return (
    <div style={{
      position: 'absolute', left: `${x()}px`, top: `${y()}px`,
      'pointer-events': 'none', 'z-index': '10', transition: 'opacity 0.3s',
    }}>
      <div style={{
        width: '2px', height: '18px', background: props.bot.color,
        'box-shadow': `0 0 4px ${props.bot.color}`,
      }} />
      <div style={{
        background: props.bot.color, color: '#fff', 'font-size': '10px',
        padding: '1px 6px', 'border-radius': '3px', 'white-space': 'nowrap',
        'margin-top': '2px',
      }}>{props.bot.name}</div>
    </div>
  )
}

function HistoryPanel() {
  const history = useSignal(editHistory)

  return (
    <div style={{
      width: '250px', background: '#fff', 'border-left': '1px solid #e0e0e0',
      padding: '16px', overflow: 'auto',
    }}>
      <h3 style={{ 'font-size': '13px', 'font-weight': '600', color: '#333', 'margin-bottom': '12px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }}>
        Edit History
      </h3>
      <For each={history().slice(-20).reverse()}>
        {(edit) => {
          const bot = BOTS.find(b => b.id === edit.userId)
          return (
            <div style={{
              padding: '6px 8px', 'border-left': `2px solid ${bot?.color ?? '#4361ee'}`,
              'margin-bottom': '4px', 'font-size': '11px',
            }}>
              <div style={{ color: bot?.color ?? '#4361ee', 'font-weight': '600' }}>{bot?.name ?? 'You'}</div>
              <div style={{ color: '#666', 'font-family': 'monospace' }}>
                {edit.type === 'insert' ? '+' : '-'} "{edit.text.slice(0, 20)}"
              </div>
              <div style={{ color: '#aaa', 'font-size': '10px' }}>
                {new Date(edit.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )
        }}
      </For>
    </div>
  )
}

export default function App() {
  const emit = useEmit()
  const text = useSignal(documentText)
  const allCursors = useSignal(cursors)

  onMount(() => {
    const cleanup = startBotSimulation()
    onCleanup(cleanup)
  })

  return (
    <div style={{ height: '100vh', display: 'flex', 'flex-direction': 'column', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '12px 24px', 'border-bottom': '1px solid #e0e0e0', display: 'flex', 'align-items': 'center', gap: '16px' }}>
        <h1 style={{ 'font-size': '18px', 'font-weight': '600', color: '#333', margin: '0' }}>Collaborative Editor</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <For each={BOTS}>
            {(bot) => (
              <div style={{
                display: 'flex', 'align-items': 'center', gap: '4px', padding: '2px 8px',
                'border-radius': '10px', background: bot.color + '22', 'font-size': '11px', color: bot.color,
              }}>
                <div style={{ width: '6px', height: '6px', 'border-radius': '50%', background: bot.color }} />
                {bot.name}
              </div>
            )}
          </For>
          <div style={{
            display: 'flex', 'align-items': 'center', gap: '4px', padding: '2px 8px',
            'border-radius': '10px', background: '#4361ee22', 'font-size': '11px', color: '#4361ee',
          }}>
            <div style={{ width: '6px', height: '6px', 'border-radius': '50%', background: '#4361ee' }} />
            You
          </div>
        </div>
      </div>

      {/* Editor + History */}
      <div style={{ flex: '1', display: 'flex', overflow: 'hidden' }}>
        {/* Editor area */}
        <div style={{ flex: '1', position: 'relative', background: '#fafafa' }}>
          {/* Line numbers */}
          <div style={{
            position: 'absolute', left: '0', top: '0', bottom: '0', width: '48px',
            background: '#f0f0f0', 'border-right': '1px solid #ddd', padding: '16px 0',
            'font-family': 'Consolas, monospace', 'font-size': '13px', color: '#999',
            'line-height': '22px', 'text-align': 'right', 'padding-right': '12px',
            'user-select': 'none',
          }}>
            <For each={text().split('\n')}>
              {(_, i) => <div>{i() + 1}</div>}
            </For>
          </div>

          {/* Bot cursors */}
          <For each={BOTS}>
            {(bot, i) => <BotCursor index={i()} bot={bot} />}
          </For>

          {/* Textarea */}
          <textarea
            value={text()}
            onInput={(e) => emit(LocalEdit, e.currentTarget.value)}
            onClick={(e) => {
              const ta = e.currentTarget
              const lines = ta.value.slice(0, ta.selectionStart).split('\n')
              emit(SelectionChanged, { line: lines.length - 1, col: lines[lines.length - 1].length })
            }}
            style={{
              position: 'absolute', left: '48px', top: '0', right: '0', bottom: '0',
              padding: '16px', 'font-family': 'Consolas, monospace', 'font-size': '13px',
              'line-height': '22px', border: 'none', background: 'transparent',
              resize: 'none', outline: 'none', color: '#333',
            }}
          />

          {/* Conflict markers overlay */}
          <Show when={allCursors().length > 0}>
            <div style={{
              position: 'absolute', bottom: '8px', left: '56px', 'font-size': '11px', color: '#999',
            }}>
              {allCursors().length} active cursor(s)
            </div>
          </Show>
        </div>

        <HistoryPanel />
      </div>
    </div>
  )
}
