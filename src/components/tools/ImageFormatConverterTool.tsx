import { useMemo, useState } from 'react'
import { Upload, Download, Copy, Check, Settings, Clock, Shield, AlertCircle, TrendingUp, Database, FileImage, Zap } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type Format = 'image/png' | 'image/jpeg' | 'image/webp'

export function ImageFormatConverterTool() {
    const [file, setFile] = useState<File | null>(null)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [format, setFormat] = usePersistentState<Format>('image_converter_format', 'image/png')
    const [quality, setQuality] = usePersistentState('image_converter_quality', 0.9)
    const [convertedUrl, setConvertedUrl] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [conversionHistory, setConversionHistory] = usePersistentState<Array<{originalName: string, originalType: string, originalSize: number, convertedFormat: string, convertedSize: number, timestamp: string}>>('image_converter_history', [])
    const [preserveSize, setPreserveSize] = usePersistentState('image_converter_preserve_size', true)
    const [convertedSize, setConvertedSize] = useState<number>(0)

    const meta = useMemo(() => {
        if (!file) return null
        return { name: file.name, type: file.type, size: file.size }
    }, [file])

    const canConvert = useMemo(() => dataUrl.length > 0, [dataUrl])

    const handleCopy = () => {
        if (convertedUrl) {
            copyToClipboard(convertedUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (originalName: string, originalType: string, originalSize: number, convertedFormat: string, convertedSizeValue: number) => {
        const newEntry = {
            originalName,
            originalType,
            originalSize,
            convertedFormat,
            convertedSize: convertedSizeValue,
            timestamp: new Date().toISOString()
        }
        setConversionHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleFile = (f: File) => {
        setFile(f)
        setConvertedUrl('')
        setConvertedSize(0)
        setError(null)
        const reader = new FileReader()
        reader.onload = () => setDataUrl(String(reader.result || ''))
        reader.readAsDataURL(f)
    }

    const convert = async () => {
        setError(null)
        setConvertedUrl('')
        setConvertedSize(0)
        try {
            if (!dataUrl) return
            const img = new Image()
            img.src = dataUrl
            await img.decode()

            const canvas = document.createElement('canvas')
            const targetWidth = preserveSize ? img.naturalWidth : img.naturalWidth
            const targetHeight = preserveSize ? img.naturalHeight : img.naturalHeight
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas not supported')
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

            const q = format === 'image/jpeg' || format === 'image/webp' ? quality : undefined
            const out = canvas.toDataURL(format, q)
            setConvertedUrl(out)
            
            // Calculate converted size
            const base64Data = out.split(',')[1]
            const convertedSizeValue = Math.round(base64Data.length * 0.75)
            setConvertedSize(convertedSizeValue)
            
            if (file) {
                addToHistory(file.name, file.type, file.size, format, convertedSizeValue)
            }
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

    const handleClearHistory = () => {
        setConversionHistory([])
    }

    const handleHistoryClick = (entry: {originalName: string, originalType: string, originalSize: number, convertedFormat: string}) => {
        setFormat(entry.convertedFormat as Format)
    }

    const getSizeReduction = () => {
        if (!convertedSize || !meta) return 0
        return Math.round(((meta.size - convertedSize) / meta.size) * 100)
    }

    return (
        <ToolLayout
            title="Image Format Converter"
            description="Convert images between PNG, JPG and WebP locally with advanced features."
            icon={FileImage}
            onReset={() => { setFile(null); setDataUrl(''); setConvertedUrl(''); setError(null) }}
            onCopy={convertedUrl ? handleCopy : undefined}
            copyDisabled={!convertedUrl}
            onDownload={convertedUrl ? download : undefined}
            downloadDisabled={!convertedUrl}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <FileImage className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Image Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">PNG, JPG, WebP format conversion</p>
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
                            onClick={handleCopy}
                            disabled={!convertedUrl}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                convertedUrl ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold">Image Conversion Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Upload */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "p-8 glass rounded-[2.5rem] border transition-all bg-[var(--bg-secondary)]/30",
                        isDragging ? 'bg-brand/10 border-brand/40 scale-[1.01]' : 'border-[var(--border-primary)]'
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

                {/* File Info and Controls */}
                {meta && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <EnhancedMeta label="Name" value={meta.name} icon={Database} />
                        <EnhancedMeta label="Type" value={meta.type || 'unknown'} icon={FileImage} />
                        <EnhancedMeta label="Size" value={`${(meta.size / 1024).toFixed(2)} KB`} icon={Zap} />
                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <div className="flex items-center space-x-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-brand" />
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Format</label>
                            </div>
                            <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono">
                                <option value="image/png">PNG</option>
                                <option value="image/jpeg">JPG</option>
                                <option value="image/webp">WebP</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Quality (JPG/WebP)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">0.0 (lowest) to 1.0 (highest)</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="preserve_size"
                                    checked={preserveSize}
                                    onChange={(e) => setPreserveSize(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="preserve_size" className="text-sm text-[var(--text-primary)]">Preserve Original Size</label>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Canvas Processing</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses HTML5 Canvas API for client-side image conversion. All processing happens locally in your browser.
                            </p>
                        </div>
                    </div>
                )}

                {/* Convert Button */}
                {dataUrl && (
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <button
                            onClick={convert}
                            disabled={!canConvert}
                            className={cn(
                                'w-full px-6 py-3 rounded-2xl font-black text-xs tracking-widest text-white',
                                canConvert ? 'brand-gradient' : 'bg-white/10 opacity-50'
                            )}
                        >
                            CONVERT IMAGE
                        </button>
                    </div>
                )}

                {/* Results and History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Original</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {dataUrl ? (
                                <div className="p-4">
                                    <img src={dataUrl} alt="original" className="max-h-[400px] max-w-full rounded-2xl mx-auto" />
                                    <div className="mt-3 text-xs text-gray-400 text-center">
                                        {meta?.name || 'Unknown'} • {meta ? (meta.size / 1024).toFixed(2) : '0'} KB
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <FileImage className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No image selected</p>
                                    <p className="text-xs">Upload an image to convert</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Converted</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {convertedUrl ? (
                                <div className="p-4">
                                    <img src={convertedUrl} alt="converted" className="max-h-[400px] max-w-full rounded-2xl mx-auto" />
                                    <div className="mt-3 text-xs text-gray-400 text-center">
                                        {format.split('/')[1].toUpperCase()} • {(convertedSize / 1024).toFixed(2)} KB
                                        {meta && getSizeReduction() !== 0 && (
                                            <span className="ml-2 text-green-400">
                                                ({getSizeReduction() > 0 ? '-' : '+'}{Math.abs(getSizeReduction())}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        <button
                                            onClick={download}
                                            className="px-6 py-3 brand-gradient rounded-2xl font-black text-xs tracking-widest text-white flex items-center"
                                        >
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Zap className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No conversion yet</p>
                                    <p className="text-xs">Convert to preview result</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={conversionHistory.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                conversionHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {conversionHistory.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {conversionHistory.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {entry.originalType} → {entry.convertedFormat.split('/')[1].toUpperCase()}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.originalName}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                            {(entry.originalSize / 1024).toFixed(2)} KB → {(entry.convertedSize / 1024).toFixed(2)} KB
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <Clock className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your conversion history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function EnhancedMeta({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
            <div className="flex items-center space-x-2 mb-2">
                <Icon className="w-4 h-4 text-brand" />
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
            </div>
            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] break-words">{value}</div>
        </div>
    )
}
