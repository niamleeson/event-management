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
  kind: 'event'
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
  kind: 'event'
  outEdges: string[]
  inEdges: string[]
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 40
const LAYER_GAP = 180
const NODE_GAP = 56
const PADDING = 40

/**
 * Compute a layered layout for the DAG.
 * Nodes are event types; edges are event-to-event (discovered at runtime when handlers emit events).
 *
 * @param dag - The DAG from engine.getDAG()
 * @returns LayoutResult with positioned nodes and routed edges
 */
export function computeDAGLayout(
  dag: {
    nodes: Array<{ id: string; name: string }>
    edges: Array<[{ id: string }, { id: string }]>
  },
): LayoutResult {
  if (dag.nodes.length === 0) {
    return { nodes: [], edges: [], width: PADDING * 2, height: PADDING * 2 }
  }

  // Build the graph
  const nodeMap = new Map<string, GraphNode>()
  const rawEdges: Array<{ from: string; to: string }> = []

  // Create event type nodes
  for (const node of dag.nodes) {
    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      kind: 'event',
      outEdges: [],
      inEdges: [],
    })
  }

  // Create edges (EventType -> EventType)
  for (const [from, to] of dag.edges) {
    if (nodeMap.has(from.id) && nodeMap.has(to.id)) {
      rawEdges.push({ from: from.id, to: to.id })
      nodeMap.get(from.id)!.outEdges.push(to.id)
      nodeMap.get(to.id)!.inEdges.push(from.id)
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
    const startY = PADDING

    for (const [posIdx, nodeId] of nodeIds.entries()) {
      const gn = nodeMap.get(nodeId)!
      const w = NODE_WIDTH
      const h = NODE_HEIGHT
      const x = PADDING + layerIdx * LAYER_GAP
      const y = startY + posIdx * (NODE_HEIGHT + NODE_GAP)

      layoutNodes.push({
        id: nodeId,
        name: gn.name,
        kind: 'event',
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
 * @deprecated Use computeDAGLayout instead. Kept for backward compatibility.
 */
export const computeLayout = computeDAGLayout as any

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
