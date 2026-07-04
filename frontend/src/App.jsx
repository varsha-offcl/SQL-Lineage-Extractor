import { SQLEditor } from './components/SQLEditor'
import { LineageGraph } from './components/LineageGraph'
import { Toolbar } from './components/Toolbar'
import { DetailPanel } from './components/DetailPanel'
import { Hexagon, ChevronUp, ChevronDown, Activity, GripVertical, GripHorizontal } from 'lucide-react'
import { useLineageStore } from './store/lineageStore'
import { ReactFlowProvider } from '@xyflow/react'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useRef } from 'react'

export default function App() {
  const { isDrawerOpen, setIsDrawerOpen, isImpactMode, setIsImpactMode, lineageData } = useLineageStore()
  const drawerRef = useRef(null)

  return (
    <div className="h-screen w-screen bg-background text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30 flex flex-col">
      <PanelGroup orientation="vertical">
        
        {/* TOP SECTION: Editor, Graph, Inspector */}
        <Panel defaultSize={isDrawerOpen ? "80%" : "95%"} minSize="30%">
          <PanelGroup orientation="horizontal">
            
            {/* LEFT: SQL Editor */}
            <Panel defaultSize="25%" minSize="15%" maxSize="45%" className="flex flex-col bg-background/50 backdrop-blur-xl relative z-20">
              <div className="px-5 py-4 border-b border-border bg-panel flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Hexagon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-zinc-100 font-bold text-[15px] tracking-tight truncate">SQL Lineage <span className="text-indigo-400">Extractor</span></span>
                </div>
                <button 
                  onClick={() => setIsImpactMode(!isImpactMode)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors shrink-0 ml-2 ${isImpactMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300'}`}
                  title="When active, clicking a column shows reverse lineage (downstream dependencies)"
                >
                  <Activity className="w-3.5 h-3.5 hidden xl:block" /> Impact {isImpactMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <SQLEditor />
              </div>
            </Panel>

            {/* Resize Handle 1 */}
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors cursor-col-resize flex flex-col justify-center items-center z-30">
                <GripVertical className="w-3 h-3 text-zinc-500" />
            </PanelResizeHandle>

            {/* CENTER: Graph Canvas */}
            <Panel defaultSize="55%" minSize="30%" className="flex flex-col bg-[#0c0c0e] relative z-0">
              <Toolbar />
              <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background pointer-events-none" />
                <ReactFlowProvider>
                  <LineageGraph />
                </ReactFlowProvider>
              </div>
            </Panel>

            {/* Resize Handle 2 */}
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors cursor-col-resize flex flex-col justify-center items-center z-30">
                <GripVertical className="w-3 h-3 text-zinc-500" />
            </PanelResizeHandle>

            {/* RIGHT: Node Inspector */}
            <Panel defaultSize="20%" minSize="15%" maxSize="35%" className="flex flex-col bg-panel z-20">
              <div className="px-5 py-4 border-b border-border text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Node Inspector
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <DetailPanel />
              </div>
            </Panel>

          </PanelGroup>
        </Panel>

        {/* Bottom Resize Handle */}
        <PanelResizeHandle className={`h-1.5 transition-colors flex justify-center items-center z-40 bg-border hover:bg-indigo-500/50 active:bg-indigo-500 cursor-row-resize`}>
            <GripHorizontal className={`w-3 h-3 text-zinc-500 ${!isDrawerOpen ? 'hidden' : ''}`} />
        </PanelResizeHandle>

        {/* BOTTOM: Lineage Summary Drawer */}
        <Panel 
            panelRef={drawerRef}
            defaultSize={isDrawerOpen ? "20%" : "5%"} 
            minSize="5%" 
            maxSize="40%" 
            collapsible 
            collapsedSize="5%" 
            onResize={(size) => {
                const asPct = typeof size === 'number' ? size : (size?.asPercentage ?? 100);
                if (asPct <= 5 && isDrawerOpen) setIsDrawerOpen(false);
                if (asPct > 5 && !isDrawerOpen) setIsDrawerOpen(true);
            }}
            className={`flex flex-col bg-panel z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t border-border`}
        >
          <div 
            className="h-10 px-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition border-b border-border shrink-0"
            onClick={() => {
                const nextState = !isDrawerOpen;
                setIsDrawerOpen(nextState);
                if (nextState) {
                    drawerRef.current?.resize("20%");
                } else {
                    drawerRef.current?.collapse();
                }
            }}
          >
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              Lineage Summary Tree
            </div>
            <button className="text-zinc-500 hover:text-zinc-300 transition">
              {isDrawerOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          {isDrawerOpen && (
            <div className="flex-1 min-h-0 overflow-auto p-6 font-mono text-[13px] text-zinc-300 bg-[#09090b] leading-relaxed custom-scrollbar whitespace-pre">
              {lineageData ? buildSummaryText(lineageData) : <div className="text-zinc-600 italic">No lineage data available.</div>}
            </div>
          )}
        </Panel>

      </PanelGroup>
    </div>
  )
}

function buildSummaryText(data) {
  let lines = []
  
  lines.push("OUTPUT COLUMNS:")
  data.columnLineage?.forEach(col => {
      const tType = String(col?.transformType || 'DIRECT').toUpperCase();
      lines.push(` └── ${col?.target} ← ${col?.source} [${tType}]${col?.expression ? ` -> ${col.expression}` : ''}`)
  })
  
  lines.push("\nTABLE JOINS:")
  if (data.joins?.length === 0) lines.push(" └── (None)")
  data.joins?.forEach(join => {
      lines.push(` ├── ${join?.source} ──► ${join?.target} [${join?.type || 'UNKNOWN'}]${join?.condition ? ` -> ON ${join.condition}` : ''}`)
  })
  
  lines.push("\nROW FILTERS:")
  if (data.filters?.length === 0) lines.push(" └── (None)")
  data.filters?.forEach(f => {
      lines.push(` ├── ${f?.table} [${f?.clause_type || 'WHERE'}]: ${f?.expression}`)
  })

  return lines.join('\n')
}
