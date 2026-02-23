import { useState, useCallback, useRef } from 'react'
import { ToolLayout } from './ToolLayout'
import { ImageIcon, Upload, Maximize, Download, RefreshCcw, Monitor } from 'lucide-react'
import Cropper from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import { cn, copyToClipboard } from '../../lib/utils'

interface Metadata {
    width: number
    height: number
    size: number
    exif?: any
}

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
    const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'>('image/jpeg')
    const [targetSizeKB, setTargetSizeKB] = useState(200)
    const [isLossless, setIsLossless] = useState(false)
    const [aspect, setAspect] = useState<number | undefined>(1)
    const [rotation, setRotation] = useState(0)
    const [showGrid, setShowGrid] = useState(false)
    const [resizeWidth, setResizeWidth] = useState<number | null>(null)
    const [resizeHeight, setResizeHeight] = useState<number | null>(null)
    const [bgApiKey, setBgApiKey] = useState('')
    const [metadata, setMetadata] = useState<Metadata | null>(null)
    const [isBatch, setIsBatch] = useState(false)
    const [base64Input, setBase64Input] = useState('')
    const [urlInput, setUrlInput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        // Batch mode not yet implemented - only process single file
        const file = files[0]
        if (file) {
            setOriginalFile(file)
            const reader = new FileReader()
            reader.onload = () => {
                const img = new Image()
                img.src = reader.result as string
                img.onload = () => {
                    setMetadata({ width: img.width, height: img.height, size: file.size })
                    setImage(reader.result as string)
                    setProcessedImage(null)
                }
            }
            reader.readAsDataURL(file)
        }

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files || [])

        // Batch mode not yet implemented - only process single file
        const file = files[0]
        if (file) {
            setOriginalFile(file)
            const reader = new FileReader()
            reader.onload = () => {
                const img = new Image()
                img.src = reader.result as string
                img.onload = () => {
                    setMetadata({ width: img.width, height: img.height, size: file.size })
                    setImage(reader.result as string)
                    setProcessedImage(null)
                }
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

        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
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

        // If resize is set, create a new canvas for resizing
        if (resizeWidth && resizeHeight) {
            const resizedCanvas = document.createElement('canvas')
            const resizedCtx = resizedCanvas.getContext('2d')
            if (!resizedCtx) return null

            resizedCanvas.width = resizeWidth
            resizedCanvas.height = resizeHeight

            resizedCtx.drawImage(canvas, 0, 0, resizeWidth, resizeHeight)
            canvas = resizedCanvas
        }

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
                else reject(new Error('Canvas toBlob failed'))
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
                maxSizeMB: targetSizeKB / (1024 * 1024),
                maxWidthOrHeight: 2560,
                useWebWorker: true,
                initialQuality: isLossless ? 1.0 : quality,
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

    const removeBackground = async (file: File) => {
        if (!bgApiKey) {
            setError('Please enter your remove.bg API key')
            setTimeout(() => setError(null), 5000)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('image_file', file)
            formData.append('size', 'auto')

            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': bgApiKey
                },
                body: formData
            })

            if (!response.ok) {
                throw new Error('Background removal failed')
            }

            const blob = await response.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
                setProcessedImage(reader.result as string)
                setProcessedSize(blob.size)
                setLoading(false)
            }
            reader.readAsDataURL(blob)
        } catch (error) {
            console.error(error)
            setError('Background removal failed. Check your API key.')
            setTimeout(() => setError(null), 5000)
            setLoading(false)
        }
    }

    const loadFromBase64 = () => {
        if (base64Input) {
            setImage(`data:image/jpeg;base64,${base64Input}`)
            setOriginalFile(null)
            setProcessedImage(null)
            setMetadata(null)
        }
    }

    const copyBase64 = () => {
        if (image) {
            const base64 = image.split(',')[1]
            copyToClipboard(base64)
        }
    }

    const loadFromUrl = async () => {
        if (urlInput) {
            try {
                const response = await fetch(urlInput)
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onload = () => {
                    setImage(reader.result as string)
                    setOriginalFile(null)
                    setProcessedImage(null)
                    setMetadata(null)
                }
                reader.readAsDataURL(blob)
            } catch (error) {
                setError('Failed to load image from URL')
                setTimeout(() => setError(null), 5000)
            }
        }
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
            {/* Error and Success Notifications */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 animate-fade-in">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
            )}
            
            {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3 animate-fade-in">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

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
                        <input type="file" ref={fileInputRef} accept="image/*" multiple={isBatch} onChange={onSelectFile} className="hidden" />
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
                                        aspect={aspect}
                                        rotation={rotation}
                                        showGrid={showGrid}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
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
                                        disabled={isLossless || !!processedImage}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                        <span>Aspect Ratio</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[
                                            { label: '1:1', value: 1 },
                                            { label: '16:9', value: 16 / 9 },
                                            { label: '4:5', value: 4 / 5 },
                                            { label: 'Free', value: undefined }
                                        ].map((ratio) => (
                                            <button
                                                key={ratio.label}
                                                onClick={() => setAspect(ratio.value)}
                                                disabled={!!processedImage}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                    aspect === ratio.value ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                                                )}
                                            >
                                                {ratio.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                        <span>Rotation</span>
                                        <span className="text-brand">{rotation}°</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={360} step={1} value={rotation}
                                        disabled={!!processedImage}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-green-500"
                                    />
                                </div>
                                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                        <span>Grid Overlay</span>
                                    </div>
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        disabled={!!processedImage}
                                        className={cn(
                                            "w-full px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                            showGrid ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                                        )}
                                    >
                                        {showGrid ? 'ON' : 'OFF'}
                                    </button>
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

                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Batch Mode</label>
                                    <button
                                        onClick={() => setIsBatch(!isBatch)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                            isBatch ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                                        )}
                                    >
                                        {isBatch ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                            <span>Target File Size</span>
                                            <span className="text-brand">{targetSizeKB}KB</span>
                                        </div>
                                        <input
                                            type="range" min={10} max={1000} step={10} value={targetSizeKB}
                                            disabled={!!processedImage}
                                            onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                                            className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-brand"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Lossless Mode</label>
                                        <button
                                            onClick={() => setIsLossless(!isLossless)}
                                            disabled={!!processedImage}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                isLossless ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                                            )}
                                        >
                                            {isLossless ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Resize Presets</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { name: 'Profile Photo', w: 400, h: 400 },
                                                { name: 'Thumbnail', w: 150, h: 150 },
                                                { name: 'Banner', w: 1200, h: 628 },
                                                { name: 'Instagram Post', w: 1080, h: 1080 },
                                                { name: 'LinkedIn Cover', w: 1584, h: 396 },
                                                { name: 'No Resize', w: null, h: null }
                                            ].map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => {
                                                        setResizeWidth(preset.w)
                                                        setResizeHeight(preset.h)
                                                    }}
                                                    disabled={!!processedImage}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                                                        (resizeWidth === preset.w && resizeHeight === preset.h) ? "bg-brand/10 border-brand text-brand shadow-sm" : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                                                    )}
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {(['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const).map((f) => (
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

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Background Removal (AI)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter remove.bg API key"
                                            value={bgApiKey}
                                            onChange={(e) => setBgApiKey(e.target.value)}
                                            className="w-full text-xs py-2 px-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                        />
                                        <button
                                            onClick={() => originalFile && removeBackground(originalFile)}
                                            disabled={loading || !originalFile}
                                            className="w-full flex items-center justify-center space-x-3 p-3 bg-purple-500 text-white rounded-[1.5rem] transition-all font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-600 disabled:opacity-50"
                                        >
                                            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Remove Background'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Base64 Converter</label>
                                        <textarea
                                            value={base64Input}
                                            onChange={(e) => setBase64Input(e.target.value)}
                                            placeholder="Paste Base64 string here"
                                            className="w-full text-xs py-2 px-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={loadFromBase64} className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-brand/5">Load Image</button>
                                            <button onClick={copyBase64} className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-brand/5">Copy Base64</button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Image URL Loader</label>
                                        <input
                                            type="text"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com/image.png"
                                            className="w-full text-xs py-2 px-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                        />
                                        <button onClick={loadFromUrl} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-brand/5">Load Image</button>
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
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-secondary)]">Dimensions</span>
                                                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{metadata ? `${metadata.width} x ${metadata.height}` : '--'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                                                <button onClick={() => {
                                                    setSuccess(`EXIF data: ${JSON.stringify(metadata?.exif || 'No EXIF data available')}`)
                                                    setTimeout(() => setSuccess(null), 10000)
                                                }} className="text-[10px] font-black text-purple-500 uppercase tracking-widest">View EXIF</button>
                                                <button onClick={() => {
                                                    setSuccess('Metadata is automatically removed when processing images.')
                                                    setTimeout(() => setSuccess(null), 5000)
                                                }} className="text-[10px] font-black text-red-500 uppercase tracking-widest">Remove Metadata</button>
                                            </div>
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
