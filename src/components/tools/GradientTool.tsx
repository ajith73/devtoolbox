import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { Paintbrush, Plus, Trash2, Copy, MoveRight, Share2 } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'

interface ColorStop {
    id: string
    color: string
    position: number
}

export function GradientTool() {
    const [type, setType] = useState<'linear' | 'radial'>('linear')
    const [angle, setAngle] = useState(135)
    const [stops, setStops] = useState<ColorStop[]>([
        { id: '1', color: '#3b82f6', position: 0 },
        { id: '2', color: '#8b5cf6', position: 100 }
    ])

    const setStopCount = (count: number) => {
        const presets = [
            '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
        ]
        const newStops = Array.from({ length: count }, (_, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            color: presets[i] || '#ffffff',
            position: Math.round((i / (count - 1)) * 100)
        }))
        setStops(newStops)
    }

    const gradientString = useMemo(() => {
        const sortedStops = [...stops].sort((a, b) => a.position - b.position)
        const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')

        if (type === 'linear') {
            return `linear-gradient(${angle}deg, ${stopString})`
        } else {
            return `radial-gradient(circle at center, ${stopString})`
        }
    }, [type, angle, stops])

    const cssCode = `background: ${gradientString};\nbackground: -webkit-${gradientString};`

    const addStop = () => {
        if (stops.length >= 5) return
        const newId = Math.random().toString(36).substr(2, 9)
        const newStop = { id: newId, color: '#ffffff', position: 50 }
        setStops([...stops, newStop])
    }

    const removeStop = (id: string) => {
        if (stops.length <= 2) return
        setStops(stops.filter(s => s.id !== id))
    }

    const updateStop = (id: string, field: keyof ColorStop, value: any) => {
        setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    return (
        <ToolLayout
            title="CSS Gradient Generator"
            description="Design premium linear and radial gradients with precision angle and position controls."
            icon={Paintbrush}
            onReset={() => {
                setType('linear')
                setAngle(135)
                setStops([
                    { id: '1', color: '#3b82f6', position: 0 },
                    { id: '2', color: '#8b5cf6', position: 100 }
                ])
            }}
            onCopy={() => copyToClipboard(cssCode)}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border-primary)] shadow-sm">
                            <button
                                onClick={() => setType('linear')}
                                className={cn("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", type === 'linear' ? "bg-brand text-white shadow-md shadow-brand/20" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                Linear
                            </button>
                            <button
                                onClick={() => setType('radial')}
                                className={cn("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", type === 'radial' ? "bg-brand text-white shadow-md shadow-brand/20" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                Radial
                            </button>
                        </div>

                        <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border-primary)] items-center px-5 space-x-3 shadow-sm">
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Complexity</span>
                            {[2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setStopCount(n)}
                                    className={cn(
                                        "w-9 h-9 rounded-xl text-[10px] font-black transition-all",
                                        stops.length === n ? "bg-brand/10 text-brand border border-brand/20" : "text-[var(--text-muted)] hover:text-brand"
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Color Stop Topology</label>
                            <button
                                onClick={addStop}
                                disabled={stops.length >= 5}
                                className="px-5 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center space-x-2 disabled:opacity-20"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Inject Node</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {stops.map((stop) => (
                                <div key={stop.id} className="flex items-center space-x-6 p-6 glass rounded-[2.5rem] border-[var(--border-primary)] group bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all shadow-sm">
                                    <div className="relative group/color shrink-0">
                                        <input
                                            type="color"
                                            value={stop.color}
                                            onChange={(e) => updateStop(stop.id, 'color', e.target.value)}
                                            className="w-14 h-14 rounded-2xl bg-transparent border-none cursor-pointer p-0 opacity-0 absolute inset-0 z-10"
                                        />
                                        <div className="w-14 h-14 rounded-2xl border-4 border-[var(--bg-primary)] shadow-md transition-transform group-hover/color:scale-105" style={{ backgroundColor: stop.color }} />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Saturation Point</span>
                                            <span className="text-[10px] font-black text-brand uppercase tracking-tighter">{stop.position}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={stop.position}
                                            onChange={(e) => updateStop(stop.id, 'position', Number(e.target.value))}
                                            className="w-full h-2 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner group-hover:accent-brand transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeStop(stop.id)}
                                        className="p-3 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {type === 'linear' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-4">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Angular Orientation</label>
                                <span className="text-[10px] font-black text-brand uppercase tracking-tighter">{angle}° Orientation</span>
                            </div>
                            <div className="flex items-center space-x-8 px-2">
                                <div
                                    className="w-20 h-20 rounded-full glass border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-center relative shadow-md shrink-0 transition-transform duration-300"
                                    style={{ transform: `rotate(${angle}deg)` }}
                                >
                                    <MoveRight className="w-8 h-8 text-brand" />
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand rounded-full shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    value={angle}
                                    onChange={(e) => setAngle(Number(e.target.value))}
                                    className="flex-1 h-3 bg-[var(--border-primary)] rounded-full appearance-none accent-brand shadow-inner"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8 flex flex-col">
                    <div className="flex-1 min-h-[400px] glass rounded-[4rem] border-[var(--border-primary)] shadow-2xl relative overflow-hidden group">
                        <div
                            className="absolute inset-0 transition-all duration-700"
                            style={{ background: gradientString }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                            <p className="text-2xl font-black text-white mix-blend-difference tracking-[0.2em] uppercase p-12 text-center leading-tight">
                                Premium Dynamic <br /> Spectral Manifest
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Engine Manifest</label>
                            <button
                                onClick={() => copyToClipboard(cssCode)}
                                className="text-[10px] font-black text-brand hover:underline decoration-2 underline-offset-4 tracking-widest transition-all"
                            >
                                <Copy className="w-4 h-4 inline mr-2" />
                                <span>Copy Primitive</span>
                            </button>
                        </div>
                        <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] border-dashed bg-[var(--bg-secondary)] shadow-sm">
                            <code className="font-mono text-xs text-brand font-black whitespace-pre-wrap break-all leading-relaxed select-all">
                                {cssCode}
                            </code>
                        </div>
                    </div>

                    <div className="bg-brand/[0.03] border border-brand/10 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-brand/10 flex items-center justify-center shrink-0">
                            <Share2 className="w-6 h-6 text-brand" />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-loose opacity-60">
                            Vendor-specific prefixes and spectral definitions are automatically extrapolated for cross-engine fidelity.
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
