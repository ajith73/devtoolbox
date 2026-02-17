import { useMemo, useState } from 'react'
import { Image as ImageIcon, Upload, Download } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { cn, copyToClipboard } from '../../lib/utils'

type Format = 'image/png' | 'image/jpeg' | 'image/webp'

export function ImageFormatConverterTool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [format, setFormat] = useState<Format>('image/png')
    const [quality, setQuality] = useState<number>(0.9)
    const [convertedUrl, setConvertedUrl] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const meta = useMemo(() => {
        if (!file) return null
        return { name: file.name, type: file.type, size: file.size }
    }, [file])

    const handleFile = (f: File) => {
        setFile(f)
        setConvertedUrl('')
        setError(null)
        const reader = new FileReader()
        reader.onload = () => setDataUrl(String(reader.result || ''))
        reader.readAsDataURL(f)
    }

    const convert = async () => {
        setError(null)
        setConvertedUrl('')
        try {
            if (!dataUrl) return
            const img = new Image()
            img.src = dataUrl
            await img.decode()

            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas not supported')
            ctx.drawImage(img, 0, 0)

            const q = format === 'image/jpeg' || format === 'image/webp' ? quality : undefined
            const out = canvas.toDataURL(format, q)
            setConvertedUrl(out)
        } catch (e: any) {
            setError(e?.message || 'Convert failed')
        }
    }

    const download = () => {
        if (!convertedUrl) return
        const a = document.createElement('a')
        a.href = convertedUrl
        const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'
        a.download = `converted.${ext}`
        a.click()
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
    }

    return (
        <ToolLayout
            title="Image Format Converter"
            description="Convert images between PNG, JPG and WebP locally."
            icon={ImageIcon}
            onReset={() => { setFile(null); setDataUrl(''); setConvertedUrl(''); setError(null) }}
            onCopy={convertedUrl ? () => copyToClipboard(convertedUrl) : undefined}
            copyDisabled={!convertedUrl}
            onDownload={convertedUrl ? download : undefined}
            downloadDisabled={!convertedUrl}
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Format</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value as Format)}>
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Quality</label>
                        <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                        />
                        <p className="mt-2 text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Only for JPG/WebP</p>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30 flex items-end">
                        <button
                            onClick={convert}
                            disabled={!dataUrl}
                            className="w-full px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white disabled:opacity-50"
                        >
                            CONVERT
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Original</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner flex items-center justify-center p-6">
                            {dataUrl ? (
                                <img src={dataUrl} alt="original" className="max-h-full max-w-full rounded-2xl" />
                            ) : (
                                <div className="text-[var(--text-muted)] opacity-30 italic">No image selected...</div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Converted</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner flex flex-col items-center justify-center p-6">
                            {convertedUrl ? (
                                <>
                                    <img src={convertedUrl} alt="converted" className="max-h-[320px] max-w-full rounded-2xl" />
                                    <div className="mt-6 flex items-center gap-3">
                                        <button
                                            onClick={download}
                                            className="px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white flex items-center"
                                        >
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-[var(--text-muted)] opacity-30 italic">Convert to preview...</div>
                            )}
                        </div>
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
