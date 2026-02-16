import { useState, useCallback } from 'react'
import { ToolLayout } from './ToolLayout'
import { Waves, Play, Sparkles, MoveRight, RefreshCcw } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { motion } from 'framer-motion'

const PRESETS = [
    { name: 'Ease In Out', value: '0.42, 0, 0.58, 1' },
    { name: 'Fast Out Slow In', value: '0.4, 0, 0.2, 1' },
    { name: 'Linear Out Slow In', value: '0, 0, 0.2, 1' },
    { name: 'Fast Out Linear In', value: '0.4, 0, 1, 1' },
    { name: 'Ease In Back', value: '0.36, 0, 0.66, -0.56' },
    { name: 'Ease Out Back', value: '0.34, 1.56, 0.64, 1' },
    { name: 'Ease In Out Back', value: '0.68, -0.6, 0.32, 1.6' }
]

export function BezierTool() {
    const [bezier, setBezier] = useState('0.4, 0, 0.2, 1')
    const [isPlaying, setIsPlaying] = useState(false)
    const [previewKey, setPreviewKey] = useState(0)

    const bezierValue = `cubic-bezier(${bezier})`

    const handlePreview = useCallback(() => {
        setIsPlaying(false)
        setPreviewKey(prev => prev + 1)
        // Small delay to ensure the browser registers the state change for animation reset
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsPlaying(true)
            })
        })
    }, [])

    const handlePresetClick = (val: string) => {
        setBezier(val)
        handlePreview()
    }

    return (
        <ToolLayout
            title="CSS Cubic Bezier Generator"
            description="Design and preview custom easing functions for fluid, professional animations."
            icon={Waves}
            onReset={() => {
                setBezier('0.4, 0, 0.2, 1')
                setPreviewKey(0)
                setIsPlaying(false)
            }}
            onCopy={() => copyToClipboard(`transition-timing-function: ${bezierValue};`)}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">Bezier Parameters</label>
                        <div className="flex items-center space-x-4 bg-[var(--input-bg)] p-6 rounded-[2rem] border border-[var(--border-primary)] group focus-within:ring-4 focus-within:ring-brand/10 transition-all shadow-inner">
                            <Waves className="w-6 h-6 text-brand/40 group-focus-within:text-brand transition-colors" />
                            <input
                                className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-mono text-xl text-brand font-black tracking-widest"
                                value={bezier}
                                onChange={(e) => setBezier(e.target.value)}
                                placeholder="0.4, 0, 0.2, 1"
                            />
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePreview}
                                className="p-3 bg-brand/10 text-brand rounded-xl hover:bg-brand/20 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                            >
                                <Play className={cn("w-5 h-5 fill-current transition-transform", isPlaying && "scale-90 opacity-50")} />
                            </motion.button>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.1em] pl-4 opacity-50">
                            Coordinate Space: [x1, y1, x2, y2] (e.g., 0.4, 0, 0.2, 1)
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">Motion Archetypes</label>
                        <div className="grid grid-cols-2 gap-3 px-2">
                            {PRESETS.map((p) => (
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={p.name}
                                    onClick={() => handlePresetClick(p.value)}
                                    className={cn(
                                        "flex items-center justify-between p-5 glass rounded-[2rem] border-[var(--border-primary)] hover:border-brand/40 transition-all group shadow-sm bg-[var(--bg-secondary)]/30",
                                        bezier === p.value ? "border-brand/40 bg-brand/10 ring-1 ring-brand/20 shadow-brand/5 scale-105" : ""
                                    )}
                                >
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest group-hover:text-brand transition-colors",
                                        bezier === p.value ? "text-brand" : "text-[var(--text-primary)] opacity-60"
                                    )}>{p.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    <div className="p-10 glass rounded-[4rem] border-[var(--border-primary)] space-y-12 bg-[var(--bg-secondary)]/30 shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40 relative overflow-hidden">
                        <div className="space-y-8 relative z-10">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] flex items-center pl-2">
                                <Sparkles className="w-5 h-5 mr-3 text-yellow-500 animate-pulse" />
                                Kinetic Simulation
                            </h3>

                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-2">
                                        <p className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest opacity-60">X-Axis Linear Projection</p>
                                        <RefreshCcw className={cn("w-3 h-3 text-brand/40 transition-all", isPlaying && "animate-spin")} />
                                    </div>
                                    <div className="h-24 glass rounded-[2.5rem] relative overflow-hidden border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-inner">
                                        <div className="absolute inset-0 bg-brand/5 opacity-50" />
                                        <div
                                            key={`linear-${previewKey}`}
                                            className="w-16 h-16 bg-brand rounded-2xl absolute top-4 left-4 shadow-2xl shadow-brand/30 flex items-center justify-center text-white"
                                            style={{
                                                transitionProperty: 'transform',
                                                transitionTimingFunction: bezierValue,
                                                transitionDuration: '1.2s',
                                                transform: isPlaying ? 'translateX(calc(min(300px, 400%)))' : 'translateX(0)'
                                            }}
                                        >
                                            <MoveRight className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest pl-2 opacity-60">Radial Expansion Cycle</p>
                                    <div className="h-32 glass rounded-[2.5rem] flex items-center justify-center border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-inner overflow-hidden">
                                        <div className="absolute inset-0 bg-pink-500/[0.03]" />
                                        <div
                                            key={`radial-${previewKey}`}
                                            className="w-14 h-14 bg-pink-500 rounded-full shadow-2xl shadow-pink-500/30 ring-4 ring-pink-500/20"
                                            style={{
                                                transitionProperty: 'all',
                                                transitionDuration: '0.8s',
                                                transitionTimingFunction: bezierValue,
                                                transform: isPlaying ? 'scale(2)' : 'scale(1)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePreview}
                                    className="px-12 py-4 bg-brand text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-full shadow-xl shadow-brand/20 border border-brand/20 flex items-center space-x-3 group"
                                >
                                    <RefreshCcw className="w-4 h-4 group-active:animate-spin" />
                                    <span>Re-Initiate Kinetic Cycle</span>
                                </motion.button>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-[var(--border-primary)] space-y-6 relative z-10">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Engine Manifest</label>
                                <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => copyToClipboard(bezierValue)}
                                    className="text-[10px] text-brand font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                                >
                                    Copy Primitive
                                </motion.button>
                            </div>
                            <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] border-dashed bg-[var(--bg-primary)]/50 shadow-inner group-hover:border-brand/40 transition-colors">
                                <code className="text-brand font-mono text-sm break-all font-black select-all">{bezierValue}</code>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-brand/[0.03] border border-brand/10 rounded-2xl flex items-center space-x-5 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <MoveRight className="w-5 h-5 text-brand" />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-loose opacity-60">
                            Bezier curves extrapolate the acceleration gradient. Values exceeding unitary range on the ordinate axis induce kinetic elasticity (bounce).
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

