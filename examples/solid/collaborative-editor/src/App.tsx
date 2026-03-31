import { usePulse, useEmit } from '@pulse/solid'
import {
  DocumentChanged,
  ActiveUsersChanged,
  EditHistoryChanged,
  HasConflictChanged,
  LocalEdit,
  CursorMoved,
  allUsers,
  type EditHistoryEntry,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f5f5f5',
  },
  mainPanel: {
    flex: 1,
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '12px 20px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
  },
  headerTitle: {
    'font-size': 18,
    'font-weight': 700,
  },
  presenceRow: {
    display: 'flex',
    gap: 8,
    'align-items': 'center',
  },
  avatar: (color: string, isOnline: boolean) => ({
    width: 32,
    height: 32,
    'border-radius': '50%',
    background: color,
    color: '#fff',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'font-size': 13,
    'font-weight': 700,
    position: 'relative' as const,
    border: `2px solid ${isOnline ? '#4caf50' : '#666'}`,
    opacity: isOnline ? 1 : 0.5,
  }),
  onlineDot: {
    position: 'absolute' as const,
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    'border-radius': '50%',
    background: '#4caf50',
    border: '2px solid #1a1a2e',
  },
  conflictBanner: {
    background: '#ff9800',
    color: '#fff',
    padding: '6px 20px',
    'font-size': 13,
    'font-weight': 600,
    'text-align': 'center' as const,
    animation: 'conflictPulse 1s ease-in-out',
  },
  editorArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'auto' as const,
    padding: 20,
  },
  textarea: {
    width: '100%',
    height: '100%',
    padding: 16,
    'font-size': 15,
    'line-height': 1.6,
    'font-family': '"SF Mono", "Fira Code", Consolas, monospace',
    border: '1px solid #ddd',
    'border-radius': 8,
    resize: 'none' as const,
    outline: 'none',
    background: '#fff',
    'box-sizing': 'border-box' as const,
    'box-shadow': '0 1px 4px rgba(0,0,0,0.06)',
  },
  cursorOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    'pointer-events': 'none' as const,
    overflow: 'hidden',
  },
  remoteCursor: (color: string, top: number, left: number) => ({
    position: 'absolute' as const,
    top,
    left,
    width: 2,
    height: 20,
    background: color,
    transition: 'top 0.3s ease-out, left 0.3s ease-out',
    'z-index': 10,
  }),
  cursorLabel: (color: string) => ({
    position: 'absolute' as const,
    top: -18,
    left: -2,
    background: color,
    color: '#fff',
    'font-size': 10,
    'font-weight': 600,
    padding: '1px 6px',
    'border-radius': '3px 3px 3px 0',
    'white-space': 'nowrap' as const,
  }),
  sidebar: {
    width: 280,
    background: '#fff',
    'border-left': '1px solid #e0e0e0',
    display: 'flex',
    'flex-direction': 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '14px 16px',
    'font-size': 13,
    'font-weight': 700,
    'text-transform': 'uppercase' as const,
    'letter-spacing': 1,
    color: '#888',
    'border-bottom': '1px solid #eee',
  },
  historyList: {
    flex: 1,
    'overflow-y': 'auto' as const,
    padding: 0,
  },
  historyItem: {
    padding: '10px 16px',
    'border-bottom': '1px solid #f0f0f0',
    'font-size': 13,
  },
  historyUser: (color: string) => ({
    'font-weight': 600,
    color,
    'margin-right': 4,
  }),
  historyAction: {
    color: '#666',
  },
  historyText: {
    'font-family': 'monospace',
    background: '#f5f5f5',
    padding: '1px 4px',
    'border-radius': 3,
    'font-size': 12,
    color: '#333',
  },
  historyTime: {
    'font-size': 11,
    color: '#bbb',
    'margin-top': 2,
  },
  docStats: {
    padding: '8px 16px',
    'border-top': '1px solid #eee',
    'font-size': 12,
    color: '#999',
    background: '#fafafa',
  },
}

const globalStyle = `
body { margin: 0; }
@keyframes conflictPulse {
  0% { opacity: 0; transform: translateY(-100%); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUserColor(userId: string): string {
  return allUsers.find(u => u.id === userId)?.color ?? '#999'
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PresenceIndicators() {
  const users = usePulse(ActiveUsersChanged, allUsers)

  return (
    <div style={styles.presenceRow}>
      {users().map(user => (
        <div
          style={styles.avatar(user.color, true)}
          title={user.name}
        >
          {user.avatar}
          <div style={styles.onlineDot} />
        </div>
      ))}
    </div>
  )
}

function ConflictBanner() {
  const conflict = usePulse(HasConflictChanged, false)

  if (!conflict()) return null

  return (
    <div style={styles.conflictBanner}>
      Edit conflict() detected near your cursor -- auto-resolving...
    </div>
  )
}

function Editor() {
  const emit = useEmit()
  const doc = usePulse(DocumentChanged, "")
  const cursorMap = usePulse(CursorsChanged, new Map<string, number>())
  let textareaRef = null

  const handleInput = (e: Event) => {
    const textarea = e.currentTarget
    const newValue = textarea.value
    const cursorPos = textarea.selectionStart

    const oldValue = doc()
    if (newValue.length > oldValue.length) {
      // Insert
      const insertedLen = newValue.length - oldValue.length
      const insertPos = cursorPos - insertedLen
      const insertedText = newValue.slice(insertPos, cursorPos)
      emit(LocalEdit, { pos: insertPos, text: insertedText, type: 'insert' })
    } else if (newValue.length < oldValue.length) {
      // Delete
      const deletedLen = oldValue.length - newValue.length
      const deletePos = cursorPos + deletedLen
      const deletedText = oldValue.slice(cursorPos, deletePos)
      emit(LocalEdit, { pos: deletePos, text: deletedText, type: 'delete' })
    }
  }

  const handleSelect = () => {
    if (textareaRef) {
      const pos = textareaRef.selectionStart
      emit(CursorMoved, { user: 'local', pos })
      if (target) target.set(pos)
    }
  }

  // Calculate approximate cursor positions for remote users()
  const remoteCursors = allUsers
    .filter(u => u.id !== 'local')
    .map(user => {
      const pos = cursorMap().get(user.id) ?? 0
      // Approximate position: ~8px per char, ~20px per line
      const textBefore = doc().slice(0, pos)
      const lines = textBefore.split('\n')
      const lineNum = lines.length - 1
      const colNum = lines[lines.length - 1]?.length ?? 0
      const top = 20 + lineNum * 24 + 16
      const left = 20 + colNum * 8.4 + 16
      return { user, top, left }
    })

  return (
    <div style={styles.editorArea}>
      <textarea
        ref={textareaRef}
        style={styles.textarea}
        value={doc}
        onChange={handleInput}
        onSelect={handleSelect}
        spellCheck={false}
      />
      <div style={styles.cursorOverlay}>
        {remoteCursors.map(({ user, top, left }) => (
          <div style={styles.remoteCursor(user.color, top, left)}>
            <div style={styles.cursorLabel(user.color)}>{user.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryPanel() {
  const history = usePulse(EditHistoryChanged, [] as EditHistoryEntry[])
  const doc = usePulse(DocumentChanged, "")

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>Edit History</div>
      <div style={styles.historyList}>
        {history().length === 0 ? (
          <div style={{ padding: 16, color: '#bbb', 'font-size': 13 }}>
            No edits yet. Start typing!
          </div>
        ) : (
          history().map((entry: EditHistoryEntry) => (
            <div style={styles.historyItem}>
              <div>
                <span style={styles.historyUser(getUserColor(
                  allUsers.find(u => u.name === entry.user)?.id ?? 'local'
                ))}>
                  {entry.user}
                </span>
                <span style={styles.historyAction}>
                  {entry.type === 'insert' ? ' inserted ' : ' deleted '}
                </span>
                <span style={styles.historyText}>
                  {entry.text.replace(/\n/g, '\\n')}
                </span>
              </div>
              <div style={styles.historyTime}>
                at position {entry.pos} - {timeAgo(entry.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
      <div style={styles.docStats}>
        {doc().length} characters | {doc().split('\n').length} lines
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
      <style>{globalStyle}</style>
      <div style={styles.container}>
        <div style={styles.mainPanel}>
          <div style={styles.header}>
            <div style={styles.headerTitle}>Pulse Collaborative Editor</div>
            <PresenceIndicators />
          </div>
          <ConflictBanner />
          <Editor />
        </div>
        <HistoryPanel />
      </div>
    </>
  )
}
