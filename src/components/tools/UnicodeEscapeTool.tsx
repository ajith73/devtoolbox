import { useMemo, useState, useRef } from 'react'
import { Type, Upload, Copy, CheckCircle, Settings, FileText, Code, Zap, Eye, EyeOff, Hash, Binary, Globe, Languages, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function encodeUnicode(input: string, format: 'short' | 'long' | 'javascript' | 'python' | 'html' | 'url' = 'short') {
    const cps = Array.from(input)
    
    switch (format) {
        case 'short':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    if (cp <= 0xffff) return `\\u${cp.toString(16).padStart(4, '0')}`
                    return `\\u{${cp.toString(16)}}`
                })
                .join('')
        
        case 'long':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    return `\\u{${cp.toString(16).toUpperCase().padStart(6, '0')}}`
                })
                .join('')
        
        case 'javascript':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    if (cp <= 0x7F) return ch
                    if (cp <= 0xffff) return `\\u${cp.toString(16).padStart(4, '0')}`
                    return `\\u{${cp.toString(16)}}`
                })
                .join('')
        
        case 'python':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    if (cp <= 0x7F) return ch
                    return `\\U${cp.toString(16).padStart(8, '0')}`
                })
                .join('')
        
        case 'html':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    if (cp <= 0x7F) return ch
                    return `&#${cp};`
                })
                .join('')
        
        case 'url':
            return cps
                .map((ch) => {
                    const cp = ch.codePointAt(0) ?? 0
                    if (cp <= 0x7F && ch.match(/[a-zA-Z0-9\-._~]/)) return ch
                    return encodeURIComponent(ch)
                })
                .join('')
        
        default:
            return encodeUnicode(input, 'short')
    }
}

function decodeUnicode(input: string, format: 'short' | 'long' | 'javascript' | 'python' | 'html' | 'url' = 'short') {
    let out = input

    switch (format) {
        case 'short':
        case 'long':
        case 'javascript':
            // Handle \u{...} format
            out = out.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) => {
                const cp = Number.parseInt(hex, 16)
                if (!Number.isFinite(cp)) return _
                try {
                    return String.fromCodePoint(cp)
                } catch {
                    return _
                }
            })
            // Handle \uXXXX format
            out = out.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => {
                const cp = Number.parseInt(hex, 16)
                if (!Number.isFinite(cp)) return _
                return String.fromCharCode(cp)
            })
            break
        
        case 'python':
            // Handle \UXXXXXXXX format
            out = out.replace(/\\U([0-9a-fA-F]{8})/g, (_, hex: string) => {
                const cp = Number.parseInt(hex, 16)
                if (!Number.isFinite(cp)) return _
                try {
                    return String.fromCodePoint(cp)
                } catch {
                    return _
                }
            })
            break
        
        case 'html':
            // Handle &#...; format
            out = out.replace(/&#(\d+);/g, (_, dec: string) => {
                const cp = Number.parseInt(dec, 10)
                if (!Number.isFinite(cp)) return _
                try {
                    return String.fromCodePoint(cp)
                } catch {
                    return _
                }
            })
            // Handle &#x...; format
            out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
                const cp = Number.parseInt(hex, 16)
                if (!Number.isFinite(cp)) return _
                try {
                    return String.fromCodePoint(cp)
                } catch {
                    return _
                }
            })
            break
        
        case 'url':
            try {
                return decodeURIComponent(out)
            } catch {
                return out
            }
    }

    return out
}

function analyzeCharacters(input: string) {
    const chars = Array.from(input)
    const analysis = {
        total: chars.length,
        ascii: 0,
        unicode: 0,
        emoji: 0,
        control: 0,
        whitespace: 0,
        codePoints: chars.map(ch => ({
            char: ch,
            codePoint: ch.codePointAt(0) || 0,
            hex: (ch.codePointAt(0) || 0).toString(16).toUpperCase(),
            category: getCategory(ch),
            name: getUnicodeName(ch)
        }))
    }
    
    chars.forEach(ch => {
        const cp = ch.codePointAt(0) || 0
        if (cp <= 0x7F) analysis.ascii++
        else analysis.unicode++
        if (isEmoji(ch)) analysis.emoji++
        if (isControl(ch)) analysis.control++
        if (isWhitespace(ch)) analysis.whitespace++
    })
    
    return analysis
}

function getCategory(char: string): string {
    const cp = char.codePointAt(0) || 0
    if (cp <= 0x7F) return 'ASCII'
    if (cp >= 0x1F300 && cp <= 0x1F9FF) return 'Emoji'
    if (cp >= 0x0400 && cp <= 0x04FF) return 'Cyrillic'
    if (cp >= 0x4E00 && cp <= 0x9FFF) return 'CJK'
    if (cp >= 0x0600 && cp <= 0x06FF) return 'Arabic'
    if (cp >= 0x0590 && cp <= 0x05FF) return 'Hebrew'
    if (cp >= 0x0370 && cp <= 0x03FF) return 'Greek'
    if (cp >= 0x0900 && cp <= 0x097F) return 'Devanagari'
    return 'Unicode'
}

function getUnicodeName(char: string): string {
    const cp = char.codePointAt(0) || 0
    const names: { [key: number]: string } = {
        0x0041: 'LATIN CAPITAL LETTER A',
        0x0061: 'LATIN SMALL LETTER A',
        0x0020: 'SPACE',
        0x000A: 'LINE FEED',
        0x000D: 'CARRIAGE RETURN',
        0x1F600: 'GRINNING FACE',
        0x1F44D: 'THUMBS UP SIGN',
        0x2764: 'HEAVY BLACK HEART',
        0x00A9: 'COPYRIGHT SIGN',
        0x00AE: 'REGISTERED SIGN',
        0x2122: 'TRADE MARK SIGN'
    }
    return names[cp] || 'UNNAMED'
}

function isEmoji(char: string): boolean {
    const cp = char.codePointAt(0) || 0
    return (cp >= 0x1F300 && cp <= 0x1F9FF) || 
           (cp >= 0x2600 && cp <= 0x26FF) || 
           (cp >= 0x2700 && cp <= 0x27BF)
}

function isControl(char: string): boolean {
    const cp = char.codePointAt(0) || 0
    return (cp >= 0x00 && cp <= 0x1F) || (cp >= 0x7F && cp <= 0x9F)
}

function isWhitespace(char: string): boolean {
    return /\s/.test(char)
}

export function UnicodeEscapeTool() {
    const [input, setInput] = usePersistentState('unicode_escape_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('unicode_escape_mode', 'encode')
    const [format, setFormat] = usePersistentState<'short' | 'long' | 'javascript' | 'python' | 'html' | 'url'>('unicode_escape_format', 'short')
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showSyntaxHighlighting, setShowSyntaxHighlighting] = useState(true)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const output = useMemo(() => {
        const startTime = performance.now()
        if (!input) {
            setProcessingTime(null)
            return ''
        }
        try {
            const result = mode === 'encode' ? encodeUnicode(input, format) : decodeUnicode(input, format)
            const endTime = performance.now()
            setProcessingTime(Math.round(endTime - startTime))
            return result
        } catch {
            setProcessingTime(null)
            return ''
        }
    }, [input, mode, format])

    const analysis = useMemo(() => {
        return showAnalysis ? analyzeCharacters(input) : null
    }, [input, showAnalysis])

    const handleCopy = async () => {
        if (output) {
            await copyToClipboard(output)
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
        const samples: { [key: string]: string } = {
            encode: 'Hello World! 🌍 🚀 ©®™',
            decode: format === 'short' ? '\\u0048\\u0065\\u006C\\u006C\\u006F\\u0020\\u0057\\u006F\\u0072\\u006C\\u0064\\u0021\\u0020\\uD83C\\uDF0D\\u0020\\uD83D\\uDE80\\u0020\\u00A9\\u00AE\\u2122' :
                     format === 'javascript' ? 'Hello\\u0020World!\\u0020\\uD83C\\uDF0D\\u0020\\uD83D\\uDE80\\u0020\\u00A9\\u00AE\\u2122' :
                     format === 'python' ? 'Hello\\u0020World!\\u0020\\U0001F30D\\u0020\\U0001F680\\u0020\\u00A9\\u00AE\\u2122' :
                     format === 'html' ? 'Hello&#32;World!&#32;&#127757;&#32;&#128640;&#32;&#169;&#174;&#8482;' :
                     format === 'url' ? 'Hello%20World!%20%F0%9F%8C%8D%20%F0%9F%9A%80%20%C2%A9%C2%AE%E2%84%A2' :
                     '\\u0048\\u0065\\u006C\\u006C\\u006F\\u0020\\u0057\\u006F\\u0072\\u006C\\u0064\\u0021\\u0020\\u{1F30D}\\u0020\\u{1F680}\\u0020\\u00A9\\u00AE\\u2122'
        }
        setInput(samples[mode] || samples.encode)
    }

    const swapMode = () => {
        if (output) {
            setInput(output)
            setMode(mode === 'encode' ? 'decode' : 'encode')
        }
    }

    return (
        <ToolLayout
            title="Unicode Escape Pro"
            description="Advanced Unicode encoder/decoder with multiple formats, character analysis, and batch processing."
            icon={Type}
            onReset={() => setInput('')}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
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
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Format</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { id: 'short', name: 'Short', icon: Hash },
                            { id: 'long', name: 'Long', icon: Code },
                            { id: 'javascript', name: 'JavaScript', icon: Globe },
                            { id: 'python', name: 'Python', icon: Languages },
                            { id: 'html', name: 'HTML', icon: FileText },
                            { id: 'url', name: 'URL', icon: Binary }
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
                        accept=".txt"
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
                        disabled={!output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Swap & Process</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!output}
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

                {/* Character Analysis */}
                {showAnalysis && analysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Hash className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Character Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand">{analysis.total}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{analysis.ascii}</div>
                                <div className="text-xs text-[var(--text-secondary)]">ASCII</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{analysis.unicode}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Unicode</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{analysis.emoji}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Emoji</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{analysis.control}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Control</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-cyan-400">{analysis.whitespace}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Whitespace</div>
                            </div>
                        </div>

                        {analysis.codePoints.length > 0 && (
                            <div className="max-h-48 overflow-auto custom-scrollbar">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[var(--border-primary)]">
                                            <th className="text-left p-2">Char</th>
                                            <th className="text-left p-2">Code Point</th>
                                            <th className="text-left p-2">Hex</th>
                                            <th className="text-left p-2">Category</th>
                                            <th className="text-left p-2">Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.codePoints.map((cp, idx) => (
                                            <tr key={idx} className="border-b border-[var(--border-primary)]/30">
                                                <td className="p-2 font-mono">{cp.char}</td>
                                                <td className="p-2 font-mono">{cp.codePoint}</td>
                                                <td className="p-2 font-mono">U+{cp.hex}</td>
                                                <td className="p-2">{cp.category}</td>
                                                <td className="p-2 text-[var(--text-muted)]">{cp.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'encode' ? 'Text Input' : 'Escape Sequences'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder={mode === 'encode' ? 'Type text to escape...' : 'Paste escape sequences...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'encode' ? 'Escape Sequences' : 'Decoded Text'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {output.length} chars
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            {showSyntaxHighlighting && output ? (
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
                                        {output}
                                    </ReactSyntaxHighlighter>
                                </div>
                            ) : (
                                <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                {/* Format Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Hash className="w-5 h-5 mx-auto mb-2 text-brand" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Short Format</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{'\\uXXXX or \\u{...}'}</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Code className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Programming</div>
                        <div className="text-[10px] text-[var(--text-muted)]">JavaScript, Python, HTML</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Globe className="w-5 h-5 mx-auto mb-2 text-green-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Web Safe</div>
                        <div className="text-[10px] text-[var(--text-muted)]">URL encoding support</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
