import dagre from '@dagrejs/dagre'

const TABLE_W = 320
const TABLE_H = 80 // Base header height
const ROW_H = 28 // Column row height

export function buildGraphLayout(rawGraph, layoutDirection = 'LR') {
  if (!rawGraph || !rawGraph.nodes || !rawGraph.edges) {
    return { nodes: [], edges: [] }
  }
  return applyDagreLayout(rawGraph.nodes, rawGraph.edges, layoutDirection)
}

function applyDagreLayout(nodes, edges, layoutDirection) {
  if (nodes.length === 0) return { nodes, edges }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: layoutDirection,
    nodesep: 100, // Vertical spacing
    ranksep: 250, // Horizontal spacing
    marginx: 100,
    marginy: 100,
  })

  nodes.forEach(n => {
    // Calculate max height assuming it might be expanded
    const cols = n.data.columns || []
    const displayColsCount = Math.min(cols.length, 12)
    const filtersCount = n.data.row_filters?.length || 0
    let maxH = TABLE_H
    maxH += (displayColsCount * ROW_H) + (cols.length > 12 ? 20 : 0) + (filtersCount * 24) + 40
    
    g.setNode(n.id, { width: TABLE_W, height: maxH })
  })

  edges.forEach(e => {
    if (e.data?.isTableEdge && g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target)
    }
  })

  dagre.layout(g)

  const positioned = nodes.map(n => {
    const pos = g.node(n.id)
    const baseNode = { 
      ...n, 
      sourcePosition: layoutDirection === 'LR' ? 'right' : 'bottom',
      targetPosition: layoutDirection === 'LR' ? 'left' : 'top'
    }
    if (!pos) return { ...baseNode, position: { x: Math.random() * 400, y: Math.random() * 400 } }
    return { ...baseNode, position: { x: pos.x - TABLE_W / 2, y: pos.y - pos.height / 2 } }
  })

  return { nodes: positioned, edges }
}
