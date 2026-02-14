import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Fingerprint, RefreshCcw, Key, Copy } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function TokenTool() {
    const [tokens, setTokens] = useState<Array<{ id: string, value: string, type: string }>>([])
    const [count, setCount] = usePersistentState('token_count', 5)

    const generateUuids = () => {
        const newTokens = Array.from({ length: count }).map(() => ({
            id: uuidv4(),
            value: uuidv4(),
            type: 'UUID v4'
        }))
        setTokens(newTokens)
    }

    const generateRandomStrings = (len = 32) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        const newTokens = Array.from({ length: count }).map(() => {
            let result = ''
            for (let i = 0; i < len; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return {
                id: uuidv4(),
                value: result,
                type: `String (${len}ch)`
            }
        })
        setTokens(newTokens)
    }

    const generateApiKeys = () => {
        const newTokens = Array.from({ length: count }).map(() => {
            const prefix = 'pk_live_'
            const buffer = new Uint8Array(24)
            window.crypto.getRandomValues(buffer)
            const key = btoa(String.fromCharCode(...buffer)).replace(/\+/g, '-').replace(/\//g, '_').substring(0, 32)
            return {
                id: uuidv4(),
                value: `${prefix}${key}`,
                type: 'API Key'
            }
        })
        setTokens(newTokens)
    }

    return (
        <ToolLayout
            title="Token Generator"
            description="Generate secure UUIDs, API keys, and random strings."
            icon={Fingerprint}
            onReset={() => { setTokens([]); }}
            onCopy={tokens.length > 0 ? () => copyToClipboard(tokens.map(t => t.value).join('\n')) : undefined}
        >
            <div className="space-y-8">
                <div className="flex flex-wrap gap-6 items-center p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm">
                    <div className="flex flex-col space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-1">Batch Size</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                            className="w-28 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl focus:ring-2 focus:ring-brand/20 transition-all text-brand font-black text-center"
                        />
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onClick={generateUuids} className="px-5 py-3.5 bg-brand/[0.03] hover:bg-brand text-brand hover:text-white rounded-2xl transition-all flex items-center justify-center space-x-3 border border-brand/10 hover:border-brand group shadow-sm active:scale-95">
                            <Fingerprint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Generate UUID</span>
                        </button>
                        <button onClick={() => generateRandomStrings()} className="px-5 py-3.5 bg-brand/[0.03] hover:bg-brand text-brand hover:text-white rounded-2xl transition-all flex items-center justify-center space-x-3 border border-brand/10 hover:border-brand group shadow-sm active:scale-95">
                            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure String</span>
                        </button>
                        <button onClick={generateApiKeys} className="px-5 py-3.5 bg-brand/[0.03] hover:bg-brand text-brand hover:text-white rounded-2xl transition-all flex items-center justify-center space-x-3 border border-brand/10 hover:border-brand group shadow-sm active:scale-95">
                            <Key className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">API Secret</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {tokens.map((token) => (
                        <div
                            key={token.id}
                            className="flex items-center justify-between p-6 glass rounded-[2rem] group/item border-[var(--border-primary)] hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/10 hover:bg-[var(--bg-secondary)]/30 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-brand/5 rounded-bl-[3rem] group-hover/item:bg-brand/10 transition-colors pointer-events-none" />
                            <div className="flex-1 truncate mr-4 relative">
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mr-4 opacity-50 group-hover/item:opacity-100 transition-opacity">{token.type}</span>
                                <code className="text-sm font-mono text-[var(--text-primary)] font-black opacity-80 group-hover/item:opacity-100 transition-opacity select-all">{token.value}</code>
                            </div>
                            <button
                                onClick={() => copyToClipboard(token.value)}
                                className="p-3 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-2xl transition-all opacity-0 group-hover/item:opacity-100 shadow-sm border border-transparent hover:border-brand/20 z-10"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {tokens.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center glass rounded-[3rem] border-dashed border-[var(--border-primary)] text-[var(--text-muted)] opacity-30 px-10 text-center space-y-4">
                            <RefreshCcw className="w-10 h-10 animate-[spin_10s_linear_infinite]" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">System awaiting seed parameters. Execute generation protocol above.</p>
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    )
}
