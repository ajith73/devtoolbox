import { useMemo, useState, useRef } from 'react'
import { ShieldCheck, Upload, Copy, CheckCircle, FileText, Eye, EyeOff, Shield, Clock, Settings } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced password analysis result type
type PasswordAnalysis = {
    strength: {
        score: number
        label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong'
        color: string
        description: string
    }
    characteristics: {
        length: number
        uniqueChars: number
        hasLower: boolean
        hasUpper: boolean
        hasNumber: boolean
        hasSymbol: boolean
        hasSpace: boolean
        hasEmoji: boolean
        hasUnicode: boolean
    }
    patterns: {
        isRepeating: boolean
        isSequential: boolean
        isKeyboardPattern: boolean
        isCommonWord: boolean
        isLeetSpeak: boolean
        isMixedCase: boolean
    }
    entropy: {
        charsetSize: number
        possibleCombinations: string
        entropyBits: number
        timeToCrack: {
            instant: string
            fast: string
            slow: string
            government: string
        }
    }
    suggestions: {
        critical: string[]
        important: string[]
        optional: string[]
    }
    compliance: {
        nist: boolean
        pci: boolean
        hipaa: boolean
        gdpr: boolean
        iso27001: boolean
    }
    visual: {
        strength: number
        complexity: number
        uniqueness: number
        patterns: number
    }
}

// Common passwords list (sample)
const COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein',
    'welcome', 'monkey', '1234567890', 'password1', 'qwertyuiop', 'starwars', 'iloveyou',
    'dragon', 'master', 'freedom', 'whatever', 'qazwsx', 'trustno1', '123qwe', '1q2w3e4r',
    'zxcvbnm', '123abc', 'password1234', 'superman', 'football', 'baseball', 'shadow',
    'michael', 'jennifer', 'jordan', 'daniel', 'rangers', 'princess', 'magical'
]

// Keyboard patterns
const KEYBOARD_PATTERNS = [
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty', 'asdfgh', 'zxcvbn',
    '1234567890', '0987654321', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'qazwsx', 'wsxedc', 'edcrfv', 'tgbvfy', 'yhnujm', 'ujmik', 'ikolp',
    '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik', '9ol', '0p'
]

// Sequential patterns
const SEQUENTIAL_PATTERNS = [
    'abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba',
    '0123456789', '9876543210', 'abcdefghijklmnopqrstuvwxyz0123456789'
]

// Enhanced password analysis function
function analyzePassword(password: string): PasswordAnalysis {
    const length = password.length
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^a-zA-Z0-9]/.test(password)
    const hasSpace = /\s/.test(password)
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(password)
    const hasUnicode = /[^\x00-\x7F]/.test(password)
    const uniqueChars = new Set(Array.from(password)).size
    
    // Pattern detection
    const isRepeating = /^(.)\1+$/.test(password)
    const isSequential = SEQUENTIAL_PATTERNS.some(pattern => 
        password.toLowerCase().includes(pattern) || pattern.includes(password.toLowerCase())
    )
    const isKeyboardPattern = KEYBOARD_PATTERNS.some(pattern => 
        password.toLowerCase().includes(pattern) || pattern.includes(password.toLowerCase())
    )
    const isCommonWord = COMMON_PASSWORDS.some(common => 
        password.toLowerCase() === common || common.includes(password.toLowerCase())
    )
    const isLeetSpeak = /[a4@b8c3d3e3f6g9h4i1j7k1l1m9n0o0p9q9r5s5t7u0v1w2x7y2z5]/i.test(password)
    const isMixedCase = hasLower && hasUpper
    
    // Calculate charset size
    let charsetSize = 0
    if (hasLower) charsetSize += 26
    if (hasUpper) charsetSize += 26
    if (hasNumber) charsetSize += 10
    if (hasSymbol) charsetSize += 32 // Approximate symbol count
    if (hasUnicode) charsetSize += 100 // Approximate unicode count
    
    // Calculate entropy
    const possibleCombinations = Math.pow(charsetSize, length)
    const entropyBits = length * Math.log2(charsetSize)
    
    // Time to crack calculations (very rough estimates)
    const calculateTimeToCrack = (combinations: number) => {
        const guessesPerSecond = {
            instant: 1000000000, // 1 billion guesses/sec (high-end GPU)
            fast: 10000000,      // 10 million guesses/sec (mid-range)
            slow: 100000,        // 100k guesses/sec (online attack)
            government: 10000000000 // 10 billion guesses/sec (government)
        }
        
        const formatTime = (seconds: number) => {
            if (seconds < 60) return `${Math.round(seconds)} seconds`
            if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
            if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
            if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
            return `${Math.round(seconds / 31536000)} years`
        }
        
        return {
            instant: formatTime(combinations / guessesPerSecond.instant),
            fast: formatTime(combinations / guessesPerSecond.fast),
            slow: formatTime(combinations / guessesPerSecond.slow),
            government: formatTime(combinations / guessesPerSecond.government)
        }
    }
    
    // Calculate strength score
    let score = 0
    
    // Length contribution (0-40 points)
    score += Math.min(40, length * 2)
    
    // Character variety (0-20 points)
    const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
    score += variety * 5
    
    // Unique characters (0-15 points)
    score += Math.min(15, Math.max(0, uniqueChars - 4) * 2)
    
    // Pattern penalties
    if (isRepeating) score -= 30
    if (isSequential) score -= 25
    if (isKeyboardPattern) score -= 20
    if (isCommonWord) score -= 35
    
    // Bonus features
    if (hasUnicode) score += 5
    if (hasEmoji) score += 3
    if (isMixedCase) score += 5
    
    score = Math.max(0, Math.min(100, score))
    
    // Determine strength label
    let label: PasswordAnalysis['strength']['label']
    let color: string
    let description: string
    
    if (score >= 85) {
        label = 'Very Strong'
        color = 'text-green-400'
        description = 'Excellent password with high entropy and complexity'
    } else if (score >= 70) {
        label = 'Strong'
        color = 'text-green-300'
        description = 'Good password with decent complexity'
    } else if (score >= 55) {
        label = 'Good'
        color = 'text-yellow-400'
        description = 'Fair password but could be improved'
    } else if (score >= 40) {
        label = 'Fair'
        color = 'text-orange-400'
        description = 'Weak password with significant vulnerabilities'
    } else if (score >= 25) {
        label = 'Weak'
        color = 'text-red-400'
        description = 'Very weak password, easily crackable'
    } else {
        label = 'Very Weak'
        color = 'text-red-500'
        description = 'Extremely weak password, immediate security risk'
    }
    
    // Generate suggestions
    const suggestions: PasswordAnalysis['suggestions'] = {
        critical: [],
        important: [],
        optional: []
    }
    
    if (length < 12) suggestions.critical.push('Use at least 12 characters')
    if (!hasLower) suggestions.critical.push('Add lowercase letters')
    if (!hasUpper) suggestions.critical.push('Add uppercase letters')
    if (!hasNumber) suggestions.critical.push('Add numbers')
    if (!hasSymbol) suggestions.important.push('Add special symbols')
    if (isRepeating) suggestions.critical.push('Avoid repeating characters')
    if (isSequential) suggestions.critical.push('Avoid sequential patterns')
    if (isKeyboardPattern) suggestions.important.push('Avoid keyboard patterns')
    if (isCommonWord) suggestions.critical.push('Avoid common words and passwords')
    if (uniqueChars < length * 0.6) suggestions.important.push('Use more unique characters')
    if (length >= 12 && !hasUnicode) suggestions.optional.push('Consider unicode characters')
    if (!isMixedCase && hasLower && hasUpper) suggestions.optional.push('Mix character cases throughout')
    
    // Compliance checks
    const compliance: PasswordAnalysis['compliance'] = {
        nist: length >= 8 && hasLower && hasUpper && hasNumber && hasSymbol,
        pci: length >= 12 && hasLower && hasUpper && hasNumber && hasSymbol,
        hipaa: length >= 8 && hasLower && hasUpper && hasNumber && hasSymbol,
        gdpr: length >= 8,
        iso27001: length >= 12 && hasLower && hasUpper && hasNumber && hasSymbol
    }
    
    // Visual metrics
    const visual: PasswordAnalysis['visual'] = {
        strength: score,
        complexity: variety * 25,
        uniqueness: Math.min(100, (uniqueChars / length) * 100),
        patterns: (isRepeating || isSequential || isKeyboardPattern || isCommonWord) ? 20 : 80
    }
    
    return {
        strength: { score, label, color, description },
        characteristics: {
            length, uniqueChars, hasLower, hasUpper, hasNumber, hasSymbol, hasSpace, hasEmoji, hasUnicode
        },
        patterns: {
            isRepeating, isSequential, isKeyboardPattern, isCommonWord, isLeetSpeak, isMixedCase
        },
        entropy: {
            charsetSize,
            possibleCombinations: possibleCombinations.toExponential(2),
            entropyBits: Math.round(entropyBits * 100) / 100,
            timeToCrack: calculateTimeToCrack(possibleCombinations)
        },
        suggestions,
        compliance,
        visual
    }
}

// Sample passwords for testing
function getSamplePasswords() {
    return [
        'password',
        '123456',
        'MyStr0ng!P@ssw0rd',
        'CorrectHorseBatteryStaple',
        'Tr0ub4dor&3',
        'P@ssw0rd123!',
        'MySecurePassword2023!',
        'Th1sIsAV3ryS3cur3P@ssw0rd!@#',
        '🔐🔑🛡️😊',
        'xK9#mP2$vL5@nQ8!'
    ]
}

export function PasswordCheckerTool() {
    const [input, setInput] = usePersistentState('password_checker_input', '')
    const [showPassword, setShowPassword] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showCompliance, setShowCompliance] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedAnalysis = useMemo(() => {
        return analyzePassword(input)
    }, [input])

    const exportText = useMemo(() => {
        if (!input) return ''
        
        return [
            `Password Strength: ${enhancedAnalysis.strength.label} (${enhancedAnalysis.strength.score}/100)`,
            `Description: ${enhancedAnalysis.strength.description}`,
            `Length: ${enhancedAnalysis.characteristics.length}`,
            `Unique Characters: ${enhancedAnalysis.characteristics.uniqueChars}`,
            `Character Types:`,
            `  Lowercase: ${enhancedAnalysis.characteristics.hasLower}`,
            `  Uppercase: ${enhancedAnalysis.characteristics.hasUpper}`,
            `  Numbers: ${enhancedAnalysis.characteristics.hasNumber}`,
            `  Symbols: ${enhancedAnalysis.characteristics.hasSymbol}`,
            `  Spaces: ${enhancedAnalysis.characteristics.hasSpace}`,
            `  Emoji: ${enhancedAnalysis.characteristics.hasEmoji}`,
            `  Unicode: ${enhancedAnalysis.characteristics.hasUnicode}`,
            `Pattern Analysis:`,
            `  Repeating: ${enhancedAnalysis.patterns.isRepeating}`,
            `  Sequential: ${enhancedAnalysis.patterns.isSequential}`,
            `  Keyboard Pattern: ${enhancedAnalysis.patterns.isKeyboardPattern}`,
            `  Common Word: ${enhancedAnalysis.patterns.isCommonWord}`,
            `  Leet Speak: ${enhancedAnalysis.patterns.isLeetSpeak}`,
            `  Mixed Case: ${enhancedAnalysis.patterns.isMixedCase}`,
            `Entropy Information:`,
            `  Charset Size: ${enhancedAnalysis.entropy.charsetSize}`,
            `  Possible Combinations: ${enhancedAnalysis.entropy.possibleCombinations}`,
            `  Entropy Bits: ${enhancedAnalysis.entropy.entropyBits}`,
            `  Time to Crack (GPU): ${enhancedAnalysis.entropy.timeToCrack.instant}`,
            `  Time to Crack (Fast): ${enhancedAnalysis.entropy.timeToCrack.fast}`,
            `  Time to Crack (Online): ${enhancedAnalysis.entropy.timeToCrack.slow}`,
            `  Time to Crack (Government): ${enhancedAnalysis.entropy.timeToCrack.government}`,
            `Compliance:`,
            `  NIST: ${enhancedAnalysis.compliance.nist}`,
            `  PCI DSS: ${enhancedAnalysis.compliance.pci}`,
            `  HIPAA: ${enhancedAnalysis.compliance.hipaa}`,
            `  GDPR: ${enhancedAnalysis.compliance.gdpr}`,
            `  ISO 27001: ${enhancedAnalysis.compliance.iso27001}`,
            `Suggestions:`,
            `  Critical: ${enhancedAnalysis.suggestions.critical.join(', ') || 'None'}`,
            `  Important: ${enhancedAnalysis.suggestions.important.join(', ') || 'None'}`,
            `  Optional: ${enhancedAnalysis.suggestions.optional.join(', ') || 'None'}`
        ].join('\n')
    }, [enhancedAnalysis])

    const handleCopy = async () => {
        if (exportText) {
            await copyToClipboard(exportText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                // Extract passwords from file (one per line)
                const lines = content.split('\n')
                const firstPassword = lines.find(line => line.trim().length > 0)
                if (firstPassword) {
                    setInput(firstPassword.trim())
                }
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSamplePasswords()
        setInput(samples[Math.floor(Math.random() * samples.length)])
    }

    return (
        <ToolLayout
            title="Password Checker Pro"
            description="Advanced password strength analyzer with comprehensive heuristics, entropy calculation, and compliance checking."
            icon={ShieldCheck}
            onReset={() => setInput('')}
            onCopy={handleCopy}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Password Checker</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced password strength analysis with comprehensive heuristics</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv,.log"
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

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!input}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAdvanced 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowCompliance(!showCompliance)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showCompliance 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Compliance</span>
                        </button>
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className={`text-lg font-black ${enhancedAnalysis.strength.color}`}>{enhancedAnalysis.strength.label}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Strength</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-blue-400">{enhancedAnalysis.strength.score}/100</div>
                        <div className="text-xs text-[var(--text-secondary)]">Score</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-green-400">{enhancedAnalysis.characteristics.length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Length</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-yellow-400">{enhancedAnalysis.entropy.entropyBits}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Entropy Bits</div>
                    </div>
                </div>

                {/* Main Input */}
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Type a password to evaluate..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full pr-12 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Processed locally; not sent anywhere. Heuristics only; not a guarantee.</p>
                </div>

                {/* Strength Visualization */}
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Strength Analysis</div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Overall Strength</span>
                                <span className={`text-sm font-bold ${enhancedAnalysis.strength.color}`}>{enhancedAnalysis.strength.score}%</span>
                            </div>
                            <div className="w-full bg-[var(--border-primary)] rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        enhancedAnalysis.strength.score >= 85 ? 'bg-green-400' :
                                        enhancedAnalysis.strength.score >= 70 ? 'bg-green-300' :
                                        enhancedAnalysis.strength.score >= 55 ? 'bg-yellow-400' :
                                        enhancedAnalysis.strength.score >= 40 ? 'bg-orange-400' :
                                        enhancedAnalysis.strength.score >= 25 ? 'bg-red-400' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${enhancedAnalysis.strength.score}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-2">
                            {enhancedAnalysis.strength.description}
                        </div>
                    </div>
                </div>

                {/* Advanced Analysis */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Characteristics</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Length:</span>
                                        <span className="text-blue-400">{enhancedAnalysis.characteristics.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Unique:</span>
                                        <span className="text-green-400">{enhancedAnalysis.characteristics.uniqueChars}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Lowercase:</span>
                                        <span className={enhancedAnalysis.characteristics.hasLower ? 'text-green-400' : 'text-red-400'}>
                                            {enhancedAnalysis.characteristics.hasLower ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Uppercase:</span>
                                        <span className={enhancedAnalysis.characteristics.hasUpper ? 'text-green-400' : 'text-red-400'}>
                                            {enhancedAnalysis.characteristics.hasUpper ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Numbers:</span>
                                        <span className={enhancedAnalysis.characteristics.hasNumber ? 'text-green-400' : 'text-red-400'}>
                                            {enhancedAnalysis.characteristics.hasNumber ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Symbols:</span>
                                        <span className={enhancedAnalysis.characteristics.hasSymbol ? 'text-green-400' : 'text-red-400'}>
                                            {enhancedAnalysis.characteristics.hasSymbol ? '✓' : '✗'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Pattern Detection</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Repeating:</span>
                                        <span className={enhancedAnalysis.patterns.isRepeating ? 'text-red-400' : 'text-green-400'}>
                                            {enhancedAnalysis.patterns.isRepeating ? '✗' : '✓'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Sequential:</span>
                                        <span className={enhancedAnalysis.patterns.isSequential ? 'text-red-400' : 'text-green-400'}>
                                            {enhancedAnalysis.patterns.isSequential ? '✗' : '✓'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Keyboard:</span>
                                        <span className={enhancedAnalysis.patterns.isKeyboardPattern ? 'text-red-400' : 'text-green-400'}>
                                            {enhancedAnalysis.patterns.isKeyboardPattern ? '✗' : '✓'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Common:</span>
                                        <span className={enhancedAnalysis.patterns.isCommonWord ? 'text-red-400' : 'text-green-400'}>
                                            {enhancedAnalysis.patterns.isCommonWord ? '✗' : '✓'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Entropy Analysis</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Charset:</span>
                                        <span className="text-blue-400">{enhancedAnalysis.entropy.charsetSize}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Combinations:</span>
                                        <span className="text-green-400 font-mono text-xs">{enhancedAnalysis.entropy.possibleCombinations}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Entropy:</span>
                                        <span className="text-yellow-400">{enhancedAnalysis.entropy.entropyBits} bits</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compliance Check */}
                {showCompliance && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Compliance Standards</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedAnalysis.compliance.nist ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedAnalysis.compliance.nist ? '✓' : '✗'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">NIST</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedAnalysis.compliance.pci ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedAnalysis.compliance.pci ? '✓' : '✗'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">PCI DSS</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedAnalysis.compliance.hipaa ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedAnalysis.compliance.hipaa ? '✓' : '✗'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">HIPAA</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedAnalysis.compliance.gdpr ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedAnalysis.compliance.gdpr ? '✓' : '✗'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">GDPR</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedAnalysis.compliance.iso27001 ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedAnalysis.compliance.iso27001 ? '✓' : '✗'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">ISO 27001</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Time to Crack */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-4">
                        <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Estimated Time to Crack</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-black text-blue-400">{enhancedAnalysis.entropy.timeToCrack.instant}</div>
                            <div className="text-xs text-[var(--text-secondary)]">High-end GPU</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-green-400">{enhancedAnalysis.entropy.timeToCrack.fast}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Mid-range</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-yellow-400">{enhancedAnalysis.entropy.timeToCrack.slow}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Online Attack</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-purple-400">{enhancedAnalysis.entropy.timeToCrack.government}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Government</div>
                        </div>
                    </div>
                </div>

                {/* Suggestions */}
                <div className="glass rounded-[2.5rem] border-[var(--border-primary)] p-8 bg-[var(--bg-secondary)]/30">
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Suggestions</div>
                    
                    {enhancedAnalysis.suggestions.critical.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm font-bold text-red-400 mb-2">Critical Issues</div>
                            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                {enhancedAnalysis.suggestions.critical.map((suggestion, index) => (
                                    <li key={index}>• {suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {enhancedAnalysis.suggestions.important.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm font-bold text-yellow-400 mb-2">Important</div>
                            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                {enhancedAnalysis.suggestions.important.map((suggestion, index) => (
                                    <li key={index}>• {suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {enhancedAnalysis.suggestions.optional.length > 0 && (
                        <div>
                            <div className="text-sm font-bold text-blue-400 mb-2">Optional</div>
                            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                {enhancedAnalysis.suggestions.optional.map((suggestion, index) => (
                                    <li key={index}>• {suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {enhancedAnalysis.suggestions.critical.length === 0 && 
                     enhancedAnalysis.suggestions.important.length === 0 && 
                     enhancedAnalysis.suggestions.optional.length === 0 && (
                        <div className="text-sm text-green-400 font-bold">Excellent! No suggestions needed.</div>
                    )}
                </div>
            </div>
        </ToolLayout>
    )
}

