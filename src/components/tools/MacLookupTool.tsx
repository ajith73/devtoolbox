import { useMemo, useState } from 'react'
import { Fingerprint, Copy, Check, Settings, Search, Clock, AlertCircle, TrendingUp, Database, Wifi } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
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
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [lookupHistory, setLookupHistory] = usePersistentState<Array<{mac: string, result: string, timestamp: string}>>('mac_lookup_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('mac_lookup_format', 'pretty')

    const normalized = useMemo(() => normalizeMac(mac), [mac])
    const isValidMac = useMemo(() => normalized.length === 12, [normalized])

    const handleCopy = () => {
        if (result) {
            copyToClipboard(result)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (macValue: string, data: any) => {
        const newEntry = {
            mac: macValue,
            result: JSON.stringify(data, null, 2),
            timestamp: new Date().toISOString()
        }
        setLookupHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const run = async () => {
        if (!isValidMac) return
        setLoading(true)
        setError(null)
        setResult('')
        try {
            const url = `https://api.macvendors.com/${encodeURIComponent(normalized)}`
            const vendor = await fetchText(url)
            const formatted = formatOutput === 'raw' 
                ? JSON.stringify({ mac: normalized, vendor }, null, 2)
                : JSON.stringify({ mac: normalized, vendor }, null, 2)
            setResult(formatted)
            addToHistory(normalized, { mac: normalized, vendor })
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch (CORS or service)')
        } finally {
            setLoading(false)
        }
    }

    const handleClearHistory = () => {
        setLookupHistory([])
    }

    const handleHistoryClick = (entry: {mac: string, result: string}) => {
        setMac(entry.mac)
        setResult(entry.result)
    }

    return (
        <ToolLayout
            title="MAC Lookup"
            description="Lookup MAC vendor information with advanced features."
            icon={Fingerprint}
            onReset={() => { setMac(''); setResult(''); setError(null) }}
            onCopy={result ? handleCopy : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Fingerprint className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced MAC Lookup</h2>
                            <p className="text-sm text-[var(--text-muted)]">MAC vendor information via macvendors.com API</p>
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
                            <span className="font-bold">MAC Lookup Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Search className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">MAC Address</label>
                        </div>
                        <input 
                            type="text" 
                            value={mac} 
                            onChange={(e) => setMac(e.target.value)} 
                            placeholder="00:1A:2B:3C:4D:5E:6F"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        />
                        <div className="mt-3 flex items-center space-x-2">
                            <Wifi className="w-3 h-3 text-[var(--text-muted)]" />
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {isValidMac ? 'Valid MAC format' : 'Invalid MAC format'}
                            </p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Database className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Query</label>
                        </div>
                        <button
                            onClick={run}
                            disabled={loading || !isValidMac}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {loading ? 'QUERYING...' : 'LOOKUP MAC'}
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
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Database className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Service</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses macvendors.com for MAC vendor lookup. Some environments block via CORS.
                            </p>
                        </div>
                    </div>
                )}

                {/* Results and History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
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
                                    <p className="text-xs">Enter a MAC address to lookup vendor information</p>
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
                                                    {entry.mac}
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
                                    <p className="text-xs">Your MAC lookup history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
