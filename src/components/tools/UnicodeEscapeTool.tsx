import { useMemo } from 'react'
import { Type } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function encodeUnicode(input: string) {
    const cps = Array.from(input)
    return cps
        .map((ch) => {
            const cp = ch.codePointAt(0) ?? 0
            if (cp <= 0xffff) return `\\u${cp.toString(16).padStart(4, '0')}`
            return `\\u{${cp.toString(16)}}`
        })
        .join('')
}

function decodeUnicode(input: string) {
    let out = input

    out = out.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) => {
        const cp = Number.parseInt(hex, 16)
        if (!Number.isFinite(cp)) return _
        try {
            return String.fromCodePoint(cp)
        } catch {
            return _
        }
    })

    out = out.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => {
        const cp = Number.parseInt(hex, 16)
        if (!Number.isFinite(cp)) return _
        return String.fromCharCode(cp)
    })

    return out
}

export function UnicodeEscapeTool() {
    const [input, setInput] = usePersistentState('unicode_escape_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('unicode_escape_mode', 'encode')

    const output = useMemo(() => {
        if (!input) return ''
        try {
            return mode === 'encode' ? encodeUnicode(input) : decodeUnicode(input)
        } catch {
            return ''
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="Unicode Escape"
            description="Convert text to Unicode escape sequences and back."
            icon={Type}
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
                            placeholder={mode === 'encode' ? 'Type text to escape...' : 'Paste \\uXXXX or \\u{...} sequences...'}
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
