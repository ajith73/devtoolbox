import { useMemo, useState } from 'react'
import { FileCode } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

async function fetchJson(url: string) {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.json()
}

function isIp(input: string) {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(input) || input.includes(':')
}

export function WhoisRdapTool() {
    const [query, setQuery] = usePersistentState('rdap_query', '')
    const [result, setResult] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const endpoint = useMemo(() => {
        const q = query.trim()
        if (!q) return null
        if (isIp(q)) return `https://rdap.org/ip/${encodeURIComponent(q)}`
        return `https://rdap.org/domain/${encodeURIComponent(q)}`
    }, [query])

    const run = async () => {
        if (!endpoint) return
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const data = await fetchJson(endpoint)
            setResult(JSON.stringify(data, null, 2))
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch (CORS or service)')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ToolLayout
            title="WHOIS (RDAP)"
            description="Lookup domain or IP registration data via RDAP (best-effort)."
            icon={FileCode}
            onReset={() => { setQuery(''); setResult(''); setError(null) }}
            onCopy={result ? () => copyToClipboard(result) : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-3">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Domain or IP</label>
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="example.com or 8.8.8.8" />
                        <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Uses rdap.org (free). May be blocked by CORS in some environments.</p>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={run}
                            disabled={loading || !endpoint}
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
