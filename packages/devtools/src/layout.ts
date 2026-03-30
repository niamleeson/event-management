// ---- Sugiyama-Style Layered Graph Layout Algorithm ----
//
// A simplified hierarchical layout for the DAG visualization:
// 1. Assign layers via longest-path layering
// 2. Reduce crossings via barycenter heuristic
// 3. Assign y-positions within each layer
// 4. Compute x from layer index

export interface LayoutNode {
  id: string
  name: string
  kind: 'event' | 'rule'
  /** Assigned layer (column) */
  layer: number
  /** Assigned position within the layer (row) */
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutEdge {
  from: string
  to: string
  /** Control points for curved paths */
  points: Array<{ x: number; y: number }>
}

export interface LayoutResult {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  width: number
  height: number
}

interface GraphNode {
  id: string
  name: string
  kind: 'event' | 'rule'
  outEdges: string[]
  inEdges: string[]
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 40
const RULE_WIDTH = 160
const RULE_HEIGHT = 44
const LAYER_GAP = 180
const NODE_GAP = 56
const PADDING = 40

/**
 * Compute a layered layout for the DAG.
 *
 * @param rules - Array of rules from the engine
 * @returns LayoutResult with positioned nodes and routed edges
 */
export function computeLayout(
  rules: Array<{
    id: string
    name: string
    mode: string
    triggers: Array<{ name: string }>
    outputs: Array<{ name: string }>
  }>,
): LayoutResult {
  if (rules.length === 0) {
    return { nodes: [], edges: [], width: PADDING * 2, height: PADDING * 2 }
  }

  // Build the graph with event nodes and rule nodes
  const nodeMap = new Map<string, GraphNode>()
  const rawEdges: Array<{ from: string; to: string }> = []

  // Collect all event type names (deduplicated)
  const eventNames = new Set<string>()
  for (const rule of rules) {
    for (const t of rule.triggers) eventNames.add(t.name)
    for (const o of rule.outputs) eventNames.add(o.name)
  }

  // Create event nodes
  for (const name of eventNames) {
    nodeMap.set(`evt:${name}`, {
      id: `evt:${name}`,
      name,
      kind: 'event',
      outEdges: [],
      inEdges: [],
    })
  }

  // Create rule nodes and edges
  for (const rule of rules) {
    const ruleId = `rule:${rule.id}`
    nodeMap.set(ruleId, {
      id: ruleId,
      name: rule.name,
      kind: 'rule',
      outEdges: [],
      inEdges: [],
    })

    // Edges: trigger event -> rule
    for (const t of rule.triggers) {
      const fromId = `evt:${t.name}`
      rawEdges.push({ from: fromId, to: ruleId })
      nodeMap.get(fromId)!.outEdges.push(ruleId)
      nodeMap.get(ruleId)!.inEdges.push(fromId)
    }

    // Edges: rule -> output event
    for (const o of rule.outputs) {
      const toId = `evt:${o.name}`
      rawEdges.push({ from: ruleId, to: toId })
      nodeMap.get(ruleId)!.outEdges.push(toId)
      nodeMap.get(toId)!.inEdges.push(ruleId)
    }
  }

  // Step 1: Assign layers via longest-path from sources
  const layers = assignLayers(nodeMap)

  // Step 2: Order nodes within each layer to minimize crossings
  const layerOrder = orderLayers(layers, nodeMap)

  // Step 3: Assign coordinates
  const layoutNodes: LayoutNode[] = []
  let maxY = 0

  for (const [layerIdx, nodeIds] of layerOrder.entries()) {
    const totalHeight =
      nodeIds.length * (NODE_HEIGHT + NODE_GAP) - NODE_GAP
    const startY = PADDING

    for (const [posIdx, nodeId] of nodeIds.entries()) {
      const gn = nodeMap.get(nodeId)!
      const isRule = gn.kind === 'rule'
      const w = isRule ? RULE_WIDTH : NODE_WIDTH
      const h = isRule ? RULE_HEIGHT : NODE_HEIGHT
      const x = PADDING + layerIdx * LAYER_GAP
      const y = startY + posIdx * (NODE_HEIGHT + NODE_GAP)

      layoutNodes.push({
        id: nodeId,
        name: gn.name,
        kind: gn.kind,
        layer: layerIdx,
        x,
        y,
        width: w,
        height: h,
      })

      const bottomEdge = y + h
      if (bottomEdge > maxY) maxY = bottomEdge
    }
  }

  // Step 4: Route edges as simple bezier curves
  const nodePositions = new Map<string, LayoutNode>()
  for (const n of layoutNodes) nodePositions.set(n.id, n)

  const layoutEdges: LayoutEdge[] = rawEdges.map(({ from, to }) => {
    const fromNode = nodePositions.get(from)!
    const toNode = nodePositions.get(to)!
    const startX = fromNode.x + fromNode.width
    const startY = fromNode.y + fromNode.height / 2
    const endX = toNode.x
    const endY = toNode.y + toNode.height / 2
    const midX = (startX + endX) / 2

    return {
      from,
      to,
      points: [
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY },
      ],
    }
  })

  const totalWidth = PADDING * 2 + layerOrder.length * LAYER_GAP
  const totalHeight = maxY + PADDING

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: Math.max(totalWidth, 300),
    height: Math.max(totalHeight, 200),
  }
}

/**
 * Assign layers using longest path from sources.
 * Returns a map from node id to layer index.
 */
function assignLayers(
  nodeMap: Map<string, GraphNode>,
): Map<string, number> {
  const layers = new Map<string, number>()
  const visited = new Set<string>()

  function dfs(id: string): number {
    if (layers.has(id)) return layers.get(id)!
    if (visited.has(id)) return 0 // cycle guard
    visited.add(id)

    const node = nodeMap.get(id)!
    if (node.inEdges.length === 0) {
      layers.set(id, 0)
      return 0
    }

    let maxParentLayer = 0
    for (const parentId of node.inEdges) {
      const parentLayer = dfs(parentId)
      if (parentLayer + 1 > maxParentLayer) {
        maxParentLayer = parentLayer + 1
      }
    }

    layers.set(id, maxParentLayer)
    return maxParentLayer
  }

  for (const id of nodeMap.keys()) {
    dfs(id)
  }

  return layers
}

/**
 * Order nodes within each layer using barycenter heuristic.
 * Returns an array of layers, each containing ordered node ids.
 */
function orderLayers(
  layerAssign: Map<string, number>,
  nodeMap: Map<string, GraphNode>,
): string[][] {
  // Group nodes by layer
  const maxLayer = Math.max(0, ...layerAssign.values())
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => [])

  for (const [id, layer] of layerAssign.entries()) {
    layers[layer].push(id)
  }

  // Initial order: alphabetical within each layer
  for (const layer of layers) {
    layer.sort((a, b) => {
      const na = nodeMap.get(a)!
      const nb = nodeMap.get(b)!
      return na.name.localeCompare(nb.name)
    })
  }

  // Barycenter ordering: iterate a few times
  const positionInLayer = new Map<string, number>()

  function updatePositions(): void {
    positionInLayer.clear()
    for (const layer of layers) {
      for (let i = 0; i < layer.length; i++) {
        positionInLayer.set(layer[i], i)
      }
    }
  }

  for (let iter = 0; iter < 4; iter++) {
    updatePositions()

    // Forward pass: order layer[i] based on positions of predecessors in layer[i-1]
    for (let i = 1; i < layers.length; i++) {
      const barycenters: Array<{ id: string; bc: number }> = []
      for (const id of layers[i]) {
        const node = nodeMap.get(id)!
        const predecessors = node.inEdges.filter(
          (pid) => layerAssign.get(pid) === i - 1,
        )
        if (predecessors.length === 0) {
          barycenters.push({ id, bc: positionInLayer.get(id) ?? 0 })
        } else {
          const sum = predecessors.reduce(
            (s, pid) => s + (positionInLayer.get(pid) ?? 0),
            0,
          )
          barycenters.push({ id, bc: sum / predecessors.length })
        }
      }
      barycenters.sort((a, b) => a.bc - b.bc)
      layers[i] = barycenters.map((b) => b.id)
    }

    updatePositions()

    // Backward pass
    for (let i = layers.length - 2; i >= 0; i--) {
      const barycenters: Array<{ id: string; bc: number }> = []
      for (const id of layers[i]) {
        const node = nodeMap.get(id)!
        const successors = node.outEdges.filter(
          (sid) => layerAssign.get(sid) === i + 1,
        )
        if (successors.length === 0) {
          barycenters.push({ id, bc: positionInLayer.get(id) ?? 0 })
        } else {
          const sum = successors.reduce(
            (s, sid) => s + (positionInLayer.get(sid) ?? 0),
            0,
          )
          barycenters.push({ id, bc: sum / successors.length })
        }
      }
      barycenters.sort((a, b) => a.bc - b.bc)
      layers[i] = barycenters.map((b) => b.id)
    }
  }

  return layers
}
