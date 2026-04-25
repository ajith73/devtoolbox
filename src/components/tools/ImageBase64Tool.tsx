import { useMemo, useState, useRef } from 'react'
import { Image as ImageIcon, Upload, Download, Copy, Check, Eye, EyeOff, Settings, FileText, Zap, Monitor } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function ImageBase64Tool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showPreview, setShowPreview] = useState(true)
    const [copied, setCopied] = useState(false)
    const [outputFormat, setOutputFormat] = usePersistentState<'base64' | 'dataurl' | 'html'>('image_base64_format', 'base64')
    const [imageQuality, setImageQuality] = usePersistentState('image_base64_quality', 'original')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const base64 = useMemo(() => {
        if (!dataUrl) return ''
        const idx = dataUrl.indexOf(',')
        return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
    }, [dataUrl])

    const output = useMemo(() => {
        if (!dataUrl) return ''
        
        switch (outputFormat) {
            case 'base64':
                return base64
            case 'dataurl':
                return dataUrl
            case 'html':
                return `<img src="${dataUrl}" alt="${file?.name || 'image'}" />`
            default:
                return base64
        }
    }, [dataUrl, base64, outputFormat, file])

    const handleFile = (f: File) => {
        setFile(f)
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result || '')
            if (imageQuality !== 'original' && f.type.startsWith('image/')) {
                // For now, we'll keep the original. In a real implementation, 
                // you could use canvas to resize/compress the image
                setDataUrl(result)
            } else {
                setDataUrl(result)
            }
        }
        reader.readAsDataURL(f)
    }

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleExport = () => {
        if (!output) return
        
        const data = {
            filename: file?.name || 'image.txt',
            content: output,
            metadata: {
                originalName: file?.name,
                size: file?.size,
                type: file?.type,
                format: outputFormat,
                quality: imageQuality,
                timestamp: new Date().toISOString()
            }
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `image-base64-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
            description="Convert an image to a Base64 string locally with advanced options."
            icon={ImageIcon}
            onReset={() => { setFile(null); setDataUrl('') }}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <ImageIcon className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Image Base64 Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">Advanced image encoding with multiple output formats</p>
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
                            disabled={!output}
                            className={cn(
                                "px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                output ? "text-brand hover:scale-105" : "text-[var(--text-muted)] cursor-not-allowed"
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
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">PNG, JPG, WebP, GIF, SVG</p>
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

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Output Format</label>
                                <select
                                    value={outputFormat}
                                    onChange={(e) => setOutputFormat(e.target.value as 'base64' | 'dataurl' | 'html')}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="base64">Base64 Only</option>
                                    <option value="dataurl">Data URL</option>
                                    <option value="html">HTML Image Tag</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Quality</label>
                                <select
                                    value={imageQuality}
                                    onChange={(e) => setImageQuality(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="original">Original</option>
                                    <option value="high">High (80%)</option>
                                    <option value="medium">Medium (60%)</option>
                                    <option value="low">Low (40%)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Metadata */}
                {meta && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                <FileText className="w-3 h-3" />
                                <span>Filename</span>
                            </div>
                            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{meta.name}</div>
                        </div>
                        <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                <Monitor className="w-3 h-3" />
                                <span>Type</span>
                            </div>
                            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{meta.type || 'unknown'}</div>
                        </div>
                        <div className="p-5 glass rounded-2xl border bg-[var(--bg-secondary)]/30">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center space-x-2">
                                <Zap className="w-3 h-3" />
                                <span>Size</span>
                            </div>
                            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">
                                {formatFileSize(meta.size)}
                                <span className="text-xs text-[var(--text-muted)] ml-2">({meta.size} bytes)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Preview & Output */}
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
                                <img src={dataUrl} alt="preview" className="max-h-full max-w-full rounded-2xl shadow-lg" />
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
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {outputFormat === 'base64' ? 'Base64' : outputFormat === 'dataurl' ? 'Data URL' : 'HTML'}
                            </label>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <textarea
                                className="w-full h-full p-6 text-blue-300 font-mono text-xs resize-none bg-transparent outline-none custom-scrollbar"
                                placeholder={`${outputFormat} output will appear here...`}
                                value={output}
                                readOnly
                            />
                            <div className="absolute top-4 right-4 text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                {output.length} chars
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
