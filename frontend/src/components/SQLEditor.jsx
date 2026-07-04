import { useState, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang } from '@codemirror/lang-sql'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { useLineageStore } from '../store/lineageStore'
import { Zap, TerminalSquare, Upload, FileCode, AlignLeft } from 'lucide-react'
import axios from 'axios'

const DIALECTS = ['ansi','mysql','postgres','sqlite','bigquery','snowflake','spark','duckdb','trino','oracle']
const PRESETS = [
  { label: 'Basic JOIN', value: "SELECT a.id, b.name FROM table_a a JOIN table_b b ON a.id = b.a_id" },
  { label: 'Aggregations', value: "SELECT user_id, SUM(amount) as total FROM sales GROUP BY user_id HAVING total > 100" },
  { label: 'CTE / Subquery', value: "WITH cte AS (SELECT id, val FROM source) SELECT id, val * 2 as doubled FROM cte WHERE val > 5" }
]

export function SQLEditor() {
  const { sql, dialect, setSQL, setDialect, setLineageData, setLoading, setError, loading, error } = useLineageStore()
  const fileInputRef = useRef(null)

  async function handleAnalyze() {
    if (!sql.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post('/api/lineage', { sql, dialect })
      setLineageData(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => setSQL(evt.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="px-4 py-2 border-b border-border flex flex-col gap-2 shrink-0 bg-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">
            <TerminalSquare className="w-4 h-4 text-emerald-400" />
            SQL Editor
          </div>
          <select
            value={dialect}
            onChange={e => setDialect(e.target.value)}
            className="bg-zinc-900 text-zinc-300 text-xs font-mono font-medium rounded-md px-2 py-1 border border-zinc-700/50 focus:outline-none focus:border-indigo-500/50 uppercase tracking-wider"
          >
            {DIALECTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <select 
            className="bg-zinc-800 text-zinc-400 rounded px-2 py-1 border border-zinc-700 w-28 truncate"
            onChange={e => setSQL(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Presets...</option>
            {PRESETS.map((p, i) => <option key={i} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700 transition">
            <Upload className="w-3 h-3" /> <span className="hidden xl:inline">Upload</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".sql,.txt" onChange={handleFileUpload} />
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-[#1e1e1e]">
        <div className="absolute inset-0 overflow-auto">
          <CodeMirror
            value={sql}
            height="100%"
            theme={vscodeDark}
            extensions={[sqlLang()]}
            onChange={(val) => setSQL(val)}
            className="h-full text-sm font-mono"
          />
        </div>
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-rose-950/90 text-rose-300 text-xs font-mono p-2 border-t border-rose-900 overflow-y-auto max-h-[100px]">
            {error}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border shrink-0 bg-panel shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-10 relative">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white text-[13px] font-bold tracking-widest uppercase rounded-lg py-3 transition-all duration-300 shadow-lg shadow-indigo-900/20"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Zap className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Parsing...' : 'Analyze Lineage'}
          </div>
        </button>
      </div>
    </div>
  )
}
