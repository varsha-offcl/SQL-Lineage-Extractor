import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Panel, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useCallback, useRef } from 'react'
import { TableNode } from './TableNode'
import { ColumnNode } from './ColumnNode'
import { buildGraphLayout } from '../utils/graphTransformer'
import { useLineageStore } from '../store/lineageStore'
import { Loader2, AlertTriangle, Hexagon, Download, Copy, LayoutList, RefreshCcw, Layers } from 'lucide-react'
import { toPng } from 'html-to-image'

const nodeTypes = { 
  tableNode: TableNode, 
  sourceTableNode: TableNode,
  outputNode: TableNode,
  transformNode: TableNode,
  columnNode: ColumnNode 
}

export function LineageGraph() {
  const { lineageData, selectedNode, hoveredEdge, selectedEdge, selectedColumn, isImpactMode, layoutDirection, setLayoutDirection, setSelectedNode, setHoveredEdge, setSelectedEdge, setSelectedColumn, loading, error } = useLineageStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const reactFlowWrapper = useRef(null)
  const { fitView } = useReactFlow()

  // 1. Initial Static Layout
  useEffect(() => {
    if (!lineageData) return
    try {
      const { nodes: n, edges: e } = buildGraphLayout(lineageData, layoutDirection)
      setNodes(n)
      setEdges(e)
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100)
    } catch (err) {
      console.error('Graph transform error:', err)
    }
  }, [lineageData, layoutDirection, setNodes, setEdges, fitView])

  // 2. Dynamic Interactive Styling
  useEffect(() => {
    if (nodes.length === 0) return

    const selectedId = selectedNode?.id
    const hoveredId = hoveredEdge?.id
    const clickedEdgeId = selectedEdge?.id

    let expandedTableIds = new Set()
    let highlightedEdges = new Set()
    
    // By default tables are collapsed, but interaction can expand them.
    
    // Impact Analysis / Column Click Logic
    if (selectedColumn) {
        edges.forEach(e => {
            if (e.data?.isColumnEdge) {
                if (isImpactMode) {
                    if (e.sourceHandle === selectedColumn) {
                        highlightedEdges.add(e.id)
                        expandedTableIds.add(e.source)
                        expandedTableIds.add(e.target)
                    }
                } else {
                    if (e.targetHandle === selectedColumn || e.sourceHandle === selectedColumn) {
                        highlightedEdges.add(e.id)
                        expandedTableIds.add(e.source)
                        expandedTableIds.add(e.target)
                    }
                }
            }
        })
    }

    if (selectedId) {
      expandedTableIds.add(selectedId)
      edges.forEach(e => {
        if (e.data?.isColumnEdge) {
          if (e.data.srcTable === selectedId) expandedTableIds.add(e.data.tgtTable)
          if (e.data.tgtTable === selectedId) expandedTableIds.add(e.data.srcTable)
        }
      })
    }

    if (hoveredId && hoveredEdge?.data?.isTableEdge) {
      expandedTableIds.add(hoveredEdge.source)
      expandedTableIds.add(hoveredEdge.target)
    }

    if (clickedEdgeId && selectedEdge?.data?.isTableEdge) {
        expandedTableIds.add(selectedEdge.source)
        expandedTableIds.add(selectedEdge.target)
    }

    setNodes(nds => nds.map(n => {
      const isSelected = n.id === selectedId
      const isExpanded = expandedTableIds.has(n.id)
      const isFaded = (selectedId || selectedColumn) ? (!isSelected && !isExpanded) : false
      
      const newStyle = { ...n.style, opacity: isFaded ? 0.4 : 1 }

      if (n.data.isSelected !== isSelected || n.data.isExpanded !== isExpanded || n.style?.opacity !== newStyle.opacity) {
        return { ...n, style: newStyle, data: { ...n.data, isSelected, isExpanded } }
      }
      return n
    }))

    setEdges(eds => eds.map(e => {
      let isVisible = true
      let stroke = e.style?.stroke || (e.data?.isColumnEdge ? '#10b981' : '#3f3f46')
      let zIndex = e.data?.isColumnEdge ? 2 : 1
      let strokeWidth = e.style?.strokeWidth || (e.data?.isColumnEdge ? 1 : 2)
      let strokeDasharray = e.style?.strokeDasharray || 'none'
      let opacity = 1

      if (e.data?.isTableEdge) {
        if (e.id === hoveredId || e.id === clickedEdgeId) {
          stroke = '#818cf8'
          strokeWidth = 3
          zIndex = 10
        } else if (selectedId && (e.source === selectedId || e.target === selectedId)) {
          stroke = '#6366f1'
          strokeWidth = 2
          zIndex = 5
        } else if (selectedId || selectedColumn) {
          opacity = 0.15
        } else {
          // Default: subtle table edges
          stroke = '#52525b'
          opacity = 0.5
        }
      }

      if (e.data?.isColumnEdge) {
        const { srcTable, tgtTable } = e.data
        
        if (selectedColumn) {
            if (highlightedEdges.has(e.id)) {
                strokeWidth = 3
                zIndex = 20
                opacity = 1
            } else {
                opacity = 0.1
            }
        } else if (selectedId) {
            if (srcTable === selectedId || tgtTable === selectedId) {
                strokeWidth = 2
                zIndex = 15
                opacity = 0.9
            } else {
                opacity = 0.1
            }
        } else {
            // Default: visible but subtle column edges
            opacity = 0.35
            
            if ((hoveredId && hoveredEdge?.data?.isTableEdge) || (clickedEdgeId && selectedEdge?.data?.isTableEdge)) {
                const targetEdge = hoveredId ? hoveredEdge : selectedEdge
                if ((srcTable === targetEdge.source && tgtTable === targetEdge.target) || 
                    (srcTable === targetEdge.target && tgtTable === targetEdge.source)) {
                  strokeWidth = 2
                  zIndex = 15
                  opacity = 0.9
                }
            }
            if (e.id === hoveredId || e.id === clickedEdgeId) {
                strokeWidth = 3
                zIndex = 20
                opacity = 1
            }
        }
      }

      if (e.hidden !== !isVisible || e.style?.strokeWidth !== strokeWidth || e.style?.zIndex !== zIndex || e.style?.opacity !== opacity || e.style?.stroke !== stroke) {
        return {
          ...e,
          hidden: !isVisible,
          style: { ...e.style, stroke, strokeWidth, zIndex, opacity, strokeDasharray }
        }
      }
      return e
    }))

  }, [selectedNode, hoveredEdge, selectedEdge, selectedColumn, isImpactMode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setHoveredEdge(null)
    setSelectedEdge(null)
    setSelectedColumn(null)
  }, [setSelectedNode, setHoveredEdge, setSelectedEdge, setSelectedColumn])

  const handleResetView = useCallback(() => {
    onPaneClick()
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50)
  }, [onPaneClick, fitView])

  const exportAsPNG = () => {
    if (reactFlowWrapper.current === null) return
    toPng(reactFlowWrapper.current, { backgroundColor: '#09090b' }).then((dataUrl) => {
      const a = document.createElement('a')
      a.setAttribute('download', 'lineage-graph.png')
      a.setAttribute('href', dataUrl)
      a.click()
    })
  }

  const copyAsJSON = () => {
    if (!lineageData) return
    navigator.clipboard.writeText(JSON.stringify(lineageData, null, 2))
  }

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400 gap-4">
      <Loader2 className="w-12 h-12 animate-spin" />
      <div className="text-sm font-semibold tracking-widest uppercase">Extracting Lineage...</div>
    </div>
  )

  if (error) return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-background">
      <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-8 max-w-lg w-full flex flex-col items-center text-center shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <div className="text-rose-400 font-bold text-lg mb-2">Extraction Error</div>
        <div className="text-rose-300/80 text-sm font-mono break-words">{error}</div>
      </div>
    </div>
  )

  if (!lineageData) return (
    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-background">
      <div className="text-center flex flex-col items-center">
        <Hexagon className="w-16 h-16 text-zinc-800 mb-4 stroke-[1px]" />
        <div className="text-sm tracking-wide">Enter SQL on the left and click</div>
        <div className="text-indigo-400 font-bold mt-1 text-base tracking-tight shadow-indigo-500 drop-shadow-sm">⚡ Analyze Lineage</div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => { setSelectedNode(node); setSelectedColumn(null); }}
        onEdgeClick={(_, edge) => { setSelectedEdge(edge); setSelectedColumn(null); }}
        onPaneClick={onPaneClick}
        onEdgeMouseEnter={(_, edge) => setHoveredEdge(edge)}
        onEdgeMouseLeave={() => setHoveredEdge(null)}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5, duration: 800 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272a" gap={24} size={1.5} />
        <Controls className="bg-panel border border-border fill-zinc-400" />
        
        <Panel position="top-right" className="flex gap-2 p-2">
            <button onClick={() => setLayoutDirection(layoutDirection === 'LR' ? 'TB' : 'LR')} className="bg-panel border border-border text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition shadow flex items-center gap-1.5">
                <LayoutList className="w-3.5 h-3.5" /> {layoutDirection === 'LR' ? 'LR Layout' : 'TB Layout'}
            </button>
            <button onClick={handleResetView} className="bg-panel border border-border text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition shadow flex items-center gap-1.5">
                <RefreshCcw className="w-3.5 h-3.5" /> Reset View
            </button>
        </Panel>

        <Panel position="bottom-left" className="flex gap-2 p-4">
            <button onClick={copyAsJSON} className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600/30 transition shadow flex items-center gap-1.5 backdrop-blur">
                <Copy className="w-3.5 h-3.5" /> Copy JSON
            </button>
            <button onClick={exportAsPNG} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition shadow flex items-center gap-1.5 backdrop-blur">
                <Download className="w-3.5 h-3.5" /> Export PNG
            </button>
        </Panel>

        <MiniMap
          nodeColor={n => {
            if (n.type === 'outputNode') return '#10b981'
            if (n.type === 'transformNode') return '#a855f7'
            return '#4f46e5' // sourceTableNode / tableNode
          }}
          bgColor="#09090b"
          maskColor="rgba(0,0,0,0.8)"
          style={{ width: 140, height: 100 }}
          className="border border-border rounded-xl overflow-hidden shadow-xl"
        />
      </ReactFlow>
    </div>
  )
}
