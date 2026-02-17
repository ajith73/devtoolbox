import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

import prettier from 'prettier/standalone'
import htmlPlugin from 'prettier/plugins/html'

export function HtmlFormatterTool() {
    const [input, setInput] = usePersistentState('html_formatter_input', '')
    const [output, setOutput] = usePersistentState('html_formatter_output', '')
    const [error, setError] = useState<string | null>(null)

    const canFormat = useMemo(() => input.trim().length > 0, [input])

    const format = async () => {
        setError(null)
        setOutput('')
        try {
            const formatted = await prettier.format(input, {
                parser: 'html',
                plugins: [htmlPlugin],
            })
            setOutput(formatted)
        } catch (e: any) {
            setError(e?.message || 'Format failed')
        }
    }

    return (
        <ToolLayout
            title="HTML Formatter"
            description="Format HTML using Prettier (runs locally)."
            icon={Eye}
            onReset={() => { setInput(''); setOutput(''); setError(null) }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Input</label>
                        <textarea
                            className="h-40 font-mono text-xs resize-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="<div><span>hello</span></div>"
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={format}
                            disabled={!canFormat}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            FORMAT
                        </button>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Formatted output will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
