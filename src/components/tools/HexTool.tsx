import { useMemo, useState, useRef } from 'react'
import { Fingerprint, Upload, Copy, CheckCircle, AlertCircle, Settings, FileText, Code, Zap, Eye, EyeOff, Hash, Binary, Cpu, Activity, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Enhanced encoding functions
function bytesToHex(bytes: Uint8Array, format: 'continuous' | 'spaced' | 'cstyle' | 'python' | 'base64' = 'continuous') {
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
    
    switch (format) {
        case 'continuous':
            return hex.join('')
        case 'spaced':
            return hex.join(' ')
        case 'cstyle':
            return hex.map((h, i) => `0x${h}${i < hex.length - 1 ? ', ' : ''}`).join('')
        case 'python':
            return `b'\\x${hex.join('\\x')}'`
        case 'base64':
            return btoa(String.fromCharCode(...bytes))
        default:
            return hex.join('')
    }
}

function hexToBytes(hex: string) {
    const normalized = hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase()
    if (!normalized) return new Uint8Array()
    if (normalized.length % 2 !== 0) throw new Error('Hex length must be even')

    const bytes = new Uint8Array(normalized.length / 2)
    for (let i = 0; i < normalized.length; i += 2) {
        const v = Number.parseInt(normalized.slice(i, i + 2), 16)
        if (Number.isNaN(v)) throw new Error('Invalid hex character')
        bytes[i / 2] = v
    }
    return bytes
}

function analyzeBytes(bytes: Uint8Array) {
    const analysis = {
        total: bytes.length,
        ascii: 0,
        extended: 0,
        control: 0,
        printable: 0,
        null: 0,
        entropy: 0,
        frequency: new Array(256).fill(0),
        distribution: {
            zeros: 0,
            low: 0,
            medium: 0,
            high: 0,
            max: 0
        }
    }
    
    bytes.forEach(byte => {
        analysis.frequency[byte]++
        
        if (byte === 0) analysis.null++
        else if (byte < 32 || byte === 127) analysis.control++
        else if (byte < 128) analysis.ascii++
        else analysis.extended++
        
        if (byte >= 32 && byte <= 126) analysis.printable++
        
        // Distribution
        if (byte === 0) analysis.distribution.zeros++
        else if (byte < 64) analysis.distribution.low++
        else if (byte < 128) analysis.distribution.medium++
        else if (byte < 192) analysis.distribution.high++
        else analysis.distribution.max++
    })
    
    // Calculate entropy
    const freq = analysis.frequency.filter(f => f > 0)
    if (freq.length > 0) {
        const probs = freq.map(f => f / bytes.length)
        analysis.entropy = -probs.reduce((sum, p) => sum + p * Math.log2(p), 0)
    }
    
    return analysis
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createHexDump(bytes: Uint8Array, bytesPerLine: number = 16) {
    const lines = []
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const chunk = bytes.slice(i, i + bytesPerLine)
        const offset = i.toString(16).padStart(8, '0')
        const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ')
        const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('')
        
        lines.push(`${offset}  ${hex.padEnd(bytesPerLine * 3 - 1, ' ')} |${ascii}|`)
    }
    return lines.join('\n')
}

export function HexTool() {
    const [input, setInput] = usePersistentState('hex_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('hex_mode', 'encode')
    const [format, setFormat] = usePersistentState<'continuous' | 'spaced' | 'cstyle' | 'python' | 'base64'>('hex_format', 'continuous')
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showHexDump, setShowHexDump] = useState(false)
    const [showSyntaxHighlighting, setShowSyntaxHighlighting] = useState(true)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const computed = useMemo(() => {
        const startTime = performance.now()
        if (!input) {
            setProcessingTime(null)
            return { output: '', error: null as string | null, bytes: new Uint8Array(), analysis: null }
        }

        try {
            if (mode === 'encode') {
                const bytes = new TextEncoder().encode(input)
                const output = format === 'base64' ? bytesToHex(bytes, 'base64') : bytesToHex(bytes, format)
                const analysis = analyzeBytes(bytes)
                const endTime = performance.now()
                setProcessingTime(Math.round(endTime - startTime))
                return { output, error: null, bytes, analysis }
            }
            const bytes = hexToBytes(input)
            const output = new TextDecoder().decode(bytes)
            const analysis = analyzeBytes(bytes)
            const endTime = performance.now()
            setProcessingTime(Math.round(endTime - startTime))
            return { output, error: null, bytes, analysis }
        } catch (e: any) {
            setProcessingTime(null)
            return { output: '', error: e?.message || 'Invalid input', bytes: new Uint8Array(), analysis: null }
        }
    }, [input, mode, format])

    const handleCopy = async () => {
        if (computed.output) {
            await copyToClipboard(computed.output)
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
        const samples = {
            encode: 'Hello World! 🌍 🚀',
            decode: format === 'base64' ? 'SGVsbG8gV29ybGQhIPCfkuK3wn5Ck' :
                     format === 'cstyle' ? '0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21' :
                     format === 'python' ? "b'\\x48\\x65\\x6c\\x6c\\x6f\\x20\\x57\\x6f\\x72\\x6c\\x64\\x21'" :
                     format === 'spaced' ? '48 65 6c 6c 6f 20 57 6f 72 6c 64 21' :
                     '48656c6c6f20576f726c6421'
        }
        setInput(samples[mode] || samples.encode)
    }

    const swapMode = () => {
        if (computed.output) {
            setInput(computed.output)
            setMode(mode === 'encode' ? 'decode' : 'encode')
        }
    }

    const getHexDump = () => {
        if (!computed.bytes || computed.bytes.length === 0) return ''
        return createHexDump(computed.bytes)
    }

    return (
        <ToolLayout
            title="Hex Encode Pro"
            description="Advanced hexadecimal encoder/decoder with multiple formats, byte analysis, and visual hex dump."
            icon={Fingerprint}
            onReset={() => setInput('')}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Header with Mode Toggle and Stats */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                        <button
                            onClick={() => setMode('encode')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'encode' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                            )}
                        >
                            Encode
                        </button>
                        <button
                            onClick={() => setMode('decode')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'decode' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                            )}
                        >
                            Decode
                        </button>
                    </div>

                    {/* Performance */}
                    {processingTime !== null && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-[var(--border-primary)]">
                            <Zap className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{processingTime}ms</span>
                        </div>
                    )}
                </div>

                {/* Format Selection */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-4">
                        <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Output Format</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { id: 'continuous', name: 'Continuous', icon: Hash },
                            { id: 'spaced', name: 'Spaced', icon: Code },
                            { id: 'cstyle', name: 'C Style', icon: Binary },
                            { id: 'python', name: 'Python', icon: Cpu },
                            { id: 'base64', name: 'Base64', icon: Activity }
                        ].map((fmt) => (
                            <button
                                key={fmt.id}
                                onClick={() => setFormat(fmt.id as any)}
                                className={cn(
                                    "flex flex-col items-center space-y-2 p-3 rounded-xl border transition-all",
                                    format === fmt.id 
                                        ? "border-brand/50 bg-brand/10 text-brand" 
                                        : "border-[var(--border-primary)] hover:border-brand/30 text-[var(--text-secondary)]"
                                )}
                            >
                                <fmt.icon className="w-4 h-4" />
                                <span className="text-xs font-bold">{fmt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.hex,.bin"
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
                        <span>Sample Data</span>
                    </button>

                    <button
                        onClick={swapMode}
                        disabled={!computed.output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Swap & Process</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!computed.output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAnalysis 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => setShowHexDump(!showHexDump)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showHexDump 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Binary className="w-3.5 h-3.5" />
                            <span>Hex Dump</span>
                        </button>
                        
                        <button
                            onClick={() => setShowSyntaxHighlighting(!showSyntaxHighlighting)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showSyntaxHighlighting 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            {showSyntaxHighlighting ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>Syntax</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Processing Error</div>
                            <div>{computed.error}</div>
                        </div>
                    </div>
                )}

                {/* Byte Analysis */}
                {showAnalysis && computed.analysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Activity className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Byte Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand">{computed.analysis.total}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{computed.analysis.ascii}</div>
                                <div className="text-xs text-[var(--text-secondary)]">ASCII</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{computed.analysis.extended}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Extended</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{computed.analysis.control}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Control</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{computed.analysis.printable}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Printable</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-red-400">{computed.analysis.null}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Null</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-cyan-400">{computed.analysis.entropy.toFixed(2)}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Entropy</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-yellow-400">{formatBytes(computed.analysis.total)}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Size</div>
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Zeros</div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gray-400 transition-all" 
                                        style={{ width: `${(computed.analysis.distribution.zeros / computed.analysis.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">{computed.analysis.distribution.zeros}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Low</div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-400 transition-all" 
                                        style={{ width: `${(computed.analysis.distribution.low / computed.analysis.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">{computed.analysis.distribution.low}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Medium</div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-400 transition-all" 
                                        style={{ width: `${(computed.analysis.distribution.medium / computed.analysis.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">{computed.analysis.distribution.medium}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-[var(--text-muted)] mb-1">High</div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-orange-400 transition-all" 
                                        style={{ width: `${(computed.analysis.distribution.high / computed.analysis.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">{computed.analysis.distribution.high}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Max</div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-red-400 transition-all" 
                                        style={{ width: `${(computed.analysis.distribution.max / computed.analysis.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">{computed.analysis.distribution.max}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'encode' ? 'Text Input' : 'Hex Input'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste hex (spaces allowed)...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'encode' ? 'Hex Output' : 'Decoded Text'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {computed.output.length} chars
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            {showHexDump && getHexDump() ? (
                                <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar">
                                    {getHexDump()}
                                </pre>
                            ) : showSyntaxHighlighting && computed.output ? (
                                <div className="h-full overflow-auto custom-scrollbar">
                                    <ReactSyntaxHighlighter
                                        language="javascript"
                                        style={oneDark}
                                        customStyle={{
                                            margin: 0,
                                            padding: '2rem',
                                            background: 'transparent',
                                            fontSize: '0.75rem',
                                            fontFamily: 'var(--font-mono)',
                                            lineHeight: '1.5'
                                        }}
                                        wrapLines={true}
                                        wrapLongLines={true}
                                    >
                                        {computed.output}
                                    </ReactSyntaxHighlighter>
                                </div>
                            ) : (
                                <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                    {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                {/* Format Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Hash className="w-5 h-5 mx-auto mb-2 text-brand" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Continuous</div>
                        <div className="text-[10px] text-[var(--text-muted)]">48656c6c6f</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Code className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Programming</div>
                        <div className="text-[10px] text-[var(--text-muted)]">C, Python, Base64</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Binary className="w-5 h-5 mx-auto mb-2 text-green-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Analysis</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Byte distribution</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
