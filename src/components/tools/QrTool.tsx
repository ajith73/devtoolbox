import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { QrCode, Download, Image as ImageIcon, Sliders, Palette } from 'lucide-react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { cn } from '../../lib/utils'

export function QrTool() {
    const [value, setValue] = useState('https://devbox.io')
    const [size, setSize] = useState(256)
    const [fgColor, setFgColor] = useState('#000000')
    const [bgColor, setBgColor] = useState('#ffffff')
    const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H')
    const [includeImage, setIncludeImage] = useState(false)
    const [imageSrc, setImageSrc] = useState('')
    const [imageSize, setImageSize] = useState(48)
    const [isDragging, setIsDragging] = useState(false)

    const downloadPNG = () => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        const url = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = 'qrcode.png'
        link.href = url
        link.click()
    }

    const downloadSVG = () => {
        const svg = document.querySelector('#qr-svg')
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'qrcode.svg'
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleImage = (file: File) => {
        const reader = new FileReader()
        reader.onload = (event) => {
            setImageSrc(event.target?.result as string)
            setIncludeImage(true)
        }
        reader.readAsDataURL(file)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleImage(file)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) handleImage(file)
    }

    return (
        <ToolLayout
            title="QR Code Generator"
            description="Create beautiful, high-quality QR codes with logos and custom colors."
            icon={QrCode}
            onReset={() => {
                setValue('https://devbox.io')
                setFgColor('#000000')
                setBgColor('#ffffff')
                setIncludeImage(false)
                setImageSrc('')
            }}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">QR Data (URL or Text)</label>
                        <textarea
                            className="w-full h-32 font-mono text-sm"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center pl-2">
                                <Palette className="w-4 h-4 mr-2 text-brand" />
                                Custom Palette
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Foreground</p>
                                    <input
                                        type="color"
                                        value={fgColor}
                                        onChange={(e) => setFgColor(e.target.value)}
                                        className="w-full h-12 p-1.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl cursor-pointer transition-all hover:border-brand/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Background</p>
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="w-full h-12 p-1.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl cursor-pointer transition-all hover:border-brand/40"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center pl-2">
                                <Sliders className="w-4 h-4 mr-2 text-brand" />
                                Precision Settings
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Error Level</p>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value as any)}
                                        className="w-full h-12 bg-[var(--input-bg)] text-xs border border-[var(--border-primary)] rounded-xl px-3 font-black text-[var(--text-primary)]"
                                    >
                                        <option value="L">L (7%)</option>
                                        <option value="M">M (15%)</option>
                                        <option value="Q">Q (25%)</option>
                                        <option value="H">H (30%)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">QR Size</p>
                                    <input
                                        type="number"
                                        value={size}
                                        onChange={(e) => setSize(Math.min(1024, Math.max(128, Number(e.target.value))))}
                                        className="w-full h-12 bg-[var(--input-bg)] text-xs border border-[var(--border-primary)] rounded-xl px-4 font-mono text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 glass rounded-[2.5rem] space-y-6 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center">
                                <ImageIcon className="w-4 h-4 mr-2 text-purple-500" />
                                Logo Overlay Engine
                            </h3>
                            {includeImage && (
                                <button onClick={() => setIncludeImage(false)} className="text-[10px] text-red-400 font-bold hover:underline">Remove</button>
                            )}
                        </div>
                        {!includeImage ? (
                            <label
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                className={cn(
                                    "flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all",
                                    isDragging ? "bg-brand/10 border-brand/40 scale-[1.02]" : "border-[var(--border-primary)] hover:bg-brand/5"
                                )}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 text-[var(--text-muted)] mb-3 group-hover:text-brand" />
                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                        {isDragging ? 'Drop to link logo' : 'Drop center logo here'}
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        ) : (
                            <div className="flex items-center space-x-8 px-2">
                                <div className="w-20 h-20 rounded-2xl bg-[var(--bg-primary)] p-3 border border-[var(--border-primary)] shadow-inner">
                                    <img src={imageSrc} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                        <span>Logo Size</span>
                                        <span className="text-brand">{imageSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={16}
                                        max={Math.floor(size / 3)}
                                        value={imageSize}
                                        onChange={(e) => setImageSize(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center space-y-8">
                    <div className="p-16 glass rounded-[4rem] border-[var(--border-primary)] shadow-2xl group relative flex items-center justify-center min-h-[450px] w-full max-w-[450px] bg-[var(--bg-secondary)]/30">
                        <div className="absolute inset-0 bg-brand/5 rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-6 bg-white rounded-3xl shadow-2xl transition-transform group-hover:scale-[1.02] duration-500">
                            {/* Canvas for PNG export */}
                            <div className="hidden">
                                <QRCodeCanvas
                                    value={value}
                                    size={size}
                                    level={level}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    imageSettings={includeImage ? { src: imageSrc, height: imageSize, width: imageSize, excavate: true } : undefined}
                                />
                            </div>
                            {/* SVG for display and SVG export */}
                            <QRCodeSVG
                                id="qr-svg"
                                value={value}
                                size={256} // Fixed display size
                                level={level}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                imageSettings={includeImage ? { src: imageSrc, height: imageSize * (256 / size), width: imageSize * (256 / size), excavate: true } : undefined}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-[450px]">
                        <button
                            onClick={downloadPNG}
                            className="flex items-center justify-center space-x-3 p-5 glass rounded-2xl hover:brand-gradient transition-all group border-[var(--border-primary)] shadow-sm"
                        >
                            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-xs uppercase tracking-widest">PNG Export</span>
                        </button>
                        <button
                            onClick={downloadSVG}
                            className="flex items-center justify-center space-x-3 p-5 glass rounded-2xl hover:bg-brand/5 hover:text-brand transition-all group border-[var(--border-primary)] shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                            <span className="font-black text-xs uppercase tracking-widest">SVG Export</span>
                        </button>
                    </div>

                    <div className="bg-brand/5 border border-brand/20 p-5 rounded-[1.5rem] flex items-center space-x-4 max-w-[450px]">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-brand" />
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed uppercase tracking-wider">
                            Exporting at <span className="text-brand font-black">{size}x{size}</span> px. Use <span className="text-purple-500 font-black">H level</span> for logo overlays.
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function Upload({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
    )
}
