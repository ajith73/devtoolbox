import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Braces, AlertCircle, CheckCircle2 } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function JsonTool() {
    const [input, setInput] = usePersistentState('json_input', '')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'pretty' | 'minify'>('pretty')

    const formatJson = (val: string, currentMode: 'pretty' | 'minify') => {
        if (!val.trim()) {
            setOutput('')
            setError(null)
            return
        }
        try {
            const parsed = JSON.parse(val)
            const formatted = currentMode === 'pretty'
                ? JSON.stringify(parsed, null, 2)
                : JSON.stringify(parsed)
            setOutput(formatted)
            setError(null)
        } catch (e: any) {
            setError(e.message)
            setOutput('')
        }
    }

    useEffect(() => {
        formatJson(input, mode)
    }, [input, mode])

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devbox-${mode}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="JSON Formatter"
            description="Validate, format, and minify your JSON data."
            icon={Braces}
            onReset={() => { setInput(''); setOutput(''); setError(null); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={output ? handleDownload : undefined}
        >
            <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[var(--bg-secondary)]/50 p-1 rounded-xl flex gap-1 border border-[var(--border-primary)] shadow-sm">
                        <button
                            onClick={() => setMode('pretty')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'pretty'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            Pretty Print
                        </button>
                        <button
                            onClick={() => setMode('minify')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'minify'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            Minify
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px] h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Raw JSON Stream</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none custom-scrollbar p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
                            placeholder='{ "action": "parse", "status": "pending" }'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
                                {mode === 'pretty' ? 'Formatted Output' : 'Minified Output'}
                            </label>
                            {input && (
                                <div className={cn(
                                    "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm",
                                    error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'
                                )}>
                                    {error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span className="tracking-[0.1em]">{error ? 'Syntax Violation' : 'Valid JSON'}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 group shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40">
                            {error ? (
                                <div className="absolute inset-0 p-10 text-red-500/80 font-mono text-sm overflow-auto custom-scrollbar">
                                    <div className="flex items-center space-x-3 mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="font-black uppercase tracking-widest text-[10px]">Parsing Error</p>
                                    </div>
                                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] italic leading-relaxed text-[11px] font-black opacity-80">
                                        {error}
                                    </div>
                                </div>
                            ) : (
                                <pre className={cn(
                                    "absolute inset-0 p-10 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all",
                                    mode === 'minify' && "whitespace-pre-wrap break-all"
                                )}>
                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[10px]">Waiting for input...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
