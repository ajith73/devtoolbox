import { useMemo, useState } from 'react'
import { Image as ImageIcon, Upload } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { cn } from '../../lib/utils'

type Info = {
    name: string
    type: string
    size: number
    width: number
    height: number
}

export function ImageInfoTool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null)

    const handleFile = (f: File) => {
        setFile(f)
        setDimensions(null)
        const reader = new FileReader()
        reader.onload = () => {
            const url = String(reader.result || '')
            setDataUrl(url)
        }
        reader.readAsDataURL(f)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
    }

    const computed = useMemo<Info | null>(() => {
        if (!file || !dataUrl) return null

        return {
            name: file.name,
            type: file.type,
            size: file.size,
            width: dimensions?.width ?? 0,
            height: dimensions?.height ?? 0,
        }
    }, [file, dataUrl, dimensions])

    return (
        <ToolLayout
            title="Image Info"
            description="View basic image metadata locally (type, size, dimensions)."
            icon={ImageIcon}
            onReset={() => { setFile(null); setDataUrl('') }}
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
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Processed locally</p>
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

                {computed && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <Meta label="Name" value={computed.name} />
                        <Meta label="Type" value={computed.type || 'unknown'} />
                        <Meta label="Size" value={`${computed.size} bytes`} />
                        <Meta label="Width" value={String(computed.width)} />
                        <Meta label="Height" value={String(computed.height)} />
                    </div>
                )}

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner flex items-center justify-center p-6 min-h-[420px]">
                    {dataUrl ? (
                        <img
                            src={dataUrl}
                            alt="preview"
                            className="max-h-[380px] max-w-full rounded-2xl"
                            onLoad={(e) => {
                                const img = e.currentTarget
                                setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
                            }}
                        />
                    ) : (
                        <div className="text-[var(--text-muted)] opacity-30 italic">No image selected...</div>
                    )}
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
