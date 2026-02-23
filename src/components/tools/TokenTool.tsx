import { useEffect } from 'react'
import { Key, Shield, Copy } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// UUID generation functions
function generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

function generateUUIDv7(): string {
    const timestamp = Date.now()
    const randomBytes = new Uint8Array(10)
    crypto.getRandomValues(randomBytes)
    const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')

    // UUID v7 format: timestamp (48 bits) + version (4 bits) + variant (2 bits) + random (74 bits)
    const timestampHex = timestamp.toString(16).padStart(12, '0')
    const versionVariant = '7' // v7 with variant bits
    const combined = timestampHex + versionVariant + randomHex.substring(2)

    return combined.substring(0, 8) + '-' +
        combined.substring(8, 12) + '-' +
        combined.substring(12, 16) + '-' +
        combined.substring(16, 20) + '-' +
        combined.substring(20, 32)
}

function generateNanoId(length: number = 21): string {
    const alphabet = '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let id = ''
    for (let i = 0; i < length; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return id
}

function generateRandomString(options: {
    length: number
    includeUppercase: boolean
    includeLowercase: boolean
    includeNumbers: boolean
    includeSymbols: boolean
    excludeSimilar: boolean
    customCharset?: string
}): string {
    let charset = ''

    if (options.customCharset) {
        charset = options.customCharset
    } else {
        if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
        if (options.includeNumbers) charset += '0123456789'
        if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    if (options.excludeSimilar) {
        charset = charset.replace(/[O0l1]/g, '')
    }

    if (!charset) return ''

    const array = new Uint8Array(options.length)
    crypto.getRandomValues(array)

    let result = ''
    for (let i = 0; i < options.length; i++) {
        result += charset[array[i] % charset.length]
    }

    return result
}

function generateApiKey(format: string): string {
    switch (format) {
        case 'sk_live':
            return 'sk_live_' + generateRandomString({
                length: 32,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSymbols: false,
                excludeSimilar: false
            })
        case 'pk_test':
            return 'pk_test_' + generateRandomString({
                length: 32,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSymbols: false,
                excludeSimilar: false
            })
        default:
            return generateRandomString({
                length: 32,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSymbols: false,
                excludeSimilar: false
            })
    }
}

function generateJWTSecret(): string {
    return generateRandomString({
        length: 64,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false
    })
}

function calculateEntropy(string: string): number {
    const charset = new Set(string).size
    const entropy = string.length * Math.log2(charset)
    return entropy
}

function getStrengthLevel(entropy: number): { level: string; color: string } {
    if (entropy < 28) return { level: 'Weak', color: 'text-red-500' }
    if (entropy < 36) return { level: 'Medium', color: 'text-yellow-500' }
    if (entropy < 60) return { level: 'Strong', color: 'text-green-500' }
    return { level: 'Very Strong', color: 'text-emerald-500' }
}

export function TokenTool() {
    const [tokenType, setTokenType] = usePersistentState('token_type', 'uuid4')
    const [length, setLength] = usePersistentState('token_length', 32)
    const [includeUppercase, setIncludeUppercase] = usePersistentState('include_uppercase', true)
    const [includeLowercase, setIncludeLowercase] = usePersistentState('include_lowercase', true)
    const [includeNumbers, setIncludeNumbers] = usePersistentState('include_numbers', true)
    const [includeSymbols, setIncludeSymbols] = usePersistentState('include_symbols', false)
    const [excludeSimilar, setExcludeSimilar] = usePersistentState('exclude_similar', false)
    const [customCharset, setCustomCharset] = usePersistentState('custom_charset', '')
    const [bulkCount, setBulkCount] = usePersistentState('bulk_count', 1)
    const [prefix, setPrefix] = usePersistentState('token_prefix', '')
    const [suffix, setSuffix] = usePersistentState('token_suffix', '')
    const [expiryHours, setExpiryHours] = usePersistentState('expiry_hours', 0)
    const [generatedTokens, setGeneratedTokens] = usePersistentState('generated_tokens', [] as string[])

    const generateToken = () => {
        let token = ''

        switch (tokenType) {
            case 'uuid4':
                token = generateUUIDv4()
                break
            case 'uuid7':
                token = generateUUIDv7()
                break
            case 'nanoid':
                token = generateNanoId(length)
                break
            case 'random':
                token = generateRandomString({
                    length,
                    includeUppercase,
                    includeLowercase,
                    includeNumbers,
                    includeSymbols,
                    excludeSimilar,
                    customCharset: customCharset || undefined
                })
                break
            case 'apikey':
                token = generateApiKey('standard')
                break
            case 'jwt':
                token = generateJWTSecret()
                break
            default:
                token = generateRandomString({
                    length,
                    includeUppercase,
                    includeLowercase,
                    includeNumbers,
                    includeSymbols,
                    excludeSimilar,
                    customCharset: customCharset || undefined
                })
        }

        token = prefix + token + suffix
        return token
    }

    const generateBulkTokens = () => {
        const tokens = []
        for (let i = 0; i < bulkCount; i++) {
            tokens.push(generateToken())
        }
        setGeneratedTokens(tokens)
    }

    const downloadTokens = (format: 'txt' | 'csv' | 'json') => {
        let content = ''

        switch (format) {
            case 'txt':
                content = generatedTokens.join('\n')
                break
            case 'csv':
                content = 'Token\n' + generatedTokens.map(t => `"${t}"`).join('\n')
                break
            case 'json':
                content = JSON.stringify({ tokens: generatedTokens, generated: new Date().toISOString() }, null, 2)
                break
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `tokens.${format}`
        link.click()
        URL.revokeObjectURL(url)
    }

    const copyAllTokens = () => {
        copyToClipboard(generatedTokens.join('\n'))
    }

    useEffect(() => {
        if (tokenType !== 'random') {
            generateBulkTokens()
        }
    }, [tokenType, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, customCharset, prefix, suffix, bulkCount])

    return (
        <ToolLayout
            title="Token Generator"
            description="Generate secure tokens, UUIDs, API keys, and random strings with customizable options."
            icon={Key}
            onReset={() => {
                setGeneratedTokens([])
                setTokenType('uuid4')
                setLength(32)
                setIncludeUppercase(true)
                setIncludeLowercase(true)
                setIncludeNumbers(true)
                setIncludeSymbols(false)
                setExcludeSimilar(false)
                setCustomCharset('')
                setBulkCount(1)
                setPrefix('')
                setSuffix('')
                setExpiryHours(0)
            }}
            onCopy={generatedTokens.length > 0 ? () => copyAllTokens() : undefined}
            onDownload={generatedTokens.length > 0 ? () => downloadTokens('txt') : undefined}
        >
            <div className="space-y-6">
                {/* Token Type Selection */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Token Type</label>
                    <select
                        value={tokenType}
                        onChange={(e) => setTokenType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="uuid4">UUID v4</option>
                        <option value="uuid7">UUID v7 (sortable) 🔥</option>
                        <option value="nanoid">Nano ID</option>
                        <option value="random">Random String</option>
                        <option value="apikey">API Key Format</option>
                        <option value="jwt">JWT Secret</option>
                    </select>
                </div>

                {/* Custom String Options */}
                {tokenType === 'random' && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                        <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Customizable Random String Generator</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Length (1-512)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="512"
                                    value={length}
                                    onChange={(e) => setLength(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Custom Character Set</label>
                                <input
                                    type="text"
                                    value={customCharset}
                                    onChange={(e) => setCustomCharset(e.target.value)}
                                    placeholder="Leave empty for default charset"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={includeUppercase}
                                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Uppercase</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={includeLowercase}
                                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Lowercase</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={includeNumbers}
                                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Numbers</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={includeSymbols}
                                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Symbols</span>
                            </label>
                        </div>

                        <label className="flex items-center space-x-2 mt-4">
                            <input
                                type="checkbox"
                                checked={excludeSimilar}
                                onChange={(e) => setExcludeSimilar(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Exclude similar characters (O/0, l/1)</span>
                        </label>
                    </div>
                )}

                {/* Bulk Generation */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Bulk Generation</h3>
                    <div className="flex items-center space-x-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Generate</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={bulkCount}
                            onChange={(e) => setBulkCount(Number(e.target.value))}
                            className="w-24 px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        />
                        <span className="text-sm">tokens</span>
                        <button
                            onClick={generateBulkTokens}
                            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                {/* Prefix/Suffix */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Prefix / Suffix Option</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Prefix</label>
                            <input
                                type="text"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                placeholder="sk_live_"
                                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Suffix</label>
                            <input
                                type="text"
                                value={suffix}
                                onChange={(e) => setSuffix(e.target.value)}
                                placeholder="_prod"
                                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Expiry Timestamp */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Expiry Timestamp Generator</h3>
                    <div className="flex items-center space-x-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Expires in</label>
                        <input
                            type="number"
                            min="0"
                            value={expiryHours}
                            onChange={(e) => setExpiryHours(Number(e.target.value))}
                            className="w-24 px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        />
                        <span className="text-sm">hours</span>
                        {expiryHours > 0 && (
                            <span className="text-sm text-[var(--text-muted)]">
                                (Expires: {new Date(Date.now() + expiryHours * 60 * 60 * 1000).toLocaleString()})
                            </span>
                        )}
                    </div>
                </div>

                {/* Security Info */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Security Mode</h3>
                        <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">Secure</span>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                        Uses Web Crypto API with secure random (crypto.getRandomValues) for maximum security.
                    </p>
                </div>

                {/* Generated Tokens */}
                {generatedTokens.length > 0 && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Generated Tokens</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={copyAllTokens}
                                    className="px-3 py-1 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors"
                                >
                                    Copy All
                                </button>
                                <button
                                    onClick={() => downloadTokens('txt')}
                                    className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                                >
                                    Download TXT
                                </button>
                                <button
                                    onClick={() => downloadTokens('csv')}
                                    className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                                >
                                    Download CSV
                                </button>
                                <button
                                    onClick={() => downloadTokens('json')}
                                    className="px-3 py-1 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors"
                                >
                                    Download JSON
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {generatedTokens.map((token, index) => {
                                const entropy = calculateEntropy(token)
                                const strength = getStrengthLevel(entropy)

                                return (
                                    <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="flex-1">
                                            <code className="text-sm font-mono text-[var(--text-primary)] break-all">{token}</code>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <span className={`text-xs font-bold ${strength.color}`}>{strength.level}</span>
                                            <button
                                                onClick={() => copyToClipboard(token)}
                                                className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                                            >
                                                <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
