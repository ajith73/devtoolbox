import { useMemo, useState, useRef } from 'react'
import { Database, Upload, Copy, CheckCircle, AlertCircle, FileText, Binary, Calculator, History, ArrowRightLeft, RefreshCw, Zap } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced base conversion functions
function parseBigInt(value: string, base: number) {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return null

    const sign = trimmed.startsWith('-') ? -1n : 1n
    const body = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed

    const clean = body.replace(/_/g, '')
    if (!clean) return null

    const digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    const allowed = new Set(digits.slice(0, base).split(''))

    let n = 0n
    for (const ch of clean) {
        if (!allowed.has(ch)) throw new Error(`Invalid digit "${ch}" for base ${base}`)
        const d = BigInt(digits.indexOf(ch))
        n = n * BigInt(base) + d
    }

    return sign * n
}

function formatBigInt(value: bigint, base: number, options: { uppercase?: boolean, groupSize?: number, prefix?: string } = {}) {
    const { uppercase = false, groupSize = 0, prefix = '' } = options
    const sign = value < 0n ? '-' : ''
    const abs = value < 0n ? -value : value
    let result = abs.toString(base)
    
    if (uppercase) result = result.toUpperCase()
    if (groupSize > 0) {
        const groups = []
        for (let i = result.length; i > 0; i -= groupSize) {
            groups.unshift(result.slice(Math.max(0, i - groupSize), i))
        }
        result = groups.join('_')
    }
    
    return sign + prefix + result
}

function getBaseInfo(base: number) {
    const bases: Record<number, { name: string, prefix: string, example: string, description: string }> = {
        2: { name: 'Binary', prefix: '0b', example: '1010', description: 'Base 2: 0 and 1' },
        3: { name: 'Ternary', prefix: '', example: '101', description: 'Base 3: 0, 1, 2' },
        4: { name: 'Quaternary', prefix: '', example: '22', description: 'Base 4: 0-3' },
        5: { name: 'Quinary', prefix: '', example: '20', description: 'Base 5: 0-4' },
        6: { name: 'Senary', prefix: '', example: '14', description: 'Base 6: 0-5' },
        7: { name: 'Septenary', prefix: '', example: '13', description: 'Base 7: 0-6' },
        8: { name: 'Octal', prefix: '0o', example: '12', description: 'Base 8: 0-7' },
        9: { name: 'Nonary', prefix: '', example: '11', description: 'Base 9: 0-8' },
        10: { name: 'Decimal', prefix: '', example: '10', description: 'Base 10: 0-9' },
        11: { name: 'Undecimal', prefix: '', example: 'a', description: 'Base 11: 0-9, a' },
        12: { name: 'Duodecimal', prefix: '', example: 'a', description: 'Base 12: 0-9, a-b' },
        13: { name: 'Tridecimal', prefix: '', example: 'a', description: 'Base 13: 0-9, a-c' },
        14: { name: 'Tetradecimal', prefix: '', example: 'a', description: 'Base 14: 0-9, a-d' },
        15: { name: 'Pentadecimal', prefix: '', example: 'a', description: 'Base 15: 0-9, a-e' },
        16: { name: 'Hexadecimal', prefix: '0x', example: 'a', description: 'Base 16: 0-9, a-f' },
        17: { name: 'Heptadecimal', prefix: '', example: 'g', description: 'Base 17: 0-9, a-g' },
        18: { name: 'Octodecimal', prefix: '', example: 'h', description: 'Base 18: 0-9, a-h' },
        19: { name: 'Enneadecimal', prefix: '', example: 'i', description: 'Base 19: 0-9, a-i' },
        20: { name: 'Vigesimal', prefix: '', example: 'j', description: 'Base 20: 0-9, a-j' },
        21: { name: 'Unvigesimal', prefix: '', example: 'k', description: 'Base 21: 0-9, a-k' },
        22: { name: 'Duovigesimal', prefix: '', example: 'l', description: 'Base 22: 0-9, a-l' },
        23: { name: 'Trivigesimal', prefix: '', example: 'm', description: 'Base 23: 0-9, a-m' },
        24: { name: 'Tetravigesimal', prefix: '', example: 'n', description: 'Base 24: 0-9, a-n' },
        25: { name: 'Pentavigesimal', prefix: '', example: 'o', description: 'Base 25: 0-9, a-o' },
        26: { name: 'Hexavigesimal', prefix: '', example: 'p', description: 'Base 26: 0-9, a-p' },
        27: { name: 'Heptavigesimal', prefix: '', example: 'q', description: 'Base 27: 0-9, a-q' },
        28: { name: 'Octovigesimal', prefix: '', example: 'r', description: 'Base 28: 0-9, a-r' },
        29: { name: 'Nonavigesimal', prefix: '', example: 's', description: 'Base 29: 0-9, a-s' },
        30: { name: 'Trigesimal', prefix: '', example: 't', description: 'Base 30: 0-9, a-t' },
        31: { name: 'Untrigesimal', prefix: '', example: 'u', description: 'Base 31: 0-9, a-u' },
        32: { name: 'Duotrigesimal', prefix: '', example: 'v', description: 'Base 32: 0-9, a-v' },
        33: { name: 'Tritrigesimal', prefix: '', example: 'w', description: 'Base 33: 0-9, a-w' },
        34: { name: 'Tetratrigesimal', prefix: '', example: 'x', description: 'Base 34: 0-9, a-x' },
        35: { name: 'Pentatrigesimal', prefix: '', example: 'y', description: 'Base 35: 0-9, a-y' },
        36: { name: 'Hexatrigesimal', prefix: '', example: 'z', description: 'Base 36: 0-9, a-z' }
    }
    return bases[base] || { name: `Base ${base}`, prefix: '', example: '0', description: `Base ${base}` }
}

function getAllConversions(value: bigint) {
    const bases = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 32, 36]
    return bases.map(base => ({
        base,
        info: getBaseInfo(base),
        value: formatBigInt(value, base, { uppercase: true, groupSize: 4, prefix: getBaseInfo(base).prefix })
    }))
}

function getBitRepresentation(value: bigint) {
    if (value === 0n) return '0'
    const abs = value < 0n ? -value : value
    const bits = abs.toString(2)
    const sign = value < 0n ? '-' : ''
    // Group bits in chunks of 4 for better readability
    const grouped = bits.replace(/(.{4})/g, '$1 ').trim()
    return sign + grouped
}

function getByteCount(value: bigint) {
    if (value === 0n) return 1
    const abs = value < 0n ? -value : value
    const bits = abs.toString(2).length
    return Math.ceil(bits / 8)
}

function getMemorySize(value: bigint) {
    const bytes = getByteCount(value)
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function BaseConverterTool() {
    const [input, setInput] = usePersistentState('base_converter_input', '')
    const [fromBase, setFromBase] = usePersistentState<number>('base_converter_from', 10)
    const [toBase, setToBase] = usePersistentState<number>('base_converter_to', 16)
    const [showAllBases, setShowAllBases] = useState(false)
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const [history, setHistory] = usePersistentState<Array<{ input: string, fromBase: number, toBase: number, output: string, timestamp: number }>>('base_converter_history', [])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedComputed = useMemo(() => {
        const startTime = performance.now()
        
        if (!input) {
            setProcessingTime(null)
            return { 
                output: '', 
                error: null as string | null, 
                bigintValue: null as bigint | null,
                allConversions: [] as any[],
                analysis: null as any
            }
        }

        try {
            if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
                throw new Error('Bases must be between 2 and 36')
            }
            
            const n = parseBigInt(input, fromBase)
            if (n === null) {
                setProcessingTime(null)
                return { 
                    output: '', 
                    error: null as string | null, 
                    bigintValue: null,
                    allConversions: [],
                    analysis: null
                }
            }
            
            const output = formatBigInt(n, toBase, { uppercase: true, groupSize: 4, prefix: getBaseInfo(toBase).prefix })
            const allConversions = getAllConversions(n)
            const analysis = {
                bigintValue: n,
                bitRepresentation: getBitRepresentation(n),
                byteCount: getByteCount(n),
                memorySize: getMemorySize(n),
                isNegative: n < 0n,
                isZero: n === 0n
            }
            
            const endTime = performance.now()
            setProcessingTime(Math.round(endTime - startTime))
            
            // Add to history
            if (output) {
                setHistory(prev => {
                    const newEntry = { input, fromBase, toBase, output, timestamp: Date.now() }
                    const filtered = prev.filter(h => h.input !== input || h.fromBase !== fromBase || h.toBase !== toBase)
                    return [newEntry, ...filtered].slice(0, 10)
                })
            }
            
            return { output, error: null, bigintValue: n, allConversions, analysis }
        } catch (e: any) {
            setProcessingTime(null)
            return { 
                output: '', 
                error: e?.message || 'Invalid input', 
                bigintValue: null,
                allConversions: [],
                analysis: null
            }
        }
    }, [input, fromBase, toBase])

    const handleCopy = async () => {
        if (enhancedComputed.output) {
            await copyToClipboard(enhancedComputed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setInput(content)
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        setInput('255')
        setFromBase(10)
        setToBase(16)
    }

    const swapBases = () => {
        if (enhancedComputed.output) {
            setInput(enhancedComputed.output)
            const temp = fromBase
            setFromBase(toBase)
            setToBase(temp)
        }
    }

    const clearHistory = () => {
        setHistory([])
    }

    const getCommonBasePresets = () => {
        return [
            { base: 2, name: 'Binary', example: '1010' },
            { base: 8, name: 'Octal', example: '12' },
            { base: 10, name: 'Decimal', example: '10' },
            { base: 16, name: 'Hex', example: 'a' }
        ]
    }

    return (
        <ToolLayout
            title="Base Converter Pro"
            description="Advanced base converter with multiple formats, analysis, and history tracking."
            icon={Database}
            onReset={() => setInput('')}
            onCopy={enhancedComputed.output ? handleCopy : undefined}
            copyDisabled={!enhancedComputed.output}
        >
            <div className="space-y-6">
                {/* Header with Performance */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Base Converter</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Convert between bases 2-36 with big integer support</p>
                        </div>
                    </div>

                    {/* Performance */}
                    {processingTime !== null && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-[var(--border-primary)]">
                            <Zap className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{processingTime}ms</span>
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.log"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                    </button>

                    <button
                        onClick={insertSample}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Sample</span>
                    </button>

                    <button
                        onClick={swapBases}
                        disabled={!enhancedComputed.output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Swap</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!enhancedComputed.output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAllBases(!showAllBases)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAllBases 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>All Bases</span>
                        </button>
                        
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAnalysis 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Binary className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showHistory 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
                        </button>
                    </div>
                </div>

                {/* Base Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">From base</label>
                        <input
                            type="number"
                            min={2}
                            max={36}
                            value={fromBase}
                            onChange={(e) => setFromBase(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm font-mono focus:border-brand/40 outline-none"
                        />
                        <div className="mt-2 text-xs text-[var(--text-secondary)]">{getBaseInfo(fromBase).name}</div>
                    </div>
                    
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">To base</label>
                        <input
                            type="number"
                            min={2}
                            max={36}
                            value={toBase}
                            onChange={(e) => setToBase(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm font-mono focus:border-brand/40 outline-none"
                        />
                        <div className="mt-2 text-xs text-[var(--text-secondary)]">{getBaseInfo(toBase).name}</div>
                    </div>
                    
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Output</label>
                        <div className="font-mono text-sm break-words text-[var(--text-primary] min-h-[32px]">
                            {enhancedComputed.output || <span className="text-[var(--text-muted)] opacity-50 italic">—</span>}
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {enhancedComputed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Conversion Error</div>
                            <div>{enhancedComputed.error}</div>
                        </div>
                    </div>
                )}

                {/* Binary Analysis */}
                {showAnalysis && enhancedComputed.analysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Binary className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Binary Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand break-all font-mono text-xs">{enhancedComputed.analysis.bitRepresentation}</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">Binary</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{enhancedComputed.analysis.byteCount}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Bytes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{enhancedComputed.analysis.memorySize}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Memory Size</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{enhancedComputed.analysis.isNegative ? 'Yes' : 'No'}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Negative</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Bases View */}
                {showAllBases && enhancedComputed.allConversions.length > 0 && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Calculator className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">All Base Conversions</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {enhancedComputed.allConversions.map((conv) => (
                                <div key={conv.base} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                                    <span className="text-brand font-bold text-sm mb-1 sm:mb-0">Base {conv.base}</span>
                                    <span className="text-[var(--text-primary)] font-mono text-xs break-all">{conv.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* History */}
                {showHistory && history.length > 0 && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <History className="w-4 h-4 text-[var(--text-muted)]" />
                                <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Conversion History</span>
                            </div>
                            <button
                                onClick={clearHistory}
                                className="flex items-center space-x-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Clear</span>
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {history.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-brand font-mono">{item.input}</span>
                                        <span className="text-[var(--text-muted)]">({item.fromBase})</span>
                                        <span className="text-[var(--text-muted)]">→</span>
                                        <span className="text-blue-400 font-mono">{item.output}</span>
                                        <span className="text-[var(--text-muted)]">({item.toBase})</span>
                                    </div>
                                    <span className="text-[var(--text-secondary)] text-[10px]">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[460px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input value</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder="Example: ff (base 16) or 101010 (base 2)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Digits: 0-9 and a-z. Underscores allowed.</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Result</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {enhancedComputed.output.length} chars
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {enhancedComputed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Base Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getCommonBasePresets().map((preset) => (
                        <div key={preset.base} className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                            <div className="text-lg font-black text-brand">{preset.base}</div>
                            <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">{preset.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{preset.example}</div>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    )
}
