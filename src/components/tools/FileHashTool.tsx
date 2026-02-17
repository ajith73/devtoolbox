import { useMemo, useState } from 'react'
import { FileCode, Upload } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function digestFile(alg: string, file: File) {
    const data = await file.arrayBuffer()
    const out = await crypto.subtle.digest(alg, data)
    return toHex(out)
}

export function FileHashTool() {
    const [file, setFile] = useState<File | null>(null)
    const [alg, setAlg] = useState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const meta = useMemo(() => {
        if (!file) return null
        return { name: file.name, type: file.type, size: file.size }
    }, [file])

    const run = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setOutput('')
        try {
            const hex = await digestFile(alg, file)
            setOutput(JSON.stringify({ algorithm: alg, file: meta, hex }, null, 2))
        } catch (e: any) {
            setError(e?.message || 'Hash failed')
        } finally {
            setLoading(false)
        }
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) setFile(f)
    }

    return (
        <ToolLayout
            title="File Hash"
            description="Compute SHA hashes for a file locally (WebCrypto)."
            icon={FileCode}
            onReset={() => { setFile(null); setOutput(''); setError(null) }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "p-8 glass rounded-[2.5rem] border-[var(--border-primary)] transition-all bg-[var(--bg-secondary)]/30",
                        isDragging ? 'bg-brand/10 border-brand/40 scale-[1.01]' : ''
                    )}
                >
                    <label className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                        <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-[var(--text-primary)]">Drop file or click to upload</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Processed locally</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) setFile(f)
                            }}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Algorithm</label>
                        <select value={alg} onChange={(e) => setAlg(e.target.value as any)}>
                            {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2 flex items-end">
                        <button
                            onClick={run}
                            disabled={!file || loading}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            {loading ? 'HASHING...' : 'HASH FILE'}
                        </button>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
