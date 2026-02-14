import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Database } from 'lucide-react'
import { format } from 'sql-formatter'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function SqlTool() {
    const [input, setInput] = usePersistentState('sql_input', '')
    const [output, setOutput] = useState('')

    useEffect(() => {
        if (!input.trim()) {
            setOutput('')
            return
        }
        try {
            const formatted = format(input, {
                language: 'sql',
                tabWidth: 2,
                keywordCase: 'upper'
            })
            setOutput(formatted)
        } catch (e: any) {
            setOutput(input) // fallback to raw
        }
    }, [input])

    return (
        <ToolLayout
            title="SQL Formatter"
            description="Prettify your SQL queries for better readability."
            icon={Database}
            onReset={() => { setInput(''); setOutput(''); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px] h-[600px]">
                <div className="flex flex-col space-y-4 group">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Query Source</label>
                    <textarea
                        className="flex-1 font-mono text-sm resize-none custom-scrollbar shadow-inner p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-[var(--text-primary)]"
                        placeholder="SELECT * FROM logic_nodes WHERE status = 'active' ORDER BY priority DESC;"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

                <div className="flex flex-col space-y-4 group">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-hover:text-brand">Engine Output</label>
                    <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm transition-all group-hover:shadow-brand/5">
                        <pre className="absolute inset-0 p-8 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all">
                            {output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[10px]">Synthetic formatting pending...</span>}
                        </pre>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
