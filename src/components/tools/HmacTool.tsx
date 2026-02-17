import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export function HmacTool() {
    const [message, setMessage] = usePersistentState('hmac_message', '')
    const [secret, setSecret] = usePersistentState('hmac_secret', '')
    const [alg, setAlg] = usePersistentState<'SHA-256' | 'SHA-384' | 'SHA-512'>('hmac_alg', 'SHA-256')
    const [output, setOutput] = usePersistentState('hmac_output', '')
    const [error, setError] = useState<string | null>(null)

    const run = async () => {
        setError(null)
        setOutput('')
        try {
            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(secret),
                { name: 'HMAC', hash: { name: alg } },
                false,
                ['sign']
            )
            const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
            const hex = toHex(sig)
            setOutput(JSON.stringify({ algorithm: `HMAC-${alg}`, hex }, null, 2))
        } catch (e: any) {
            setError(e?.message || 'HMAC failed')
        }
    }

    return (
        <ToolLayout
            title="HMAC Calculator"
            description="Compute HMAC signatures locally using WebCrypto."
            icon={ShieldCheck}
            onReset={() => { setMessage(''); setSecret(''); setOutput(''); setError(null) }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Algorithm</label>
                        <select value={alg} onChange={(e) => setAlg(e.target.value as any)}>
                            {['SHA-256', 'SHA-384', 'SHA-512'].map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Secret</label>
                        <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="secret key" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[420px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Message</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="message to sign"
                        />
                        <button
                            onClick={run}
                            disabled={!message || !secret}
                            className="px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            SIGN
                        </button>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
