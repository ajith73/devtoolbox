import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileDiff } from 'lucide-react'
import { diffChars, diffLines } from 'diff'
import { cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function DiffTool() {
    const [original, setOriginal] = usePersistentState('diff_original', '{\n  "name": "DevBox",\n  "version": "1.0",\n  "status": "Beta"\n}')
    const [modified, setModified] = usePersistentState('diff_modified', '{\n  "name": "DevBox Tool",\n  "version": "1.1",\n  "status": "Stable"\n}')
    const [diffMode, setDiffMode] = useState<'chars' | 'lines'>('lines')
    const [diffResult, setDiffResult] = useState<any[]>([])

    useEffect(() => {
        const result = diffMode === 'lines'
            ? diffLines(original, modified)
            : diffChars(original, modified)
        setDiffResult(result)
    }, [original, modified, diffMode])

    return (
        <ToolLayout
            title="Text Diff Checker"
            description="Compare two text blocks to find additions, deletions, and changes."
            icon={FileDiff}
            onReset={() => { setOriginal(''); setModified(''); }}
        >
            <div className="space-y-6 text-[var(--text-primary)]">
                <div className="flex items-center space-x-4 mb-2">
                    <div className="flex glass rounded-2xl p-1.5 border-[var(--border-primary)] shadow-lg bg-[var(--bg-secondary)]/50">
                        <button
                            onClick={() => setDiffMode('lines')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                                diffMode === 'lines' ? "brand-gradient text-white shadow-md shadow-brand/20 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            Line Diff
                        </button>
                        <button
                            onClick={() => setDiffMode('chars')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                                diffMode === 'chars' ? "brand-gradient text-white shadow-md shadow-brand/20 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            Char Diff
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4 flex flex-col min-h-[350px] group transition-all">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Source Prototype</label>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner custom-scrollbar transition-all focus:ring-4 focus:ring-brand/10 font-black opacity-80"
                            value={original}
                            onChange={(e) => setOriginal(e.target.value)}
                            placeholder="Input original state..."
                        />
                    </div>
                    <div className="space-y-4 flex flex-col min-h-[350px] group transition-all">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Evolutionary Variant</label>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner custom-scrollbar transition-all focus:ring-4 focus:ring-brand/10 font-black opacity-80"
                            value={modified}
                            onChange={(e) => setModified(e.target.value)}
                            placeholder="Input modified variant..."
                        />
                    </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-[var(--border-primary)]/30">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Engine Intersection Resolve</label>
                        <div className="flex items-center space-x-6 text-[9px] font-black uppercase tracking-widest opacity-60">
                            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" /><span>Additions</span></div>
                            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" /><span>Deletions</span></div>
                        </div>
                    </div>
                    <div className="min-h-[300px] glass rounded-[3.5rem] p-10 font-mono text-sm shadow-inner whitespace-pre-wrap leading-relaxed border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 overflow-auto custom-scrollbar transition-all backdrop-blur-sm">
                        {diffResult.map((part, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "px-1.5 py-1 rounded-lg transition-all duration-300 font-bold",
                                    part.added ? "bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm mx-0.5" :
                                        part.removed ? "bg-red-500/10 text-red-500 line-through decoration-red-900/50 border border-red-500/20 shadow-sm mx-0.5" :
                                            "text-[var(--text-secondary)] opacity-100"
                                )}
                            >
                                {part.value}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
