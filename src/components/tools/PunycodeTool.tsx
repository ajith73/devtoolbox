import { useMemo } from 'react'
import { Link } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import punycode from 'punycode/'

function toAscii(input: string) {
    // Convert each label to ASCII (xn--)
    return input
        .split('.')
        .map((label) => punycode.toASCII(label))
        .join('.')
}

function toUnicode(input: string) {
    return input
        .split('.')
        .map((label) => punycode.toUnicode(label))
        .join('.')
}

export function PunycodeTool() {
    const [input, setInput] = usePersistentState('punycode_input', '')
    const [mode, setMode] = usePersistentState<'to-ascii' | 'to-unicode'>('punycode_mode', 'to-ascii')

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null }
        try {
            const out = mode === 'to-ascii' ? toAscii(input.trim()) : toUnicode(input.trim())
            return { output: out, error: null as string | null }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Conversion failed' }
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="Punycode"
            description="Convert internationalized domain names between Unicode and ASCII (xn--)."
            icon={Link}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('to-ascii')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'to-ascii' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        To ASCII
                    </button>
                    <button
                        onClick={() => setMode('to-unicode')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'to-unicode' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        To Unicode
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
                            placeholder={mode === 'to-ascii' ? 'münich.com' : 'xn--mnich-kva.com'}
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
