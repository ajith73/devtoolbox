import { Fingerprint } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function digest(alg: string, text: string) {
    const data = new TextEncoder().encode(text)
    const out = await crypto.subtle.digest(alg, data)
    return toHex(out)
}

export function HashTool() {
    const [input, setInput] = usePersistentState('hash_input', '')
    const [alg, setAlg] = usePersistentState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('hash_alg', 'SHA-256')

    const [output, setOutput] = usePersistentState('hash_output', '')
    const [error, setError] = usePersistentState<string | null>('hash_error', null)

    const run = async () => {
        if (!input) return
        try {
            const hex = await digest(alg, input)
            const txt = JSON.stringify({ algorithm: alg, hex }, null, 2)
            setOutput(txt)
        } catch (e: any) {
            setOutput('')
            setError(e?.message || 'Hash failed')
        }
    }

    return (
        <ToolLayout
            title="Hash Calculator"
            description="Compute SHA hashes locally using WebCrypto."
            icon={Fingerprint}
            onReset={() => { setInput(''); setOutput(''); setError(null) }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-3">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Input</label>
                        <textarea
                            className="h-32 font-mono text-sm resize-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type text to hash..."
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Algorithm</label>
                        <select value={alg} onChange={(e) => setAlg(e.target.value as any)}>
                            {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <button
                            onClick={run}
                            disabled={!input}
                            className={cn(
                                'mt-4 w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                input ? 'brand-gradient' : 'bg-white/10 opacity-50'
                            )}
                        >
                            HASH
                        </button>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
