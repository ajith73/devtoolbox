import { useMemo, useState, useRef } from 'react'
import { Image as ImageIcon, Upload, Download, Copy, Check, Eye, EyeOff, Settings, FileText, Monitor, Zap, Calendar, Ruler, Palette, Maximize2 } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type Info = {
    name: string
    type: string
    size: number
    width: number
    height: number
    lastModified?: Date
    aspectRatio?: string
    megapixels?: number
    colorDepth?: string
}

export function ImageInfoTool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showPreview, setShowPreview] = useState(true)
    const [copied, setCopied] = useState(false)
    const [analysisMode, setAnalysisMode] = usePersistentState<'basic' | 'detailed'>('image_info_mode', 'basic')
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleExport = () => {
        if (!computed) return
        
        const data = {
            filename: computed.name,
            metadata: {
                type: computed.type,
                size: computed.size,
                dimensions: {
                    width: computed.width,
                    height: computed.height
                },
                aspectRatio: computed.aspectRatio,
                megapixels: computed.megapixels,
                lastModified: computed.lastModified,
                analysisDate: new Date().toISOString()
            }
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `image-info-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopyInfo = () => {
        if (!computed) return
        
        const info = `Name: ${computed.name}\nType: ${computed.type}\nSize: ${formatFileSize(computed.size)}\nDimensions: ${computed.width}x${computed.height}\nAspect Ratio: ${computed.aspectRatio || 'N/A'}\nMegapixels: ${computed.megapixels || 'N/A'}`
        
        copyToClipboard(info)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const calculateAspectRatio = (width: number, height: number): string | null => {
        if (!width || !height) return null
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
        const divisor = gcd(width, height)
        const w = width / divisor
        const h = height / divisor
        return `${w}:${h}`
    }

    const calculateMegapixels = (width: number, height: number): number | null => {
        if (!width || !height) return null
        return Math.round((width * height) / 1000000 * 100) / 100
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
            lastModified: new Date(file.lastModified),
            aspectRatio: dimensions ? calculateAspectRatio(dimensions.width, dimensions.height) || undefined : undefined,
            megapixels: dimensions ? calculateMegapixels(dimensions.width, dimensions.height) || undefined : undefined,
        }
    }, [file, dataUrl, dimensions])

    return (
        <ToolLayout
            title="Image Info"
            description="View comprehensive image metadata locally with advanced analysis."
            icon={ImageIcon}
            onReset={() => { setFile(null); setDataUrl('') }}
            onCopy={computed ? handleCopyInfo : undefined}
            copyDisabled={!computed}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <ImageIcon className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Image Metadata Analyzer</h2>
                            <p className="text-sm text-[var(--text-muted)]">Comprehensive image information extraction</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={!computed}
                            className={cn(
                                "px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                computed ? "text-brand hover:scale-105" : "text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Upload Area */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "p-8 glass rounded-2xl border transition-all bg-[var(--bg-secondary)]/30",
                        isDragging ? 'bg-brand/10 border-brand/40 scale-[1.01]' : ''
                    )}
                >
                    <label className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                        <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-black text-[var(--text-primary)]">Drop image or click to upload</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">PNG, JPG, WebP, GIF, SVG, BMP, TIFF</p>
                        </div>
                        <input
                            ref={fileInputRef}
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

                {/* Enhanced Metadata Display */}
                {computed && (
                    <div className="space-y-6">
                        {/* Analysis Mode Toggle */}
                        <div className="flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setAnalysisMode('basic')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    analysisMode === 'basic' 
                                        ? "brand-gradient text-white shadow-lg" 
                                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                )}
                            >
                                Basic Info
                            </button>
                            <button
                                onClick={() => setAnalysisMode('detailed')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    analysisMode === 'detailed' 
                                        ? "brand-gradient text-white shadow-lg" 
                                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                )}
                            >
                                Detailed Analysis
                            </button>
                        </div>

                        {/* Basic Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                    <FileText className="w-3 h-3" />
                                    <span>Filename</span>
                                </div>
                                <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{computed.name}</div>
                            </div>
                            <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                    <Monitor className="w-3 h-3" />
                                    <span>Type</span>
                                </div>
                                <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{computed.type || 'unknown'}</div>
                            </div>
                            <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                    <Zap className="w-3 h-3" />
                                    <span>Size</span>
                                </div>
                                <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                    {formatFileSize(computed.size)}
                                    <span className="text-xs text-[var(--text-muted)] ml-2">({computed.size.toLocaleString()} bytes)</span>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Analysis */}
                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                        <Ruler className="w-3 h-3" />
                                        <span>Dimensions</span>
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                        {computed.width} × {computed.height} px
                                    </div>
                                </div>
                                <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                        <Maximize2 className="w-3 h-3" />
                                        <span>Aspect Ratio</span>
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                        {computed.aspectRatio || 'N/A'}
                                    </div>
                                </div>
                                <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                        <Palette className="w-3 h-3" />
                                        <span>Megapixels</span>
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                        {computed.megapixels ? `${computed.megapixels} MP` : 'N/A'}
                                    </div>
                                </div>
                                <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>Last Modified</span>
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                        {computed.lastModified?.toLocaleDateString()}
                                        <span className="text-xs text-[var(--text-muted)] block">{computed.lastModified?.toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Enhanced Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Preview</label>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    showPreview ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                )}
                                title="Toggle preview"
                            >
                                {showPreview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[var(--input-bg)] shadow-inner flex items-center justify-center p-6">
                            {dataUrl && showPreview ? (
                                <img
                                    src={dataUrl}
                                    alt="preview"
                                    className="max-h-full max-w-full rounded-2xl shadow-lg"
                                    onLoad={(e) => {
                                        const img = e.currentTarget
                                        setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
                                    }}
                                />
                            ) : (
                                <div className="text-[var(--text-muted)] opacity-30 italic text-center">
                                    <div className="mb-2">
                                        <ImageIcon className="w-12 h-12 mx-auto" />
                                    </div>
                                    {dataUrl ? 'Preview hidden' : 'No image selected...'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Copy Info</label>
                            <button
                                onClick={handleCopyInfo}
                                disabled={!computed}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    computed ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied!' : 'Copy All'}</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <textarea
                                className="w-full h-full p-6 text-blue-300 font-mono text-xs resize-none bg-transparent outline-none custom-scrollbar"
                                placeholder="Image metadata will appear here..."
                                value={computed ? `Filename: ${computed.name}
Type: ${computed.type}
Size: ${formatFileSize(computed.size)} (${computed.size} bytes)
Dimensions: ${computed.width} × ${computed.height} px
${showAdvanced ? `Aspect Ratio: ${computed.aspectRatio || 'N/A'}
Megapixels: ${computed.megapixels ? computed.megapixels + ' MP' : 'N/A'}
Last Modified: ${computed.lastModified?.toLocaleDateString()} ${computed.lastModified?.toLocaleTimeString()}` : ''}` : ''}
                                readOnly
                            />
                            <div className="absolute top-4 right-4 text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                {computed ? Object.keys(computed).length + ' properties' : '0 properties'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
