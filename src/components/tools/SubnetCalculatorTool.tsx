import { useMemo, useState } from 'react'
import { Calculator, Copy, Check, Settings, Search, Clock, Shield, AlertCircle, TrendingUp, Database, Network, Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function ipToInt(ip: string) {
    const parts = ip.trim().split('.')
    if (parts.length !== 4) throw new Error('Invalid IPv4')
    const nums = parts.map((p) => {
        const n = Number(p)
        if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('Invalid IPv4')
        return n
    })
    return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3]
}

function intToIp(v: number) {
    return [
        (v >>> 24) & 255,
        (v >>> 16) & 255,
        (v >>> 8) & 255,
        v & 255,
    ].join('.')
}

function maskFromCidr(cidr: number) {
    if (cidr < 0 || cidr > 32) throw new Error('CIDR must be 0-32')
    if (cidr === 0) return 0
    return (0xffffffff << (32 - cidr)) >>> 0
}

function countHosts(cidr: number) {
    const hostBits = 32 - cidr
    if (hostBits <= 0) return 1
    return 2 ** hostBits
}

export function SubnetCalculatorTool() {
    const [input, setInput] = usePersistentState('subnet_input', '192.168.1.10/24')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [subnetHistory, setSubnetHistory] = usePersistentState<Array<{input: string, result: string, timestamp: string}>>('subnet_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('subnet_format', 'pretty')

    const computed = useMemo(() => {
        const raw = input.trim()
        if (!raw) return { error: null as string | null, data: null as any }

        try {
            const [ipPart, cidrPart] = raw.includes('/') ? raw.split('/') : [raw, '32']
            const cidr = Number(cidrPart)
            if (!Number.isInteger(cidr)) throw new Error('Invalid CIDR')
            const ipInt = ipToInt(ipPart)
            const mask = maskFromCidr(cidr)
            const network = (ipInt & mask) >>> 0
            const broadcast = (network | (~mask >>> 0)) >>> 0
            const total = countHosts(cidr)

            const firstUsable = cidr >= 31 ? network : (network + 1) >>> 0
            const lastUsable = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0
            const usableCount = cidr >= 31 ? total : Math.max(0, total - 2)

            const wildcard = (~mask) >>> 0

            const data = {
                input: raw,
                ip: intToIp(ipInt),
                cidr,
                subnetMask: intToIp(mask),
                wildcardMask: intToIp(wildcard),
                networkAddress: intToIp(network),
                broadcastAddress: intToIp(broadcast),
                firstUsable: intToIp(firstUsable),
                lastUsable: intToIp(lastUsable),
                totalAddresses: total,
                usableAddresses: usableCount,
            }

            return { error: null as string | null, data }
        } catch (e: any) {
            return { error: e?.message || 'Invalid input', data: null as any }
        }
    }, [input])

    const exportText = useMemo(() => {
        if (!computed.data) return ''
        return formatOutput === 'raw' 
            ? JSON.stringify(computed.data, null, 2)
            : JSON.stringify(computed.data, null, 2)
    }, [computed.data, formatOutput])

    const handleCopy = () => {
        if (exportText) {
            copyToClipboard(exportText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (inputValue: string, resultValue: string) => {
        const newEntry = {
            input: inputValue,
            result: resultValue,
            timestamp: new Date().toISOString()
        }
        setSubnetHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setSubnetHistory([])
    }

    const handleHistoryClick = (entry: {input: string, result: string}) => {
        setInput(entry.input)
    }

    // Add to history when computation succeeds
    useMemo(() => {
        if (computed.data && computed.error === null) {
            addToHistory(input, exportText)
        }
    }, [computed.data, computed.error, exportText, input])

    return (
        <ToolLayout
            title="Subnet Calculator"
            description="Calculate IPv4 subnet details from IP/CIDR with advanced features."
            icon={Network}
            onReset={() => setInput('')}
            onCopy={exportText ? handleCopy : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Network className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Subnet Calculator</h2>
                            <p className="text-sm text-[var(--text-muted)]">IPv4 subnet analysis and calculation</p>
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
                            disabled={!exportText}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                exportText ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold">Subnet Calculation Error</span>
                        </div>
                        {computed.error}
                    </div>
                )}

                {/* Enhanced Input */}
                <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-3">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">IP / CIDR</label>
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="192.168.1.10/24"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                    />
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                            Examples: 10.0.0.1/8, 172.16.0.1/12, 192.168.1.10/24
                        </p>
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
                                <Globe className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">IPv4 Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Calculates subnet mask, network address, broadcast address, usable IP ranges, and host counts for any IPv4 network.
                            </p>
                        </div>
                    </div>
                )}

                {/* Enhanced Results */}
                <div className="glass rounded-2xl border p-8 bg-[var(--bg-secondary)]/30">
                    {computed.data ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <EnhancedRow k="Subnet Mask" v={computed.data.subnetMask} icon={Shield} />
                            <EnhancedRow k="Wildcard Mask" v={computed.data.wildcardMask} icon={Database} />
                            <EnhancedRow k="Network Address" v={computed.data.networkAddress} icon={Network} />
                            <EnhancedRow k="Broadcast Address" v={computed.data.broadcastAddress} icon={Globe} />
                            <EnhancedRow k="First Usable" v={computed.data.firstUsable} icon={TrendingUp} />
                            <EnhancedRow k="Last Usable" v={computed.data.lastUsable} icon={TrendingUp} />
                            <EnhancedRow k="Total Addresses" v={String(computed.data.totalAddresses)} icon={Database} />
                            <EnhancedRow k="Usable Addresses" v={String(computed.data.usableAddresses)} icon={Database} />
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-muted)] opacity-50">
                            <Calculator className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">Enter an IP/CIDR to calculate...</p>
                            <p className="text-xs">Subnet details will appear here</p>
                        </div>
                    )}
                </div>

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
                            {exportText ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {exportText}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {exportText.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No results yet</p>
                                    <p className="text-xs">Enter IP/CIDR to calculate subnet details</p>
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
                                disabled={subnetHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    subnetHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {subnetHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {subnetHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {entry.input}
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
                                    <p className="text-xs">Your subnet calculation history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function EnhancedRow({ k, v, icon: Icon }: { k: string, v: string, icon: any }) {
    return (
        <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-tertiary)]/50 transition-all">
            <div className="flex items-center space-x-2 mb-2">
                <Icon className="w-4 h-4 text-brand" />
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{k}</div>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono break-words">{v}</div>
        </div>
    )
}
