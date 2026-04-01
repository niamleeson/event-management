import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types — events are nodes, rules are edges
// ---------------------------------------------------------------------------

interface EventNode {
  name: string       // display name (stripped suffix)
  fullName: string   // full name with #N suffix (for matching onEmit)
  layer: number
  x: number
  y: number
  isInput: boolean   // true if no rule outputs this event (external input)
  isTerminal: boolean // true if no rule consumes this event downstream
}

interface RuleEdge {
  from: string // source event fullName
  to: string   // target event fullName
  ruleName: string
}

interface Props {
  engine: any | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_W = 160
const NODE_H = 36
const LAYER_GAP = 200
const NODE_GAP = 52
const PAD_X = 40
const PAD_Y = 30

const INPUT_BG = 'rgba(67,97,238,0.12)'
const INPUT_BORDER = '#4361ee'
const MID_BG = 'rgba(139,92,246,0.10)'
const MID_BORDER = '#8b5cf6'
const TERMINAL_BG = 'rgba(34,197,94,0.10)'
const TERMINAL_BORDER = '#22c55e'
const EDGE_DIM = '#334155'
const LABEL_COLOR = '#c9d1d9'
const EDGE_LABEL_COLOR = '#475569'

function stripSuffix(name: string): string {
  const idx = name.lastIndexOf('#')
  return idx >= 0 ? name.slice(0, idx) : name
}

// ---------------------------------------------------------------------------
// Build event-centric layout from engine DAG
// ---------------------------------------------------------------------------

function buildLayout(engine: any): { nodes: EventNode[]; edges: RuleEdge[] } {
  const dag = engine.getDAG()
  if (!dag?.nodes?.length) return { nodes: [], edges: [] }

  // Collect all event types and their roles
  const allEvents = new Map<string, { fullName: string; producedBy: Set<string>; consumedBy: Set<string> }>()

  const ensureEvent = (fullName: string) => {
    if (!allEvents.has(fullName)) {
      allEvents.set(fullName, { fullName, producedBy: new Set(), consumedBy: new Set() })
    }
    return allEvents.get(fullName)!
  }

  // Build edges: for each rule, trigger events → output events
  const ruleEdges: RuleEdge[] = []

  for (const rule of dag.nodes) {
    const triggers: any[] = rule.triggers ?? []
    const outputs: any[] = rule.outputs ?? []

    for (const t of triggers) ensureEvent(t.name)
    for (const o of outputs) ensureEvent(o.name)

    // Each rule creates edges from each trigger to each output
    for (const trigger of triggers) {
      ensureEvent(trigger.name).consumedBy.add(rule.id)
      for (const output of outputs) {
        ensureEvent(output.name).producedBy.add(rule.id)
        ruleEdges.push({
          from: trigger.name,
          to: output.name,
          ruleName: rule.name,
        })
      }
    }

    // If rule has triggers but no outputs, mark triggers as consumed (terminal rule)
    if (outputs.length === 0) {
      for (const t of triggers) {
        ensureEvent(t.name).consumedBy.add(rule.id)
      }
    }
  }

  // Deduplicate edges (same from→to)
  const edgeKey = (e: RuleEdge) => `${e.from}→${e.to}`
  const seen = new Set<string>()
  const dedupedEdges: RuleEdge[] = []
  for (const e of ruleEdges) {
    const k = edgeKey(e)
    if (!seen.has(k)) {
      seen.add(k)
      dedupedEdges.push(e)
    }
  }

  // Build adjacency for topological layering (event → event)
  const adj = new Map<string, Set<string>>()
  const inDeg = new Map<string, number>()
  for (const name of allEvents.keys()) {
    adj.set(name, new Set())
    inDeg.set(name, 0)
  }
  for (const e of dedupedEdges) {
    if (!adj.get(e.from)!.has(e.to)) {
      adj.get(e.from)!.add(e.to)
      inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1)
    }
  }

  // Kahn's layering
  const layers = new Map<string, number>()
  const queue: string[] = []
  for (const [name, deg] of inDeg) {
    if (deg === 0) {
      queue.push(name)
      layers.set(name, 0)
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!
    const cl = layers.get(cur)!
    for (const next of adj.get(cur) ?? []) {
      layers.set(next, Math.max(layers.get(next) ?? 0, cl + 1))
      inDeg.set(next, (inDeg.get(next) ?? 0) - 1)
      if (inDeg.get(next) === 0) queue.push(next)
    }
  }

  // Group by layer
  const layerGroups = new Map<number, string[]>()
  for (const [name, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, [])
    layerGroups.get(layer)!.push(name)
  }

  // Assign positions
  const eventNodes: EventNode[] = []
  for (const [layer, names] of layerGroups) {
    names.sort() // deterministic order
    for (let i = 0; i < names.length; i++) {
      const fullName = names[i]
      const info = allEvents.get(fullName)!
      const isInput = info.producedBy.size === 0
      const isTerminal = !dedupedEdges.some(e => e.from === fullName)

      eventNodes.push({
        name: stripSuffix(fullName),
        fullName,
        layer,
        x: PAD_X + layer * LAYER_GAP,
        y: PAD_Y + i * NODE_GAP,
        isInput,
        isTerminal,
      })
    }
  }

  return { nodes: eventNodes, edges: dedupedEdges }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DAGViewer({ engine }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<EventNode[]>([])
  const [edges, setEdges] = useState<RuleEdge[]>([])
  const [eventsPerSec, setEventsPerSec] = useState(0)
  const eventCounterRef = useRef(0)
  const edgeLookupRef = useRef<Map<string, HTMLElement[]>>(new Map())
  const flashTimers = useRef<Map<HTMLElement, number>>(new Map())
  const nodeLookupRef = useRef<Map<string, HTMLElement>>(new Map())

  // Build layout — re-read a few times to catch late registrations (usePulse)
  useEffect(() => {
    if (!engine) { setNodes([]); setEdges([]); return }
    let prevKey = ''
    const refresh = () => {
      const layout = buildLayout(engine)
      const key = `${layout.nodes.length}:${layout.edges.length}`
      if (key !== prevKey) {
        prevKey = key
        setNodes(layout.nodes)
        setEdges(layout.edges)
      }
    }
    refresh()
    const t1 = setTimeout(refresh, 100)
    const t2 = setTimeout(refresh, 400)
    const t3 = setTimeout(refresh, 1000)
    const t4 = setTimeout(refresh, 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [engine])

  // Build DOM lookups after render
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const raf = requestAnimationFrame(() => {
      // Edge lookup: event fullName → path elements where that event is from or to
      const edgeMap = new Map<string, HTMLElement[]>()
      for (const path of svg.querySelectorAll<SVGPathElement>('[data-from]')) {
        const from = path.getAttribute('data-from') ?? ''
        const to = path.getAttribute('data-to') ?? ''
        for (const key of [from, to]) {
          if (!edgeMap.has(key)) edgeMap.set(key, [])
          edgeMap.get(key)!.push(path as unknown as HTMLElement)
        }
      }
      edgeLookupRef.current = edgeMap

      // Node lookup: event fullName → rect element
      const nodeMap = new Map<string, HTMLElement>()
      for (const g of svg.querySelectorAll<SVGGElement>('[data-event]')) {
        const name = g.getAttribute('data-event') ?? ''
        nodeMap.set(name, g as unknown as HTMLElement)
      }
      nodeLookupRef.current = nodeMap
    })
    return () => cancelAnimationFrame(raf)
  }, [nodes, edges])

  // Subscribe to engine.debug.onEmit for pulse animations
  useEffect(() => {
    if (!engine) return
    eventCounterRef.current = 0
    const prevHook = engine.debug?.onEmit

    engine.debug.onEmit = (typeName: string, _payload: any) => {
      prevHook?.(typeName, _payload)
      eventCounterRef.current++

      // Flash the node
      const nodeEl = nodeLookupRef.current.get(typeName)
      if (nodeEl) {
        const rect = nodeEl.querySelector('rect')
        if (rect) {
          rect.setAttribute('stroke', '#60a5fa')
          rect.setAttribute('stroke-width', '2.5')
          setTimeout(() => {
            rect.setAttribute('stroke', rect.getAttribute('data-border') ?? EDGE_DIM)
            rect.setAttribute('stroke-width', '1.5')
          }, 120)
        }
      }

      // Flash edges where this event is the source
      const paths = edgeLookupRef.current.get(typeName)
      if (paths) {
        for (const path of paths) {
          const existing = flashTimers.current.get(path)
          if (existing) clearTimeout(existing)
          path.setAttribute('stroke', '#60a5fa')
          path.setAttribute('stroke-width', '2.5')
          const timer = window.setTimeout(() => {
            path.setAttribute('stroke', EDGE_DIM)
            path.setAttribute('stroke-width', '1.5')
            flashTimers.current.delete(path)
          }, 150)
          flashTimers.current.set(path, timer)
        }
      }
    }

    const interval = setInterval(() => {
      setEventsPerSec(eventCounterRef.current)
      eventCounterRef.current = 0
    }, 1000)

    return () => {
      engine.debug.onEmit = prevHook
      clearInterval(interval)
      for (const t of flashTimers.current.values()) clearTimeout(t)
      flashTimers.current.clear()
    }
  }, [engine])

  // Compute viewBox
  const maxX = nodes.reduce((m, n) => Math.max(m, n.x + NODE_W), 0) + PAD_X
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y + NODE_H), 0) + PAD_Y
  const viewBox = `0 0 ${Math.max(maxX, 400)} ${Math.max(maxY, 200)}`

  if (!engine) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Select an example to view its DAG</div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No events registered</div>
        <div style={styles.statsBar}>
          <span>0 events</span>
          <span style={styles.divider}>|</span>
          <span>{eventsPerSec} events/sec</span>
        </div>
      </div>
    )
  }

  const nodeByName = new Map(nodes.map(n => [n.fullName, n]))

  return (
    <div style={styles.container}>
      <svg ref={svgRef} viewBox={viewBox} style={styles.svg} preserveAspectRatio="xMinYMin meet">
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={EDGE_DIM} />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodeByName.get(edge.from)
          const to = nodeByName.get(edge.to)
          if (!from || !to) return null
          const x1 = from.x + NODE_W
          const y1 = from.y + NODE_H / 2
          const x2 = to.x
          const y2 = to.y + NODE_H / 2
          const cx1 = x1 + (x2 - x1) * 0.4
          const cx2 = x2 - (x2 - x1) * 0.4
          return (
            <path
              key={`${edge.from}-${edge.to}-${i}`}
              d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
              fill="none" stroke={EDGE_DIM} strokeWidth={1.5}
              markerEnd="url(#arr)"
              data-from={edge.from} data-to={edge.to}
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
          )
        })}

        {/* Nodes (events) */}
        {nodes.map(node => {
          const bg = node.isInput ? INPUT_BG : node.isTerminal ? TERMINAL_BG : MID_BG
          const border = node.isInput ? INPUT_BORDER : node.isTerminal ? TERMINAL_BORDER : MID_BORDER
          return (
            <g key={node.fullName} data-event={node.fullName}>
              <rect
                x={node.x} y={node.y} width={NODE_W} height={NODE_H}
                rx={18} ry={18}
                fill={bg} stroke={border} strokeWidth={1.5}
                data-border={border}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
              <text
                x={node.x + NODE_W / 2} y={node.y + NODE_H / 2 + 4}
                textAnchor="middle" fill={LABEL_COLOR}
                fontSize={11} fontFamily="'JetBrains Mono', monospace" fontWeight={500}
              >
                {node.name.length > 20 ? node.name.slice(0, 18) + '..' : node.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend + stats */}
      <div style={styles.statsBar}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: INPUT_BORDER, display: 'inline-block' }} />
          <span>Input</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: MID_BORDER, display: 'inline-block' }} />
          <span>Internal</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TERMINAL_BORDER, display: 'inline-block' }} />
          <span>Output</span>
        </span>
        <span style={styles.divider}>|</span>
        <span>{nodes.length} events</span>
        <span style={styles.divider}>|</span>
        <span>{edges.length} edges</span>
        <span style={styles.divider}>|</span>
        <span style={{ color: eventsPerSec > 0 ? '#60a5fa' : '#64748b' }}>
          {eventsPerSec.toLocaleString()} evt/s
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f1124',
    borderTop: '1px solid #1e293b',
    overflow: 'hidden',
  },
  svg: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 16px',
    background: '#0a0a1a',
    borderTop: '1px solid #1e293b',
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#64748b',
    flexShrink: 0,
  },
  divider: { color: '#334155' },
}
