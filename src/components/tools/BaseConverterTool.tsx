import { useMemo } from 'react'
import { Database } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function parseBigInt(value: string, base: number) {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return null

    const sign = trimmed.startsWith('-') ? -1n : 1n
    const body = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed

    const clean = body.replace(/_/g, '')
    if (!clean) return null

    const digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    const allowed = new Set(digits.slice(0, base).split(''))

    let n = 0n
    for (const ch of clean) {
        if (!allowed.has(ch)) throw new Error(`Invalid digit "${ch}" for base ${base}`)
        const d = BigInt(digits.indexOf(ch))
        n = n * BigInt(base) + d
    }

    return sign * n
}

function formatBigInt(value: bigint, base: number) {
    const sign = value < 0n ? '-' : ''
    const abs = value < 0n ? -value : value
    return sign + abs.toString(base)
}

export function BaseConverterTool() {
    const [input, setInput] = usePersistentState('base_converter_input', '')
    const [fromBase, setFromBase] = usePersistentState<number>('base_converter_from', 10)
    const [toBase, setToBase] = usePersistentState<number>('base_converter_to', 16)

    const computed = useMemo(() => {
        if (!input) return { output: '', error: null as string | null }
        try {
            if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
                throw new Error('Bases must be between 2 and 36')
            }
            const n = parseBigInt(input, fromBase)
            if (n === null) return { output: '', error: null as string | null }
            return { output: formatBigInt(n, toBase), error: null as string | null }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Invalid input' }
        }
    }, [input, fromBase, toBase])

    return (
        <ToolLayout
            title="Base Converter"
            description="Convert integers between bases 2 and 36 (supports big integers)."
            icon={Database}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">From base</label>
                        <input
                            type="number"
                            min={2}
                            max={36}
                            value={fromBase}
                            onChange={(e) => setFromBase(Number(e.target.value))}
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">To base</label>
                        <input
                            type="number"
                            min={2}
                            max={36}
                            value={toBase}
                            onChange={(e) => setToBase(Number(e.target.value))}
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Output</label>
                        <div className="font-mono text-sm break-words text-[var(--text-primary)]">
                            {computed.output || <span className="text-[var(--text-muted)] opacity-50 italic">—</span>}
                        </div>
                    </div>
                </div>

                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {computed.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[460px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input value</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder="Example: ff (base 16) or 101010 (base 2)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Digits: 0-9 and a-z. Underscores allowed.</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Result</label>
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
