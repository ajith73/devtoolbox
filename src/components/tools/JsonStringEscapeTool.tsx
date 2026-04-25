import { useMemo, useState, useRef } from 'react'
import { Braces, Upload, Copy, CheckCircle, AlertCircle, Settings, FileText, Code, Zap, Eye, EyeOff, Hash, Quote, FileJson, Shield, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Enhanced escape functions
function escapeJsonString(text: string, format: 'standard' | 'minimal' | 'verbose' | 'safe' | 'html' = 'standard') {
    switch (format) {
        case 'standard':
            return JSON.stringify(text)
        case 'minimal':
            return JSON.stringify(text).replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
                const char = String.fromCharCode(parseInt(code, 16))
                // Only escape if necessary
                if (char === '"' || char === '\\' || char < ' ') {
                    return match
                }
                return char
            })
        case 'verbose':
            return JSON.stringify(text, null, 2)
        case 'safe':
            // Escape all non-ASCII characters
            return JSON.stringify(text).replace(/[^\\x20-\\x7E]/g, (char) => {
                const code = char.charCodeAt(0)
                return `\\u${code.toString(16).padStart(4, '0')}`
            })
        case 'html':
            // HTML-friendly escaping
            return JSON.stringify(text)
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/&/g, '\\u0026')
                .replace(/'/g, '\\u0027')
        default:
            return JSON.stringify(text)
    }
}

function unescapeJsonString(text: string, _format: 'standard' | 'minimal' | 'verbose' | 'safe' | 'html' = 'standard') {
    try {
        const trimmed = text.trim()
        const candidate = trimmed.startsWith('"') ? trimmed : `"${trimmed}"`
        return JSON.parse(candidate)
    } catch (e) {
        // Try alternative parsing for different formats
        try {
            // Remove outer quotes if present and parse
            const unquoted = text.replace(/^"|"$/g, '')
            return JSON.parse(`"${unquoted}"`)
        } catch {
            throw new Error('Invalid JSON string literal')
        }
    }
}

function analyzeJsonString(text: string) {
    const analysis = {
        total: text.length,
        escaped: 0,
        unicode: 0,
        control: 0,
        quotes: 0,
        backslashes: 0,
        newlines: 0,
        tabs: 0,
        ascii: 0,
        utf8: 0,
        escapeSequences: [] as string[],
    }
    
    // Count escape sequences
    const escapeMatches = text.match(/\\./g) || []
    analysis.escaped = escapeMatches.length
    analysis.escapeSequences = escapeMatches
    
    // Count specific characters
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (char === '"') analysis.quotes++
        else if (char === '\\') analysis.backslashes++
        else if (char === '\\n') analysis.newlines++
        else if (char === '\\t') analysis.tabs++
        else if (char < ' ') analysis.control++
        else if (char.charCodeAt(0) > 127) analysis.utf8++
        else analysis.ascii++
    }
    
    // Count Unicode escape sequences
    const unicodeMatches = text.match(/\\u[0-9a-fA-F]{4}/g) || []
    analysis.unicode = unicodeMatches.length
    
    return analysis
}

function validateJsonString(text: string) {
    const issues = []
    
    try {
        JSON.parse(text)
    } catch (e: any) {
        issues.push(`Invalid JSON: ${e.message}`)
    }
    
    // Check for common issues
    if (text.includes('\\\\\\\\')) {
        issues.push('Multiple backslash sequences detected')
    }
    
    if ((text.match(/"/g) || []).length % 2 !== 0) {
        issues.push('Unmatched quotes detected')
    }
    
    const unicodeIssues = text.match(/\\u[^0-9a-fA-F]/g)
    if (unicodeIssues) {
        issues.push('Invalid Unicode escape sequences found')
    }
    
    return {
        isValid: issues.length === 0,
        issues
    }
}

export function JsonStringEscapeTool() {
    const [input, setInput] = usePersistentState('json_string_escape_input', '')
    const [mode, setMode] = usePersistentState<'escape' | 'unescape'>('json_string_escape_mode', 'escape')
    const [format, setFormat] = usePersistentState<'standard' | 'minimal' | 'verbose' | 'safe' | 'html'>('json_string_format', 'standard')
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showValidation, setShowValidation] = useState(false)
    const [showSyntaxHighlighting, setShowSyntaxHighlighting] = useState(true)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const computed = useMemo(() => {
        const startTime = performance.now()
        if (!input) {
            setProcessingTime(null)
            return { output: '', error: null as string | null, analysis: null, validation: null }
        }

        try {
            let output = ''
            if (mode === 'escape') {
                output = escapeJsonString(input, format)
            } else {
                output = unescapeJsonString(input, format)
            }
            
            const analysis = analyzeJsonString(mode === 'escape' ? output : input)
            const validation = validateJsonString(mode === 'escape' ? output : input)
            
            const endTime = performance.now()
            setProcessingTime(Math.round(endTime - startTime))
            
            return { output, error: null, analysis, validation }
        } catch (e: any) {
            setProcessingTime(null)
            const analysis = analyzeJsonString(input)
            const validation = validateJsonString(input)
            return { output: '', error: e?.message || 'Invalid input', analysis, validation }
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
            escape: {
                standard: 'Hello "World"! \\nNew line\\tTab',
                minimal: 'Hello "World"! \\nNew line\\tTab',
                verbose: 'Hello "World"! \\nNew line\\tTab',
                safe: 'Hello "World"! 🌍',
                html: 'Hello "World"! <script>alert("xss")</script>'
            },
            unescape: {
                standard: '"Hello \\"World\\"!\\nNew line\\tTab"',
                minimal: '"Hello "World"!"\nNew line\tTab',
                verbose: '"Hello \\"World\\"!\\nNew line\\tTab"',
                safe: '"Hello \\"World\\"!\\ud83c\\udf0d"',
                html: '"Hello \\"World\\"!\\u003cscript\\u003ealert(\\"xss\\")\\u003c/script\\u003e"'
            }
        }
        const sample = samples[mode]?.[format] || samples.escape.standard
        setInput(sample)
    }

    const swapMode = () => {
        if (computed.output) {
            setInput(computed.output)
            setMode(mode === 'escape' ? 'unescape' : 'escape')
        }
    }

    return (
        <ToolLayout
            title="JSON String Escape Pro"
            description="Advanced JSON string escaper with multiple formats, validation, and character analysis."
            icon={Braces}
            onReset={() => setInput('')}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Header with Mode Toggle and Stats */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                        <button
                            onClick={() => setMode('escape')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'escape' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                            )}
                        >
                            Escape
                        </button>
                        <button
                            onClick={() => setMode('unescape')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'unescape' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                            )}
                        >
                            Unescape
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
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Escape Format</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { id: 'standard', name: 'Standard', icon: Quote },
                            { id: 'minimal', name: 'Minimal', icon: Code },
                            { id: 'verbose', name: 'Verbose', icon: FileJson },
                            { id: 'safe', name: 'Safe', icon: Shield },
                            { id: 'html', name: 'HTML', icon: Hash }
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
                        accept=".txt,.json"
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
                        <span>Sample Text</span>
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
                            <Hash className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showValidation 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Validation</span>
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

                {/* Validation Results */}
                {showValidation && computed.validation && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Validation Results</span>
                        </div>
                        
                        <div className={cn(
                            "flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-bold",
                            computed.validation.isValid 
                                ? "border-green-400/20 bg-green-400/5 text-green-400" 
                                : "border-red-400/20 bg-red-400/5 text-red-400"
                        )}>
                            {computed.validation.isValid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            <span>{computed.validation.isValid ? 'Valid JSON String' : 'Validation Issues Found'}</span>
                        </div>
                        
                        {computed.validation.issues.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {computed.validation.issues.map((issue, idx) => (
                                    <div key={idx} className="text-xs text-red-400 font-mono bg-red-400/5 p-2 rounded border border-red-400/20">
                                        {issue}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Character Analysis */}
                {showAnalysis && computed.analysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Hash className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Character Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand">{computed.analysis.total}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{computed.analysis.escaped}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Escaped</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{computed.analysis.unicode}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Unicode</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{computed.analysis.ascii}</div>
                                <div className="text-xs text-[var(--text-secondary)]">ASCII</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{computed.analysis.quotes}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Quotes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-cyan-400">{computed.analysis.backslashes}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Backslashes</div>
                            </div>
                        </div>

                        {/* Escape Sequences */}
                        {computed.analysis.escapeSequences.length > 0 && (
                            <div className="mt-4">
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Escape Sequences</div>
                                <div className="flex flex-wrap gap-2">
                                    {computed.analysis.escapeSequences.slice(0, 20).map((seq, idx) => (
                                        <div key={idx} className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs font-mono text-[var(--text-primary)]">
                                            {seq}
                                        </div>
                                    ))}
                                    {computed.analysis.escapeSequences.length > 20 && (
                                        <div className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-muted)]">
                                            +{computed.analysis.escapeSequences.length - 20} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'escape' ? 'Raw Text' : 'JSON String'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder={mode === 'escape' ? 'Type raw text to escape...' : 'Paste JSON string literal...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'escape' ? 'JSON String' : 'Unescaped Text'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {computed.output.length} chars
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            {showSyntaxHighlighting && computed.output ? (
                                <div className="h-full overflow-auto custom-scrollbar">
                                    <ReactSyntaxHighlighter
                                        language="json"
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
                        <Quote className="w-5 h-5 mx-auto mb-2 text-brand" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Standard</div>
                        <div className="text-[10px] text-[var(--text-muted)]">JSON.stringify()</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Code className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Minimal</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Reduced escaping</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Shield className="w-5 h-5 mx-auto mb-2 text-green-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Safe</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Full Unicode escape</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
