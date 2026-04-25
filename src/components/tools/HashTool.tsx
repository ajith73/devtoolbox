import { useState } from 'react'
import { Copy, Check, Settings, Search, Clock, Shield, AlertCircle, TrendingUp, Database, Hash } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function digest(alg: string, text: string) {
    const data = new TextEncoder().encode(text)
    const out = await crypto.subtle.digest(alg, data)
    return toHex(out)
}

export function HashTool() {
    const [input, setInput] = usePersistentState('hash_input', '')
    const [alg, setAlg] = usePersistentState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('hash_alg', 'SHA-256')
    const [output, setOutput] = usePersistentState('hash_output', '')
    const [error, setError] = usePersistentState<string | null>('hash_error', null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hashHistory, setHashHistory] = usePersistentState<Array<{input: string, algorithm: string, output: string, timestamp: string}>>('hash_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('hash_format', 'pretty')
    const [uppercase, setUppercase] = usePersistentState('hash_uppercase', false)

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (inputValue: string, algorithm: string, hashValue: string) => {
        const newEntry = {
            input: inputValue,
            algorithm,
            output: hashValue,
            timestamp: new Date().toISOString()
        }
        setHashHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const run = async () => {
        if (!input) return
        try {
            const hex = await digest(alg, input)
            const formattedHex = uppercase ? hex.toUpperCase() : hex
            const formatted = formatOutput === 'raw' 
                ? formattedHex
                : JSON.stringify({ algorithm: alg, hash: formattedHex, input: input.substring(0, 50) + (input.length > 50 ? '...' : '') }, null, 2)
            setOutput(formatted)
            addToHistory(input, alg, formattedHex)
        } catch (e: any) {
            setOutput('')
            setError(e?.message || 'Hash failed')
        }
    }

    const handleClearHistory = () => {
        setHashHistory([])
    }

    const handleHistoryClick = (entry: {input: string, algorithm: string, output: string}) => {
        setInput(entry.input)
        setAlg(entry.algorithm as any)
        const formatted = formatOutput === 'raw' 
            ? entry.output
            : JSON.stringify({ algorithm: entry.algorithm, hash: entry.output, input: entry.input.substring(0, 50) + (entry.input.length > 50 ? '...' : '') }, null, 2)
        setOutput(formatted)
    }

    return (
        <ToolLayout
            title="Hash Calculator"
            description="Compute SHA hashes locally using WebCrypto with advanced features."
            icon={Hash}
            onReset={() => { setInput(''); setOutput(''); setError(null) }}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Hash className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Hash Calculator</h2>
                            <p className="text-sm text-[var(--text-muted)]">SHA hash computation via WebCrypto API</p>
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
                            <span className="font-bold">Hash Calculation Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Search className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Input Text</label>
                        </div>
                        <textarea
                            className="w-full h-32 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono resize-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type text to hash..."
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {input.length} characters
                            </p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Database className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Algorithm</label>
                        </div>
                        <select value={alg} onChange={(e) => setAlg(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono">
                            <option value="SHA-1">SHA-1</option>
                            <option value="SHA-256">SHA-256</option>
                            <option value="SHA-384">SHA-384</option>
                            <option value="SHA-512">SHA-512</option>
                        </select>
                        <button
                            onClick={run}
                            disabled={!input}
                            className={cn(
                                'mt-4 w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                input ? 'brand-gradient' : 'bg-white/10 opacity-50'
                            )}
                        >
                            COMPUTE HASH
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
                                <label htmlFor="format_raw" className="text-sm text-[var(--text-primary)]">Raw Hash</label>
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
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">WebCrypto API</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses browser's native WebCrypto API for secure SHA hash computation. All processing happens locally.
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
                                    <p className="text-sm">No hash computed yet</p>
                                    <p className="text-xs">Enter text and select algorithm to compute hash</p>
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
                                disabled={hashHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    hashHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {hashHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {hashHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {entry.algorithm}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.input.substring(0, 50)}{entry.input.length > 50 ? '...' : ''}
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
                                    <p className="text-xs">Your hash computation history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
