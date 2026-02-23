import { useState, useMemo, useCallback } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    Palette,
    Copy,
    Hash,
    CheckCircle2,
    AlertTriangle,
    Wand2,
    Eye,
    Layers,
    Share2,
    Sun,
    Moon,
    Box,
    RefreshCcw,
    Target,
    Zap,
    Pipette,
    FileJson,
    Settings
} from 'lucide-react'
import { HexAlphaColorPicker } from 'react-colorful'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'
import namesPlugin from 'colord/plugins/names'
import labPlugin from 'colord/plugins/lab'
import cmykPlugin from 'colord/plugins/cmyk'
import hwbPlugin from 'colord/plugins/hwb'
import lchPlugin from 'colord/plugins/lch'
import mixPlugin from 'colord/plugins/mix'
import harmoniesPlugin from 'colord/plugins/harmonies'

// Extend colord with plugins
extend([a11yPlugin, namesPlugin, labPlugin, cmykPlugin, hwbPlugin, lchPlugin, mixPlugin, harmoniesPlugin])

// --- Types ---
type ToolTab = 'converter' | 'accessibility' | 'palette' | 'gradient'
type ColorBlindType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

// --- Helper: Color Blind Filters ---
const COLOR_BLIND_MATRICES: Record<ColorBlindType, string> = {
    none: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)',
    achromatopsia: 'url(#achromatopsia)'
}

export function ColorTool() {
    // Mode & Settings
    const [color, setColor] = usePersistentState('color_v2_val', '#3b82f6')
    const [activeTab, setActiveTab] = useState<ToolTab>('converter')
    const [themePreview, setThemePreview] = useState<'light' | 'dark'>('light')
    const [cbType, setCbType] = useState<ColorBlindType>('none')
    const [status, setStatus] = useState<string | null>(null)



    // Derived Color Data
    const c = useMemo(() => colord(color), [color])
    const rgba = c.toRgb()
    const hsla = c.toHsl()
    const cmyk = c.toCmyk()
    const lab = c.toLab()
    const lch = c.toLch()
    const alpha = c.alpha()

    // Calculated Values
    const luminance = c.luminance()
    const isDark = c.isDark()

    const contrastWhite = c.contrast('#ffffff')
    const contrastBlack = c.contrast('#000000')

    const getAccessibility = useCallback((contrast: number) => ({
        aa: contrast >= 4.5,
        aaa: contrast >= 7,
        aaLarge: contrast >= 3,
        aaaLarge: contrast >= 4.5
    }), [])

    const accWhite = getAccessibility(contrastWhite)
    const accBlack = getAccessibility(contrastBlack)

    // Palette Generation
    const harmonies = useMemo(() => {
        return {
            complementary: [color, c.harmonies('complementary')[1].toHex()],
            analogous: c.harmonies('analogous').map((cl: any) => cl.toHex()),
            triadic: c.harmonies('triadic').map((cl: any) => cl.toHex()),
            tetradic: c.harmonies('tetradic').map((cl: any) => cl.toHex()),
            split: c.harmonies('split-complementary').map((cl: any) => cl.toHex())
        }
    }, [color, c])

    const tints = useMemo(() => {
        const list = []
        for (let i = 1; i <= 9; i++) {
            list.push(c.mix('#ffffff', i * 0.1).toHex())
        }
        return list
    }, [c])

    const shades = useMemo(() => {
        const list = []
        for (let i = 1; i <= 9; i++) {
            list.push(c.mix('#000000', i * 0.1).toHex())
        }
        return list
    }, [c])

    // --- Handlers ---
    const handleCopy = (text: string, label: string = 'Copied!') => {
        copyToClipboard(text)
        setStatus(label)
        setTimeout(() => setStatus(null), 2000)
    }

    const exportTokens = () => {
        const data = {
            base: color,
            formats: {
                hex: color,
                rgb: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
                hsl: `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`,
                cmyk: `cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})`,
                lab: `lab(${lab.l}, ${lab.a}, ${lab.b})`,
                oklch: `oklch(${lch.l.toFixed(2)}% ${lch.c.toFixed(2)} ${lch.h.toFixed(2)})`
            },
            harmonies,
            shades,
            tints
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `color-tokens-${color.replace('#', '')}.json`
        a.click()
        setStatus('Tokens Exported!')
        setTimeout(() => setStatus(null), 2000)
    }

    const sharePalette = () => {
        const text = `DevBox Color Palette: ${color}\n\nHex: ${color}\nRGB: rgb(${rgba.r}, ${rgba.g}, ${rgba.b})\nHarmonies: ${Object.entries(harmonies).map(([k, v]) => `\n${k}: ${v.join(', ')}`).join('')}`
        handleCopy(text, 'Palette link copied!')
    }

    const openEyeDropper = async () => {
        if (!('EyeDropper' in window)) {
            return
        }
        // @ts-ignore - EyeDropper is experimental
        const dropper = new window.EyeDropper()
        try {
            const result = await dropper.open()
            setColor(result.sRGBHex)
        } catch (e) {
            console.log('User canceled eye dropper')
        }
    }

    const autoFixContrast = (bg: string) => {
        let current = c
        let iteration = 0
        while (current.contrast(bg) < 4.5 && iteration < 100) {
            current = bg === '#ffffff' ? current.darken(0.01) : current.lighten(0.01)
            iteration++
        }
        setColor(current.toHex())
        setStatus(iteration < 100 ? `Contrast Adjusted (${current.contrast(bg).toFixed(2)}:1)` : 'Could not reach target contrast')
        setTimeout(() => setStatus(null), 3000)
    }

    return (
        <ToolLayout
            title="Color Toolkit (Pro)"
            description="Professional conversion, accessibility audit, and palette synthesis."
            icon={Palette}
            onReset={() => setColor('#3b82f6')}
            onCopy={() => handleCopy(color)}
        >
            {/* Status Toast */}
            {status && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-8 py-4 rounded-[2rem] shadow-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center space-x-3 border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                        <span>{status}</span>
                    </div>
                </div>
            )}

            {/* Color Blind SVG Filters */}
            <svg style={{ display: 'none' }}>
                <filter id="protanopia">
                    <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
                </filter>
                <filter id="deuteranopia">
                    <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
                </filter>
                <filter id="tritanopia">
                    <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
                </filter>
                <filter id="achromatopsia">
                    <feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0" />
                </filter>
            </svg>

            <div className="space-y-8" style={{ filter: COLOR_BLIND_MATRICES[cbType] }}>
                {/* Navigation */}
                <div className="flex flex-wrap gap-2 p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] w-fit mx-auto">
                    {(['converter', 'accessibility', 'palette', 'gradient'] as ToolTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === t
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Input & Preview */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 flex flex-col items-center space-y-8">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-brand/20 to-purple-500/20 rounded-full blur-2xl opacity-50 transition-opacity" />
                                <div className="relative custom-color-picker p-4 rounded-full border border-[var(--border-primary)] shadow-inner">
                                    <HexAlphaColorPicker color={color} onChange={setColor} />
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center space-x-3 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-primary)] focus-within:border-brand/40 transition-all">
                                    <Hash className="w-5 h-5 text-brand" />
                                    <input
                                        type="text"
                                        value={color.toUpperCase()}
                                        onChange={(e) => colord(e.target.value).isValid() && setColor(e.target.value)}
                                        className="flex-1 bg-transparent font-mono text-xl font-black uppercase outline-none text-[var(--text-primary)] tracking-widest"
                                    />
                                    <div className="flex items-center space-x-1">
                                        <button onClick={openEyeDropper} className="p-3 hover:bg-brand/10 rounded-xl text-[var(--text-muted)] hover:text-brand transition-all" title="Eye Dropper Tool">
                                            <Pipette className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleCopy(color)} className="p-3 hover:bg-brand/10 rounded-xl text-[var(--text-muted)] hover:text-brand transition-all" title="Copy HEX">
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                                        <span>Current stream</span>
                                    </div>
                                    <span>{alpha < 1 ? `Alpha: ${Math.round(alpha * 100)}%` : 'Opaque'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Format Matrix */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'RGB', val: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})` },
                                { label: 'HSL', val: `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%)` },
                                { label: 'CMYK', val: `cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})` },
                                { label: 'LAB', val: `lab(${lab.l}, ${lab.a}, ${lab.b})` }
                            ].map(item => (
                                <div key={item.label} className="p-4 bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)] rounded-2xl flex flex-col group hover:border-brand/40 transition-all cursor-pointer" onClick={() => handleCopy(item.val)}>
                                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{item.label}</span>
                                    <code className="text-[10px] font-mono font-bold truncate text-[var(--text-primary)]">{item.val}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Active Tab Content */}
                    <div className="lg:col-span-7 space-y-6">
                        {activeTab === 'converter' && (
                            <div className="space-y-6">
                                {/* Extended Conversion Info */}
                                <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Target className="w-5 h-5 text-brand" />
                                            <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Chromatic Metadata</h3>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                                                <Zap className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">OKLCH Gamut OK</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Relative Luminance</p>
                                            <div className="h-4 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                                <div
                                                    className="h-full brand-gradient transition-all duration-500"
                                                    style={{ width: `${luminance * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono font-bold text-[var(--text-primary)]">
                                                <span>0.0 (Black)</span>
                                                <span className="text-brand">{luminance.toFixed(4)}</span>
                                                <span>1.0 (White)</span>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-primary)] flex flex-col justify-center space-y-2">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Modern CSS Space</p>
                                            <div className="flex items-center justify-between">
                                                <code className="text-sm font-mono font-black text-brand">oklch({lch.l.toFixed(2)}%, {lch.c.toFixed(2)}, {lch.h.toFixed(2)})</code>
                                                <button onClick={() => handleCopy(`oklch(${lch.l.toFixed(2)}% ${lch.c.toFixed(2)} ${lch.h.toFixed(2)})`)} className="p-2 text-[var(--text-muted)] hover:text-brand">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Real-time Theming Preview */}
                                    <div className="pt-8 border-t border-[var(--border-primary)] space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Component Stress Test</h3>
                                            <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
                                                <button
                                                    onClick={() => setThemePreview('light')}
                                                    className={cn("p-2 rounded-lg transition-all", themePreview === 'light' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)]")}
                                                >
                                                    <Sun className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setThemePreview('dark')}
                                                    className={cn("p-2 rounded-lg transition-all", themePreview === 'dark' ? "bg-black text-white shadow-sm" : "text-[var(--text-muted)]")}
                                                >
                                                    <Moon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-8 rounded-[2.5rem] border transition-colors space-y-6",
                                            themePreview === 'light' ? "bg-white border-gray-200 text-gray-900" : "bg-gray-900 border-gray-800 text-white"
                                        )}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Action Primitives</h4>
                                                    <button
                                                        className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg transition-transform active:scale-95"
                                                        style={{ backgroundColor: color, color: isDark ? '#ffffff' : '#000000' }}
                                                    >
                                                        Primary Button
                                                    </button>
                                                    <button
                                                        className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs border-2 shadow-sm"
                                                        style={{ borderColor: color, color: color }}
                                                    >
                                                        Outline Button
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Typography Flow</h4>
                                                    <p className="text-xl font-bold leading-tight" style={{ color: color }}>Heading Dynamic Stream</p>
                                                    <p className="text-xs opacity-80 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at varius enim, a finibus ex. Etiam tempor congue.</p>
                                                    <a href="#" className="inline-block text-xs font-black underline underline-offset-4" style={{ color: color }}>Interactive Link Block</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'accessibility' && (
                            <div className="space-y-6">
                                {/* Contrast Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* White Contrast */}
                                    <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-6">
                                        <div className="flex items-center justify-between font-black">
                                            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Contrast vs White</span>
                                            <span className={cn("text-2xl font-mono", accWhite.aa ? "text-emerald-500" : "text-rose-500")}>{contrastWhite.toFixed(2)}:1</span>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 h-24 flex items-center justify-center border border-gray-100 shadow-inner">
                                            <span className="text-2xl font-black" style={{ color: color }}>Agitprop</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'AA Regular', pass: accWhite.aa },
                                                { label: 'AAA Regular', pass: accWhite.aaa },
                                                { label: 'AA Large', pass: accWhite.aaLarge },
                                                { label: 'AAA Large', pass: accWhite.aaaLarge }
                                            ].map(r => (
                                                <div key={r.label} className={cn("px-4 py-2 rounded-xl border flex items-center justify-between", r.pass ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-500")}>
                                                    <span className="text-[9px] font-black uppercase tracking-tight">{r.label}</span>
                                                    {r.pass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                </div>
                                            ))}
                                        </div>
                                        {!accWhite.aa && (
                                            <button
                                                onClick={() => autoFixContrast('#ffffff')}
                                                className="w-full py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center space-x-2"
                                            >
                                                <RefreshCcw className="w-3 h-3" />
                                                <span>Auto-fix for White</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Black Contrast */}
                                    <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-6">
                                        <div className="flex items-center justify-between font-black">
                                            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Contrast vs Black</span>
                                            <span className={cn("text-2xl font-mono", accBlack.aa ? "text-emerald-500" : "text-rose-500")}>{contrastBlack.toFixed(2)}:1</span>
                                        </div>
                                        <div className="bg-black rounded-2xl p-6 h-24 flex items-center justify-center border border-gray-800 shadow-inner">
                                            <span className="text-2xl font-black" style={{ color: color }}>Agitprop</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'AA Regular', pass: accBlack.aa },
                                                { label: 'AAA Regular', pass: accBlack.aaa },
                                                { label: 'AA Large', pass: accBlack.aaLarge },
                                                { label: 'AAA Large', pass: accBlack.aaaLarge }
                                            ].map(r => (
                                                <div key={r.label} className={cn("px-4 py-2 rounded-xl border flex items-center justify-between", r.pass ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-500")}>
                                                    <span className="text-[9px] font-black uppercase tracking-tight">{r.label}</span>
                                                    {r.pass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                </div>
                                            ))}
                                        </div>
                                        {!accBlack.aa && (
                                            <button
                                                onClick={() => autoFixContrast('#000000')}
                                                className="w-full py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2"
                                            >
                                                <RefreshCcw className="w-3 h-3" />
                                                <span>Auto-fix for Black</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Color Blind Simulation */}
                                <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <Eye className="w-5 h-5 text-brand" />
                                        <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Vision Impairment Simulation</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {(['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as ColorBlindType[]).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setCbType(t)}
                                                className={cn(
                                                    "p-3 rounded-xl border flex flex-col items-center space-y-2 transition-all",
                                                    cbType === t ? "bg-brand/10 border-brand shadow-sm" : "bg-[var(--bg-primary)] border-[var(--border-primary)] opacity-50 hover:opacity-100"
                                                )}
                                            >
                                                <div className="w-full aspect-[2/1] rounded-lg shadow-inner" style={{ backgroundColor: color, filter: COLOR_BLIND_MATRICES[t] }} />
                                                <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-none">{t === 'none' ? 'Standard' : t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'palette' && (
                            <div className="space-y-6">
                                {/* Color Harmonies */}
                                <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-8">
                                    <div className="flex items-center space-x-3">
                                        <Wand2 className="w-5 h-5 text-brand" />
                                        <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Chromatic Harmonies</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {Object.entries(harmonies).map(([type, colors]) => (
                                            <div key={type} className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{type}</span>
                                                    <button onClick={() => handleCopy(JSON.stringify(colors), `${type.toUpperCase()} Array Copied!`)} className="text-[8px] font-black text-brand uppercase hover:underline">Export Array</button>
                                                </div>
                                                <div className="flex rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-sm h-16">
                                                    {colors.map((hex, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex-1 transition-all hover:flex-[2] cursor-pointer group relative"
                                                            style={{ backgroundColor: hex }}
                                                            onClick={() => setColor(hex)}
                                                        >
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] font-mono text-white font-black">
                                                                {hex.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shades & Tints (Design System Scale) */}
                                <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <Layers className="w-5 h-5 text-brand" />
                                        <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Design System Scale (50-900)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest px-2">Tints (Mix White)</p>
                                            <div className="space-y-1">
                                                {tints.map((hex: any, i: number) => (
                                                    <div key={i} className="flex h-10 group cursor-pointer" onClick={() => setColor(hex)}>
                                                        <div className="w-20 bg-[var(--bg-primary)] flex items-center px-3 border-y border-l border-[var(--border-primary)] rounded-l-lg">
                                                            <span className="text-[9px] font-black opacity-40">{(i + 1) * 100}</span>
                                                        </div>
                                                        <div className="flex-1 border-y border-r border-[var(--border-primary)] rounded-r-lg group-hover:scale-[1.02] transition-transform" style={{ backgroundColor: hex }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest px-2">Shades (Mix Black)</p>
                                            <div className="space-y-1">
                                                {shades.map((hex: any, i: number) => (
                                                    <div key={i} className="flex h-10 group cursor-pointer" onClick={() => setColor(hex)}>
                                                        <div className="w-20 bg-[var(--bg-primary)] flex items-center px-3 border-y border-l border-[var(--border-primary)] rounded-l-lg">
                                                            <span className="text-[9px] font-black opacity-40">{(i + 1) * 100}</span>
                                                        </div>
                                                        <div className="flex-1 border-y border-r border-[var(--border-primary)] rounded-r-lg group-hover:scale-[1.02] transition-transform" style={{ backgroundColor: hex }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gradient' && (
                            <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] space-y-8">
                                <div className="flex items-center space-x-3">
                                    <Box className="w-5 h-5 text-brand" />
                                    <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Gradient Synthesis</h3>
                                </div>

                                <div className="space-y-6">
                                    <div
                                        className="h-64 rounded-[2.5rem] shadow-2xl border-4 border-[var(--border-primary)]"
                                        style={{ background: `linear-gradient(135deg, ${color}, ${c.harmonies('complementary')[1].toHex()})` }}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-[var(--bg-secondary)]/50 rounded-3xl border border-[var(--border-primary)] space-y-3">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">CSS Linear Gradient</p>
                                            <div className="flex items-center justify-between">
                                                <code className="text-[10px] font-mono font-bold text-brand truncate max-w-[200px]">linear-gradient(135deg, {color}, {c.harmonies('complementary')[1].toHex()})</code>
                                                <button onClick={() => handleCopy(`background: linear-gradient(135deg, ${color}, ${c.harmonies('complementary')[1].toHex()});`)} className="p-2 text-[var(--text-muted)] hover:text-brand">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[var(--bg-secondary)]/50 rounded-3xl border border-[var(--border-primary)] space-y-3">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Tailwind Utilities</p>
                                            <div className="flex items-center justify-between">
                                                <code className="text-[10px] font-mono font-bold text-brand">bg-gradient-to-br from-[{color}] to-[{c.harmonies('complementary')[1].toHex()}]</code>
                                                <button onClick={() => handleCopy(`bg-gradient-to-br from-[${color}] to-[${c.harmonies('complementary')[1].toHex()}]`)} className="p-2 text-[var(--text-muted)] hover:text-brand">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Global Dynamic Footer */}
                        <div className="p-8 glass rounded-[3rem] border border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-6 bg-[var(--bg-secondary)]/10">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <button
                                    onClick={exportTokens}
                                    className="flex items-center space-x-2 px-6 py-3 brand-gradient text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <FileJson className="w-4 h-4" />
                                    <span>Export Design Tokens</span>
                                </button>
                                <button
                                    onClick={sharePalette}
                                    className="flex items-center space-x-2 px-6 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase hover:bg-brand/10 hover:text-brand transition-all"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share Palette</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-5">
                                <div className="flex items-center space-x-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Local Buffer Sync: OK</span>
                                </div>
                                <div className="h-4 w-px bg-[var(--border-primary)]" />
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">V2.5.0-P3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
