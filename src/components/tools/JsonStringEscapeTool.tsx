import { useMemo } from 'react'
import { Braces } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function JsonStringEscapeTool() {
    const [input, setInput] = usePersistentState('json_string_escape_input', '')
    const [mode, setMode] = usePersistentState<'escape' | 'unescape'>('json_string_escape_mode', 'escape')

    const computed = useMemo(() => {
        if (!input) return { output: '', error: null as string | null }

        try {
            if (mode === 'escape') {
                return { output: JSON.stringify(input), error: null as string | null }
            }

            const trimmed = input.trim()
            const candidate = trimmed.startsWith('"') ? trimmed : `"${trimmed}"`
            return { output: JSON.parse(candidate), error: null as string | null }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Invalid JSON string' }
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="JSON String Escape"
            description="Escape text as a JSON string literal or unescape a JSON string back to text."
            icon={Braces}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('escape')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'escape' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Escape
                    </button>
                    <button
                        onClick={() => setMode('unescape')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'unescape' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Unescape
                    </button>
                </div>

                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {computed.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder={mode === 'escape' ? 'Type raw text...' : 'Paste a JSON string literal...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
