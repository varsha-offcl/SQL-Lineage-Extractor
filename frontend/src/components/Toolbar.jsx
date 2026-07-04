import { useLineageStore } from '../store/lineageStore'
import { Database, Workflow, Link2, Filter, Code2, Component } from 'lucide-react'

export function Toolbar() {
  const { lineageData } = useLineageStore()

  if (!lineageData) return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-panel shrink-0 shadow-sm z-10 min-h-[56px]">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm mr-auto tracking-wide">
            <Component className="w-4 h-4 text-indigo-500" />
            Interactive Graph Canvas
        </div>
    </div>
  )

  const tablesCount = lineageData.tables?.length || 0
  const colsTraced = lineageData.columnLineage?.length || 0
  const computedCount = lineageData.columnLineage?.filter(c => c.transformType && c.transformType !== 'DIRECT').length || 0
  const joinsCount = lineageData.joins?.length || 0
  
  const filterTypes = Array.from(new Set(lineageData.filters?.map(f => f.clause_type.toUpperCase()) || []))
  const filterStr = filterTypes.length > 0 ? filterTypes.join(' + ') : 'None'

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-panel shrink-0 shadow-sm z-10 min-h-[56px] overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm mr-auto tracking-wide shrink-0">
        <Component className="w-4 h-4 text-indigo-500" />
        Interactive Graph Canvas
      </div>
      
      <div className="flex items-center gap-4 text-[12px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 shadow-inner">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-zinc-300 font-bold">Tables:</span> {tablesCount}
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 shadow-inner">
          <Workflow className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-300 font-bold">Columns Traced:</span> {colsTraced}
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 shadow-inner">
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-zinc-300 font-bold">Computed:</span> {computedCount}
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 shadow-inner">
          <Link2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-zinc-300 font-bold">JOINs:</span> {joinsCount}
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 shadow-inner">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-zinc-300 font-bold">Filters:</span> {filterStr}
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 shadow-inner">
          <span className="font-bold text-zinc-400">Dialect:</span> <span className="uppercase tracking-widest text-indigo-300">{lineageData.dialect}</span>
        </div>
      </div>
    </div>
  )
}
