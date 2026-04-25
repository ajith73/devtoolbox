import { useState, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { usePersistentState } from '../../lib/storage'
import { Image as ImageIcon, Copy, Download, RefreshCw, Sliders, Check, Settings, Shield, Grid3x3, Sparkles, History, ExternalLink, Database } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'

export function PlaceholderImageTool() {
    const [width, setWidth] = usePersistentState('placeholder_width', 800)
    const [height, setHeight] = usePersistentState('placeholder_height', 600)
    const [grayscale, setGrayscale] = usePersistentState('placeholder_grayscale', false)
    const [blur, setBlur] = usePersistentState('placeholder_blur', 0)
    const [randomSeed, setRandomSeed] = usePersistentState('placeholder_seed', '')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [imageService, setImageService] = usePersistentState('placeholder_service', 'picsum')
    const [aspectRatio, setAspectRatio] = usePersistentState('placeholder_aspect', 'custom')
    const [category, setCategory] = usePersistentState('placeholder_category', 'any')
    const [imageFormat, setImageFormat] = usePersistentState('placeholder_format', 'jpg')
    const [history, setHistory] = usePersistentState('placeholder_history', [] as Array<{width: number, height: number, url: string, timestamp: string, service: string, category: string}>)
    const [autoGenerate, setAutoGenerate] = usePersistentState('placeholder_auto_generate', false)
    const [showGrid, setShowGrid] = usePersistentState('placeholder_show_grid', false)
    const [gridCount, setGridCount] = usePersistentState('placeholder_grid_count', 4)

    const categories = [
        { value: 'any', label: 'Any' },
        { value: 'nature', label: 'Nature' },
        { value: 'city', label: 'City' },
        { value: 'people', label: 'People' },
        { value: 'animals', label: 'Animals' },
        { value: 'architecture', label: 'Architecture' },
        { value: 'food', label: 'Food' },
        { value: 'technology', label: 'Technology' },
        { value: 'abstract', label: 'Abstract' },
        { value: 'business', label: 'Business' },
        { value: 'fashion', label: 'Fashion' },
        { value: 'sports', label: 'Sports' },
        { value: 'travel', label: 'Travel' }
    ]

    const aspectRatios = [
        { value: 'custom', label: 'Custom', width: null, height: null },
        { value: '1:1', label: 'Square', width: 800, height: 800 },
        { value: '16:9', label: 'Widescreen', width: 1920, height: 1080 },
        { value: '4:3', label: 'Standard', width: 1024, height: 768 },
        { value: '3:2', label: 'Classic', width: 900, height: 600 },
        { value: '21:9', label: 'Ultra Wide', width: 2560, height: 1080 },
        { value: '9:16', label: 'Portrait', width: 600, height: 1067 }
    ]

    // Generate URL on mount and update
    const generateUrl = () => {
        setLoading(true)
        let url = ''

        if (imageService === 'picsum') {
            url = `https://picsum.photos`
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
        } else if (imageService === 'placeholder') {
            // Placehold.co with basic URL format
            url = `https://placehold.co/${width}x${height}`
        } else if (imageService === 'unsplash') {
            // Use Picsum as reliable alternative
            url = `https://picsum.photos/${width}/${height}?random=1`
            
            // Add blur and grayscale if needed
            if (grayscale) url += '&grayscale'
            if (blur > 0) url += `&blur=${blur}`
        }

        setImageUrl(url)
        setLoading(false)
    }

    // Auto generate when parameters change
    useEffect(() => {
        if (autoGenerate) {
            generateUrl()
        }
    }, [width, height, grayscale, blur, randomSeed, imageService, category, autoGenerate])

    // Update URL when parameters change (non-auto mode)
    useEffect(() => {
        if (!autoGenerate) {
            generateUrl()
        }
    }, [width, height, grayscale, blur, randomSeed, imageService, category])

    const handleCopyUrl = () => {
        copyToClipboard(imageUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleGenerateNew = () => {
        const newSeed = Math.random().toString(36).substring(7)
        setRandomSeed(newSeed)
        
        // Add to history after a short delay to ensure imageUrl is updated
        setTimeout(() => {
            const newEntry = {
                width,
                height,
                url: imageUrl,
                timestamp: new Date().toISOString(),
                service: imageService,
                category
            }
            setHistory(prev => [newEntry, ...prev.slice(0, 19)])
        }, 100)
    }

    const handleAspectRatioChange = (ratio: string) => {
        setAspectRatio(ratio)
        const selectedRatio = aspectRatios.find(r => r.value === ratio)
        if (selectedRatio && selectedRatio.width && selectedRatio.height) {
            setWidth(selectedRatio.width)
            setHeight(selectedRatio.height)
        }
    }

    const handleClearHistory = () => {
        setHistory([])
    }

    const handleHistoryClick = (entry: {width: number, height: number, url: string, service: string, category: string}) => {
        setWidth(entry.width)
        setHeight(entry.height)
        setImageService(entry.service)
        setCategory(entry.category)
        setImageUrl(entry.url)
    }

    const handleDownload = () => {
        if (!imageUrl || !imageUrl.startsWith('http')) {
            console.error('Invalid image URL for download')
            return
        }
        
        try {
            const a = document.createElement('a')
            a.href = imageUrl
            a.download = `placeholder-${width}x${height}-${Date.now()}.${imageFormat}`
            a.target = '_blank' // Open in new tab to avoid CORS issues
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    const computed = useMemo(() => {
        if (!width || !height) return { megapixels: 0, aspectRatioStr: '1:1', totalImages: 0 }
        
        const megapixels = Math.round((width * height) / 1000000 * 100) / 100
        const aspectRatioStr = `${width}:${height}`
        const totalImages = history.length
        
        return { megapixels, aspectRatioStr, totalImages }
    }, [width, height, history])

    const generateGridImages = () => {
        const images = []
        for (let i = 0; i < gridCount; i++) {
            const seed = Math.random().toString(36).substring(7)
            let url = ''

            // Use the same logic as generateUrl but with different seeds
            if (imageService === 'picsum') {
                url = `https://picsum.photos/seed/${seed}/${width}/${height}`
                
                const params = []
                if (grayscale) params.push('grayscale')
                if (blur > 0) params.push(`blur=${blur}`)

                if (params.length > 0) {
                    url += `?${params.join('&')}`
                }
            } else if (imageService === 'placeholder') {
                // Placehold.co with basic URL format
                url = `https://placehold.co/${width}x${height}`
            } else if (imageService === 'unsplash') {
                // Use Picsum as reliable alternative
                url = `https://picsum.photos/${width}/${height}?random=1`
                
                // Add blur and grayscale if needed
                if (grayscale) url += '&grayscale'
                if (blur > 0) url += `&blur=${blur}`
            }
            
            images.push({ url, seed })
        }
        return images
    }

    return (
        <ToolLayout
            title="Placeholder Image Generator"
            description="Generate random placeholder images with custom dimensions and advanced effects."
            icon={ImageIcon}
            onReset={() => {
                setWidth(800)
                setHeight(600)
                setGrayscale(false)
                setBlur(0)
                setRandomSeed('')
                generateUrl()
            }}
            onCopy={handleCopyUrl}
        >
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <ImageIcon className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Image Generator</h2>
                            <p className="text-sm text-[var(--text-muted)]">Professional placeholder images</p>
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
                            onClick={handleCopyUrl}
                            disabled={!imageUrl}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                imageUrl ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                {(width || height) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Dimensions</div>
                            <div className="text-2xl font-black text-brand">{width}×{height}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Megapixels</div>
                            <div className="text-2xl font-black text-purple-500">{computed.megapixels}MP</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Aspect Ratio</div>
                            <div className="text-2xl font-black text-cyan-500">{computed.aspectRatioStr}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Generated</div>
                            <div className="text-2xl font-black text-green-500">{computed.totalImages}</div>
                        </div>
                    </div>
                )}

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="auto_generate"
                                    checked={autoGenerate}
                                    onChange={(e) => setAutoGenerate(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_generate" className="text-sm text-[var(--text-primary)]">Auto Generate</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_grid"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_grid" className="text-sm text-[var(--text-primary)]">Show Grid</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Image Service</label>
                                <select
                                    value={imageService}
                                    onChange={(e) => setImageService(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="picsum">Picsum</option>
                                    <option value="placeholder">Placehold.co</option>
                                    <option value="unsplash">Unsplash Source</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Image Format</label>
                                <select
                                    value={imageFormat}
                                    onChange={(e) => setImageFormat(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="jpg">JPG</option>
                                    <option value="png">PNG</option>
                                    <option value="webp">WebP</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Aspect Ratio</label>
                                <select
                                    value={aspectRatio}
                                    onChange={(e) => handleAspectRatioChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    {aspectRatios.map(ratio => (
                                        <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            {showGrid && (
                                <div>
                                    <label className="text-sm text-[var(--text-primary)] block mb-2">Grid Count</label>
                                    <select
                                        value={gridCount}
                                        onChange={(e) => setGridCount(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                    >
                                        <option value={2}>2</option>
                                        <option value={4}>4</option>
                                        <option value={6}>6</option>
                                        <option value={9}>9</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses multiple image services for placeholder generation. Picsum provides random images, Placehold.co offers colored placeholders, and Unsplash Source provides high-quality photos.
                            </p>
                        </div>
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Panel */}
                    <div className="lg:col-span-1 space-y-6 glass p-6 rounded-2xl border-[var(--border-primary)] h-fit">
                        <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-brand" />
                            Image Settings
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
                                        min="1"
                                        max="4000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Height (px)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(Number(e.target.value))}
                                        className="w-full p-3 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] font-mono font-bold text-center"
                                        min="1"
                                        max="4000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
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

                            <div className="flex items-center gap-3">
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
                                    onClick={handleGenerateNew}
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
                        {showGrid ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                        <Grid3x3 className="w-5 h-5 text-brand" />
                                        Grid View ({gridCount} images)
                                    </h3>
                                </div>
                                <div className={`grid grid-cols-2 md:grid-cols-${gridCount <= 3 ? gridCount : 3} gap-4`}>
                                    {generateGridImages().map((img, index) => (
                                        <div key={index} className="relative aspect-video glass rounded-xl border-[var(--border-primary)] overflow-hidden group">
                                            <img
                                                src={img.url}
                                                alt={`Grid image ${index + 1}`}
                                                className="w-full h-full object-cover rounded-xl"
                                                loading="lazy"
                                            />
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => copyToClipboard(img.url)}
                                                    className="p-2 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-md hover:bg-white hover:scale-110 transition-all"
                                                    title="Copy URL"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-brand" />
                                        Preview
                                    </h3>
                                </div>
                                <div className="relative aspect-video glass rounded-2xl border-[var(--border-primary)] overflow-hidden flex items-center justify-center bg-[var(--bg-secondary)]/50 group">
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
                                        <button
                                            onClick={handleDownload}
                                            className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-md hover:bg-white hover:scale-110 transition-all"
                                            title="Download Image"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <a
                                            href={imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-md hover:bg-white hover:scale-110 transition-all"
                                            title="Open Image"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* URL Display */}
                <div className="glass p-4 rounded-2xl border border-[var(--border-primary)] flex items-center gap-4">
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

                {/* Generation History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <History className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={history.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                history.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {history.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {history.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {entry.width}×{entry.height} • {entry.service}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.category}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <History className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your generation history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* API Info */}
                <div className="p-6 glass rounded-2xl border-dashed border-brand/20 flex flex-col items-center justify-center space-y-2 bg-brand/5 shadow-inner">
                    <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-brand" />
                        <p className="text-[10px] text-brand font-black uppercase tracking-[0.4em]">Image Services</p>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                        Picsum • Placehold.co • Unsplash Source
                    </p>
                </div>
            </div>
        </ToolLayout>
    )
}
