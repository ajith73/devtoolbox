import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
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

    const envelope = useMemo(() => {
        return {
            format: 'AES-256-GCM+PBKDF2',
            saltHex: '',
            ivHex: '',
            ciphertextB64: ''
        }
    }, [])

    const runEncrypt = async () => {
        setError(null)
        setOutput('')
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16))
            const iv = crypto.getRandomValues(new Uint8Array(12))
            const key = await deriveKey(passphrase, salt, 200000)
            const ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                new TextEncoder().encode(input)
            )
            const env = {
                format: 'AES-256-GCM+PBKDF2',
                kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 200000 },
                saltHex: toHex(salt),
                ivHex: toHex(iv),
                ciphertextB64: b64Encode(new Uint8Array(ciphertext))
            }
            setOutput(JSON.stringify(env, null, 2))
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
            setOutput(new TextDecoder().decode(plain))
        } catch (e: any) {
            setError(e?.message || 'Decrypt failed')
        }
    }

    return (
        <ToolLayout
            title="AES Encrypt / Decrypt"
            description="AES-256-GCM encryption with PBKDF2 passphrase derivation (local)."
            icon={ShieldCheck}
            onReset={() => { setInput(''); setPassphrase(''); setOutput(''); setError(null) }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'encrypt' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Encrypt
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'decrypt' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        Decrypt
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Passphrase</label>
                        <input type="text" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="passphrase" />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={mode === 'encrypt' ? runEncrypt : runDecrypt}
                            disabled={!passphrase || !input}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{mode === 'encrypt' ? 'Plaintext' : 'Envelope JSON'}</label>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'encrypt' ? 'Text to encrypt...' : JSON.stringify(envelope, null, 2)}
                        />
                    </div>
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
