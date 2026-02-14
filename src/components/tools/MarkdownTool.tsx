import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileEdit, Eye, Download, FileText, Zap, Layout } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function MarkdownTool() {
    const [markdown, setMarkdown] = usePersistentState('markdown_input', '# Hello World\n\nStart typing on the left to see the **preview** on the right.\n\n### Features\n- Real-time preview\n- Clean aesthetics\n- .md download\n\n```javascript\nconsole.log("Markdown is awesome!");\n```')
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')

    const handleDownload = () => {
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document.md'
        a.click()
        URL.revokeObjectURL(url)
    }

    // Very simple markdown to HTML converter for the preview (since I can't install new libraries easily in one go)
    // In a real app, we'd use react-markdown or marked
    const renderPreview = (text: string) => {
        return text
            .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-black mb-4">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-3xl font-black mb-3">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-2xl font-black mb-2">$1</h3>')
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-[var(--bg-secondary)] p-6 rounded-2xl font-mono text-sm my-6 border border-[var(--border-primary)] shadow-inner">$1</pre>')
            .replace(/\n/g, '<br />')
    }

    return (
        <ToolLayout
            title="Markdown Editor"
            description="Professional markdown suite with real-time semantic preview and file export."
            icon={FileEdit}
            onReset={() => setMarkdown('')}
            onDownload={markdown ? handleDownload : undefined}
            onCopy={() => copyToClipboard(markdown)}
        >
            <div className="space-y-6 flex flex-col min-h-[700px]">
                <div className="flex items-center justify-between p-1.5 glass rounded-2xl md:rounded-3xl bg-[var(--bg-secondary)] border-[var(--border-primary)] w-fit mx-auto mb-2 overflow-hidden shadow-lg sticky top-0 z-10 transition-colors">
                    {[
                        { id: 'edit', name: 'Editor', icon: FileEdit },
                        { id: 'split', name: 'Split View', icon: Layout },
                        { id: 'preview', name: 'Preview', icon: Eye }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={cn(
                                "flex items-center space-x-2 px-6 py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase transition-all duration-300",
                                viewMode === mode.id
                                    ? "brand-gradient text-white shadow-lg shadow-brand/20 scale-105"
                                    : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            <mode.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{mode.name}</span>
                        </button>
                    ))}
                </div>

                <div className={cn(
                    "flex-1 grid gap-8 min-h-[500px]",
                    viewMode === 'split' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                )}>
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div className="flex flex-col space-y-3 h-full group">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Markdown Input</label>
                                <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    <span>Live Syncing</span>
                                </div>
                            </div>
                            <textarea
                                className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-8 rounded-[2.5rem] border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                                placeholder="Type your markdown here..."
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                            />
                        </div>
                    )}

                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex flex-col space-y-3 h-full overflow-hidden">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2">Live Preview</label>
                            <div className="flex-1 glass rounded-[2.5rem] border-[var(--border-primary)] p-8 overflow-auto custom-scrollbar bg-[var(--bg-secondary)]/50 shadow-inner">
                                {markdown ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: renderPreview(markdown) }}
                                        className="text-[var(--text-primary)] leading-relaxed prose prose-slate max-w-none"
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                        <FileText className="w-16 h-16" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Nothing to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-primary)]/30 shrink-0">
                    <div className="p-5 glass rounded-2xl border-[var(--border-primary)] flex items-center space-x-4 group hover:border-brand/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight">File Status</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{markdown ? 'Draft Active' : 'Empty Canvas'}</p>
                        </div>
                    </div>
                    <div className="p-5 glass rounded-2xl border-[var(--border-primary)] flex items-center space-x-4 group hover:border-brand/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <Download className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight">Export Format</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">Raw Markdown (.md)</p>
                        </div>
                    </div>
                    <div className="p-5 glass rounded-2xl border-[var(--border-primary)] flex items-center space-x-4 group hover:border-brand/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight">Encoding</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">UTF-8 Standard</p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
