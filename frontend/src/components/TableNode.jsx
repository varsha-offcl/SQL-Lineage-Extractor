import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Database, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { useLineageStore } from '../store/lineageStore'

const TYPE_STYLES = {
  source:     'bg-indigo-950/40 border-indigo-500/30 text-indigo-100 ring-indigo-500/20',
  cte:        'bg-violet-950/40 border-violet-500/30 text-violet-100 ring-violet-500/20',
  output:     'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 ring-emerald-500/20',
  ddl_target: 'bg-rose-950/40 border-rose-500/30 text-rose-100 ring-rose-500/20',
  subquery:   'bg-amber-950/40 border-amber-500/30 text-amber-100 ring-amber-500/20',
}

const TYPE_LABELS = {
  source:     'Source Table',
  cte:        'CTE / With',
  output:     'Output',
  ddl_target: 'Target',
  subquery:   'Subquery',
}

export function TableNode({ id, data, sourcePosition, targetPosition }) {
  const { setNodes } = useReactFlow()
  const { setSelectedColumn, selectedColumn } = useLineageStore()
  const isSelected = data.isSelected
  const isExpanded = data.isExpanded || data.manuallyExpanded
  const cols = data.columns || []
  const displayCols = cols.slice(0, 12)
  const extraCols = cols.length - 12
  const style = TYPE_STYLES[data.type] || 'bg-zinc-900/80 border-zinc-700/50 text-zinc-100'

  return (
    <div className={`rounded-xl border backdrop-blur-xl transition-all duration-300 min-w-[260px] max-w-[320px] shadow-2xl ${style} ${isSelected ? 'ring-2 ring-white/20 scale-[1.02] bg-opacity-80' : 'hover:ring-1 hover:bg-opacity-60'}`}>
      <Handle type="target" position={targetPosition || Position.Top} className={`!bg-zinc-600/50 !border-none !rounded-full hover:!bg-indigo-400 transition-colors ${targetPosition === Position.Left || targetPosition === Position.Right ? '!w-1.5 !h-12' : '!w-12 !h-1.5'}`} />
      
      <div className="px-4 py-3 border-b border-white/5 bg-black/20 rounded-t-xl flex flex-col gap-1 cursor-pointer" onClick={(e) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, manuallyExpanded: !isExpanded } } : n))
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-70">
            <Database className="w-3 h-3" />
            {TYPE_LABELS[data.type] || data.type}
          </div>
          <button className="text-zinc-500 hover:text-white transition">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="font-extrabold text-[15px] font-mono tracking-tight truncate" title={data.name}>
          {data.name}
        </div>
      </div>
      
      <div className="px-4 py-2 flex flex-col gap-2">
        {data.filter_count > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold bg-amber-950/30 w-fit px-2 py-0.5 rounded border border-amber-500/20">
            <Filter className="w-3 h-3" />
            {data.filter_count} Filter{data.filter_count > 1 ? 's' : ''}
          </div>
        )}
        
        {isExpanded && cols.length > 0 && (
          <div className="pt-2 flex flex-col gap-0.5 animate-slide-down">
            {displayCols.map((col, idx) => {
              const colId = `${data.id}.${col}`
              const isColSelected = selectedColumn === colId
              return (
                <div 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedColumn(colId); }}
                  className={`relative text-[12px] font-mono cursor-pointer px-2 py-1.5 rounded flex items-center justify-between group transition-colors ${isColSelected ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-500/50' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`}
                >
                  <Handle 
                    type="target" 
                    position={Position.Left} 
                    id={colId} 
                    className={`!w-2 !h-4 !border-none !rounded-[2px] !left-[-16px] transition-colors ${isColSelected ? '!bg-indigo-400' : '!bg-emerald-500/50 group-hover:!bg-emerald-400'}`} 
                  />
                  <span className="truncate mr-4">{col}</span>
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={colId} 
                    className={`!w-2 !h-4 !border-none !rounded-[2px] !right-[-16px] transition-colors ${isColSelected ? '!bg-indigo-400' : '!bg-emerald-500/50 group-hover:!bg-emerald-400'}`} 
                  />
                </div>
              )
            })}
            {extraCols > 0 && (
              <div className="text-[11px] font-mono text-zinc-500 italic py-1 mt-1 text-center border-t border-white/5">
                + {extraCols} more columns
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={sourcePosition || Position.Bottom} className={`!bg-zinc-600/50 !border-none !rounded-full hover:!bg-indigo-400 transition-colors ${sourcePosition === Position.Left || sourcePosition === Position.Right ? '!w-1.5 !h-12' : '!w-12 !h-1.5'}`} />
    </div>
  )
}
