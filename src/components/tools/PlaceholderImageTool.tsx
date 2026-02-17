import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Image as ImageIcon, Copy, Download, RefreshCw, Sliders, Check } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'

export function PlaceholderImageTool() {
    const [width, setWidth] = useState(800)
    const [height, setHeight] = useState(600)
    const [grayscale, setGrayscale] = useState(false)
    const [blur, setBlur] = useState(0)
    const [randomSeed, setRandomSeed] = useState(0)
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Generate URL on mount and update
    const generateUrl = () => {
        setLoading(true)
        let url = `https://picsum.photos`
        if (randomSeed) {
            url += `/seed/${randomSeed}`
        }
        url += `/${width}/${height}`

        const params = []
        if (grayscale) params.push('grayscale')
        if (blur > 0) params.push(`blur=${blur}`)

        if (params.length > 0) {
            url += `?${params.join('&')}`
        }
        setImageUrl(url)
        setLoading(false)
    }

    // Update URL when parameters change
    useEffect(() => {
        generateUrl()
    }, [width, height, grayscale, blur, randomSeed])

    const handleCopyUrl = () => {
        copyToClipboard(imageUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <ToolLayout
            title="Placeholder Image Generator"
            description="Generate random placeholder images with custom dimensions and effects."
            icon={ImageIcon}
            onReset={() => {
                setWidth(800)
                setHeight(600)
                setGrayscale(false)
                setBlur(0)
                setRandomSeed(0)
                generateUrl()
            }}
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-8 glass p-6 rounded-[2rem] border-[var(--border-primary)] h-fit">
                    <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-brand" />
                        Settings
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Width (px)</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(Number(e.target.value))}
                                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] font-mono font-bold text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Height (px)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] font-mono font-bold text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center justify-between">
                                Blur Effect
                                <span className="text-brand">{blur}px</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={blur}
                                onChange={(e) => setBlur(Number(e.target.value))}
                                className="w-full accent-brand"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="grayscale"
                                checked={grayscale}
                                onChange={(e) => setGrayscale(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-[var(--border-primary)] text-brand focus:ring-brand"
                            />
                            <label htmlFor="grayscale" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer select-none">
                                Grayscale Mode
                            </label>
                        </div>

                        <div className="pt-6 space-y-3">
                            <button
                                onClick={() => {
                                    setRandomSeed(Math.random())
                                    generateUrl()
                                }}
                                className="w-full py-3 rounded-xl bg-brand text-white font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Generate New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video glass rounded-[2rem] border-[var(--border-primary)] overflow-hidden flex items-center justify-center bg-[var(--bg-secondary)]/50 group">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                            </div>
                        )}

                        <img
                            key={imageUrl} // Force reload on URL change
                            src={imageUrl || 'https://picsum.photos/800/600'}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-xl transition-opacity duration-500"
                            onLoad={() => setLoading(false)}
                            onError={() => setLoading(false)}
                        />

                        {/* Actions Overlay */}
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleCopyUrl}
                                className={cn(
                                    "p-3 rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-110",
                                    copied ? "bg-green-500 text-white" : "bg-white/90 text-slate-900 hover:bg-white"
                                )}
                                title="Copy URL"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                            <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-md hover:bg-white hover:scale-110 transition-all"
                                title="Open Image"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="glass p-4 rounded-xl border border-[var(--border-primary)] flex items-center gap-4">
                        <div className="p-2 bg-[var(--bg-secondary)] rounded-lg font-mono text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">
                            Direct URL
                        </div>
                        <input
                            type="text"
                            readOnly
                            value={imageUrl}
                            className="flex-1 bg-transparent font-mono text-sm text-[var(--text-primary)] outline-none"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                            onClick={handleCopyUrl}
                            className="text-[var(--text-muted)] hover:text-brand transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
