// ---- DAG Network Diagram Component ----
// Renders all event types and rules as a directed graph using SVG.

import { computeLayout, type LayoutNode, type LayoutEdge, type LayoutResult } from '../layout.js'
import { el, svg, cleanName, truncate } from '../utils.js'
import type { PulseEngine } from '../types.js'

export interface GraphComponent {
  element: HTMLElement
  update(): void
  highlightEdge(fromId: string, toId: string): void
  clearHighlights(): void
  destroy(): void
}

export function createGraphComponent(engine: PulseEngine): GraphComponent {
  const container = el('div', { cls: 'pd-graph-container' })
  const tooltip = el('div', { cls: 'pd-graph-tooltip', style: { display: 'none' } })
  container.appendChild(tooltip)

  let svgEl: SVGSVGElement | null = null
  let layout: LayoutResult | null = null
  let edgeElements = new Map<string, SVGPathElement>()
  let activeHighlights = new Set<string>()
  let highlightTimeout: ReturnType<typeof setTimeout> | null = null

  function edgeKey(from: string, to: string): string {
    return `${from}|${to}`
  }

  function update(): void {
    // Get rules from the engine
    let rules: Array<{
      id: string
      name: string
      mode: string
      triggers: Array<{ name: string }>
      outputs: Array<{ name: string }>
    }>

    try {
      rules = engine.getRules()
    } catch {
      rules = []
    }

    if (rules.length === 0) {
      container.innerHTML = ''
      container.appendChild(el('div', { cls: 'pd-graph-empty', text: 'No rules registered yet.' }))
      container.appendChild(tooltip)
      svgEl = null
      edgeElements.clear()
      layout = null
      return
    }

    layout = computeLayout(rules)
    edgeElements.clear()

    // Create SVG
    svgEl = svg('svg', {
      width: String(layout.width),
      height: String(layout.height),
      class: 'pd-graph-svg',
      viewBox: `0 0 ${layout.width} ${layout.height}`,
    })

    // Defs: arrowhead marker
    const defs = svg('defs')
    const marker = svg('marker', {
      id: 'pd-arrowhead',
      viewBox: '0 0 10 10',
      refX: '10',
      refY: '5',
      markerWidth: '8',
      markerHeight: '8',
      orient: 'auto-start-reverse',
    })
    const arrowPath = svg('path', {
      d: 'M 0 0 L 10 5 L 0 10 z',
      fill: '#2a2a4a',
    })
    marker.appendChild(arrowPath)
    defs.appendChild(marker)
    svgEl.appendChild(defs)

    // Render edges first (below nodes)
    const edgesGroup = svg('g', { class: 'pd-edges' })
    for (const edge of layout.edges) {
      const pathD = buildCurvePath(edge)
      const path = svg('path', {
        d: pathD,
        class: 'pd-graph-edge',
        'data-from': edge.from,
        'data-to': edge.to,
      })
      edgesGroup.appendChild(path)
      edgeElements.set(edgeKey(edge.from, edge.to), path)
    }
    svgEl.appendChild(edgesGroup)

    // Render nodes
    const nodesGroup = svg('g', { class: 'pd-nodes' })
    for (const node of layout.nodes) {
      const group = svg('g', {
        class: node.kind === 'rule' ? 'pd-graph-node-rule' : 'pd-graph-node-event',
        transform: `translate(${node.x}, ${node.y})`,
      })

      const rect = svg('rect', {
        width: String(node.width),
        height: String(node.height),
        rx: node.kind === 'rule' ? '10' : '4',
        ry: node.kind === 'rule' ? '10' : '4',
      })

      // Assign color based on event type name hash
      if (node.kind === 'event') {
        const hue = hashToHue(node.name)
        rect.setAttribute('stroke', `hsl(${hue}, 65%, 55%)`)
      }

      const displayName = truncate(cleanName(node.name), 18)
      const label = svg('text', {
        x: String(node.width / 2),
        y: String(node.height / 2),
        class: 'pd-graph-node-label',
      })
      label.textContent = displayName

      group.appendChild(rect)
      group.appendChild(label)

      // Tooltip on hover
      group.addEventListener('mouseenter', (e: Event) => {
        const mouseEvent = e as MouseEvent
        showTooltip(node, mouseEvent)
      })
      group.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none'
      })
      group.addEventListener('mousemove', (e: Event) => {
        const mouseEvent = e as MouseEvent
        positionTooltip(mouseEvent)
      })

      nodesGroup.appendChild(group)
    }
    svgEl.appendChild(nodesGroup)

    // Replace existing SVG
    const existingSvg = container.querySelector('.pd-graph-svg')
    if (existingSvg) {
      container.removeChild(existingSvg)
    }
    // Insert SVG before tooltip
    container.insertBefore(svgEl, tooltip)
  }

  function showTooltip(node: LayoutNode, event: MouseEvent): void {
    let info = ''
    if (node.kind === 'event') {
      info = `Event Type: ${cleanName(node.name)}\nID: ${node.name}`
    } else {
      const ruleId = node.id.replace('rule:', '')
      info = `Rule: ${cleanName(node.name)}\nID: ${ruleId}`
      // Try to find rule details
      try {
        const rules = engine.getRules()
        const rule = rules.find((r) => r.id === ruleId)
        if (rule) {
          info += `\nMode: ${rule.mode}`
          info += `\nTriggers: ${rule.triggers.map((t) => cleanName(t.name)).join(', ')}`
          if (rule.outputs.length > 0) {
            info += `\nOutputs: ${rule.outputs.map((o) => cleanName(o.name)).join(', ')}`
          }
        }
      } catch {
        // ignore
      }
    }
    tooltip.textContent = info
    tooltip.style.display = 'block'
    positionTooltip(event)
  }

  function positionTooltip(event: MouseEvent): void {
    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left + 12
    const y = event.clientY - rect.top + 12
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
  }

  function highlightEdge(fromId: string, toId: string): void {
    const key = edgeKey(fromId, toId)
    const path = edgeElements.get(key)
    if (path) {
      path.classList.add('pd-edge-active', 'pd-edge-active-anim')
      activeHighlights.add(key)
    }

    // Auto-clear after a delay
    if (highlightTimeout) clearTimeout(highlightTimeout)
    highlightTimeout = setTimeout(() => {
      clearHighlights()
    }, 2000)
  }

  function clearHighlights(): void {
    for (const key of activeHighlights) {
      const path = edgeElements.get(key)
      if (path) {
        path.classList.remove('pd-edge-active', 'pd-edge-active-anim')
      }
    }
    activeHighlights.clear()
  }

  function destroy(): void {
    if (highlightTimeout) clearTimeout(highlightTimeout)
    container.innerHTML = ''
  }

  // Initial render
  update()

  return {
    element: container,
    update,
    highlightEdge,
    clearHighlights,
    destroy,
  }
}

/** Build an SVG path string from edge control points (cubic bezier). */
function buildCurvePath(edge: LayoutEdge): string {
  const pts = edge.points
  if (pts.length < 2) return ''
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
  }
  // Use cubic bezier through 4 control points
  if (pts.length === 4) {
    return `M ${pts[0].x} ${pts[0].y} C ${pts[1].x} ${pts[1].y}, ${pts[2].x} ${pts[2].y}, ${pts[3].x} ${pts[3].y}`
  }
  // Fallback: polyline
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`
  }
  return d
}

/** Deterministic hue from string. */
function hashToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return ((hash % 360) + 360) % 360
}
