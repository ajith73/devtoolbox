import { useState, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    FileDiff, Zap, RefreshCcw, Trash2,
    Layout, Columns, Settings2,
    Share2, Search, Eye,
    Check, ChevronRight, FileText,
    Filter, ArrowRightLeft
} from 'lucide-react'
import { diffChars, diffLines, diffWordsWithSpace, diffSentences } from 'diff'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { jsPDF } from 'jspdf'

type DiffMode = 'chars' | 'words' | 'lines' | 'sentences'
type ViewMode = 'unified' | 'split'

interface IgnoreSettings {
    whitespace: boolean
    case: boolean
    punctuation: boolean
}

interface DiffStats {
    additions: number
    deletions: number
    changes: number
    percent: number
}

export function DiffTool() {
    // Persistent States
    const [original, setOriginal] = usePersistentState('diff_original', 'Build amazing tools with DevBox.')
    const [modified, setModified] = usePersistentState('diff_modified', 'Build professional tools with DevBox Pro.')
    const [diffMode, setDiffMode] = usePersistentState<DiffMode>('diff_mode', 'lines')
    const [viewMode, setViewMode] = usePersistentState<ViewMode>('diff_view_mode', 'unified')
    const [ignoreSettings, setIgnoreSettings] = usePersistentState<IgnoreSettings>('diff_ignore_settings', {
        whitespace: false,
        case: false,
        punctuation: false
    })

    // Local States
    const [diffResult, setDiffResult] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Diff Logic
    useEffect(() => {
        let textA = original
        let textB = modified

        if (ignoreSettings.case) {
            textA = textA.toLowerCase()
            textB = textB.toLowerCase()
        }
        if (ignoreSettings.whitespace) {
            textA = textA.replace(/\s+/g, ' ')
            textB = textB.replace(/\s+/g, ' ')
        }
        if (ignoreSettings.punctuation) {
            const puncRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g
            textA = textA.replace(puncRegex, "")
            textB = textB.replace(puncRegex, "")
        }

        let result: any[] = []
        switch (diffMode) {
            case 'chars': result = diffChars(textA, textB); break
            case 'words': result = diffWordsWithSpace(textA, textB); break
            case 'lines': result = diffLines(textA, textB); break
            case 'sentences': result = diffSentences(textA, textB); break
            default: result = diffLines(textA, textB)
        }
        setDiffResult(result)
    }, [original, modified, diffMode, ignoreSettings])

    // Stats Calculation
    const stats = useMemo<DiffStats>(() => {
        const additions = diffResult.filter(p => p.added).reduce((acc, p) => acc + (diffMode === 'lines' ? p.count : p.value.length), 0)
        const deletions = diffResult.filter(p => p.removed).reduce((acc, p) => acc + (diffMode === 'lines' ? p.count : p.value.length), 0)
        const total = original.length || 1
        return {
            additions,
            deletions,
            changes: diffResult.filter(p => p.added || p.removed).length,
            percent: Math.min(100, Math.round(((additions + deletions) / total) * 100))
        }
    }, [diffResult, original.length, diffMode])

    // Actions
    const handleCopyPart = (type: 'added' | 'removed') => {
        const text = diffResult
            .filter(p => (type === 'added' ? p.added : p.removed))
            .map(p => p.value)
            .join('')
        copyToClipboard(text)
        setCopiedId(type)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const generateShareLink = () => {
        const params = new URLSearchParams()
        params.set('original', btoa(original))
        params.set('modified', btoa(modified))
        params.set('mode', diffMode)
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
        copyToClipboard(url)
        alert('Shareable link copied to clipboard!')
    }

    const exportAsPDF = () => {
        try {
            const doc = new jsPDF()
            doc.setFontSize(16)
            doc.text('DevBox Text Diff Report', 20, 20)
            doc.setFontSize(10)
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)

            let y = 45
            diffResult.forEach((part) => {
                if (part.added) doc.setTextColor(0, 150, 0)
                else if (part.removed) doc.setTextColor(200, 0, 0)
                else doc.setTextColor(100, 100, 100)

                const lines = doc.splitTextToSize(part.value, 170)
                doc.text(lines, 20, y)
                y += lines.length * 5
                if (y > 280) {
                    doc.addPage()
                    y = 20
                }
            })
            doc.save('diff-report.pdf')
        } catch (e) {
            console.error('PDF generation failed:', e)
        }
    }

    const exportAsMarkdown = () => {
        const md = diffResult.map(part => {
            if (part.added) return `++ ${part.value} ++`
            if (part.removed) return `-- ~~${part.value}~~ --`
            return part.value
        }).join('')
        const blob = new Blob([md], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'diff-report.md'
        a.click()
    }

    const exportAsJSON = () => {
        const data = {
            stats,
            diff: diffResult.map(p => ({
                type: p.added ? 'added' : (p.removed ? 'removed' : 'neutral'),
                value: p.value
            }))
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'diff-report.json'
        a.click()
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'alpha' | 'beta') => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const content = ev.target?.result as string
            if (side === 'alpha') setOriginal(content)
            else setModified(content)
        }
        reader.readAsText(file)
    }

    // Split View Processing
    const splitData = useMemo(() => {
        if (viewMode !== 'split') return null

        const left: any[] = []
        const right: any[] = []

        diffResult.forEach(part => {
            if (part.added) {
                right.push(part)
            } else if (part.removed) {
                left.push(part)
            } else {
                left.push(part)
                right.push(part)
            }
        })
        return { left, right }
    }, [diffResult, viewMode])

    return (
        <ToolLayout
            title="Text Diff Checker"
            description="Enterprise-grade linguistic divergence analyzer with visual merge resolution and telemetry-driven delta detection."
            icon={FileDiff}
            onReset={() => { setOriginal(''); setModified(''); }}
            onDownload={exportAsPDF}
        >
            <div className="space-y-8 text-[var(--text-primary)]">

                {/* Dashboard Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex glass rounded-2xl p-1 border-[var(--border-primary)] bg-[var(--bg-primary)]/50 shadow-inner">
                            {(['lines', 'words', 'chars', 'sentences'] as DiffMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setDiffMode(m)}
                                    className={cn(
                                        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        diffMode === m ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:text-brand"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div className="flex glass rounded-2xl p-1 border-[var(--border-primary)] bg-[var(--bg-primary)]/50 shadow-inner">
                            <button
                                onClick={() => setViewMode('unified')}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === 'unified' ? "bg-brand text-white" : "text-[var(--text-muted)] hover:text-brand"
                                )}
                                title="Unified View"
                            >
                                <Layout className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === 'split' ? "bg-brand text-white" : "text-[var(--text-muted)] hover:text-brand"
                                )}
                                title="Split View"
                            >
                                <Columns className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex glass rounded-2xl p-1 border-[var(--border-primary)]">
                            <button onClick={exportAsMarkdown} className="p-2 text-[var(--text-muted)] hover:text-brand" title="MD Export"><FileText className="w-4 h-4" /></button>
                            <button onClick={exportAsJSON} className="p-2 text-[var(--text-muted)] hover:text-brand" title="JSON Export"><RefreshCcw className="w-4 h-4 rotate-45" /></button>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] transition-colors group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Filter deltas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-6 py-2.5 rounded-2xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[10px] uppercase font-black tracking-widest outline-none focus:ring-4 focus:ring-brand/10 w-48 transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn(
                                "p-3 rounded-2xl border transition-all",
                                showSettings ? "bg-brand text-white border-transparent" : "glass text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={generateShareLink}
                            className="p-3 glass rounded-2xl border-[var(--border-primary)] text-brand hover:bg-brand/10 transition-all"
                            title="Share Link"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="p-8 glass rounded-[2.5rem] border-brand/20 bg-brand/5 animate-in slide-in-from-top duration-500 space-y-6">
                        <div className="flex items-center space-x-3 text-brand">
                            <Filter className="w-4 h-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Sanitation Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'whitespace', label: 'Ignore Whitespace', desc: 'Sanitize blank space tokens' },
                                { id: 'case', label: 'Case Insensitive', desc: 'Ignore uppercase/lowercase telemetry' },
                                { id: 'punctuation', label: 'Linguistic Punc', desc: 'Ignore syntax delimiters' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setIgnoreSettings(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof IgnoreSettings] }))}
                                    className={cn(
                                        "p-6 rounded-[2rem] border transition-all text-left flex flex-col space-y-2",
                                        ignoreSettings[opt.id as keyof IgnoreSettings]
                                            ? "bg-brand/10 border-brand text-brand"
                                            : "bg-[var(--bg-primary)]/50 border-[var(--border-primary)] text-[var(--text-muted)]"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                        {ignoreSettings[opt.id as keyof IgnoreSettings] && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <p className="text-[9px] opacity-60 font-bold">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
                        <div className="w-14 h-14 glass rounded-full border-[var(--border-primary)] flex items-center justify-center shadow-3xl backdrop-blur-2xl ring-8 ring-brand/5 group cursor-pointer hover:scale-110 transition-transform" onClick={() => {
                            const temp = original;
                            setOriginal(modified);
                            setModified(temp);
                        }}>
                            <ArrowRightLeft className="w-6 h-6 text-brand animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col group transition-all h-[450px]">
                        <div className="flex items-center justify-between px-8">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em] group-focus-within:text-brand transition-colors">Prototype Alpha (Source)</label>
                            <label className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{original.length} Bytes</label>
                        </div>
                        <div className="relative flex-1">
                            <textarea
                                className="absolute inset-0 w-full h-full font-mono text-sm resize-none p-10 rounded-[3.5rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-2xl custom-scrollbar transition-all focus:ring-[12px] focus:ring-brand/5 outline-none font-medium leading-relaxed"
                                value={original}
                                onChange={(e) => setOriginal(e.target.value)}
                                placeholder="Paste source stream A..."
                            />
                            <input
                                type="file"
                                id="file-upload-alpha"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'alpha')}
                            />
                            <button
                                onClick={() => document.getElementById('file-upload-alpha')?.click()}
                                className="absolute bottom-6 right-6 p-3 glass rounded-xl text-brand hover:bg-brand/10 transition-all shadow-lg"
                                title="Upload File Alpha"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col group transition-all h-[450px]">
                        <div className="flex items-center justify-between px-8">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em] group-focus-within:text-brand transition-colors">Prototype Beta (Evolution)</label>
                            <label className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{modified.length} Bytes</label>
                        </div>
                        <div className="relative flex-1">
                            <textarea
                                className="absolute inset-0 w-full h-full font-mono text-sm resize-none p-10 rounded-[3.5rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-2xl custom-scrollbar transition-all focus:ring-[12px] focus:ring-brand/5 outline-none font-medium leading-relaxed"
                                value={modified}
                                onChange={(e) => setModified(e.target.value)}
                                placeholder="Paste evolutionary variant B..."
                            />
                            <input
                                type="file"
                                id="file-upload-beta"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'beta')}
                            />
                            <button
                                onClick={() => document.getElementById('file-upload-beta')?.click()}
                                className="absolute bottom-6 right-6 p-3 glass rounded-xl text-brand hover:bg-brand/10 transition-all shadow-lg"
                                title="Upload File Beta"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Delta Fragments', value: diffResult.length, color: 'text-brand', icon: Zap },
                        { label: 'Token Additions', value: `+${stats.additions}`, color: 'text-green-500', icon: ChevronRight },
                        { label: 'Token Deletions', value: `-${stats.deletions}`, color: 'text-red-500', icon: Trash2 },
                        { label: 'Evolution Index', value: `${stats.percent}%`, color: 'text-purple-500', icon: RefreshCcw }
                    ].map(stat => (
                        <div key={stat.label} className="p-6 glass rounded-[2rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 flex flex-col items-center justify-center space-y-2 shadow-xl hover:scale-105 transition-transform duration-500">
                            <stat.icon className={cn("w-4 h-4 mb-2", stat.color)} />
                            <p className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">{stat.value}</p>
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Diff Result Engine */}
                <div className="space-y-6 pt-12 border-t border-brand/10">
                    <div className="flex items-center justify-between px-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                            <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.5em]">Real-time Intersection Analytics</h3>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCopyPart('added')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all glass border-[var(--border-primary)]",
                                    copiedId === 'added' ? "bg-green-500 text-white" : "hover:text-green-500 hover:border-green-500/30"
                                )}
                            >
                                {copiedId === 'added' ? 'Copied Additions!' : 'Extract Additions'}
                            </button>
                            <button
                                onClick={() => handleCopyPart('removed')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all glass border-[var(--border-primary)]",
                                    copiedId === 'removed' ? "bg-red-500 text-white" : "hover:text-red-500 hover:border-red-500/30"
                                )}
                            >
                                {copiedId === 'removed' ? 'Copied Deletions!' : 'Extract Deletions'}
                            </button>
                        </div>
                    </div>

                    <div className="relative group overflow-hidden rounded-[4rem] shadow-3xl">
                        {viewMode === 'unified' ? (
                            <div className="min-h-[500px] glass p-12 font-mono text-sm leading-loose border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 overflow-auto custom-scrollbar transition-all backdrop-blur-xl relative">
                                {diffResult.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col space-y-4 opacity-10">
                                        <Eye className="w-12 h-12" />
                                        <p className="text-[10px] uppercase font-black tracking-[1em]">Scanning for Divergence...</p>
                                    </div>
                                ) : (
                                    diffResult.filter(p => !searchQuery || p.value.toLowerCase().includes(searchQuery.toLowerCase())).map((part, index) => (
                                        <span
                                            key={index}
                                            className={cn(
                                                "px-1 py-0.5 rounded-md transition-all duration-300 font-bold break-all inline-block mx-0.5",
                                                part.added ? "bg-green-500/15 text-green-500 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]" :
                                                    part.removed ? "bg-red-500/15 text-red-500 line-through decoration-red-500/30 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]" :
                                                        "text-[var(--text-secondary)] opacity-80"
                                            )}
                                        >
                                            {part.value}
                                        </span>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 min-h-[500px] glass border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 backdrop-blur-xl">
                                <div className="p-12 border-r border-[var(--border-primary)] overflow-auto custom-scrollbar border-dashed">
                                    <p className="text-[10px] font-black text-red-500/50 uppercase tracking-[0.4em] mb-8">Deletions Matrix</p>
                                    <div className="font-mono text-sm leading-loose">
                                        {splitData?.left.map((part, index) => (
                                            <span
                                                key={index}
                                                className={cn(
                                                    "px-1 py-0.5 rounded-md break-all inline-block mx-0.5",
                                                    part.removed ? "bg-red-500/15 text-red-500 border border-red-500/20" : "text-[var(--text-secondary)] opacity-30"
                                                )}
                                            >
                                                {part.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-12 overflow-auto custom-scrollbar">
                                    <p className="text-[10px] font-black text-green-500/50 uppercase tracking-[0.4em] mb-8">Additions Matrix</p>
                                    <div className="font-mono text-sm leading-loose">
                                        {splitData?.right.map((part, index) => (
                                            <span
                                                key={index}
                                                className={cn(
                                                    "px-1 py-0.5 rounded-md break-all inline-block mx-0.5",
                                                    part.added ? "bg-green-500/15 text-green-500 border border-green-500/20" : "text-[var(--text-secondary)] opacity-30"
                                                )}
                                            >
                                                {part.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pro Feature Teaser */}
                <div className="p-12 glass rounded-[3.5rem] border-dashed border-brand/20 bg-brand/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] text-brand font-black uppercase tracking-[0.5em]">Advanced Resolves</p>
                            <p className="text-[11px] text-[var(--text-secondary)] font-bold italic opacity-60">Utilize semantic merge logic to prevent temporal data conflicts.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setModified(original)}
                                className="px-8 py-3 glass border-[var(--border-primary)] rounded-2xl text-[9px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white transition-all shadow-lg"
                            >
                                Revert Beta to Alpha
                            </button>
                            <button
                                onClick={() => setOriginal(modified)}
                                className="px-8 py-3 glass border-[var(--border-primary)] rounded-2xl text-[9px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white transition-all shadow-lg"
                            >
                                Force Update Alpha
                            </button>
                            <button
                                onClick={() => {
                                    const merged = diffResult.filter(p => !p.removed).map(p => p.value).join('')
                                    setModified(merged)
                                    setOriginal(merged)
                                }}
                                className="px-8 py-3 brand-gradient text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl"
                            >
                                Resolve & Sync All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
