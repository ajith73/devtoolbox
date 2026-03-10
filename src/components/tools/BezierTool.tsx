import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    Waves, Play, RefreshCcw, ArrowLeftRight,
    Maximize2, Layout, Activity, Zap, Code,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MousePointer2,
    Trash2, Keyboard
} from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { usePersistentState } from '../../lib/storage'

// Constants & Types
type BezierPoints = [number, number, number, number]

const PRESETS: Record<string, { name: string, value: BezierPoints }> = {
    standard: { name: 'Standard Ease', value: [0.4, 0, 0.2, 1] },
    easeIn: { name: 'Ease In (Sin)', value: [0.12, 0, 0.39, 0] },
    easeOut: { name: 'Ease Out (Sin)', value: [0.61, 1, 0.88, 1] },
    easeInOut: { name: 'Ease In Out (Sin)', value: [0.37, 0, 0.63, 1] },
    quadIn: { name: 'Quad In', value: [0.11, 0, 0.5, 0] },
    quadOut: { name: 'Quad Out', value: [0.5, 1, 0.89, 1] },
    expoIn: { name: 'Expo In', value: [0.7, 0, 0.84, 0] },
    expoOut: { name: 'Expo Out', value: [0.16, 1, 0.3, 1] },
    backIn: { name: 'Back In (Elastic)', value: [0.36, 0, 0.66, -0.56] },
    backOut: { name: 'Back Out (Elastic)', value: [0.34, 1.56, 0.64, 1] },
    backInOut: { name: 'Back In Out (Elastic)', value: [0.68, -0.6, 0.32, 1.6] },
}

export function BezierTool() {
    // Core State
    const [bezier, setBezier] = usePersistentState<string>('bezier_main', '0.4, 0, 0.2, 1')
    const [curveB, setCurveB] = usePersistentState<string>('bezier_secondary', '0.1, 0.9, 0.2, 0.1')
    const [compareMode, setCompareMode] = useState(false)
    const [duration, setDuration] = useState(1.2)
    const [activeTab, setActiveTab] = useState<'visualizer' | 'showcase' | 'export'>('visualizer')

    const [customPresets, setCustomPresets] = usePersistentState<Array<{ name: string, value: string }>>('bezier_custom_presets', [])
    const [showVelocity, setShowVelocity] = useState(false)

    // UI Local State
    const [isPlaying, setIsPlaying] = useState(false)
    const [previewKey, setPreviewKey] = useState(0)
    const [copied, setCopied] = useState(false)
    const [dragPoint, setDragPoint] = useState<number | null>(null)
    const [selectedHandle, setSelectedHandle] = useState<1 | 2>(1)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Parse Bezier
    const parseBezier = (val: string): BezierPoints => {
        const parts = val.split(',').map(p => parseFloat(p.trim()))
        if (parts.length === 4 && parts.every(p => !isNaN(p))) {
            return [
                Math.max(0, Math.min(1, parts[0])),
                parts[1],
                Math.max(0, Math.min(1, parts[2])),
                parts[3]
            ] as BezierPoints
        }
        return [0.4, 0, 0.2, 1]
    }

    const currentPoints = useMemo(() => parseBezier(bezier), [bezier])
    const secondaryPoints = useMemo(() => parseBezier(curveB), [curveB])
    const bezierValue = `cubic-bezier(${bezier})`
    const secondaryValue = `cubic-bezier(${curveB})`

    // Velocity Calculator (First Derivative)
    const getVelocity = (t: number, p1: number, p2: number) => {
        // P0=0, P3=1
        return 3 * Math.pow(1 - t, 2) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * Math.pow(t, 2) * (1 - p2)
    }

    const savePreset = () => {
        const name = prompt('Enter preset name:', `Curve ${customPresets.length + 1}`)
        if (name) {
            setCustomPresets([...customPresets, { name, value: bezier }])
        }
    }

    const deletePreset = (index: number) => {
        setCustomPresets(customPresets.filter((_, i) => i !== index))
    }

    // Reverse Curve Logic
    const handleReverse = () => {
        const [x1, y1, x2, y2] = currentPoints
        setBezier(`${(1 - x2).toFixed(2)}, ${(1 - y2).toFixed(2)}, ${(1 - x1).toFixed(2)}, ${(1 - y1).toFixed(2)}`)
    }

    // Mirror Logic
    const handleMirror = () => {
        const [x1, y1, x2, y2] = currentPoints
        setBezier(`${x1.toFixed(2)}, ${(-y1).toFixed(2)}, ${x2.toFixed(2)}, ${(-y2).toFixed(2)}`)
    }

    const handlePreview = useCallback(() => {
        setIsPlaying(false)
        setPreviewKey(prev => prev + 1)
        setTimeout(() => setIsPlaying(true), 50)
    }, [])

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const W = canvas.width
        const H = canvas.height
        const padding = 60
        const plotSize = W - padding * 2

        const scaleX = (x: number) => padding + x * plotSize
        const scaleY = (y: number) => H - padding - y * plotSize

        ctx.clearRect(0, 0, W, H)

        // Draw Grid Lines
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 10; i++) {
            const pos = padding + (i / 10) * plotSize
            ctx.beginPath(); ctx.moveTo(pos, padding); ctx.lineTo(pos, H - padding); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(padding, pos); ctx.lineTo(W - padding, pos); ctx.stroke()
        }

        // Draw Velocity Graph (Overlay)
        if (showVelocity) {
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'
            ctx.fillStyle = 'rgba(16, 185, 129, 0.05)'
            ctx.beginPath()
            ctx.moveTo(scaleX(0), scaleY(0))
            for (let t = 0; t <= 1; t += 0.02) {
                const vel = getVelocity(t, currentPoints[1], currentPoints[3])
                ctx.lineTo(scaleX(t), scaleY(vel * 0.3)) // Scaled down for visibility
            }
            ctx.lineTo(scaleX(1), scaleY(0))
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }

        // Draw Axes
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)'
        ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(padding, padding); ctx.lineTo(padding, H - padding); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(padding, H - padding); ctx.lineTo(W - padding, H - padding); ctx.stroke()
        ctx.setLineDash([])

        const drawCurve = (pts: BezierPoints, color: string, alpha: number, isMain: boolean) => {
            const [x1, y1, x2, y2] = pts
            ctx.strokeStyle = color
            ctx.globalAlpha = alpha
            ctx.lineWidth = isMain ? 4 : 2
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(scaleX(0), scaleY(0))
            ctx.bezierCurveTo(scaleX(x1), scaleY(y1), scaleX(x2), scaleY(y2), scaleX(1), scaleY(1))
            ctx.stroke()

            if (!isMain) return

            // Control lines
            ctx.lineWidth = 1
            ctx.strokeStyle = color
            ctx.globalAlpha = alpha * 0.4
            ctx.beginPath(); ctx.moveTo(scaleX(0), scaleY(0)); ctx.lineTo(scaleX(x1), scaleY(y1)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(scaleX(1), scaleY(1)); ctx.lineTo(scaleX(x2), scaleY(y2)); ctx.stroke()

            // Control handles
            const drawHandle = (x: number, y: number, id: number) => {
                const isSelected = selectedHandle === id
                ctx.fillStyle = isSelected ? '#fff' : color
                ctx.globalAlpha = 1
                ctx.beginPath(); ctx.arc(scaleX(x), scaleY(y), isSelected ? 8 : 6, 0, Math.PI * 2); ctx.fill()
                ctx.strokeStyle = isSelected ? color : '#fff'
                ctx.lineWidth = isSelected ? 3 : 2
                ctx.stroke()

                if (isSelected) {
                    ctx.shadowBlur = 10
                    ctx.shadowColor = color
                    ctx.stroke()
                    ctx.shadowBlur = 0
                }
            }
            drawHandle(x1, y1, 1)
            drawHandle(x2, y2, 2)
        }

        if (compareMode) drawCurve(secondaryPoints, '#ec4899', 0.5, false)
        drawCurve(currentPoints, '#6366f1', 1, true)

    }, [currentPoints, secondaryPoints, compareMode, showVelocity, selectedHandle])

    // Interaction Handler
    const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        const xRaw = (clientX - rect.left) / rect.width
        const yRaw = (clientY - rect.top) / rect.height

        const padding = 60 / canvas.width
        const valX = Math.max(0, Math.min(1, (xRaw - padding) / (1 - padding * 2)))
        const valY = (1 - yRaw - padding) / (1 - padding * 2)

        if (e.type === 'mousedown' || e.type === 'touchstart') {
            const dist1 = Math.hypot(valX - currentPoints[0], valY - currentPoints[1])
            const dist2 = Math.hypot(valX - currentPoints[2], valY - currentPoints[3])
            if (dist1 < 0.1) setDragPoint(1)
            else if (dist2 < 0.1) setDragPoint(2)
        } else if ((e.type === 'mousemove' || e.type === 'touchmove') && dragPoint) {
            const pts = [...currentPoints]
            if (dragPoint === 1) { pts[0] = +valX.toFixed(3); pts[1] = +valY.toFixed(3) }
            else { pts[2] = +valX.toFixed(3); pts[3] = +valY.toFixed(3) }
            setBezier(pts.join(', '))
        } else {
            setDragPoint(null)
        }
    }

    const copyFormat = (type: string) => {
        let text = ''
        switch (type) {
            case 'css': text = `transition-timing-function: ${bezierValue};`; break
            case 'framer': text = `ease: [${bezier}]`; break
            case 'tailwind': text = `"custom-easing": "${bezierValue}"`; break
            case 'gsap': text = `CustomEase.create("custom", "${bezier}")`; break
        }
        copyToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeTab !== 'visualizer') return

            const step = e.shiftKey ? 0.05 : 0.01
            const pts = [...currentPoints]
            const idx = selectedHandle === 1 ? 0 : 2

            if (e.key === 'ArrowRight') pts[idx] = Math.min(1, pts[idx] + step)
            if (e.key === 'ArrowLeft') pts[idx] = Math.max(0, pts[idx] - step)
            if (e.key === 'ArrowUp') pts[idx + 1] = pts[idx + 1] + step
            if (e.key === 'ArrowDown') pts[idx + 1] = pts[idx + 1] - step
            if (e.key === '1') setSelectedHandle(1)
            if (e.key === '2') setSelectedHandle(2)
            if (e.key === ' ') {
                e.preventDefault()
                handlePreview()
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
                setBezier(pts.map(p => +p.toFixed(3)).join(', '))
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeTab, currentPoints, selectedHandle, setBezier])

    useEffect(() => {
        handlePreview()
    }, [bezier, duration, handlePreview])

    return (
        <ToolLayout
            title="Cubic Bezier Pro"
            description="High-precision easing visualizer and kinetic design studio."
            icon={Waves}
            onReset={() => {
                setBezier('0.4, 0, 0.2, 1')
                setCurveB('0.1, 0.9, 0.2, 0.1')
                setCompareMode(false)
            }}
        >
            <div className="flex flex-col space-y-10 text-[var(--text-primary)]">
                {/* Visualizer & Graph Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-12 flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                        <div className="flex space-x-2">
                            {['visualizer', 'showcase', 'export'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t as any)}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === t ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-brand transition-colors">Compare Mode</span>
                                <button
                                    onClick={() => setCompareMode(!compareMode)}
                                    className={cn(
                                        "w-10 h-5 rounded-full relative transition-all duration-300",
                                        compareMode ? "bg-brand" : "bg-[var(--bg-secondary)]"
                                    )}
                                >
                                    <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm", compareMode ? "right-1" : "left-1")} />
                                </button>
                            </label>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-500">
                        {activeTab === 'visualizer' && (
                            <div className="relative group p-4 glass rounded-[3rem] border-[var(--border-primary)] bg-slate-900/5 dark:bg-black/20 shadow-inner overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={500}
                                    className="w-full h-full cursor-crosshair touch-none select-none"
                                    onMouseDown={handleCanvasInteraction}
                                    onMouseMove={handleCanvasInteraction}
                                    onMouseUp={handleCanvasInteraction}
                                    onMouseLeave={handleCanvasInteraction}
                                    onTouchStart={handleCanvasInteraction}
                                    onTouchMove={handleCanvasInteraction}
                                    onTouchEnd={handleCanvasInteraction}
                                />
                                <div className="absolute top-8 left-8 p-3 glass rounded-xl border border-white/10 backdrop-blur-md">
                                    <Activity className="w-5 h-5 text-brand" />
                                </div>
                                <div className="absolute bottom-10 right-10 flex flex-col items-end space-y-2">
                                    <p className="text-[9px] font-black text-brand bg-brand/10 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">{bezierValue}</p>
                                    {compareMode && <p className="text-[9px] font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">{secondaryValue}</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'showcase' && (
                            <div className="grid grid-cols-2 gap-6 animate-in zoom-in duration-500">
                                {[
                                    { label: 'Button Momentum', type: 'button' },
                                    { label: 'Drawer Translation', type: 'drawer' },
                                    { label: 'Modal Scale', type: 'modal' },
                                    { label: 'Floating Card', type: 'card' }
                                ].map((s, i) => (
                                    <div key={i} className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 flex flex-col items-center justify-center space-y-6 h-64 overflow-hidden relative">
                                        <p className="absolute top-6 left-6 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{s.label}</p>
                                        <AnimatePresence mode="wait">
                                            {isPlaying && (
                                                <motion.div
                                                    key={previewKey}
                                                    initial={s.type === 'button' ? { x: -40, opacity: 0 } : (s.type === 'modal' ? { scale: 0.5, opacity: 0 } : { y: 40, opacity: 0 })}
                                                    animate={s.type === 'button' ? { x: 40, opacity: 1 } : (s.type === 'modal' ? { scale: 1, opacity: 1 } : { y: -40, opacity: 1 })}
                                                    transition={{ duration, ease: currentPoints }}
                                                    className={cn(
                                                        "w-12 h-12 bg-brand shadow-2xl transition-all",
                                                        s.type === 'button' ? "rounded-xl" : (s.type === 'modal' ? "rounded-full bg-pink-500" : "w-16 h-20 rounded-2xl bg-indigo-500 shadow-indigo-500/20")
                                                    )}
                                                />
                                            )}
                                        </AnimatePresence>
                                        {!isPlaying && <Layout className="w-10 h-10 text-[var(--text-muted)] opacity-20" />}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'css', label: 'CSS Styles', icon: Code, desc: 'Direct property injection' },
                                        { id: 'framer', label: 'Motion', icon: Zap, desc: 'React animation config' },
                                        { id: 'tailwind', label: 'Tailwind', icon: Layout, desc: 'Config extension' },
                                        { id: 'gsap', label: 'GSAP', icon: RefreshCcw, desc: 'CustomEase plugin' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => copyFormat(f.id)}
                                            className="p-6 glass rounded-[2rem] border-[var(--border-primary)] hover:border-brand/40 group text-left transition-all hover:translate-y-[-4px] shadow-sm flex items-start space-x-4"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                                                <f.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-[var(--text-primary)] tracking-widest leading-none mb-1">{f.label}</p>
                                                <p className="text-[8px] font-bold uppercase text-[var(--text-muted)] tracking-tighter">{f.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest pl-2">Real-time Manifest</p>
                                        {copied && <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protocol Copied</motion.span>}
                                    </div>
                                    <code className="block p-6 bg-black/10 rounded-2xl border border-white/5 font-mono text-xs text-brand line-clamp-3 select-all">
                                        {bezierValue}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-5 space-y-8 h-full flex flex-col">
                        <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)]/20 shadow-sm flex-1 space-y-8 overflow-hidden flex flex-col">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Kinetic Controls</label>
                                    <button
                                        onClick={() => setShowVelocity(!showVelocity)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border",
                                            showVelocity ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-black/5 border-transparent text-[var(--text-muted)]"
                                        )}
                                    >
                                        Velocity Mask
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2">
                                            <span className="text-[var(--text-muted)]">Time Period</span>
                                            <span className="text-brand">{duration}s</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="5" step="0.1"
                                            value={duration} onChange={(e) => setDuration(+e.target.value)}
                                            className="w-full accent-brand h-1.5 bg-[var(--bg-secondary)] rounded-full"
                                        />
                                    </div>

                                    {/* Precision Nudge Pad */}
                                    <div className="p-4 glass rounded-2xl border border-[var(--border-primary)] space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest">Precision Pad</span>
                                            <div className="flex space-x-1">
                                                {[1, 2].map(id => (
                                                    <button
                                                        key={id}
                                                        onClick={() => setSelectedHandle(id as any)}
                                                        className={cn(
                                                            "w-6 h-6 rounded-md text-[8px] font-black transition-all",
                                                            selectedHandle === id ? "bg-brand text-white" : "bg-black/5 text-[var(--text-muted)]"
                                                        )}
                                                    >
                                                        {id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                                            <div />
                                            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))} className="p-2 hover:bg-brand/10 rounded-lg transition-colors"><ChevronUp className="w-4 h-4 mx-auto" /></button>
                                            <div />
                                            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))} className="p-2 hover:bg-brand/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 mx-auto" /></button>
                                            <div className="flex items-center justify-center text-brand"><MousePointer2 className="w-4 h-4" /></div>
                                            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))} className="p-2 hover:bg-brand/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 mx-auto" /></button>
                                            <div />
                                            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))} className="p-2 hover:bg-brand/10 rounded-lg transition-colors"><ChevronDown className="w-4 h-4 mx-auto" /></button>
                                            <div />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={handleReverse} className="p-4 glass rounded-2xl border border-[var(--border-primary)] hover:border-brand/40 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3">
                                            <ArrowLeftRight className="w-3.5 h-3.5" />
                                            <span>Invert</span>
                                        </button>
                                        <button onClick={handleMirror} className="p-4 glass rounded-2xl border border-[var(--border-primary)] hover:border-brand/40 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3">
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            <span>Mirror</span>
                                        </button>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handlePreview}
                                            className="flex-1 py-5 bg-brand text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3"
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            <span>Trigger</span>
                                        </button>
                                        <button
                                            onClick={savePreset}
                                            className="p-5 glass border border-[var(--border-primary)] hover:border-brand/40 text-brand rounded-[1.5rem] transition-all"
                                            title="Save to Library"
                                        >
                                            <Activity className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-2 flex items-center">
                                    <Layout className="w-4 h-4 mr-2" />
                                    Dynamic Library
                                </label>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                    {customPresets.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-brand pl-2 opacity-60">Custom Patterns</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {customPresets.map((p, i) => (
                                                    <div key={i} className="group relative">
                                                        <button
                                                            onClick={() => {
                                                                setBezier(p.value)
                                                                handlePreview()
                                                            }}
                                                            className={cn(
                                                                "w-full p-4 rounded-xl border transition-all text-left truncate pr-8",
                                                                bezier === p.value ? "bg-brand/10 border-brand text-brand shadow-sm" : "bg-black/5 dark:bg-white/5 border-transparent text-[var(--text-primary)] opacity-60 hover:opacity-100"
                                                            )}
                                                        >
                                                            <p className="text-[8px] font-black uppercase tracking-widest leading-tight truncate">{p.name}</p>
                                                        </button>
                                                        <button
                                                            onClick={() => deletePreset(i)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2 opacity-60">Core Archetypes</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(PRESETS).map(([id, p]) => (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        setBezier(p.value.join(', '))
                                                        handlePreview()
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-xl border transition-all text-left",
                                                        bezier === p.value.join(', ') ? "bg-brand/10 border-brand text-brand ring-1 ring-brand/20" : "bg-black/5 dark:bg-white/5 border-transparent text-[var(--text-primary)] opacity-60 hover:opacity-100 hover:border-[var(--border-primary)]"
                                                    )}
                                                >
                                                    <p className="text-[8px] font-black uppercase tracking-widest leading-tight">{p.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-brand/[0.03] border border-brand/10 rounded-3xl space-y-4">
                            <div className="flex items-center space-x-4">
                                <Keyboard className="w-5 h-5 text-brand shrink-0" />
                                <p className="text-[8px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-relaxed">
                                    Precision Interface Shortcuts
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pl-9">
                                <div className="space-y-1">
                                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter"><span className="text-brand">[1] / [2]</span> Select Handle</p>
                                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter"><span className="text-brand">[Arrows]</span> Nudge Position</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter"><span className="text-brand">[Shift + Arrows]</span> Fast Nudge</p>
                                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter"><span className="text-brand">[Space]</span> Trigger Preview</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

