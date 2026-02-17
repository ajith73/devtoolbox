import { useMemo, useState } from 'react'
import { Image as ImageIcon, Upload } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'

export function ImageBase64Tool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)

    const base64 = useMemo(() => {
        if (!dataUrl) return ''
        const idx = dataUrl.indexOf(',')
        return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
    }, [dataUrl])

    const handleFile = (f: File) => {
        setFile(f)
        const reader = new FileReader()
        reader.onload = () => {
            setDataUrl(String(reader.result || ''))
        }
        reader.readAsDataURL(f)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
    }

    const meta = useMemo(() => {
        if (!file) return null
        return {
            name: file.name,
            type: file.type,
            size: file.size,
        }
    }, [file])

    return (
        <ToolLayout
            title="Image Base64"
            description="Convert an image to a Base64 string locally."
            icon={ImageIcon}
            onReset={() => { setFile(null); setDataUrl('') }}
            onCopy={base64 ? () => copyToClipboard(base64) : undefined}
            copyDisabled={!base64}
        >
            <div className="space-y-6">
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
                            <p className="text-sm font-bold text-[var(--text-primary)]">Drop image or click to upload</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">PNG, JPG, WebP, GIF</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleFile(f)
                            }}
                        />
                    </label>
                </div>

                {meta && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Meta label="Name" value={meta.name} />
                        <Meta label="Type" value={meta.type || 'unknown'} />
                        <Meta label="Size" value={`${meta.size} bytes`} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Preview</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner flex items-center justify-center p-6">
                            {dataUrl ? (
                                <img src={dataUrl} alt="preview" className="max-h-full max-w-full rounded-2xl" />
                            ) : (
                                <div className="text-[var(--text-muted)] opacity-30 italic">No image selected...</div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Base64</label>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none"
                            placeholder="Base64 output will appear here..."
                            value={base64}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function Meta({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{value}</div>
        </div>
    )
}
