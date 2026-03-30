import { For, Show, createMemo, createEffect, onCleanup } from 'solid-js'
import { useSignal, useSpring, useEmit } from '@pulse/solid'
import {
  cards,
  dragState,
  cardStatuses,
  dragSpringX,
  dragSpringY,
  DragStart,
  DragMove,
  DragEnd,
  CardMoved,
  UndoRequested,
  type KanbanCard,
  type ColumnId,
  type CardStatus,
} from './engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: '#4361ee' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function cardStyle(status: CardStatus, isDragging: boolean) {
  let borderColor = '#334155'
  let bg = '#0f172a'
  if (status === 'saving') {
    borderColor = '#f59e0b'
  } else if (status === 'saved') {
    borderColor = '#10b981'
    bg = '#10b98108'
  } else if (status === 'error') {
    borderColor = '#ef4444'
    bg = '#ef444408'
  }
  return {
    background: bg,
    border: `2px solid ${borderColor}`,
    'border-radius': '12px',
    padding: '16px',
    'margin-bottom': '10px',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? '0.4' : '1',
    transition: 'border-color 0.3s, background 0.3s, opacity 0.15s',
    'user-select': 'none',
  }
}

function statusBadgeStyle(status: CardStatus) {
  const map: Record<CardStatus, { color: string; label: string }> = {
    idle: { color: '#64748b', label: '' },
    saving: { color: '#f59e0b', label: 'Saving...' },
    saved: { color: '#10b981', label: 'Saved' },
    error: { color: '#ef4444', label: 'Error - retrying' },
    settled: { color: '#64748b', label: '' },
  }
  const info = map[status]
  if (!info.label) return { display: 'none' }
  return {
    'font-size': '11px',
    'font-weight': '600',
    color: info.color,
  }
}

function statusLabel(status: CardStatus): string {
  const labels: Record<CardStatus, string> = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error - retrying',
    settled: '',
  }
  return labels[status]
}

// ---------------------------------------------------------------------------
// KanbanCardComponent
// ---------------------------------------------------------------------------

function KanbanCardComponent(props: { card: KanbanCard }) {
  const emit = useEmit()
  const drag = useSignal(dragState)
  const statuses = useSignal(cardStatuses)

  const status = createMemo(() => (statuses()[props.card.id] ?? 'idle') as CardStatus)
  const isDragging = createMemo(() => drag()?.cardId === props.card.id)

  let cardRef: HTMLDivElement | undefined

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    const rect = cardRef?.getBoundingClientRect()
    if (!rect) return
    emit(DragStart, {
      cardId: props.card.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={cardRef}
      style={{
        ...cardStyle(status(), isDragging()),
        animation:
          status() === 'error'
            ? 'shake 0.5s ease-in-out'
            : status() === 'saved'
              ? 'flashGreen 0.6s ease-out'
              : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <p
        style={{
          'font-size': '15px',
          'font-weight': '600',
          color: '#e2e8f0',
          margin: '0',
          'margin-bottom': '4px',
        }}
      >
        {props.card.title}
      </p>
      <p
        style={{
          'font-size': '13px',
          color: '#94a3b8',
          margin: '0',
          'margin-bottom': '10px',
        }}
      >
        {props.card.description}
      </p>
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        }}
      >
        <span
          style={{
            'font-size': '11px',
            'font-weight': '600',
            'text-transform': 'uppercase',
            color: PRIORITY_COLORS[props.card.priority] ?? '#94a3b8',
            background: `${PRIORITY_COLORS[props.card.priority] ?? '#94a3b8'}22`,
            padding: '2px 8px',
            'border-radius': '8px',
          }}
        >
          {props.card.priority}
        </span>
        <span>
          <span style={statusBadgeStyle(status())}>
            {statusLabel(status())}
          </span>
          <Show when={status() === 'saved' || status() === 'error'}>
            <button
              style={{
                'font-size': '12px',
                color: '#94a3b8',
                background: 'none',
                border: '1px solid #334155',
                'border-radius': '6px',
                padding: '2px 8px',
                cursor: 'pointer',
                'margin-left': '8px',
              }}
              onClick={(e) => {
                e.stopPropagation()
                emit(UndoRequested, props.card.id)
              }}
            >
              Undo
            </button>
          </Show>
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ghost card (follows mouse during drag via spring)
// ---------------------------------------------------------------------------

function GhostCard() {
  const drag = useSignal(dragState)
  const allCards = useSignal(cards)
  const springX = useSpring(dragSpringX)
  const springY = useSpring(dragSpringY)

  return (
    <Show when={drag()}>
      {(d) => {
        const card = createMemo(() => allCards().find((c) => c.id === d().cardId))
        return (
          <Show when={card()}>
            {(c) => (
              <div
                style={{
                  position: 'fixed',
                  'pointer-events': 'none',
                  'z-index': '1000',
                  width: '300px',
                  background: '#1e293b',
                  border: '2px solid #4361ee',
                  'border-radius': '12px',
                  padding: '16px',
                  'box-shadow': '0 20px 40px rgba(0,0,0,0.5)',
                  left: `${springX() - d().offsetX}px`,
                  top: `${springY() - d().offsetY}px`,
                }}
              >
                <p
                  style={{
                    'font-size': '15px',
                    'font-weight': '600',
                    color: '#e2e8f0',
                    margin: '0',
                    'margin-bottom': '4px',
                  }}
                >
                  {c().title}
                </p>
                <p
                  style={{
                    'font-size': '13px',
                    color: '#94a3b8',
                    margin: '0',
                  }}
                >
                  {c().description}
                </p>
              </div>
            )}
          </Show>
        )
      }}
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function Column(props: { id: ColumnId; title: string; color: string }) {
  const allCards = useSignal(cards)
  const drag = useSignal(dragState)
  const emit = useEmit()

  const columnCards = createMemo(() => allCards().filter((c) => c.column === props.id))
  const isDragging = createMemo(() => drag() !== null)

  return (
    <div
      style={{
        background: '#1e293b',
        'border-radius': '16px',
        padding: '16px',
        'min-height': '400px',
        'border-top': `3px solid ${props.color}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '16px',
          padding: '0 4px',
        }}
      >
        <span
          style={{
            'font-size': '16px',
            'font-weight': '700',
            color: '#e2e8f0',
          }}
        >
          {props.title}
        </span>
        <span
          style={{
            'font-size': '13px',
            'font-weight': '600',
            color: props.color,
            background: `${props.color}22`,
            padding: '2px 10px',
            'border-radius': '12px',
          }}
        >
          {columnCards().length}
        </span>
      </div>
      <For each={columnCards()}>
        {(card) => <KanbanCardComponent card={card} />}
      </For>
      <Show when={isDragging()}>
        <div
          style={{
            'min-height': '60px',
            border: '2px dashed transparent',
            'border-radius': '8px',
            transition: 'border-color 0.2s, background 0.2s',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4361ee'
            e.currentTarget.style.background = '#4361ee11'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
          }}
          onMouseUp={() => {
            const d = drag()
            if (d) {
              const card = allCards().find((c) => c.id === d.cardId)
              if (card && card.column !== props.id) {
                emit(CardMoved, {
                  cardId: d.cardId,
                  fromColumn: card.column,
                  toColumn: props.id,
                })
              }
              emit(DragEnd, undefined)
            }
          }}
        >
          <div
            style={{
              padding: '20px',
              'text-align': 'center',
              color: '#475569',
              'font-size': '13px',
            }}
          >
            Drop here
          </div>
        </div>
      </Show>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const drag = useSignal(dragState)

  // Global mouse move/up handlers for drag
  createEffect(() => {
    const currentDrag = drag()

    const handleMouseMove = (e: MouseEvent) => {
      if (currentDrag) {
        emit(DragMove, { x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      if (currentDrag) {
        emit(DragEnd, undefined)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    onCleanup(() => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    })
  })

  return (
    <div
      style={{
        'min-height': '100vh',
        background: '#0f172a',
        padding: '32px 24px',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes flashGreen {
          0% { background: #10b98122; }
          100% { background: #0f172a; }
        }
      `}</style>

      <div style={{ 'text-align': 'center', 'margin-bottom': '32px' }}>
        <h1
          style={{
            'font-size': '36px',
            'font-weight': '800',
            color: '#f1f5f9',
            margin: '0',
          }}
        >
          Pulse Kanban
        </h1>
        <p
          style={{
            color: '#94a3b8',
            'font-size': '14px',
            'margin-top': '6px',
          }}
        >
          Drag cards between columns. Spring physics follow your mouse.
          Saves auto-retry on failure.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(3, 1fr)',
          gap: '20px',
          'max-width': '1100px',
          margin: '0 auto',
        }}
      >
        <For each={COLUMNS}>
          {(col) => <Column id={col.id} title={col.title} color={col.color} />}
        </For>
      </div>

      <GhostCard />

      <div
        style={{
          'text-align': 'center',
          'margin-top': '32px',
          padding: '16px',
          background: '#1e293b',
          'border-radius': '12px',
          'max-width': '500px',
          margin: '32px auto 0',
        }}
      >
        <p
          style={{
            color: '#94a3b8',
            'font-size': '13px',
          }}
        >
          This example integrates with{' '}
          <code
            style={{
              color: '#4361ee',
              'font-family': 'monospace',
              'font-size': '12px',
            }}
          >
            @pulse/devtools
          </code>
          . Import and connect to visualize event flow, signals, and the DAG in
          real-time.
        </p>
        <p
          style={{
            color: '#94a3b8',
            'font-size': '13px',
            'margin-top': '8px',
          }}
        >
          <code
            style={{
              color: '#4361ee',
              'font-family': 'monospace',
              'font-size': '12px',
            }}
          >
            {`import { connectDevtools } from '@pulse/devtools'`}
          </code>
        </p>
      </div>
    </div>
  )
}
