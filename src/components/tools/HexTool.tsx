import { useMemo } from 'react'
import { Fingerprint } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function bytesToHex(bytes: Uint8Array) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

function hexToBytes(hex: string) {
    const normalized = hex.replace(/\s+/g, '').toLowerCase()
    if (!normalized) return new Uint8Array()
    if (normalized.length % 2 !== 0) throw new Error('Hex length must be even')

    const bytes = new Uint8Array(normalized.length / 2)
    for (let i = 0; i < normalized.length; i += 2) {
        const v = Number.parseInt(normalized.slice(i, i + 2), 16)
        if (Number.isNaN(v)) throw new Error('Invalid hex')
        bytes[i / 2] = v
    }
    return bytes
}

export function HexTool() {
    const [input, setInput] = usePersistentState('hex_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('hex_mode', 'encode')

    const computed = useMemo(() => {
        if (!input) return { output: '', error: null as string | null }

        try {
            if (mode === 'encode') {
                const bytes = new TextEncoder().encode(input)
                return { output: bytesToHex(bytes), error: null as string | null }
            }
            const bytes = hexToBytes(input)
            return { output: new TextDecoder().decode(bytes), error: null as string | null }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Invalid input' }
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="Hex Encode"
            description="Encode text to hex or decode hex back to text (UTF-8)."
            icon={Fingerprint}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
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
                            placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste hex (spaces allowed)...'}
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
