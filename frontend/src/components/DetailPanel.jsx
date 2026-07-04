import { useLineageStore } from '../store/lineageStore'
import { Info, Code2, Filter, Link2, Database, Workflow } from 'lucide-react'

export function DetailPanel() {
  const { selectedNode, selectedEdge, lineageData } = useLineageStore()

  if (selectedEdge) {
    const isColumnEdge = selectedEdge.data?.isColumnEdge
    return (
      <div className="p-5 space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {isColumnEdge ? 'Column Edge' : 'Table Edge'}
            </span>
          </div>
          <div className="text-zinc-100 font-extrabold text-[15px] font-mono break-words leading-tight">
            {isColumnEdge ? `${selectedEdge.sourceHandle} → ${selectedEdge.targetHandle}` : `${selectedEdge.source} ──► ${selectedEdge.target}`}
          </div>
        </div>

        {isColumnEdge && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px] uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5" />
              Column Transform
            </div>
            <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-3 shadow-inner">
               <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Type</div>
               <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 mb-2 border border-purple-500/20 uppercase tracking-widest">
                  {lineageData?.columnLineage?.find(c => c.source === selectedEdge.sourceHandle && c.target === selectedEdge.targetHandle)?.transformType || 'DIRECT'}
               </div>
              {selectedEdge.data?.expression && (
                <>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 mt-2">Expression</div>
                  <code className="text-xs font-mono text-purple-200/80 break-words">
                    {selectedEdge.data.expression}
                  </code>
                </>
              )}
            </div>
          </div>
        )}

        {!isColumnEdge && selectedEdge.data?.join_type && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5" />
              JOIN Properties
            </div>
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3">
              <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 mb-2 border border-blue-500/20 uppercase tracking-widest">
                {selectedEdge.data.join_type}
              </div>
              {selectedEdge.data.join_condition && (
                <div className="text-zinc-300 text-xs font-mono break-words leading-relaxed">
                  ON {selectedEdge.data.join_condition}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!selectedNode) return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
        <Info className="w-8 h-8 text-zinc-600" />
      </div>
      <p className="text-sm font-medium">Select any node or edge to view its properties and lineage details.</p>
    </div>
  )

  const fullNode = lineageData?.nodes?.find(n => n.id === selectedNode.id)
  const nodeType = selectedNode.data?.type || 'source'
  const nodeId = selectedNode.id

  const filters = lineageData?.filters?.filter(f => f.table === nodeId) || []
  
  // Source table logic
  const sourceColumns = Array.from(new Set(lineageData?.columnLineage?.filter(c => c.source.split('.')[0] === nodeId).map(c => c.source.split('.')[1])))
  const nodeJoins = lineageData?.joins?.filter(j => j.source === nodeId || j.target === nodeId) || []

  // CTE logic
  const cteFeeds = lineageData?.edges?.filter(e => e.data?.isTableEdge && e.target === nodeId).map(e => e.source) || []
  const cteColumns = fullNode?.data?.columns || []

  // Output logic
  const outputLineage = lineageData?.columnLineage?.filter(c => c.target.split('.')[0] === nodeId) || []
  const outputGroups = {}
  outputLineage.forEach(col => {
      if (!outputGroups[col.target]) outputGroups[col.target] = []
      outputGroups[col.target].push(col)
  })

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {nodeType === 'outputNode' || nodeType === 'output' ? 'Output' : nodeType === 'cte' ? 'CTE' : 'Source Table'}
          </span>
        </div>
        <div className="text-zinc-100 font-extrabold text-lg font-mono break-words leading-tight">
          {selectedNode.data?.name || nodeId}
        </div>
      </div>

      {/* Source Table specifics */}
      {(nodeType === 'source' || nodeType === 'sourceTableNode') && (
        <>
          {sourceColumns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                Columns Referenced ({sourceColumns.length})
              </div>
              <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-3 flex flex-wrap gap-1.5">
                  {sourceColumns.map(col => (
                      <span key={col} className="text-[11px] font-mono text-emerald-100/80 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50">{col}</span>
                  ))}
              </div>
            </div>
          )}
          {nodeJoins.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                <Link2 className="w-3.5 h-3.5" />
                Participating Joins ({nodeJoins.length})
              </div>
              <div className="space-y-2">
                  {nodeJoins.map((j, idx) => (
                      <div key={idx} className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3">
                          <div className="text-[10px] font-mono text-blue-200/90 mb-1">
                              {j.source} <span className="text-blue-500">→</span> {j.target}
                          </div>
                          <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 mb-1 border border-blue-500/20 uppercase tracking-widest">{j.type}</div>
                          {j.condition && <div className="text-[10px] font-mono text-zinc-400 mt-1">ON {j.condition}</div>}
                      </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTE specifics */}
      {(nodeType === 'cte' || nodeType === 'transformNode') && (
        <>
          {cteFeeds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
                <Workflow className="w-3.5 h-3.5" />
                Feeder Tables ({cteFeeds.length})
              </div>
              <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-3 flex flex-wrap gap-1.5">
                  {cteFeeds.map(feed => (
                      <span key={feed} className="text-[11px] font-mono text-indigo-100/80 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-900/50">{feed}</span>
                  ))}
              </div>
            </div>
          )}
          {cteColumns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                Produced Columns ({cteColumns.length})
              </div>
              <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-3 flex flex-wrap gap-1.5">
                  {cteColumns.map(col => (
                      <span key={col} className="text-[11px] font-mono text-emerald-100/80 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50">{col}</span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Output specifics */}
      {(nodeType === 'output' || nodeType === 'outputNode' || nodeType === 'ddl_target') && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              Final Output Columns ({Object.keys(outputGroups).length})
            </div>
            <div className="space-y-3">
                {Object.entries(outputGroups).map(([target, sources]) => (
                    <div key={target} className="bg-emerald-950/10 border border-emerald-900/20 rounded-xl p-3">
                        <div className="text-[12px] font-mono font-bold text-emerald-300 mb-2">{target.split('.')[1] || target}</div>
                        {sources.map((src, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-widest">{src.transformType || 'DIRECT'}</span>
                                    <span className="text-[10px] font-mono text-zinc-400">{src.source}</span>
                                </div>
                                {src.expression && <div className="text-[10px] font-mono text-zinc-500 pl-1 border-l border-zinc-700 ml-1">{src.expression}</div>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Filters (Applies to CTEs and Tables) */}
      {filters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Logic & Filters ({filters.length})
          </div>
          <div className="space-y-2">
            {filters.map((f, i) => (
              <div key={i} className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 hover:bg-amber-950/30 transition-colors">
                <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 mb-2 border border-amber-500/20 uppercase tracking-widest">
                  {f.clause_type}
                </div>
                <div className="text-zinc-300 text-xs font-mono break-words leading-relaxed">{f.expression}</div>
                {f.columns_referenced?.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-amber-900/20 flex flex-wrap gap-1">
                    {f.columns_referenced.map(col => (
                      <span key={col} className="text-[10px] font-mono text-amber-200/50 bg-amber-950/40 px-1.5 py-0.5 rounded">
                        {col}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
