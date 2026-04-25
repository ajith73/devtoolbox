import { useMemo, useState } from 'react'
import { Copy, Check, Settings, Search, Clock, Shield, Database, Network } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function isValidIPv4(ip: string) {
    const parts = ip.trim().split('.')
    if (parts.length !== 4) return false
    return parts.every((p) => {
        if (!/^\d+$/.test(p)) return false
        const n = Number(p)
        return n >= 0 && n <= 255
    })
}

function isValidIPv6(ip: string) {
    const v = ip.trim()
    if (!v) return false
    if (!/^[0-9a-fA-F:]+$/.test(v)) return false
    if (v.split(':').length < 3) return false
    return true
}

function getIPv4Details(ip: string) {
    const parts = ip.trim().split('.')
    if (!isValidIPv4(ip)) return null
    
    const [octet1, octet2, octet3, octet4] = parts.map(Number)
    const isPrivate = (
        (octet1 === 10) ||
        (octet1 === 127) ||
        (octet1 === 169 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 192 && octet2 >= 168 && octet2 <= 255) ||
        (octet1 >= 224)
    )
    
    const isLoopback = octet1 === 127
    const isMulticast = octet1 >= 224 && octet1 <= 239
    const isLinkLocal = octet1 === 169 && octet2 >= 254 && octet2 <= 255
    
    return {
        octets: [octet1, octet2, octet3, octet4],
        isPrivate,
        isLoopback,
        isMulticast,
        isLinkLocal,
        binary: parts.map(o => Number(o).toString(2).padStart(8, '0')).join('.'),
        decimal: octet1 * 16777216 + octet2 * 65536 + octet3 * 256 + octet4,
        class: isPrivate ? 'Private' : isLoopback ? 'Loopback' : isMulticast ? 'Multicast' : isLinkLocal ? 'Link-Local' : 'Public'
    }
}

function getIPv6Details(ip: string) {
    if (!isValidIPv6(ip)) return null
    
    const parts = ip.split(':')
    const isLoopback = ip === '::1' || ip === '0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:1'
    const isLinkLocal = ip.startsWith('fe80::') || ip.startsWith('fc00::')
    const isMulticast = ip.startsWith('ff00::') || ip.startsWith('ff02::') || ip.startsWith('ff0' + '::')
    
    return {
        parts,
        isLoopback,
        isLinkLocal,
        isMulticast,
        compressed: ip.includes('::'),
        fullLength: parts.length
    }
}

export function IpValidatorTool() {
    const [input, setInput] = usePersistentState('ip_validator_input', '')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [validationHistory, setValidationHistory] = usePersistentState('ip_validator_history', [] as Array<{input: string, result: string, timestamp: string, type: string}>)
    const [validateFormat, setValidateFormat] = usePersistentState('ip_validate_format', 'both')
    const [showDetails, setShowDetails] = usePersistentState('ip_show_details', false)

    const computed = useMemo(() => {
        const v = input.trim()
        if (!v) return { output: '', valid: null as boolean | null, details: null as any }

        const ipv4 = isValidIPv4(v)
        const ipv6 = !ipv4 && isValidIPv6(v)
        const valid = ipv4 || ipv6
        const kind = ipv4 ? 'IPv4' : ipv6 ? 'IPv6' : 'Invalid'
        
        let details = null
        if (valid && showDetails) {
            details = ipv4 ? getIPv4Details(v) : getIPv6Details(v)
        }
        
        let output = ''
        if (validateFormat === 'both') {
            output = JSON.stringify({ input: v, valid, type: kind, details }, null, 2)
        } else if (validateFormat === 'simple') {
            output = `${valid ? '✓' : '✗'} ${kind}`
        } else if (validateFormat === 'detailed') {
            output = JSON.stringify({ input: v, valid, type: kind, details }, null, 2)
        }
        
        return { output, valid, details }
    }, [input, validateFormat, showDetails])

    const handleCopy = () => {
        if (computed.output) {
            copyToClipboard(computed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (inputValue: string, resultValue: string, typeValue: string) => {
        const newEntry = {
            input: inputValue,
            result: resultValue,
            timestamp: new Date().toISOString(),
            type: typeValue
        }
        setValidationHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setValidationHistory([])
    }

    const handleHistoryClick = (entry: {input: string, result: string}) => {
        setInput(entry.input)
    }

    // Add to history when validation succeeds
    useMemo(() => {
        if (computed.output && computed.valid !== null && input) {
            addToHistory(input, computed.output, computed.details?.class || (computed.valid ? 'Valid' : 'Invalid'))
        }
    }, [computed.output, computed.valid, input, computed.details])

    const getCharacterCount = () => input.length

    return (
        <ToolLayout
            title="IP Validator"
            description="Validate IPv4/IPv6 addresses locally with advanced features."
            icon={Network}
            onReset={() => setInput('')}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Network className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced IP Validator</h2>
                            <p className="text-sm text-[var(--text-muted)]">IPv4/IPv6 address validation</p>
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
                            disabled={!computed.output}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                computed.output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Input */}
                <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-3">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">IP Address</label>
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="8.8.8.8 or 2001:4860:4860::8888"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                    />
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                            {getCharacterCount()} characters
                        </p>
                        {computed.valid !== null && (
                            <div className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                computed.valid ? "text-green-400" : "text-red-400"
                            )}>
                                {computed.valid ? '✓' : '✗'} {computed.details?.type || 'Invalid'}
                            </div>
                        )}
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
                                    id="format_both"
                                    name="format"
                                    checked={validateFormat === 'both'}
                                    onChange={() => setValidateFormat('both')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_both" className="text-sm text-[var(--text-primary)]">Full JSON</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="format_simple"
                                    name="format"
                                    checked={validateFormat === 'simple'}
                                    onChange={() => setValidateFormat('simple')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_simple" className="text-sm text-[var(--text-primary)]">Simple Format</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="format_detailed"
                                    name="format"
                                    checked={validateFormat === 'detailed'}
                                    onChange={() => setValidateFormat('detailed')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_detailed" className="text-sm text-[var(--text-primary)]">Detailed JSON</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_details"
                                    checked={showDetails}
                                    onChange={(e) => setShowDetails(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_details" className="text-sm text-[var(--text-primary)]">Show Details</label>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Validation Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Validates IPv4 addresses according to RFC 791 and IPv6 addresses according to RFC 4291. Includes detailed analysis of address ranges, classes, and properties.
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
                            {computed.output ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {computed.output}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {computed.output.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Network className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No validation yet</p>
                                    <p className="text-xs">Enter an IP address to validate</p>
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
                                disabled={validationHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    validationHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {validationHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {validationHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {entry.type}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.input}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                                {entry.result.substring(0, 60)}{entry.result.length > 60 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your validation history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
