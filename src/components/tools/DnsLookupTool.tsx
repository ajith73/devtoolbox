import { useState, useMemo } from 'react'
import { Copy, Check, Settings, Search, Server, Globe2, Clock, Shield, AlertCircle, TrendingUp, Zap } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
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
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [lookupHistory, setLookupHistory] = usePersistentState<Array<{name: string, type: string, result: string, timestamp: string}>>('dns_lookup_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('dns_format', 'pretty')

    const canLookup = useMemo(() => name.trim().length > 0, [name])

    const handleCopy = () => {
        if (result) {
            copyToClipboard(result)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (queryName: string, queryType: string, data: any) => {
        const newEntry = {
            name: queryName,
            type: queryType,
            result: JSON.stringify(data, null, 2),
            timestamp: new Date().toISOString()
        }
        setLookupHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const run = async () => {
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const url = `https://dns.google/resolve?name=${encodeURIComponent(name.trim())}&type=${encodeURIComponent(type)}`
            const data = await fetchJson(url)
            const formatted = formatOutput === 'raw' 
                ? JSON.stringify(data, null, 2)
                : JSON.stringify(data, null, 2)
            setResult(formatted)
            addToHistory(name.trim(), type, data)
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch (CORS or service)')
        } finally {
            setLoading(false)
        }
    }

    const handleClearHistory = () => {
        setLookupHistory([])
    }

    const handleHistoryClick = (entry: {name: string, type: string, result: string}) => {
        setName(entry.name)
        setType(entry.type as any)
        setResult(entry.result)
    }

    return (
        <ToolLayout
            title="DNS Lookup"
            description="Query DNS records using DNS-over-HTTPS (Google) with advanced features."
            icon={Globe2}
            onReset={() => { setName('example.com'); setResult(''); setError(null) }}
            onCopy={result ? handleCopy : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Globe2 className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced DNS Lookup</h2>
                            <p className="text-sm text-[var(--text-muted)]">DNS-over-HTTPS queries with Google's secure resolver</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!result}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                result ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold">DNS Lookup Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Search className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Domain Name</label>
                        </div>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="example.com"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        />
                    </div>

                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Server className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Record Type</label>
                        </div>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono">
                            <option value="A">A (IPv4 Address)</option>
                            <option value="AAAA">AAAA (IPv6 Address)</option>
                            <option value="CNAME">CNAME (Alias)</option>
                            <option value="MX">MX (Mail Exchange)</option>
                            <option value="TXT">TXT (Text Record)</option>
                            <option value="NS">NS (Name Server)</option>
                            <option value="SOA">SOA (Start of Authority)</option>
                            <option value="SRV">SRV (Service)</option>
                        </select>
                    </div>

                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Zap className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Query</label>
                        </div>
                        <button
                            onClick={run}
                            disabled={loading || !canLookup}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {loading ? 'QUERYING...' : 'LOOKUP DNS'}
                        </button>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="format_pretty"
                                    name="format"
                                    checked={formatOutput === 'pretty'}
                                    onChange={() => setFormatOutput('pretty')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_pretty" className="text-sm text-[var(--text-primary)]">Pretty JSON</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="format_raw"
                                    name="format"
                                    checked={formatOutput === 'raw'}
                                    onChange={() => setFormatOutput('raw')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_raw" className="text-sm text-[var(--text-primary)]">Raw JSON</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results and History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Results</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {result ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {result}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {result.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No results yet</p>
                                    <p className="text-xs">Enter a domain name and select record type to query</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                disabled={lookupHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    lookupHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {lookupHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {lookupHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {entry.name} ({entry.type})
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.result.substring(0, 100)}{entry.result.length > 100 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your DNS lookup history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
