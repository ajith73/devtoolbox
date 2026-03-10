import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    Paintbrush, Trash2, Copy, Share2,
    RefreshCw, Settings2, Layout,
    Palette, Box, Type, Square, Layers, Sparkles,
    CheckCircle2, AlertTriangle, Image as ImageIcon,
    ChevronDown, ChevronUp, Zap
} from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
import a11yPlugin from 'colord/plugins/a11y'
import { usePersistentState } from '../../lib/storage'
import { motion, AnimatePresence } from 'framer-motion'

extend([namesPlugin, a11yPlugin])

interface ColorStop {
    id: string
    color: string
    position: number
}

type GradientType = 'linear' | 'radial' | 'conic'
type PreviewElement = 'background' | 'button' | 'card' | 'text' | 'border'

const PRESETS = [
    { name: 'Sunset Glow', colors: ['#f8ad9d', '#f4978e', '#f08080', '#ee6c4d'] },
    { name: 'Deep Ocean', colors: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef'] },
    { name: 'Neon Night', colors: ['#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de', '#48bfe3', '#56cfe1', '#64dfdf', '#72efdd', '#80ffdb'] },
    { name: 'Glassmorphism', colors: ['#ffffff1a', '#ffffff0d'] },
    { name: 'Cyberpunk', colors: ['#ff0055', '#00ffcc', '#3333ff'] },
    { name: 'Emerald Forest', colors: ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'] },
    { name: 'Peachy Pastel', colors: ['#ff9a9e', '#fad0c4', '#fad0c4'] },
    { name: 'Borealis', colors: ['#00c9ff', '#92fe9d'] },
    { name: 'Hyper Dark', colors: ['#1a1a1a', '#0a0a0a', '#000000'] }
]

export function GradientTool() {
    // Persistent State
    const [type, setType] = usePersistentState<GradientType>('gradient_type', 'linear')
    const [angle, setAngle] = usePersistentState('gradient_angle', 135)
    const [radialPos, setRadialPos] = usePersistentState('gradient_radial_pos', { x: 50, y: 50 })
    const [radialShape, setRadialShape] = usePersistentState<'circle' | 'ellipse'>('gradient_radial_shape', 'circle')
    const [stops, setStops] = usePersistentState<ColorStop[]>('gradient_stops', [
        { id: '1', color: '#3b82f6', position: 0 },
        { id: '2', color: '#8b5cf6', position: 100 }
    ])
    const [isAnimated, setIsAnimated] = usePersistentState('gradient_animated', false)
    const [previewElement, setPreviewElement] = usePersistentState<PreviewElement>('gradient_preview_element', 'background')

    // Local State
    const [activeStopId, setActiveStopId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [showPresets, setShowPresets] = useState(false)

    // Derived State
    const gradientString = useMemo(() => {
        const sortedStops = [...stops].sort((a, b) => a.position - b.position)
        const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')

        switch (type) {
            case 'linear':
                return `linear-gradient(${angle}deg, ${stopString})`
            case 'radial':
                return `radial-gradient(${radialShape} at ${radialPos.x}% ${radialPos.y}%, ${stopString})`
            case 'conic':
                return `conic-gradient(from ${angle}deg at ${radialPos.x}% ${radialPos.y}%, ${stopString})`
            default:
                return `linear-gradient(${angle}deg, ${stopString})`
        }
    }, [type, angle, stops, radialPos, radialShape])

    const cssCode = useMemo(() => {
        let base = `background: ${gradientString};`
        if (isAnimated) {
            base += `\nbackground-size: 400% 400%;\nanimation: gradientMove 8s ease infinite;`
            base += `\n\n@keyframes gradientMove {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}`
        }
        return base
    }, [gradientString, isAnimated])

    const scssCode = `$gradient: ${gradientString};\n\n.gradient-element {\n  background: $gradient;\n  ${isAnimated ? 'background-size: 400% 400%;\n  animation: gradientMove 8s ease infinite;' : ''}\n}`

    const tailwindConfig = `theme: {\n  extend: {\n    backgroundImage: {\n      'custom-gradient': "${gradientString}",\n    }\n  }\n}`

    const contrastRatio = useMemo(() => {
        // Sample the first and last colors for contrast checking
        const color1 = colord(stops[0].color)
        const contrast = color1.contrast('#ffffff')
        return contrast
    }, [stops])

    // Handlers
    const addStop = () => {
        const newId = Math.random().toString(36).substr(2, 9)
        const lastStop = stops[stops.length - 1]
        const newStop = {
            id: newId,
            color: colord(stops[stops.length - 1].color).lighten(0.1).toHex(),
            position: Math.min(100, lastStop.position + 10)
        }
        setStops([...stops, newStop])
    }

    const removeStop = (id: string) => {
        if (stops.length <= 2) return
        setStops(stops.filter(s => s.id !== id))
    }

    const updateStop = (id: string, updates: Partial<ColorStop>) => {
        setStops(stops.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const reverseGradient = () => {
        const reversed = [...stops].reverse().map((stop, i) => ({
            ...stop,
            position: stops[i].position
        }))
        setStops(reversed)
    }

    const applyPreset = (colors: string[]) => {
        const newStops = colors.map((c, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            color: c,
            position: Math.round((i / (colors.length - 1)) * 100)
        }))
        setStops(newStops)
    }

    const handleCopy = (text: string, id: string) => {
        copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Simple extraction placeholder - in real app would use a canvas to sample dominant colors
        applyPreset(['#ff9a9e', '#fad0c4', '#fad0c4'])
    }

    return (
        <ToolLayout
            title="Spectral Matrix Generator"
            description="Enterprise-grade gradient architect with multi-dimensional depth control and real-time kinetic synthesis."
            icon={Paintbrush}
            onReset={() => {
                setType('linear')
                setAngle(135)
                setStops([
                    { id: '1', color: '#3b82f6', position: 0 },
                    { id: '2', color: '#8b5cf6', position: 100 }
                ])
                setIsAnimated(false)
                setPreviewElement('background')
            }}
        >
            <div className="space-y-12 text-[var(--text-primary)]">

                {/* Visual Engine Output */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 h-[500px] group relative">
                    <div className="absolute inset-0 z-10 p-12 pointer-events-none flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-4 glass rounded-2xl border-white/20 backdrop-blur-xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 mb-1">Spectral Projection</p>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{type} Matrix</h2>
                            </div>
                            <div className="flex gap-3 pointer-events-auto">
                                {(['background', 'button', 'card', 'text', 'border'] as PreviewElement[]).map(el => (
                                    <button
                                        key={el}
                                        onClick={() => setPreviewElement(el)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl glass border-white/10 flex items-center justify-center transition-all hover:scale-110",
                                            previewElement === el ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                                        )}
                                        title={`Preview on ${el}`}
                                    >
                                        {el === 'background' ? <Layout className="w-5 h-5" /> :
                                            el === 'button' ? <Square className="w-5 h-5" /> :
                                                el === 'card' ? <Layers className="w-5 h-5" /> :
                                                    el === 'text' ? <Type className="w-5 h-5" /> :
                                                        <Box className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end p-4 pointer-events-auto">
                            <div className="glass rounded-3xl p-4 border-white/10 flex items-center space-x-6 backdrop-blur-2xl">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">WCAG Contrast</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={cn(
                                            "text-xs font-black",
                                            contrastRatio > 4.5 ? "text-green-400" : "text-red-400"
                                        )}>{contrastRatio.toFixed(1)}:1</span>
                                        {contrastRatio > 4.5 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                                    </div>
                                </div>
                                <div className="h-8 w-[1px] bg-white/10" />
                                <button
                                    onClick={() => handleCopy(cssCode, 'main')}
                                    className="px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    {copiedId === 'main' ? 'Injected' : 'Extract Code'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 rounded-[4rem] border-[12px] border-[var(--bg-secondary)] shadow-3xl overflow-hidden relative bg-black">
                        {previewElement === 'background' && (
                            <div
                                className={cn("absolute inset-0 transition-all duration-1000", isAnimated && "animate-gradient")}
                                style={{ background: gradientString }}
                            />
                        )}
                        {previewElement === 'button' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                <button
                                    className={cn("px-12 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-sm shadow-2xl transition-all", isAnimated && "animate-gradient")}
                                    style={{ background: gradientString }}
                                >
                                    Quantum Launch
                                </button>
                            </div>
                        )}
                        {previewElement === 'card' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-20">
                                <div
                                    className={cn("w-full h-full rounded-[3rem] p-10 flex flex-col justify-end shadow-2xl overflow-hidden", isAnimated && "animate-gradient")}
                                    style={{ background: gradientString }}
                                >
                                    <div className="glass p-6 rounded-2xl border-white/10 backdrop-blur-lg">
                                        <div className="w-12 h-2 bg-white/20 rounded-full mb-4" />
                                        <div className="w-24 h-4 bg-white/40 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {previewElement === 'text' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black">
                                <h1
                                    className={cn("text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text leading-none", isAnimated && "animate-gradient")}
                                    style={{ backgroundImage: gradientString }}
                                >
                                    Vectra
                                </h1>
                            </div>
                        )}
                        {previewElement === 'border' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                <div
                                    className={cn("p-1.5 rounded-[3rem] shadow-2xl", isAnimated && "animate-gradient")}
                                    style={{ background: gradientString }}
                                >
                                    <div className="w-80 h-48 bg-gray-900 rounded-[2.8rem] flex items-center justify-center">
                                        <span className="text-white/20 font-black uppercase tracking-[0.5em] text-[10px]">Neon Shield</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Engine Controls Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Topology & Resolution */}
                    <div className="p-10 glass rounded-[3.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-brand">
                                <Sparkles className="w-6 h-6" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Geometry & Topology</h3>
                            </div>
                            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-primary)]">
                                {(['linear', 'radial', 'conic'] as GradientType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            type === t ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:text-brand"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Angular Bias</label>
                                    <input
                                        type="number"
                                        value={angle}
                                        onChange={(e) => setAngle(Number(e.target.value))}
                                        className="w-12 bg-transparent text-right font-black text-brand outline-none"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    value={angle}
                                    onChange={(e) => setAngle(Number(e.target.value))}
                                    className="w-full h-2 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Kinetic Motion</label>
                                    <span className="text-[8px] font-bold text-brand uppercase tracking-tighter">{isAnimated ? 'Stream Active' : 'Static Mode'}</span>
                                </div>
                                <button
                                    onClick={() => setIsAnimated(!isAnimated)}
                                    className={cn(
                                        "w-full py-4 rounded-xl border flex items-center justify-center space-x-3 transition-all",
                                        isAnimated ? "bg-brand/10 border-brand/20 text-brand shadow-lg" : "glass border-[var(--border-primary)] text-[var(--text-muted)]"
                                    )}
                                >
                                    {isAnimated ? <Zap className="w-5 h-5 animate-pulse" /> : <RefreshCw className="w-5 h-5" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isAnimated ? 'Interrupt Sync' : 'Initialize Animation'}</span>
                                </button>
                            </div>
                        </div>

                        {type !== 'linear' && (
                            <div className="space-y-8 pt-6 border-t border-[var(--border-primary)]/30">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Projection Shape</label>
                                    <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-primary)]">
                                        {(['circle', 'ellipse'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setRadialShape(s)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    radialShape === s ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:text-brand"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2">Focal Point X</label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={radialPos.x}
                                            onChange={(e) => setRadialPos({ ...radialPos, x: Number(e.target.value) })}
                                            className="w-full h-2 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2">Focal Point Y</label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={radialPos.y}
                                            onChange={(e) => setRadialPos({ ...radialPos, y: Number(e.target.value) })}
                                            className="w-full h-2 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nodes & Chroma Flow */}
                    <div className="p-10 glass rounded-[3.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8 h-full flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-brand">
                                <Palette className="w-6 h-6" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Chroma Nodes</h3>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={reverseGradient}
                                    title="Reverse Stops"
                                    className="p-2.5 glass rounded-xl text-brand hover:bg-brand/10 transition-all border border-[var(--border-primary)]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={addStop}
                                    className="px-6 py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Inject Node
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 h-[300px]">
                            {stops.map((stop) => (
                                <div
                                    key={stop.id}
                                    onMouseEnter={() => setActiveStopId(stop.id)}
                                    onMouseLeave={() => setActiveStopId(null)}
                                    className={cn(
                                        "p-6 glass rounded-[2.5rem] border-[var(--border-primary)] flex items-center space-x-6 group hover:border-brand/30 transition-all",
                                        activeStopId === stop.id ? "ring-2 ring-brand/20 border-brand bg-brand/5" : ""
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <input
                                            type="color"
                                            value={stop.color.length > 7 ? stop.color.substr(0, 7) : stop.color}
                                            onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                                            className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer z-10"
                                        />
                                        <div
                                            className="w-12 h-12 rounded-2xl border-2 border-[var(--bg-primary)] shadow-lg"
                                            style={{ backgroundColor: stop.color }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">{stop.color}</span>
                                            <span className="text-[10px] font-black text-brand tracking-tighter">{stop.position}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={stop.position}
                                            onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeStop(stop.id)}
                                        disabled={stops.length <= 2}
                                        className="p-3 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all disabled:opacity-20"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Manifest Hub */}
                <div className="p-10 glass rounded-[3.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div className="flex items-center space-x-4">
                            <Settings2 className="w-6 h-6 text-brand" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Engine Manifests</h3>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className="p-3 glass rounded-2xl text-brand group-hover:bg-brand/10 transition-all border border-[var(--border-primary)]">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-brand transition-colors">Extract From Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                            <button
                                onClick={() => setShowPresets(!showPresets)}
                                className={cn(
                                    "px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center space-x-3 shadow-xl",
                                    showPresets ? "bg-brand text-white border-transparent" : "glass text-brand border-brand/20 hover:bg-brand/5"
                                )}
                            >
                                <Layers className="w-4 h-4" />
                                <span>Spectral Presets</span>
                                {showPresets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showPresets && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-8 border-y border-[var(--border-primary)]/30">
                                    {PRESETS.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => applyPreset(preset.colors)}
                                            className="group relative h-24 rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95"
                                        >
                                            <div
                                                className="absolute inset-0 transition-all duration-500 group-hover:scale-110"
                                                style={{ background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all bg-blur-[2px]">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white">{preset.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Vanilla CSS</span>
                                <button onClick={() => handleCopy(cssCode, 'css')} className="text-brand hover:scale-110 transition-transform">
                                    {copiedId === 'css' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="p-8 glass rounded-[2.5rem] bg-[var(--bg-primary)]/50 border-[var(--border-primary)] border-dashed h-40 overflow-y-auto custom-scrollbar">
                                <code className="text-xs font-mono text-brand font-black break-all whitespace-pre-wrap">{cssCode}</code>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">SCSS Mixin</span>
                                <button onClick={() => handleCopy(scssCode, 'scss')} className="text-brand hover:scale-110 transition-transform">
                                    {copiedId === 'scss' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="p-8 glass rounded-[2.5rem] bg-[var(--bg-primary)]/50 border-[var(--border-primary)] border-dashed h-40 overflow-y-auto custom-scrollbar">
                                <code className="text-xs font-mono text-purple-400 font-bold break-all whitespace-pre-wrap">{scssCode}</code>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tailwind Extend</span>
                                <button onClick={() => handleCopy(tailwindConfig, 'tw')} className="text-brand hover:scale-110 transition-transform">
                                    {copiedId === 'tw' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="p-8 glass rounded-[2.5rem] bg-[var(--bg-primary)]/50 border-[var(--border-primary)] border-dashed h-40 overflow-y-auto custom-scrollbar">
                                <code className="text-xs font-mono text-cyan-400 font-bold break-all whitespace-pre-wrap">{tailwindConfig}</code>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-primary)]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20">
                                <Share2 className="w-7 h-7 text-brand" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Dynamic URL Ingestion</h4>
                                <p className="text-[11px] font-bold italic text-[var(--text-muted)] opacity-60">Generate persistent temporal share links with encoded spectral data.</p>
                            </div>
                        </div>
                        <button
                            className="px-12 py-5 brand-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4"
                            onClick={() => handleCopy(window.location.href, 'share')}
                        >
                            <Share2 className="w-5 h-5" />
                            <span>{copiedId === 'share' ? 'Matrix Shared' : 'Generate Global Link'}</span>
                        </button>
                    </div>
                </div>

            </div>
        </ToolLayout >
    )
}
