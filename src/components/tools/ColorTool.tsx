import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { Palette, Copy, Hash, CheckCircle2, AlertTriangle, Wand2, MousePointer2 } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { copyToClipboard, cn } from '../../lib/utils'

export function ColorTool() {
    const [color, setColor] = useState('#3b82f6')

    const rgb = useMemo(() => {
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return { r, g, b }
    }, [color])

    const hsl = useMemo(() => {
        let { r, g, b } = rgb
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        let h = 0, s = 0, l = (max + min) / 2
        if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break
                case g: h = (b - r) / d + 2; break
                case b: h = (r - g) / d + 4; break
            }
            h /= 6
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
    }, [rgb])

    const contrast = useMemo(() => {
        const getLuminance = (r: number, g: number, b: number) => {
            const a = [r, g, b].map(v => {
                v /= 255
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
            })
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
        }
        const L1 = getLuminance(rgb.r, rgb.g, rgb.b)
        const L_white = getLuminance(255, 255, 255)
        const L_black = getLuminance(0, 0, 0)

        const contrastWhite = (Math.max(L1, L_white) + 0.05) / (Math.min(L1, L_white) + 0.05)
        const contrastBlack = (Math.max(L1, L_black) + 0.05) / (Math.min(L1, L_black) + 0.05)

        return {
            white: contrastWhite.toFixed(2),
            black: contrastBlack.toFixed(2),
            prefers: contrastWhite > contrastBlack ? 'White' : 'Black'
        }
    }, [rgb])

    const palettes = useMemo(() => {
        const rotate = (h: number, amount: number) => (h + amount) % 360
        return [
            { name: 'Complementary', hex: `hsl(${rotate(hsl.h, 180)}, ${hsl.s}%, ${hsl.l}%)` },
            { name: 'Analogous L', hex: `hsl(${rotate(hsl.h, 330)}, ${hsl.s}%, ${hsl.l}%)` },
            { name: 'Analogous R', hex: `hsl(${rotate(hsl.h, 30)}, ${hsl.s}%, ${hsl.l}%)` },
            { name: 'Triadic A', hex: `hsl(${rotate(hsl.h, 120)}, ${hsl.s}%, ${hsl.l}%)` },
            { name: 'Triadic B', hex: `hsl(${rotate(hsl.h, 240)}, ${hsl.s}%, ${hsl.l}%)` },
        ]
    }, [hsl])

    return (
        <ToolLayout
            title="Color Converter & Contrast"
            description="Professional grade color toolkit with WCAG verification and palette generation."
            icon={Palette}
            onReset={() => setColor('#3b82f6')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-8">
                    <div className="flex flex-col items-center space-y-6">
                        <div className="custom-color-picker glass p-8 rounded-[4rem] border border-[var(--border-primary)] shadow-2xl relative bg-[var(--bg-secondary)]/30">
                            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-[2rem] border-4 border-[var(--bg-primary)] shadow-2xl transition-all duration-300 z-10" style={{ backgroundColor: color }} />
                            <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', maxWidth: '320px', height: '320px' }} />
                        </div>

                        <div className="w-full flex items-center space-x-4 bg-[var(--input-bg)] p-5 rounded-[1.5rem] border border-[var(--border-primary)] shadow-sm group focus-within:border-brand/40 transition-all">
                            <Hash className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-brand" />
                            <input
                                className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-mono text-xl md:text-2xl uppercase font-black text-[var(--text-primary)] tracking-widest"
                                value={color}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (/^#[0-9A-F]{6}$/i.test(val)) setColor(val)
                                }}
                                onBlur={(e) => {
                                    const val = e.target.value
                                    if (val && !val.startsWith('#')) setColor('#' + val)
                                }}
                            />
                            <button onClick={() => copyToClipboard(color)} className="p-2 text-[var(--text-muted)] hover:text-brand transition-all hover:scale-110">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 glass rounded-[2.5rem] space-y-8 border-[var(--border-primary)] shadow-sm">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-2 pl-2">
                            <MousePointer2 className="w-4 h-4" />
                            <span>Contrast Assessment</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-[var(--bg-secondary)]/50 rounded-[2rem] border border-[var(--border-primary)] flex flex-col items-center justify-center space-y-3 shadow-inner">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">On White</p>
                                <p className="text-3xl font-mono font-black tracking-tighter text-[var(--text-primary)]">{contrast.white}:1</p>
                                <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", parseFloat(contrast.white) > 4.5 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                    {parseFloat(contrast.white) > 4.5 ? 'PASS (AA)' : 'FAIL'}
                                </span>
                            </div>
                            <div className="p-6 bg-[var(--bg-secondary)]/50 rounded-[2rem] border border-[var(--border-primary)] flex flex-col items-center justify-center space-y-3 shadow-inner">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">On Black</p>
                                <p className="text-3xl font-mono font-black tracking-tighter text-[var(--text-primary)]">{contrast.black}:1</p>
                                <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", parseFloat(contrast.black) > 4.5 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                    {parseFloat(contrast.black) > 4.5 ? 'PASS (AA)' : 'FAIL'}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 bg-brand/5 rounded-2xl border border-brand/20 flex items-center justify-between shadow-sm">
                            <span className="text-xs font-medium text-[var(--text-secondary)] italic">Recommendation: Best with <span className="text-brand font-black uppercase">{contrast.prefers}</span> text</span>
                            {parseFloat(contrast.white) > 7 || parseFloat(contrast.black) > 7 ? <CheckCircle2 className="w-5 h-5 text-green-500 transition-colors" /> : <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-8 glass rounded-[2.5rem] border-white/5 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Live Chromatic Preview</h3>
                            <div
                                className="h-44 rounded-[2.5rem] shadow-2xl transition-all duration-300 flex items-center justify-center border-4 border-[var(--border-primary)] relative overflow-hidden group"
                                style={{ backgroundColor: color }}
                            >
                                <p className="text-2xl font-black tracking-tighter mix-blend-difference text-white opacity-20 group-hover:opacity-100 transition-opacity uppercase tracking-[0.2em] select-none">DevBox Design</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'RGB Vector', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                                { label: 'HSL Cylinder', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                            ].map((fmt) => (
                                <div key={fmt.label} className="flex items-center justify-between p-5 bg-[var(--bg-secondary)]/50 rounded-[1.5rem] border border-[var(--border-primary)] shadow-sm hover:border-brand/20 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{fmt.label}</p>
                                        <code className="text-sm font-mono font-black text-[var(--text-primary)]">{fmt.value}</code>
                                    </div>
                                    <button onClick={() => copyToClipboard(fmt.value)} className="p-2 text-[var(--text-muted)] hover:text-brand transition-all hover:scale-110">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-5 pt-8 border-t border-[var(--border-primary)]">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center">
                                    <Wand2 className="w-4 h-4 mr-2 text-brand" />
                                    Palette Synthesis
                                </h3>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {palettes.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            // Handle palette selection
                                        }}
                                        className="group relative"
                                        title={p.name}
                                    >
                                        <div className="aspect-square rounded-[1.25rem] border border-[var(--border-primary)] transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm" style={{ backgroundColor: p.hex }} />
                                        <div className="mt-3 text-[8px] text-[var(--text-muted)] font-black uppercase tracking-tighter truncate text-center">{p.name.split(' ')[0]}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
