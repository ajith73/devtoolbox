import { useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

async function fetchJson(url: string) {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.json()
}

export function IpLookupTool() {
    const [target, setTarget] = usePersistentState('ip_lookup_target', '')
    const [result, setResult] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const canLookupTarget = useMemo(() => target.trim().length > 0, [target])

    const lookupMyIp = async () => {
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const data = await fetchJson('https://jsonip.com')
            setResult(JSON.stringify(data, null, 2))
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch')
        } finally {
            setLoading(false)
        }
    }

    const lookupRdap = async () => {
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const q = target.trim()
            const url = `https://rdap.org/ip/${encodeURIComponent(q)}`
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
            title="IP Lookup"
            description="Lookup your public IP or query IP ownership data via RDAP (best-effort, depends on CORS)."
            icon={Globe}
            onReset={() => { setTarget(''); setResult(''); setError(null) }}
            onCopy={result ? () => copyToClipboard(result) : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">My IP</div>
                        <button
                            onClick={lookupMyIp}
                            disabled={loading}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {loading ? 'LOADING...' : 'GET PUBLIC IP'}
                        </button>
                    </div>

                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">RDAP (IP address)</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="8.8.8.8"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="flex-1"
                            />
                            <button
                                onClick={lookupRdap}
                                disabled={loading || !canLookupTarget}
                                className="px-6 py-3 glass rounded-2xl border-[var(--border-primary)] font-black text-xs tracking-widest text-[var(--text-secondary)] hover:text-brand disabled:opacity-50"
                            >
                                LOOKUP
                            </button>
                        </div>
                        <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">RDAP is a WHOIS-like JSON protocol. Some browsers may block via CORS.</p>
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
