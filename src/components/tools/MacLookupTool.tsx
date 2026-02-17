import { useMemo, useState } from 'react'
import { Fingerprint } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

async function fetchText(url: string) {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.text()
}

function normalizeMac(mac: string) {
    return mac.trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase()
}

export function MacLookupTool() {
    const [mac, setMac] = usePersistentState('mac_lookup_mac', '')
    const [result, setResult] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const normalized = useMemo(() => normalizeMac(mac), [mac])

    const run = async () => {
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const url = `https://api.macvendors.com/${encodeURIComponent(normalized)}`
            const vendor = await fetchText(url)
            setResult(JSON.stringify({ mac: normalized, vendor }, null, 2))
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch (CORS or service)')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ToolLayout
            title="MAC Lookup"
            description="Lookup MAC vendor information (best-effort; depends on public API + CORS)."
            icon={Fingerprint}
            onReset={() => { setMac(''); setResult(''); setError(null) }}
            onCopy={result ? () => copyToClipboard(result) : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-3">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">MAC Address</label>
                        <input
                            type="text"
                            value={mac}
                            onChange={(e) => setMac(e.target.value)}
                            placeholder="00:1A:2B:3C:4D:5E"
                        />
                        <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Uses api.macvendors.com. Some environments block via CORS.</p>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={run}
                            disabled={loading || normalized.length < 6}
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
