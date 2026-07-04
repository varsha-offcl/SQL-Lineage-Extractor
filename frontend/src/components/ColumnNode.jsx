import { Handle, Position } from '@xyflow/react'

export function ColumnNode({ data, selected }) {
  const parts = (data.id || '').split('.', 2)
  const displayTable = parts.length === 2 ? parts[0] : 'unknown'
  const displayCol = parts.length === 2 ? parts[1] : data.id

  return (
    <div className={`rounded-lg border border-solid px-4 py-3 bg-gray-900/90 border-emerald-600/60 shadow-xl backdrop-blur-sm ${selected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-950' : ''}`}>
      <Handle type="target" position={Position.Top} style={{ background: '#10b981', width: '12px', height: '6px', borderRadius: '4px' }} />
      <div className="text-sm font-mono tracking-tight">
        <span className="text-gray-400">{displayTable}.</span>
        <span className="text-emerald-300 font-bold ml-0.5">{displayCol}</span>
      </div>
      {data.expression && (
        <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={data.expression}>
          {data.expression}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#10b981', width: '12px', height: '6px', borderRadius: '4px' }} />
    </div>
  )
}
