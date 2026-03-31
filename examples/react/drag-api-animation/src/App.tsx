import { useRef, useEffect, useCallback } from 'react'
import { usePulse, useEmit } from '@pulse/react'
import {
  CardsChanged,
  DragStateChanged,
  DragPositionChanged,
  CardStatusesChanged,
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
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    padding: '32px 24px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  } as React.CSSProperties,
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: '#f1f5f9',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 6,
  } as React.CSSProperties,
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    maxWidth: 1100,
    margin: '0 auto',
  } as React.CSSProperties,
  column: (color: string) =>
    ({
      background: '#1e293b',
      borderRadius: 16,
      padding: 16,
      minHeight: 400,
      borderTop: `3px solid ${color}`,
    }) as React.CSSProperties,
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '0 4px',
  } as React.CSSProperties,
  columnTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
  } as React.CSSProperties,
  columnCount: (color: string) =>
    ({
      fontSize: 13,
      fontWeight: 600,
      color: color,
      background: `${color}22`,
      padding: '2px 10px',
      borderRadius: 12,
    }) as React.CSSProperties,
  card: (status: CardStatus, isDragging: boolean) => {
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
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.4 : 1,
      transition: 'border-color 0.3s, background 0.3s, opacity 0.15s',
      userSelect: 'none' as const,
    } as React.CSSProperties
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e8f0',
    margin: 0,
    marginBottom: 4,
  } as React.CSSProperties,
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0,
    marginBottom: 10,
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  priorityBadge: (priority: string) =>
    ({
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      color: PRIORITY_COLORS[priority] ?? '#94a3b8',
      background: `${PRIORITY_COLORS[priority] ?? '#94a3b8'}22`,
      padding: '2px 8px',
      borderRadius: 8,
    }) as React.CSSProperties,
  statusBadge: (status: CardStatus) => {
    const map: Record<CardStatus, { color: string; label: string }> = {
      idle: { color: '#64748b', label: '' },
      saving: { color: '#f59e0b', label: 'Saving...' },
      saved: { color: '#10b981', label: 'Saved' },
      error: { color: '#ef4444', label: 'Error - retrying' },
      settled: { color: '#64748b', label: '' },
    }
    const info = map[status]
    if (!info.label) return { display: 'none' } as React.CSSProperties
    return {
      fontSize: 11,
      fontWeight: 600,
      color: info.color,
    } as React.CSSProperties
  },
  undoBtn: {
    fontSize: 12,
    color: '#94a3b8',
    background: 'none',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '2px 8px',
    cursor: 'pointer',
    marginLeft: 8,
  } as React.CSSProperties,
  ghostCard: {
    position: 'fixed' as const,
    pointerEvents: 'none' as const,
    zIndex: 1000,
    width: 300,
    background: '#1e293b',
    border: '2px solid #4361ee',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  } as React.CSSProperties,
  dropZone: {
    minHeight: 60,
    border: '2px dashed transparent',
    borderRadius: 8,
    transition: 'border-color 0.2s, background 0.2s',
    background: 'transparent',
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// CardComponent
// ---------------------------------------------------------------------------

function KanbanCardComponent({ card }: { card: KanbanCard }) {
  const emit = useEmit()
  const drag = usePulse(DragStateChanged, null as ReturnType<typeof DragStateChanged['__type']> | null)
  const statuses = usePulse(CardStatusesChanged, {} as Record<string, CardStatus>)
  const cardRef = useRef<HTMLDivElement>(null)

  const status: CardStatus = statuses[card.id] ?? 'idle'
  const isDragging = drag?.cardId === card.id

  const statusLabels: Record<CardStatus, string> = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error - retrying',
    settled: '',
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      emit(DragStart, {
        cardId: card.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      })
    },
    [emit, card.id],
  )

  return (
    <div
      ref={cardRef}
      style={{
        ...styles.card(status, isDragging),
        animation:
          status === 'error'
            ? 'shake 0.5s ease-in-out'
            : status === 'saved'
              ? 'flashGreen 0.6s ease-out'
              : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <p style={styles.cardTitle}>{card.title}</p>
      <p style={styles.cardDesc}>{card.description}</p>
      <div style={styles.cardFooter}>
        <span style={styles.priorityBadge(card.priority)}>{card.priority}</span>
        <span>
          <span style={styles.statusBadge(status)}>{statusLabels[status]}</span>
          {(status === 'saved' || status === 'error') && (
            <button
              style={styles.undoBtn}
              onClick={(e) => {
                e.stopPropagation()
                emit(UndoRequested, card.id)
              }}
            >
              Undo
            </button>
          )}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ghost card
// ---------------------------------------------------------------------------

function GhostCard() {
  const drag = usePulse(DragStateChanged, null as any)
  const allCards = usePulse(CardsChanged, [] as KanbanCard[])
  const springPos = usePulse(DragPositionChanged, { x: 0, y: 0 })

  if (!drag) return null

  const card = allCards.find((c) => c.id === drag.cardId)
  if (!card) return null

  return (
    <div
      style={{
        ...styles.ghostCard,
        left: springPos.x - drag.offsetX,
        top: springPos.y - drag.offsetY,
      }}
    >
      <p style={styles.cardTitle}>{card.title}</p>
      <p style={styles.cardDesc}>{card.description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function Column({
  id,
  title,
  color,
}: {
  id: ColumnId
  title: string
  color: string
}) {
  const allCards = usePulse(CardsChanged, [] as KanbanCard[])
  const drag = usePulse(DragStateChanged, null as any)
  const emit = useEmit()

  const columnCards = allCards.filter((c) => c.column === id)
  const isDragging = drag !== null

  return (
    <div style={styles.column(color)}>
      <div style={styles.columnHeader}>
        <span style={styles.columnTitle}>{title}</span>
        <span style={styles.columnCount(color)}>{columnCards.length}</span>
      </div>
      {columnCards.map((card) => (
        <KanbanCardComponent key={card.id} card={card} />
      ))}
      {isDragging && (
        <div
          style={styles.dropZone}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4361ee'
            e.currentTarget.style.background = '#4361ee11'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
          }}
          onMouseUp={() => {
            if (drag) {
              const card = allCards.find((c) => c.id === drag.cardId)
              if (card && card.column !== id) {
                emit(CardMoved, {
                  cardId: drag.cardId,
                  fromColumn: card.column,
                  toColumn: id,
                })
              }
              emit(DragEnd, undefined)
            }
          }}
        >
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: '#475569',
              fontSize: 13,
            }}
          >
            Drop here
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const drag = usePulse(DragStateChanged, null as any)

  // Global mouse move/up handlers for drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (drag) {
        emit(DragMove, { x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      if (drag) {
        emit(DragEnd, undefined)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [drag, emit])

  return (
    <div style={styles.container}>
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

      <div style={styles.header}>
        <h1 style={styles.title}>Pulse Kanban</h1>
        <p style={styles.subtitle}>
          Drag cards between columns. Spring physics follow your mouse.
          Saves auto-retry on failure.
        </p>
      </div>

      <div style={styles.board}>
        {COLUMNS.map((col) => (
          <Column key={col.id} id={col.id} title={col.title} color={col.color} />
        ))}
      </div>

      <GhostCard />
    </div>
  )
}
