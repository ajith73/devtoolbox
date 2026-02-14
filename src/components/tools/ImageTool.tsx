import { useState, useCallback, useRef } from 'react'
import { ToolLayout } from './ToolLayout'
import { ImageIcon, Upload, Maximize, Download, RefreshCcw, Monitor } from 'lucide-react'
import Cropper from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import { cn } from '../../lib/utils'

export function ImageTool() {
    const [image, setImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [processedSize, setProcessedSize] = useState<number>(0)
    const [quality, setQuality] = useState(0.8)
    const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')

    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setOriginalFile(file)
            const reader = new FileReader()
            reader.onload = () => {
                setImage(reader.result as string)
                setProcessedImage(null)
            }
            reader.readAsDataURL(file)
        }
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
            setOriginalFile(file)
            const reader = new FileReader()
            reader.onload = () => {
                setImage(reader.result as string)
                setProcessedImage(null)
            }
            reader.readAsDataURL(file)
        }
    }

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createCroppedImage = async (imageSrc: string, pixelCrop: any) => {
        const img = new Image()
        img.src = imageSrc
        await new Promise((resolve) => (img.onload = resolve))

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            img,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
            }, format, quality)
        })
    }

    const handleProcess = async () => {
        if (!image || !croppedAreaPixels) return
        setLoading(true)
        try {
            const croppedBlob = await createCroppedImage(image, croppedAreaPixels)
            if (!croppedBlob) throw new Error('Processing failed')

            const file = new File([croppedBlob], `processed.${format.split('/')[1]}`, { type: format })

            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 2560,
                useWebWorker: true,
                initialQuality: quality,
            }

            const compressedFile = await imageCompression(file, options)
            setProcessedSize(compressedFile.size)

            const reader = new FileReader()
            reader.readAsDataURL(compressedFile)
            reader.onloadend = () => {
                setProcessedImage(reader.result as string)
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <ToolLayout
            title="Image Master Elite"
            description="Next-gen image processor with surgical cropping and AI-powered compression."
            icon={ImageIcon}
            onReset={() => {
                setImage(null)
                setProcessedImage(null)
                setOriginalFile(null)
            }}
        >
            <div className="space-y-8 text-[var(--text-primary)]">
                {!image ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                            "min-h-[400px] glass rounded-[3rem] border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center space-y-6 group cursor-pointer transition-all relative overflow-hidden bg-[var(--bg-secondary)]/30",
                            isDragging ? "bg-brand/10 border-brand/40 scale-[1.02]" : "hover:bg-[var(--bg-secondary)]"
                        )}
                    >
                        <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center group-hover:scale-110 group-hover:brand-gradient transition-all duration-500 shadow-2xl">
                            <Upload className="w-10 h-10 text-[var(--text-muted)] group-hover:text-white" />
                        </div>
                        <div className="text-center relative">
                            <p className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Surrender your pixels</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-[0.3em] font-black">Drag & Drop or Click to browse</p>
                        </div>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={onSelectFile} className="hidden" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="relative h-[400px] lg:h-[600px] glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-black/60 shadow-inner">
                                {!processedImage ? (
                                    <Cropper
                                        image={image || undefined}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-black/40 backdrop-blur-sm">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Post-Process Preview</p>
                                        <img src={processedImage} alt="Processed" className="max-w-full max-h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[var(--border-primary)]" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                        <span>{processedImage ? 'Viewing Result' : 'Lens Zoom'}</span>
                                        <span className="text-brand">{zoom.toFixed(1)}x</span>
                                    </div>
                                    {!processedImage && (
                                        <input
                                            type="range" min={1} max={3} step={0.1} value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-brand"
                                        />
                                    )}
                                </div>
                                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                        <span>Compression Energy</span>
                                        <span className="text-purple-500">{Math.round(quality * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0.1} max={1} step={0.05} value={quality}
                                        disabled={!!processedImage}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-8 glass rounded-[2.5rem] space-y-8 border-[var(--border-primary)] shadow-2xl sticky top-8 bg-[var(--bg-secondary)]/50">
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black tracking-tight flex items-center space-x-3 text-[var(--text-primary)]">
                                        <Monitor className="w-6 h-6 text-brand" />
                                        <span>Workspace</span>
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">Fine-tune your crop mask and adjust the quality slider for the perfect balance.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['image/jpeg', 'image/png', 'image/webp'] as const).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFormat(f)}
                                                disabled={!!processedImage}
                                                className={cn(
                                                    "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                    format === f
                                                        ? "bg-brand/10 border-brand text-brand shadow-sm"
                                                        : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                                                )}
                                            >
                                                {f.split('/')[1]}
                                            </button>
                                        ))}
                                    </div>

                                    {!processedImage ? (
                                        <button
                                            onClick={handleProcess}
                                            disabled={loading}
                                            className="w-full flex items-center justify-center space-x-3 p-5 brand-gradient text-white hover:scale-[1.02] active:scale-[0.98] rounded-[1.5rem] transition-all group font-black uppercase text-xs tracking-[0.2em] shadow-xl"
                                        >
                                            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Maximize className="w-4 h-4 group-hover:rotate-90 transition-transform" />}
                                            <span>Execute Command</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setProcessedImage(null)}
                                            className="w-full flex items-center justify-center space-x-3 p-5 glass hover:bg-brand/10 hover:text-brand rounded-[1.5rem] transition-all font-black uppercase text-xs tracking-[0.2em] border border-[var(--border-primary)] shadow-sm"
                                        >
                                            <RefreshCcw className="w-4 h-4" />
                                            <span>Reset Mask</span>
                                        </button>
                                    )}

                                    {processedImage && (
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a')
                                                link.href = processedImage
                                                link.download = `optimized-devbox.${format.split('/')[1]}`
                                                link.click()
                                            }}
                                            className="w-full flex items-center justify-center space-x-3 p-5 bg-brand text-white rounded-[1.5rem] transition-all font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                                        >
                                            <Download className="w-4 h-4 animate-bounce" />
                                            <span>Download Final</span>
                                        </button>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-[var(--border-primary)] space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Efficiency Report</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-secondary)]">Original Payload</span>
                                                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{originalFile ? formatSize(originalFile.size) : '--'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-secondary)]">Optimized Payload</span>
                                                <span className="text-xs font-mono font-bold text-brand">{processedImage ? formatSize(processedSize) : '--'}</span>
                                            </div>
                                            {processedImage && (
                                                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Savings</span>
                                                    <span className="text-xs font-black text-green-500">
                                                        {Math.max(0, Math.round((1 - processedSize / (originalFile?.size || 1)) * 100))}% Smaller
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
