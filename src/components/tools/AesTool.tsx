import { useMemo, useState } from 'react'
import { Copy, Check, Settings, Search, Clock, Shield, AlertCircle, TrendingUp, Database, Lock, Unlock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toHex(bytes: Uint8Array) {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string) {
    const clean = hex.trim().replace(/\s+/g, '')
    if (!clean) return new Uint8Array()
    if (clean.length % 2 !== 0) throw new Error('Hex length must be even')
    const out = new Uint8Array(clean.length / 2)
    for (let i = 0; i < clean.length; i += 2) {
        const v = Number.parseInt(clean.slice(i, i + 2), 16)
        if (Number.isNaN(v)) throw new Error('Invalid hex')
        out[i / 2] = v
    }
    return out
}

function b64Encode(bytes: Uint8Array) {
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin)
}

function b64Decode(b64: string) {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
    const saltBytes = new Uint8Array(salt)
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    )

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export function AesTool() {
    const [mode, setMode] = usePersistentState<'encrypt' | 'decrypt'>('aes_mode', 'encrypt')
    const [input, setInput] = usePersistentState('aes_input', '')
    const [passphrase, setPassphrase] = usePersistentState('aes_passphrase', '')
    const [output, setOutput] = usePersistentState('aes_output', '')
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [aesHistory, setAesHistory] = usePersistentState<Array<{mode: string, input: string, passphrase: string, output: string, timestamp: string}>>('aes_history', [])
    const [iterations, setIterations] = usePersistentState('aes_iterations', 200000)

    const canProcess = useMemo(() => passphrase.length > 0 && input.length > 0, [passphrase, input])

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (modeValue: string, inputValue: string, passphraseValue: string, outputValue: string) => {
        const newEntry = {
            mode: modeValue,
            input: inputValue,
            passphrase: passphraseValue,
            output: outputValue,
            timestamp: new Date().toISOString()
        }
        setAesHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const envelope = useMemo(() => {
        return {
            format: 'AES-256-GCM+PBKDF2',
            kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations },
            saltHex: '',
            ivHex: '',
            ciphertextB64: ''
        }
    }, [iterations])

    const runEncrypt = async () => {
        setError(null)
        setOutput('')
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16))
            const iv = crypto.getRandomValues(new Uint8Array(12))
            const key = await deriveKey(passphrase, salt, iterations)
            const ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                new TextEncoder().encode(input)
            )
            const env = {
                format: 'AES-256-GCM+PBKDF2',
                kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations },
                saltHex: toHex(salt),
                ivHex: toHex(iv),
                ciphertextB64: b64Encode(new Uint8Array(ciphertext))
            }
            const result = JSON.stringify(env, null, 2)
            setOutput(result)
            addToHistory('encrypt', input, passphrase, result)
        } catch (e: any) {
            setError(e?.message || 'Encrypt failed')
        }
    }

    const runDecrypt = async () => {
        setError(null)
        setOutput('')
        try {
            const env = JSON.parse(input)
            const salt = fromHex(env.saltHex)
            const iv = fromHex(env.ivHex)
            const iterations = Number(env?.kdf?.iterations) || 200000
            const key = await deriveKey(passphrase, salt, iterations)
            const ciphertext = b64Decode(env.ciphertextB64)
            const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
            const result = new TextDecoder().decode(plain)
            setOutput(result)
            addToHistory('decrypt', input, passphrase, result)
        } catch (e: any) {
            setError(e?.message || 'Decrypt failed')
        }
    }

    const handleClearHistory = () => {
        setAesHistory([])
    }

    const handleHistoryClick = (entry: {mode: string, input: string, passphrase: string, output: string}) => {
        setMode(entry.mode as 'encrypt' | 'decrypt')
        setInput(entry.input)
        setPassphrase(entry.passphrase)
        setOutput(entry.output)
    }

    return (
        <ToolLayout
            title="AES Encrypt / Decrypt"
            description="AES-256-GCM encryption with PBKDF2 passphrase derivation and advanced features."
            icon={Lock}
            onReset={() => { setInput(''); setPassphrase(''); setOutput(''); setError(null) }}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Lock className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced AES Encryption</h2>
                            <p className="text-sm text-[var(--text-muted)]">AES-256-GCM with PBKDF2 key derivation</p>
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
                            <span className="font-bold">AES Processing Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Mode Toggle */}
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                            mode === 'encrypt' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        <Lock className="w-3 h-3" />
                        <span>Encrypt</span>
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                            mode === 'decrypt' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        <Unlock className="w-3 h-3" />
                        <span>Decrypt</span>
                    </button>
                </div>

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-3">
                            <Shield className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Passphrase</label>
                        </div>
                        <input 
                            type="password" 
                            value={passphrase} 
                            onChange={(e) => setPassphrase(e.target.value)} 
                            placeholder="Enter secure passphrase..."
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        />
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {passphrase.length} characters
                            </p>
                        </div>
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-3">
                            <Database className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Process</label>
                        </div>
                        <button
                            onClick={mode === 'encrypt' ? runEncrypt : runDecrypt}
                            disabled={!canProcess}
                            className={cn(
                                'w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                canProcess ? 'brand-gradient' : 'bg-white/10 opacity-50'
                            )}
                        >
                            {mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}
                        </button>
                    </div>
                </div>

                {/* Input/Output Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                    {mode === 'encrypt' ? 'Plaintext' : 'Envelope JSON'}
                                </label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                            <textarea
                                className="w-full h-full p-4 bg-transparent text-blue-300 font-mono text-xs resize-none outline-none"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'encrypt' ? 'Text to encrypt...' : JSON.stringify(envelope, null, 2)}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {input.length} characters
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
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
                                    <p className="text-sm">No output yet</p>
                                    <p className="text-xs">Enter data and passphrase to process</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">PBKDF2 Iterations</label>
                                <input
                                    type="number"
                                    value={iterations}
                                    onChange={(e) => setIterations(Number(e.target.value))}
                                    min="10000"
                                    max="1000000"
                                    step="10000"
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Higher iterations = more security, slower processing</p>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-sm text-[var(--text-primary)] font-bold mb-2">Algorithm Details</div>
                                    <div className="text-xs text-[var(--text-muted)] space-y-1">
                                        <div>• AES-256-GCM</div>
                                        <div>• PBKDF2-SHA256</div>
                                        <div>• Random Salt (16 bytes)</div>
                                        <div>• Random IV (12 bytes)</div>
                                        <div>• Authenticated Encryption</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Security Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                All encryption and decryption happens locally in your browser using the WebCrypto API. No data is sent to any server. The envelope format includes all necessary parameters for decryption.
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
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                disabled={aesHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    aesHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                            {aesHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {aesHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest flex items-center space-x-1">
                                                    {entry.mode === 'encrypt' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                    <span>{entry.mode}</span>
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.input.substring(0, 50)}{entry.input.length > 50 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your encryption/decryption history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
