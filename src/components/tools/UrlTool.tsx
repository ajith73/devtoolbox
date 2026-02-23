import { useMemo } from 'react'
import {
    Settings,
    Terminal,
    FileJson,
    ShieldAlert,
    Globe,
    Copy,
    Download,
    Upload,
    ArrowRight,
    Search,
    RefreshCcw,
    Layers,
    Code
} from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// --- Types ---
type UrlMode = 'standard' | 'parser' | 'bulk' | 'compare'
type EncodeScope = 'full' | 'query' | 'path' | 'fragment'

interface ParsedUrl {
    href: string
    protocol: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string
    params: Record<string, string>
}

// --- Helper Functions ---
function safeParseUrl(input: string): URL | null {
    const trimmed = input.trim()
    if (!trimmed) return null
    try {
        return new URL(trimmed)
    } catch {
        try {
            // Try to parse as relative or incomplete URL
            if (!trimmed.includes('://') && !trimmed.startsWith('//')) {
                return new URL('https://' + trimmed)
            }
            return new URL(trimmed, 'https://example.com')
        } catch {
            return null
        }
    }
}

function detectUrlState(input: string): 'encoded' | 'decoded' | 'mixed' {
    if (!input) return 'decoded'
    const hasPercent = /%[0-9A-Fa-f]{2}/.test(input)
    const hasUnsafe = /[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]/.test(input)

    if (hasPercent && !hasUnsafe) return 'encoded'
    if (!hasPercent && hasUnsafe) return 'decoded'
    if (hasPercent && hasUnsafe) return 'mixed'
    return 'decoded'
}

function normalizeUrl(input: string): string {
    try {
        const url = safeParseUrl(input)
        if (!url) return input
        // Standard normalizations
        let result = url.protocol.toLowerCase() + '//' + url.hostname.toLowerCase()
        if (url.port) result += ':' + url.port
        result += url.pathname.replace(/\/+/g, '/') // Remove duplicate slashes
        if (url.search) result += url.search
        if (url.hash) result += url.hash
        return result
    } catch {
        return input
    }
}

// --- Main Component ---
export function UrlTool() {
    const [mode, setMode] = usePersistentState<UrlMode>('url_v2_mode', 'standard')
    const [input, setInput] = usePersistentState('url_v2_input', '')
    const [scope, setScope] = usePersistentState<EncodeScope>('url_v2_scope', 'full')
    const [autoDetect, setAutoDetect] = usePersistentState('url_v2_auto', true)

    // Internal states
    const [bulkInput, setBulkInput] = usePersistentState('url_v2_bulk', '')
    const [base64Combo, setBase64Combo] = usePersistentState('url_v2_b64', false)

    // Parse logic
    const parsed = useMemo(() => {
        const url = safeParseUrl(input)
        if (!url) return null

        const params: Record<string, string> = {}
        url.searchParams.forEach((val, key) => {
            params[key] = val
        })

        return {
            href: url.href,
            protocol: url.protocol,
            host: url.host,
            hostname: url.hostname,
            port: url.port,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            params
        } as ParsedUrl
    }, [input])

    // Main conversion logic
    const output = useMemo(() => {
        if (!input.trim()) return ''

        try {
            const detectedMode = detectUrlState(input)
            const isEncoded = detectedMode === 'encoded'
            const activeAction = autoDetect
                ? (isEncoded ? 'decode' : 'encode')
                : 'encode' // UI should really have a toggle but user asked for auto-detect

            let result = input

            if (activeAction === 'encode') {
                if (scope === 'full') {
                    result = encodeURIComponent(input)
                } else if (scope === 'query') {
                    const url = safeParseUrl(input)
                    if (url) {
                        const base = url.origin + url.pathname
                        const query = url.search
                        result = base + '?' + encodeURIComponent(query.startsWith('?') ? query.slice(1) : query)
                        if (url.hash) result += url.hash
                    } else {
                        result = encodeURIComponent(input)
                    }
                } else if (scope === 'path') {
                    const url = safeParseUrl(input)
                    if (url) {
                        result = url.origin + encodeURI(url.pathname) + url.search + url.hash
                    }
                } else if (scope === 'fragment') {
                    const parts = input.split('#')
                    if (parts.length > 1) {
                        result = parts[0] + '#' + encodeURIComponent(parts[1])
                    }
                }
            } else {
                result = decodeURIComponent(input)
            }

            if (base64Combo && activeAction === 'encode') {
                result = btoa(result)
                result = encodeURIComponent(result)
            }

            return result
        } catch (e) {
            return 'Malformed URI Component'
        }
    }, [input, scope, autoDetect, base64Combo])

    // Security Checks
    const securityWarnings = useMemo(() => {
        const warnings = []
        if (/<script|alert\(|javascript:/i.test(input)) {
            warnings.push('Potential XSS / Script Injection detected in input.')
        }
        if (input.includes('admin') || input.includes('config')) {
            warnings.push('URL contains sensitive routing patterns.')
        }
        return warnings
    }, [input])

    // Comparison Logic
    const comparisons = useMemo(() => {
        if (!input.trim()) return null
        return {
            encodeURI: encodeURI(input),
            encodeURIComponent: encodeURIComponent(input),
            escape: escape(input)
        }
    }, [input])

    // Bulk logic
    const bulkOutput = useMemo(() => {
        if (!bulkInput.trim()) return []
        return bulkInput.split('\n').map(line => {
            try {
                return encodeURIComponent(line.trim())
            } catch {
                return 'ERROR'
            }
        })
    }, [bulkInput])

    // --- Handlers ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            setBulkInput(event.target?.result as string)
            setMode('bulk')
        }
        reader.readAsText(file)
    }

    const downloadBulk = () => {
        const content = bulkOutput.join('\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'devbox-urls-encoded.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    const setQueryParam = (key: string, val: string) => {
        try {
            const url = new URL(input)
            url.searchParams.set(key, val)
            setInput(url.href)
        } catch (e) {
            // If not a full URL, we can't easily edit params as URL object
            const up = new URLSearchParams(input.includes('?') ? input.split('?')[1] : input)
            up.set(key, val)
            const parts = input.split('?')
            setInput(parts[0] + (input.includes('?') ? '?' : '') + up.toString())
        }
    }

    return (
        <ToolLayout
            title="Professional URL Tool"
            description="Smart encoder, decoder, parser, and mass-transformer with security auditing."
            icon={Globe}
            onReset={() => { setInput(''); setBulkInput(''); }}
            onCopy={() => { copyToClipboard(output); }}
        >
            <div className="space-y-6">
                {/* Mode Switcher */}
                <div className="flex flex-wrap gap-2 p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] w-fit mx-auto">
                    {(['standard', 'parser', 'bulk', 'compare'] as UrlMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === m
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {mode !== 'bulk' && (
                    <div className="space-y-6">
                        {/* Universal Input Area */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                            <div className="relative glass rounded-[2.5rem] p-6 border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <Terminal className="w-4 h-4 text-brand" />
                                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Entropy Stream Entry</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setAutoDetect(!autoDetect)}
                                            className={cn(
                                                "flex items-center space-x-2 px-3 py-1 rounded-full border transition-all",
                                                autoDetect ? "bg-brand/10 border-brand/40 text-brand" : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)]"
                                            )}
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-widest">Auto Detect: {autoDetect ? 'ON' : 'OFF'}</span>
                                        </button>
                                        <button
                                            onClick={() => setInput(normalizeUrl(input))}
                                            className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline"
                                        >
                                            Normalize URL
                                        </button>
                                        <div className="flex items-center space-x-2">
                                            <div className={cn("w-2 h-2 rounded-full", detectUrlState(input) === 'encoded' ? "bg-purple-500 shadow-[0_0_8px_purple]" : "bg-emerald-500 shadow-[0_0_8px_emerald]")} />
                                            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                                                {detectUrlState(input).toUpperCase()} DETECTED
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <textarea
                                    className="w-full h-32 bg-[var(--input-bg)] border-[var(--border-primary)] rounded-2xl p-6 font-mono text-sm resize-none focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                                    placeholder="Paste URL, query string, or encoded junk here..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                {securityWarnings.length > 0 && (
                                    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start space-x-3">
                                        <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            {securityWarnings.map((w, i) => (
                                                <p key={i} className="text-[10px] text-orange-400 font-bold uppercase tracking-tight">{w}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {mode === 'standard' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Configuration Card */}
                                <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <Settings className="w-4 h-4 text-brand" />
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Conversion Scope</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['full', 'query', 'path', 'fragment'] as EncodeScope[]).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setScope(s)}
                                                className={cn(
                                                    "p-4 rounded-xl border text-left transition-all group",
                                                    scope === s ? "bg-brand/10 border-brand ring-4 ring-brand/5" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                                )}
                                            >
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest", scope === s ? "text-brand" : "text-[var(--text-secondary)]")}>{s} Segment</p>
                                                <p className="text-[8px] text-[var(--text-muted)] mt-1 opacity-60">
                                                    {s === 'full' ? 'Clobber the entire string' : `Target only ${s} logic`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-[var(--border-primary)]">
                                        <button
                                            onClick={() => setBase64Combo(!base64Combo)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                                                base64Combo ? "bg-purple-500/10 border-purple-500/40" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                            )}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Layers className="w-4 h-4 text-purple-400" />
                                                <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Stack Base64 Logic</span>
                                            </div>
                                            <div className={cn("w-10 h-5 rounded-full relative transition-colors", base64Combo ? "bg-purple-500" : "bg-[var(--border-primary)]")}>
                                                <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", base64Combo ? "left-6" : "left-1")} />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Output Card */}
                                <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <RefreshCcw className="w-4 h-4 text-brand" />
                                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Transform Result</h3>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(output)}
                                            className="p-2 hover:bg-brand/10 rounded-lg text-brand transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 min-h-[160px] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <Code className="w-20 h-20 text-brand" />
                                        </div>
                                        <pre className="text-sm font-mono text-brand break-all whitespace-pre-wrap select-all relative z-10 leading-relaxed">
                                            {output || 'Synthetic output awaiting stream...'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'parser' && parsed && (
                            <div className="space-y-6">
                                {/* Visual Breakdown */}
                                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <div className="flex items-center space-x-3 mb-8">
                                        <Search className="w-4 h-4 text-brand" />
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Structural Extraction</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Protocol', val: parsed.protocol, color: 'text-blue-400' },
                                            { label: 'Hostname', val: parsed.hostname, color: 'text-brand' },
                                            { label: 'Port', val: parsed.port || 'Default', color: 'text-purple-400' },
                                            { label: 'Path', val: parsed.pathname, color: 'text-amber-400' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-4 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-2xl">
                                                <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1 tracking-widest">{item.label}</p>
                                                <p className={cn("text-xs font-mono font-bold truncate", item.color)}>{item.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Query Params Modifier */}
                                    <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center space-x-2">
                                                <FileJson className="w-4 h-4 text-brand" />
                                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Query Parameters Map</span>
                                            </div>
                                            <span className="text-[10px] font-black text-brand bg-brand/10 px-3 py-1 rounded-full uppercase">
                                                {Object.keys(parsed.params).length} Values Found
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {Object.keys(parsed.params).length === 0 ? (
                                                <div className="text-center py-8 opacity-30 text-[10px] font-black uppercase tracking-widest italic">No query parameters detected in stream</div>
                                            ) : (
                                                Object.entries(parsed.params).map(([k, v], i) => (
                                                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex items-center space-x-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl group hover:border-brand/40 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                                                <span className="text-[10px] font-black text-brand">{i + 1}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-0.5">Key</p>
                                                                <p className="text-xs font-mono font-bold truncate text-[var(--text-secondary)]">{k}</p>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={v}
                                                                onChange={(e) => setQueryParam(k, e.target.value)}
                                                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-brand/20 outline-none"
                                                            />
                                                            <ArrowRight className="absolute right-3 top-3 w-4 h-4 text-[var(--text-muted)] opacity-20" />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'compare' && comparisons && (
                            <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                <div className="flex items-center space-x-3 mb-8">
                                    <Layers className="w-4 h-4 text-brand" />
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Binary Logic Comparison</h3>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(comparisons).map(([key, val]) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black text-brand font-mono uppercase tracking-widest">{key}()</span>
                                                <button onClick={() => copyToClipboard(val)} className="text-[8px] font-black uppercase text-[var(--text-muted)] hover:text-brand">Copy Protocol</button>
                                            </div>
                                            <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl font-mono text-xs break-all text-[var(--text-secondary)]">
                                                {val}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'bulk' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Mass Entry Stream</label>
                                    <label className="cursor-pointer flex items-center space-x-2 px-4 py-1.5 bg-brand/10 text-brand rounded-full text-[9px] font-black uppercase hover:bg-brand hover:text-white transition-all">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Import Data</span>
                                        <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.csv" />
                                    </label>
                                </div>
                                <textarea
                                    className="w-full h-[400px] bg-[var(--input-bg)] border-[var(--border-primary)] rounded-[2.5rem] p-8 font-mono text-sm resize-none focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                                    placeholder="Paste multiple URLs here (one per line)..."
                                    value={bulkInput}
                                    onChange={(e) => setBulkInput(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Entropy Transform Output</label>
                                    <button
                                        onClick={downloadBulk}
                                        className="flex items-center space-x-2 px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-[9px] font-black uppercase hover:bg-purple-400 hover:text-white transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export TXT</span>
                                    </button>
                                </div>
                                <div className="h-[400px] glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <pre className="h-full p-8 text-brand font-mono text-sm overflow-auto custom-scrollbar whitespace-pre leading-relaxed">
                                        {bulkOutput.join('\n') || <span className="text-[var(--text-muted)] opacity-30 italic">No output buffered...</span>}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
