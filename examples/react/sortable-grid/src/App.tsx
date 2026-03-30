import { useSignal, useEmit } from '@pulse/react'
import { useCallback, useEffect, useRef } from 'react'
import {
  items,
  dragState,
  enteringIds,
  exitingIds,
  DragStart,
  DragMove,
  DragEnd,
  DragOver,
  ShuffleAll,
  AddItem,
  RemoveItem,
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      emit(DragStart, {
        index,
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      })
    },
    [emit, index],
  )

  const handleMouseEnter = useCallback(() => {
    emit(DragOver, { index })
  }, [emit, index])

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        boxShadow: isOver && !isDragging
          ? `0 0 0 3px ${item.color}60, 0 4px 16px rgba(0,0,0,0.2)`
          : '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
        userSelect: 'none',
        animation: isEntering ? 'pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
  const ds = useSignal(dragState)
  const itemList = useSignal(items)

  if (!ds.active || ds.dragIndex < 0 || ds.dragIndex >= itemList.length) return null

  const item = itemList[ds.dragIndex]

  return (
    <div
      style={{
        position: 'fixed',
        left: ds.currentX - ds.offsetX,
        top: ds.currentY - ds.offsetY,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grabbing',
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 0 2px ${item.color}`,
        transform: 'scale(1.08) rotate(2deg)',
        transition: 'transform 0.15s ease',
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
  const itemList = useSignal(items)
  const ds = useSignal(dragState)
  const entering = useSignal(enteringIds)
  const exiting = useSignal(exitingIds)

  // Global mouse move/up handlers for drag
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (ds.active) {
        emit(DragMove, { x: e.clientX, y: e.clientY })
      }
    }
    const handleUp = () => {
      if (ds.active) {
        emit(DragEnd, undefined)
      }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [ds.active, emit])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#f1f5f9',
          marginBottom: 8,
        }}
      >
        Sortable Grid
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
        Drag items to reorder. Items animate to new positions.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <button
          onClick={() => emit(ShuffleAll, undefined)}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: '1px solid #6366f140',
            background: '#6366f120',
            color: '#818cf8',
            fontSize: 14,
            fontWeight: 600,
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
            borderRadius: 10,
            border: '1px solid #22c55e40',
            background: '#22c55e20',
            color: '#4ade80',
            fontSize: 14,
            fontWeight: 600,
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
          gridTemplateColumns: `repeat(${COLUMNS}, ${ITEM_SIZE}px)`,
          gap: GAP,
        }}
      >
        {itemList.map((item, index) => (
          <GridCard
            key={item.id}
            item={item}
            index={index}
            isDragging={ds.active && ds.dragIndex === index}
            isOver={ds.active && ds.overIndex === index && ds.dragIndex !== index}
            isEntering={entering.has(item.id)}
            isExiting={exiting.has(item.id)}
          />
        ))}
      </div>

      {/* Drag ghost */}
      <DragGhost />

      {/* Item count */}
      <p style={{ color: '#475569', fontSize: 13, marginTop: 24 }}>
        {itemList.length} items
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
