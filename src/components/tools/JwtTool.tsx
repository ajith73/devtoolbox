import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileCode, AlertCircle, Clock } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import { copyToClipboard } from '../../lib/utils'

export function JwtTool() {
    const [input, setInput] = useState('')
    const [header, setHeader] = useState<any>(null)
    const [payload, setPayload] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [expiry, setExpiry] = useState<Date | null>(null)

    useEffect(() => {
        if (!input.trim()) {
            setHeader(null)
            setPayload(null)
            setError(null)
            setExpiry(null)
            return
        }

        try {
            const decodedToken: any = jwtDecode(input, { header: true })
            setHeader(decodedToken)

            const decodedPayload: any = jwtDecode(input)
            setPayload(decodedPayload)

            if (decodedPayload.exp) {
                setExpiry(new Date(decodedPayload.exp * 1000))
            }
            setError(null)
        } catch (e: any) {
            setError('Invalid JWT Token')
            setHeader(null)
            setPayload(null)
            setExpiry(null)
        }
    }, [input])

    const isExpired = expiry ? expiry < new Date() : false

    return (
        <ToolLayout
            title="JWT Decoder"
            description="Inspect and validate JSON Web Tokens."
            icon={FileCode}
            onReset={() => setInput('')}
            onCopy={payload ? () => copyToClipboard(JSON.stringify(payload, null, 2)) : undefined}
        >
            <div className="space-y-6">
                <div className="flex flex-col space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Base64 Signature</label>
                    <textarea
                        className="h-32 font-mono text-sm resize-none p-6 glass rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)]"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-4 text-red-500 shadow-sm animate-shake">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <span className="text-sm font-black uppercase tracking-widest">{error} Decoding Error</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Protocol Header</label>
                        <div className="h-48 glass rounded-[2.5rem] p-6 overflow-auto border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm">
                            <pre className="text-pink-600 dark:text-pink-400 font-mono text-sm leading-relaxed font-black opacity-90">
                                {header ? JSON.stringify(header, null, 2) : '// Null state: awaiting token...'}
                            </pre>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Application Payload</label>
                        <div className="h-48 glass rounded-[2.5rem] p-6 overflow-auto border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm">
                            <pre className="text-blue-600 dark:text-blue-400 font-mono text-sm leading-relaxed font-black opacity-90">
                                {payload ? JSON.stringify(payload, null, 2) : '// Null state: awaiting token...'}
                            </pre>
                        </div>
                    </div>
                </div>

                {expiry && (
                    <div className={`p-6 rounded-[2rem] flex items-center justify-between border shadow-sm ${isExpired ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-green-500/5 border-green-500/20 text-green-500'}`}>
                        <div className="flex items-center space-x-4">
                            <Clock className={`w-6 h-6 ${isExpired ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                Temporal Status: {isExpired ? 'EXPIRED' : 'ACTIVE'}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-black opacity-80 uppercase tracking-widest">{expiry.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
