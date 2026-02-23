import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Copy } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// JWT decoding functions
function decodeBase64Url(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4
    const padded = padding ? base64 + '='.repeat(4 - padding) : base64
    return atob(padded)
}

function parseJwt(token: string): { header: any; payload: any; signature: string } | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const header = JSON.parse(decodeBase64Url(parts[0]))
        const payload = JSON.parse(decodeBase64Url(parts[1]))
        const signature = parts[2]

        return { header, payload, signature }
    } catch (e) {
        return null
    }
}

async function verifyHS256(token: string, secret: string): Promise<boolean> {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return false

        const data = parts[0] + '.' + parts[1]
        const signature = parts[2]

        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        )

        const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
        const expectedSignatureBase64Url = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')

        return signature === expectedSignatureBase64Url
    } catch (e) {
        return false
    }
}

async function verifyRS256(token: string, publicKeyPem: string): Promise<boolean> {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return false

        const data = parts[0] + '.' + parts[1]
        const signature = parts[2]

        // Convert PEM to binary
        const pemContents = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s/g, '')
        const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

        const publicKey = await crypto.subtle.importKey(
            'spki',
            binaryKey,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify']
        )

        const signatureBinary = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(signature.length * 6 / 8), '=')), c => c.charCodeAt(0))

        return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signatureBinary, new TextEncoder().encode(data))
    } catch (e) {
        return false
    }
}

function generateJWT(payload: any, secret: string, algorithm: 'HS256' | 'RS256' = 'HS256'): Promise<string> {
    const header = { alg: algorithm, typ: 'JWT' }

    const encoder = new TextEncoder()
    const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    const data = headerB64 + '.' + payloadB64

    // For demo purposes, only implement HS256 generation
    if (algorithm === 'HS256') {
        return crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        ).then(key =>
            crypto.subtle.sign('HMAC', key, encoder.encode(data))
        ).then(signature => {
            const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
            return data + '.' + signatureB64
        })
    }

    throw new Error('RS256 generation not implemented in demo')
}

function getClaimsExplanation(): Record<string, string> {
    return {
        iss: 'Issuer - identifies the principal that issued the JWT',
        sub: 'Subject - identifies the principal that is the subject of the JWT',
        aud: 'Audience - identifies the recipients that the JWT is intended for',
        exp: 'Expiration Time - identifies the expiration time after which the JWT must not be accepted',
        nbf: 'Not Before - identifies the time before which the JWT must not be accepted',
        iat: 'Issued At - identifies the time at which the JWT was issued',
        jti: 'JWT ID - provides a unique identifier for the JWT'
    }
}

function getSecurityWarnings(tokenData: any, isExpired: boolean, signatureValid: boolean | null): string[] {
    const warnings = []

    if (isExpired) {
        warnings.push('⚠ Token expired')
    }

    if (tokenData?.header?.alg === 'none') {
        warnings.push('⚠ Using "none" algorithm - token is not signed')
    }

    if (tokenData?.payload && !tokenData.payload.aud) {
        warnings.push('⚠ Missing audience claim')
    }

    if (signatureValid === false) {
        warnings.push('⚠ Invalid signature')
    }

    if (tokenData?.payload?.exp && tokenData.payload.exp < Date.now() / 1000 - 86400 * 30) {
        warnings.push('⚠ Token expired more than 30 days ago')
    }

    return warnings
}

export function JwtTool() {
    const [mode, setMode] = usePersistentState<'decode' | 'generate'>('jwt_mode', 'decode')
    const [input, setInput] = usePersistentState('jwt_input', '')
    const [secret, setSecret] = usePersistentState('jwt_secret', '')
    const [publicKey, setPublicKey] = usePersistentState('jwt_public_key', '')
    const [algorithm, setAlgorithm] = usePersistentState<'HS256' | 'RS256'>('jwt_algorithm', 'HS256')
    const [decodedData, setDecodedData] = useState<any>(null)
    const [signatureValid, setSignatureValid] = useState<boolean | null>(null)
    const [generatedToken, setGeneratedToken] = useState('')
    const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!input.trim()) {
            setDecodedData(null)
            setSignatureValid(null)
            setSecurityWarnings([])
            setError(null)
            return
        }

        if (mode === 'decode') {
            const tokenData = parseJwt(input)
            if (!tokenData) {
                setError('Invalid JWT format')
                setDecodedData(null)
                setSignatureValid(null)
                setSecurityWarnings([])
                return
            }

            setDecodedData(tokenData)
            setError(null)

            // Check expiration
            const now = Date.now() / 1000
            const isExpired = tokenData.payload.exp && tokenData.payload.exp < now

            // Verify signature
            if (tokenData.header.alg === 'HS256' && secret) {
                verifyHS256(input, secret).then(setSignatureValid)
            } else if (tokenData.header.alg === 'RS256' && publicKey) {
                verifyRS256(input, publicKey).then(setSignatureValid)
            } else {
                setSignatureValid(null)
            }

            // Generate security warnings
            const warnings = getSecurityWarnings(tokenData, !!isExpired, signatureValid)
            setSecurityWarnings(warnings)
        }
    }, [input, secret, publicKey, mode, signatureValid])

    const handleGenerateToken = async () => {
        try {
            setError(null)
            let payload
            try {
                payload = JSON.parse(input)
            } catch (e) {
                setError('Invalid JSON payload')
                return
            }

            const token = await generateJWT(payload, secret, algorithm)
            setGeneratedToken(token)
        } catch (e: any) {
            setError(e.message || 'Failed to generate token')
        }
    }

    const copyDecodedSection = (section: 'header' | 'payload' | 'signature') => {
        if (!decodedData) return

        if (section === 'signature') {
            copyToClipboard(decodedData.signature)
        } else {
            copyToClipboard(JSON.stringify(decodedData[section], null, 2))
        }
    }

    const downloadToken = () => {
        const content = generatedToken || input
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'jwt-token.txt'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="JWT Decoder & Generator"
            description="Decode, verify, and generate JSON Web Tokens with comprehensive security analysis."
            icon={ShieldCheck}
            onReset={() => {
                setInput('')
                setSecret('')
                setPublicKey('')
                setDecodedData(null)
                setSignatureValid(null)
                setGeneratedToken('')
                setSecurityWarnings([])
                setError(null)
            }}
            onCopy={generatedToken ? () => copyToClipboard(generatedToken) : input ? () => copyToClipboard(input) : undefined}
            onDownload={generatedToken || input ? downloadToken : undefined}
        >
            <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-bold">Mode:</span>
                        <div className="flex rounded-lg bg-[var(--bg-secondary)] p-1">
                            <button
                                onClick={() => setMode('decode')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'decode'
                                    ? 'bg-brand text-white'
                                    : 'text-[var(--text-muted)] hover:text-brand'
                                    }`}
                            >
                                Decode
                            </button>
                            <button
                                onClick={() => setMode('generate')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'generate'
                                    ? 'bg-brand text-white'
                                    : 'text-[var(--text-muted)] hover:text-brand'
                                    }`}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>

                {mode === 'decode' ? (
                    <>
                        {/* JWT Input */}
                        <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">JWT Token</label>
                            <textarea
                                className="w-full h-24 font-mono text-sm resize-none custom-scrollbar p-4 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand/20"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            {error && (
                                <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Verification Settings */}
                        {decodedData && (
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Signature Verification</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Secret (HS256)</label>
                                        <input
                                            type="password"
                                            value={secret}
                                            onChange={(e) => setSecret(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                                            placeholder="Enter secret key"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Algorithm</label>
                                        <div className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm">
                                            {decodedData.header.alg || 'Unknown'}
                                            {decodedData.header.alg === 'none' && (
                                                <AlertTriangle className="inline w-4 h-4 text-red-500 ml-2" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {decodedData.header.alg === 'RS256' && (
                                    <div className="mt-4">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Public Key (RS256)</label>
                                        <textarea
                                            className="w-full h-24 font-mono text-xs resize-none custom-scrollbar p-3 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand/20"
                                            placeholder="-----BEGIN PUBLIC KEY-----..."
                                            value={publicKey}
                                            onChange={(e) => setPublicKey(e.target.value)}
                                        />
                                    </div>
                                )}

                                {signatureValid !== null && (
                                    <div className="mt-4 flex items-center space-x-2">
                                        {signatureValid ? (
                                            <>
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <span className="text-sm font-bold text-green-500">Signature Valid</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-5 h-5 text-red-500" />
                                                <span className="text-sm font-bold text-red-500">Signature Invalid</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Decoded Sections */}
                        {decodedData && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Header */}
                                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Header</h3>
                                        <button
                                            onClick={() => copyDecodedSection('header')}
                                            className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                        </button>
                                    </div>
                                    <pre className="text-xs font-mono text-brand bg-[var(--bg-secondary)] p-3 rounded-lg overflow-auto max-h-32">
                                        {JSON.stringify(decodedData.header, null, 2)}
                                    </pre>
                                </div>

                                {/* Payload */}
                                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Payload</h3>
                                        <button
                                            onClick={() => copyDecodedSection('payload')}
                                            className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                        </button>
                                    </div>
                                    <pre className="text-xs font-mono text-green-600 bg-[var(--bg-secondary)] p-3 rounded-lg overflow-auto max-h-32">
                                        {JSON.stringify(decodedData.payload, null, 2)}
                                    </pre>
                                </div>

                                {/* Signature */}
                                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Signature</h3>
                                        <button
                                            onClick={() => copyDecodedSection('signature')}
                                            className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                        </button>
                                    </div>
                                    <div className="text-xs font-mono text-orange-600 bg-[var(--bg-secondary)] p-3 rounded-lg overflow-auto max-h-32 break-all">
                                        {decodedData.signature}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Token Claims Inspector */}
                        {decodedData?.payload && (
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Token Claims</h3>
                                <div className="space-y-3">
                                    {Object.entries(decodedData.payload).map(([key, value]) => (
                                        <div key={key} className="flex items-start space-x-3 p-2 bg-[var(--bg-secondary)] rounded-lg">
                                            <div className="font-bold text-brand min-w-[60px]">{key}:</div>
                                            <div className="flex-1">
                                                <div className="font-mono text-sm text-[var(--text-primary)]">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </div>
                                                {getClaimsExplanation()[key] && (
                                                    <div className="text-xs text-[var(--text-muted)] mt-1">
                                                        {getClaimsExplanation()[key]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expiration Check */}
                        {decodedData?.payload && (
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <h3 className="text-sm font-bold mb-4 text-[var(--text-primary)]">Expiration Check</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Issued At (iat)</div>
                                        <div className="font-mono text-sm">
                                            {decodedData.payload.iat ? new Date(decodedData.payload.iat * 1000).toLocaleString() : 'Not set'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Expiry (exp)</div>
                                        <div className="font-mono text-sm">
                                            {decodedData.payload.exp ? new Date(decodedData.payload.exp * 1000).toLocaleString() : 'Not set'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Status</div>
                                        <div className="flex items-center space-x-2">
                                            {decodedData.payload.exp ? (
                                                decodedData.payload.exp < Date.now() / 1000 ? (
                                                    <>
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm font-bold text-red-500">Expired</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-bold text-green-500">Valid</span>
                                                    </>
                                                )
                                            ) : (
                                                <span className="text-sm text-[var(--text-muted)]">No expiry</span>
                                            )}
                                        </div>
                                        {decodedData.payload.exp && decodedData.payload.exp > Date.now() / 1000 && (
                                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                                Expires in: {Math.floor((decodedData.payload.exp - Date.now() / 1000) / 3600)}h {Math.floor(((decodedData.payload.exp - Date.now() / 1000) % 3600) / 60)}m
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Warnings */}
                        {securityWarnings.length > 0 && (
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <h3 className="text-sm font-bold mb-4 text-red-500">Security Warnings</h3>
                                <div className="space-y-2">
                                    {securityWarnings.map((warning, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            <span className="text-sm text-red-700">{warning}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Generate Mode */
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Payload Input */}
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Payload JSON</label>
                                <textarea
                                    className="w-full h-48 font-mono text-sm resize-none custom-scrollbar p-4 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand/20"
                                    placeholder='{\n  "sub": "user123",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Algorithm</label>
                                    <select
                                        value={algorithm}
                                        onChange={(e) => setAlgorithm(e.target.value as 'HS256' | 'RS256')}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                                    >
                                        <option value="HS256">HS256 (HMAC)</option>
                                        <option value="RS256">RS256 (RSA)</option>
                                    </select>
                                </div>

                                <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Secret</label>
                                    <input
                                        type="password"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                                        placeholder="Enter secret key"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerateToken}
                                    className="w-full px-4 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors"
                                >
                                    Generate JWT
                                </button>

                                {error && (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Generated Token */}
                        {generatedToken && (
                            <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                                <h3 className="text-sm font-bold mb-3 text-[var(--text-primary)]">Generated JWT</h3>
                                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                                    <pre className="text-sm font-mono text-brand break-all select-all">
                                        {generatedToken}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ToolLayout>
    )
}
