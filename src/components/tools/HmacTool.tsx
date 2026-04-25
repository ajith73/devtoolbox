import { useState, useMemo } from 'react'
import { ShieldCheck, Copy, Check, Settings, Search, Clock, Shield, AlertCircle, TrendingUp, Database, Key } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
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
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hmacHistory, setHmacHistory] = usePersistentState<Array<{message: string, secret: string, algorithm: string, output: string, timestamp: string}>>('hmac_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('hmac_format', 'pretty')
    const [uppercase, setUppercase] = usePersistentState('hmac_uppercase', false)

    const canSign = useMemo(() => message.length > 0 && secret.length > 0, [message, secret])

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (messageValue: string, secretValue: string, algorithm: string, hmacValue: string) => {
        const newEntry = {
            message: messageValue,
            secret: secretValue,
            algorithm,
            output: hmacValue,
            timestamp: new Date().toISOString()
        }
        setHmacHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

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
            const formattedHex = uppercase ? hex.toUpperCase() : hex
            const formatted = formatOutput === 'raw' 
                ? formattedHex
                : JSON.stringify({ algorithm: `HMAC-${alg}`, hmac: formattedHex, message: message.substring(0, 50) + (message.length > 50 ? '...' : '') }, null, 2)
            setOutput(formatted)
            addToHistory(message, secret, alg, formattedHex)
        } catch (e: any) {
            setError(e?.message || 'HMAC failed')
        }
    }

    const handleClearHistory = () => {
        setHmacHistory([])
    }

    const handleHistoryClick = (entry: {message: string, secret: string, algorithm: string, output: string}) => {
        setMessage(entry.message)
        setSecret(entry.secret)
        setAlg(entry.algorithm as any)
        const formatted = formatOutput === 'raw' 
            ? entry.output
            : JSON.stringify({ algorithm: `HMAC-${entry.algorithm}`, hmac: entry.output, message: entry.message.substring(0, 50) + (entry.message.length > 50 ? '...' : '') }, null, 2)
        setOutput(formatted)
    }

    return (
        <ToolLayout
            title="HMAC Calculator"
            description="Compute HMAC signatures locally using WebCrypto with advanced features."
            icon={Key}
            onReset={() => { setMessage(''); setSecret(''); setOutput(''); setError(null) }}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Key className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced HMAC Calculator</h2>
                            <p className="text-sm text-[var(--text-muted)]">HMAC signature computation via WebCrypto API</p>
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
                            disabled={!output}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
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
                            <span className="font-bold">HMAC Calculation Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Database className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Algorithm</label>
                        </div>
                        <select value={alg} onChange={(e) => setAlg(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono">
                            <option value="SHA-256">HMAC-SHA256</option>
                            <option value="SHA-384">HMAC-SHA384</option>
                            <option value="SHA-512">HMAC-SHA512</option>
                        </select>
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Shield className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Secret Key</label>
                        </div>
                        <input 
                            type="text" 
                            value={secret} 
                            onChange={(e) => setSecret(e.target.value)} 
                            placeholder="Enter secret key..."
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {secret.length} characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Input and Sign Button */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Search className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Message</label>
                        </div>
                        <textarea
                            className="w-full h-32 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter message to sign..."
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {message.length} characters
                            </p>
                        </div>
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Sign</label>
                        </div>
                        <button
                            onClick={run}
                            disabled={!canSign}
                            className={cn(
                                'w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                canSign ? 'brand-gradient' : 'bg-white/10 opacity-50'
                            )}
                        >
                            COMPUTE HMAC
                        </button>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <label htmlFor="format_raw" className="text-sm text-[var(--text-primary)]">Raw HMAC</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="uppercase"
                                    checked={uppercase}
                                    onChange={(e) => setUppercase(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="uppercase" className="text-sm text-[var(--text-primary)]">Uppercase</label>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">WebCrypto Security</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses browser's native WebCrypto API for secure HMAC computation. All processing happens locally and never leaves your browser.
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
                            {output ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {output}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {output.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No HMAC computed yet</p>
                                    <p className="text-xs">Enter message and secret key to compute HMAC</p>
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
                                disabled={hmacHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    hmacHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {hmacHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {hmacHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    HMAC-{entry.algorithm}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.message.substring(0, 50)}{entry.message.length > 50 ? '...' : ''}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                                {entry.output.substring(0, 60)}{entry.output.length > 60 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your HMAC computation history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
