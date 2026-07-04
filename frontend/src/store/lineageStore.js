import { create } from 'zustand'

const DEFAULT_SQL = `-- Enter your SQL query here...`

export const useLineageStore = create((set) => ({
  sql: DEFAULT_SQL,
  dialect: 'ansi',
  lineageData: null,
  selectedNode: null,
  selectedEdge: null,
  hoveredEdge: null,
  selectedColumn: null, // For impact analysis
  isImpactMode: false,
  isDrawerOpen: true,
  layoutDirection: 'LR',
  loading: false,
  error: null,

  setSQL: (sql) => set({ sql }),
  setDialect: (dialect) => set({ dialect }),
  setLineageData: (data) => set({ lineageData: data, selectedNode: null, selectedEdge: null, hoveredEdge: null, selectedColumn: null }),
  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),
  setHoveredEdge: (edge) => set({ hoveredEdge: edge }),
  setSelectedColumn: (col) => set({ selectedColumn: col }),
  setIsImpactMode: (isImpact) => set({ isImpactMode: isImpact }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
