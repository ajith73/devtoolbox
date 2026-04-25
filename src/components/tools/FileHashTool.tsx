import { useMemo, useState } from 'react'
import { Upload, Copy, Check, Settings, Clock, Shield, AlertCircle, TrendingUp, Database, Hash, File } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function digestFile(alg: string, file: File) {
    const data = await file.arrayBuffer()
    const out = await crypto.subtle.digest(alg, data)
    return toHex(out)
}

export function FileHashTool() {
    const [file, setFile] = useState<File | null>(null)
    const [alg, setAlg] = usePersistentState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('file_hash_alg', 'SHA-256')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hashHistory, setHashHistory] = usePersistentState<Array<{fileName: string, fileSize: number, algorithm: string, hash: string, timestamp: string}>>('file_hash_history', [])
    const [formatOutput, setFormatOutput] = usePersistentState('file_hash_format', 'pretty')
    const [uppercase, setUppercase] = usePersistentState('file_hash_uppercase', false)

    const meta = useMemo(() => {
        if (!file) return null
        return { name: file.name, type: file.type, size: file.size }
    }, [file])

    const canHash = useMemo(() => file !== null, [file])

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (fileName: string, fileSize: number, algorithm: string, hashValue: string) => {
        const newEntry = {
            fileName,
            fileSize,
            algorithm,
            hash: hashValue,
            timestamp: new Date().toISOString()
        }
        setHashHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const run = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setOutput('')
        try {
            const hex = await digestFile(alg, file)
            const formattedHex = uppercase ? hex.toUpperCase() : hex
            const formatted = formatOutput === 'raw' 
                ? formattedHex
                : JSON.stringify({ algorithm: alg, file: meta, hash: formattedHex }, null, 2)
            setOutput(formatted)
            addToHistory(file.name, file.size, alg, formattedHex)
        } catch (e: any) {
            setError(e?.message || 'Hash failed')
        } finally {
            setLoading(false)
        }
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) setFile(f)
    }

    const handleClearHistory = () => {
        setHashHistory([])
    }

    const handleHistoryClick = (entry: {fileName: string, fileSize: number, algorithm: string, hash: string}) => {
        setAlg(entry.algorithm as any)
        const formatted = formatOutput === 'raw' 
            ? entry.hash
            : JSON.stringify({ algorithm: entry.algorithm, file: { name: entry.fileName, type: 'unknown', size: entry.fileSize }, hash: entry.hash }, null, 2)
        setOutput(formatted)
    }

    return (
        <ToolLayout
            title="File Hash"
            description="Compute SHA hashes for a file locally using WebCrypto with advanced features."
            icon={Hash}
            onReset={() => { setFile(null); setOutput(''); setError(null) }}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Hash className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced File Hash</h2>
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
                            <span className="font-bold">File Hash Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced File Upload */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "p-8 glass rounded-[2.5rem] border transition-all bg-[var(--bg-secondary)]/30",
                        isDragging ? 'bg-brand/10 border-brand/40 scale-[1.01]' : 'border-[var(--border-primary)]'
                    )}
                >
                    <label className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                        <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-[var(--text-primary)]">Drop file or click to upload</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Processed locally</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) setFile(f)
                            }}
                        />
                    </label>
                </div>

                {/* File Info and Controls */}
                {file && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                            <div className="flex items-center space-x-2 mb-3">
                                <File className="w-4 h-4 text-brand" />
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">File Information</label>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-primary)]">Name:</span>
                                    <span className="text-sm text-[var(--text-muted)] font-mono truncate max-w-[200px]">{file.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-primary)]">Size:</span>
                                    <span className="text-sm text-[var(--text-muted)] font-mono">{(file.size / 1024).toFixed(2)} KB</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-primary)]">Type:</span>
                                    <span className="text-sm text-[var(--text-muted)] font-mono truncate max-w-[200px]">{file.type || 'Unknown'}</span>
                                </div>
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
                                disabled={!canHash || loading}
                                className={cn(
                                    'mt-4 w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                    canHash && !loading ? 'brand-gradient' : 'bg-white/10 opacity-50'
                                )}
                            >
                                {loading ? 'HASHING...' : 'HASH FILE'}
                            </button>
                        </div>
                    </div>
                )}

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
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">WebCrypto Security</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses browser's native WebCrypto API for secure SHA hash computation. All processing happens locally and never leaves your browser.
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
                                    <p className="text-xs">Upload a file to compute its hash</p>
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
                                                {entry.fileName}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                                {(entry.fileSize / 1024).toFixed(2)} KB • {entry.hash.substring(0, 60)}{entry.hash.length > 60 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your file hash history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
