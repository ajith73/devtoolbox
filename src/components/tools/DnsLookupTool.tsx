import { useState } from 'react'
import { Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

async function fetchJson(url: string) {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.json()
}

export function DnsLookupTool() {
    const [name, setName] = usePersistentState('dns_name', 'example.com')
    const [type, setType] = usePersistentState('dns_type', 'A')
    const [result, setResult] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const run = async () => {
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const url = `https://dns.google/resolve?name=${encodeURIComponent(name.trim())}&type=${encodeURIComponent(type)}`
            const data = await fetchJson(url)
            setResult(JSON.stringify(data, null, 2))
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch (CORS or service)')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ToolLayout
            title="DNS Lookup"
            description="Query DNS records using DNS-over-HTTPS (Google)."
            icon={Globe}
            onReset={() => { setName(''); setResult(''); setError(null) }}
            onCopy={result ? () => copyToClipboard(result) : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={run}
                            disabled={loading || !name.trim()}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {loading ? 'LOADING...' : 'LOOKUP'}
                        </button>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {result || <span className="text-[var(--text-muted)] opacity-30 italic">Results will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
