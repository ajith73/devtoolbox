import { useMemo, useState, useRef } from 'react'
import { Radio, Upload, Copy, CheckCircle, AlertCircle, FileText, Zap, Binary, ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Morse code mappings
const MORSE_CODE: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
}

const REVERSE_MORSE: { [key: string]: string } = Object.entries(MORSE_CODE).reduce((acc, [char, morse]) => {
    acc[morse] = char
    return acc
}, {} as { [key: string]: string })

function encodeToMorse(text: string): string {
    return text.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ')
}

function decodeFromMorse(morse: string): string {
    return morse.split(' ').map(code => REVERSE_MORSE[code] || code).join('')
}

function validateMorse(morse: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const validChars = '.- /'
    
    for (const char of morse) {
        if (!validChars.includes(char)) {
            errors.push(`Invalid character: "${char}". Only dots (.), dashes (-), and spaces (/) are allowed.`)
        }
    }
    
    // Check for invalid Morse patterns
    const patterns = morse.split(' ').filter(p => p !== '/')
    for (const pattern of patterns) {
        if (pattern && !REVERSE_MORSE[pattern]) {
            errors.push(`Invalid Morse pattern: "${pattern}"`)
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

function getMorseStats(morse: string) {
    const chars = morse.split('')
    const dots = chars.filter(c => c === '.').length
    const dashes = chars.filter(c => c === '-').length
    const spaces = chars.filter(c => c === ' ').length
    const patterns = morse.split(' ').filter(p => p !== '').length
    
    return {
        dots,
        dashes,
        spaces,
        patterns,
        total: chars.length,
        ratio: dashes > 0 ? (dots / dashes).toFixed(2) : '0'
    }
}

export function MorseTool() {
    const [input, setInput] = usePersistentState('morse_code_input', '')
    const [mode, setMode] = usePersistentState<'encode' | 'decode'>('morse_code_mode', 'encode')
    const [showStats, setShowStats] = useState(false)
    const [showValidation, setShowValidation] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const result = useMemo(() => {
        if (!input.trim()) return ''
        
        if (mode === 'encode') {
            return encodeToMorse(input)
        } else {
            return decodeFromMorse(input)
        }
    }, [input, mode])

    const validation = useMemo(() => {
        if (mode === 'encode' || !input.trim()) return { isValid: true, errors: [] }
        return validateMorse(input)
    }, [input, mode])

    const stats = useMemo(() => {
        if (!input.trim()) return { dots: 0, dashes: 0, spaces: 0, patterns: 0, total: 0, ratio: '0' }
        return mode === 'encode' ? getMorseStats(result) : getMorseStats(input)
    }, [input, mode, result])

    const handleCopy = async () => {
        try {
            await copyToClipboard(result)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const text = e.target?.result as string
                setInput(text)
            }
            reader.readAsText(file)
        }
    }

    const insertSample = () => {
        if (mode === 'encode') {
            setInput('HELLO WORLD')
        } else {
            setInput('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')
        }
    }

    const swapMode = () => {
        if (result) {
            setInput(result)
        }
        setMode(mode === 'encode' ? 'decode' : 'encode')
    }

    return (
        <ToolLayout
            title="Morse Code"
            description="Encode text to Morse code or decode Morse to text. Use / for spaces between words."
            icon={Radio}
            onReset={() => setInput('')}
            onCopy={result ? handleCopy : undefined}
            copyDisabled={!result}
        >
            <div className="space-y-6">
                {/* Mode Selection */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setMode('encode')}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                mode === 'encode' 
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Radio className="w-4 h-4 mr-2" />
                            Encode
                        </button>
                        <button
                            onClick={() => setMode('decode')}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                mode === 'decode' 
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/25" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Binary className="w-4 h-4 mr-2" />
                            Decode
                        </button>
                    </div>
                    <button
                        onClick={swapMode}
                        className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Swap input and output"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            {mode === 'encode' ? 'Text Input' : 'Morse Code Input'}
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".txt"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                title="Upload file"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                onClick={insertSample}
                                className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                title="Insert sample"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Morse code to decode...'}
                        className="w-full h-32 p-4 rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Output Section */}
                {result && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                {mode === 'encode' ? 'Morse Code Output' : 'Text Output'}
                            </label>
                            <button
                                onClick={handleCopy}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-1 rounded-lg transition-all",
                                    copied 
                                        ? "bg-green-500 text-white" 
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                )}
                            >
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <div className="p-4 rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <pre className="font-mono text-sm whitespace-pre-wrap break-all">{result}</pre>
                        </div>
                    </div>
                )}

                {/* Validation Errors */}
                {mode === 'decode' && !validation.isValid && (
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Validation Errors</span>
                        </div>
                        <div className="space-y-1">
                            {validation.errors.map((error, index) => (
                                <div key={index} className="text-sm text-red-300 pl-6">
                                    • {error}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center space-x-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                        <span>{showStats ? 'Hide' : 'Show'} Statistics</span>
                    </button>
                    <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                        <span>Chars: {input.length}</span>
                        <span>{mode === 'encode' ? 'Patterns' : 'Chars'}: {stats.total}</span>
                    </div>
                </div>

                {showStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.dots}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Dots (.)</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.dashes}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Dashes (-)</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{stats.spaces}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Spaces</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.patterns}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Patterns</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-pink-400">{stats.ratio}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Dot/Dash Ratio</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Total Characters</div>
                        </div>
                    </div>
                )}

                {/* Reference Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Morse Code Reference</h3>
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            {showValidation ? 'Hide' : 'Show'} Validation
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                            {Object.entries(MORSE_CODE).slice(0, 36).map(([char, morse]) => (
                                <div key={char} className="flex justify-between items-center p-2 rounded bg-[var(--bg-tertiary)]/50">
                                    <span className="font-mono font-bold text-blue-400">{char}</span>
                                    <span className="font-mono text-green-400">{morse}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
