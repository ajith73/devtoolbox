import { useMemo } from 'react'
import { FileJson } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import Papa from 'papaparse'

export function CsvJsonTool() {
    const [input, setInput] = usePersistentState('csv_json_input', '')
    const [mode, setMode] = usePersistentState<'csv-to-json' | 'json-to-csv'>('csv_json_mode', 'csv-to-json')

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null }
        try {
            if (mode === 'csv-to-json') {
                const parsed = Papa.parse(input, { header: true, skipEmptyLines: true, dynamicTyping: true })
                if (parsed.errors.length > 0) throw new Error(parsed.errors[0].message)
                return { output: JSON.stringify(parsed.data, null, 2), error: null as string | null }
            }

            const obj = JSON.parse(input)
            if (!Array.isArray(obj)) throw new Error('For JSON to CSV, the root must be an array of objects')
            const csv = Papa.unparse(obj)
            return { output: csv, error: null as string | null }
        } catch (e: unknown) {
            return { output: '', error: (e as Error)?.message || 'Invalid input' }
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="CSV ↔ JSON"
            description="Convert between CSV and JSON locally."
            icon={FileJson}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('csv-to-json')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'csv-to-json' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        CSV to JSON
                    </button>
                    <button
                        onClick={() => setMode('json-to-csv')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'json-to-csv' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        JSON to CSV
                    </button>
                </div>

                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{computed.error}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'csv-to-json' ? 'name,age\nAlice,30' : '[{"name":"Alice","age":30}]'}
                        />
                    </div>
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
