import { onMount } from 'solid-js'
import { usePulse, useEmit } from '@pulse/solid'
import {
  ItemsChanged,
  DragStateChanged,
  EnteringIdsChanged,
  ExitingIdsChanged,
  DragStart,
  DragMove,
  DragEnd,
  DragOver,
  ShuffleAll,
  AddItem,
  RemoveItem,
  type GridItem,
  type DragState,
} from './engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS = 4
const ITEM_SIZE = 120
const GAP = 12

// ---------------------------------------------------------------------------
// GridCard
// ---------------------------------------------------------------------------

function GridCard({
  item,
  index,
  isDragging,
  isOver,
  isEntering,
  isExiting,
}: {
  item: { id: string; color: string; label: string }
  index: number
  isDragging: boolean
  isOver: boolean
  isEntering: boolean
  isExiting: boolean
}) {
  const emit = useEmit()

  const handleMouseDown = 
    (e: MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      emit(DragStart, {
        index,
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      })
    }
  const handleMouseEnter = () => {
    emit(DragOver, { index })
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        'border-radius': 16,
        background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : isExiting ? 0 : 1,
        transform: isOver && !isDragging
          ? 'scale(0.92)'
          : isEntering
            ? 'scale(1)'
            : isExiting
              ? 'scale(0.5)'
              : 'scale(1)',
        transition: isDragging
          ? 'none'
          : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
        'box-shadow': isOver && !isDragging
          ? `0 0 0 3px ${item.color}60, 0 4px 16px rgba(0,0,0,0.2)`
          : '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
        'user-select': 'none',
        animation: isEntering ? 'pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
      }}
    >
      <span
        style={{
          'font-size': 28,
          'font-weight': 800,
          color: 'rgba(255,255,255,0.9)',
          'text-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {item.label}
      </span>

      {/* Remove button on hover (using CSS :hover via wrapper) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          emit(RemoveItem, index)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          'border-radius': '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(255,255,255,0.8)',
          'font-size': 12,
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
        className="remove-btn"
      >
        \u2715
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DragGhost
// ---------------------------------------------------------------------------

function DragGhost() {
  const ds = usePulse(DragStateChanged, { active: false, dragIndex: -1, overIndex: -1, startX: 0, startY: 0, currentX: 0, currentY: 0, offsetX: 0, offsetY: 0 } as DragState)
  const itemList = usePulse(ItemsChanged, [] as GridItem[])

  if (!ds().active || ds().dragIndex < 0 || ds().dragIndex >= itemList().length) return null

  const item = itemList()[ds().dragIndex]

  return (
    <div
      style={{
        position: 'fixed',
        left: ds.currentX - ds().offsetX,
        top: ds.currentY - ds().offsetY,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        'border-radius': 16,
        background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        cursor: 'grabbing',
        'z-index': 9999,
        'pointer-events': 'none',
        'box-shadow': `0 16px 40px rgba(0,0,0,0.35), 0 0 0 2px ${item.color}`,
        transform: 'scale(1.08) rotate(2deg)',
        transition: 'transform 0.15s ease',
      }}
    >
      <span
        style={{
          'font-size': 28,
          'font-weight': 800,
          color: 'rgba(255,255,255,0.9)',
          'text-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {item.label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const itemList = usePulse(ItemsChanged, [] as GridItem[])
  const ds = usePulse(DragStateChanged, { active: false, dragIndex: -1, overIndex: -1, startX: 0, startY: 0, currentX: 0, currentY: 0, offsetX: 0, offsetY: 0 } as DragState)
  const entering = usePulse(EnteringIdsChanged, new Set<string>())
  const exiting = usePulse(ExitingIdsChanged, new Set<string>())

  // Global mouse move/up handlers for drag
  onMount(() => {
    const handleMove = (e: MouseEvent) => {
      if (ds().active) {
        emit(DragMove, { x: e.clientX, y: e.clientY })
      }
    }
    const handleUp = () => {
      if (ds().active) {
        emit(DragEnd, undefined)
      }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  })

  return (
    <div
      style={{
        'min-height': '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'font-family':
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 40,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
      }}
    >
      <h1
        style={{
          'font-size': 32,
          'font-weight': 800,
          color: '#f1f5f9',
          'margin-bottom': 8,
        }}
      >
        Sortable Grid
      </h1>
      <p style={{ color: '#64748b', 'font-size': 14, 'margin-bottom': 32 }}>
        Drag items to reorder. Items animate to new positions.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, 'margin-bottom': 32 }}>
        <button
          onClick={() => emit(ShuffleAll, undefined)}
          style={{
            padding: '10px 24px',
            'border-radius': 10,
            border: '1px solid #6366f140',
            background: '#6366f120',
            color: '#818cf8',
            'font-size': 14,
            'font-weight': 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6366f135'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6366f120'
          }}
        >
          Shuffle All
        </button>
        <button
          onClick={() => emit(AddItem, undefined)}
          style={{
            padding: '10px 24px',
            'border-radius': 10,
            border: '1px solid #22c55e40',
            background: '#22c55e20',
            color: '#4ade80',
            'font-size': 14,
            'font-weight': 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#22c55e35'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#22c55e20'
          }}
        >
          Add Item
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': `repeat(${COLUMNS}, ${ITEM_SIZE}px)`,
          gap: GAP,
        }}
      >
        {itemList().map((item, index) => (
          <GridCard
            item={item}
            index={index}
            isDragging={ds().active && ds().dragIndex === index}
            isOver={ds().active && ds().overIndex === index && ds().dragIndex !== index}
            isEntering={entering().has(item.id)}
            isExiting={exiting().has(item.id)}
          />
        ))}
      </div>

      {/* Drag ghost */}
      <DragGhost />

      {/* Item count */}
      <p style={{ color: '#475569', 'font-size': 13, 'margin-top': 24 }}>
        {itemList().length} items
      </p>

      <style>{`
        @keyframes pop-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .remove-btn { opacity: 0 !important; }
        div:hover > .remove-btn { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
