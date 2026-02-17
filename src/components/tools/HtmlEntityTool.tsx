import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function encodeHtmlEntities(input: string) {
    const el = document.createElement('div')
    el.textContent = input
    return el.innerHTML
}

function decodeHtmlEntities(input: string) {
    const el = document.createElement('div')
    el.innerHTML = input
    return el.textContent ?? ''
}

export function HtmlEntityTool() {
    const [input, setInput] = usePersistentState('html_entity_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('html_entity_mode', 'encode')

    const output = useMemo(() => {
        if (!input) return ''
        try {
            return mode === 'encode' ? encodeHtmlEntities(input) : decodeHtmlEntities(input)
        } catch {
            return ''
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="HTML Entity"
            description="Encode or decode HTML entities locally in your browser."
            icon={Eye}
            onReset={() => setInput('')}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('encode')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'encode' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Encode
                    </button>
                    <button
                        onClick={() => setMode('decode')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'decode' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Decode
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder={mode === 'encode' ? 'Paste HTML or text to encode...' : 'Paste entities to decode...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
