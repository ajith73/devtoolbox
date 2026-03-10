import { ToolLayout } from './ToolLayout'
import { Type, Copy, Zap, Wrench, Code, Search } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { useState } from 'react'

export function TextTool() {
    const [input, setInput] = usePersistentState('text_input', '')
    const [activeTab, setActiveTab] = useState<'cases' | 'processing' | 'programming' | 'seo'>('cases')

    const formats = [
        {
            id: 'upper',
            name: 'UPPERCASE',
            convert: (t: string) => t.toUpperCase()
        },
        {
            id: 'lower',
            name: 'lowercase',
            convert: (t: string) => t.toLowerCase()
        },
        {
            id: 'title',
            name: 'Title Case',
            convert: (t: string) => t.replace(/\w\S*/g, (txt) =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            )
        },
        {
            id: 'sentence',
            name: 'Sentence case',
            convert: (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
        },
        {
            id: 'camel',
            name: 'camelCase',
            convert: (t: string) => t
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                    index === 0 ? word.toLowerCase() : word.toUpperCase()
                )
                .replace(/\s+/g, '')
        },
        {
            id: 'pascal',
            name: 'PascalCase',
            convert: (t: string) => t
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
                .replace(/\s+/g, '')
        },
        {
            id: 'snake',
            name: 'snake_case',
            convert: (t: string) => t
                .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
                ?.map(x => x.toLowerCase())
                .join('_') || ''
        },
        {
            id: 'kebab',
            name: 'kebab-case',
            convert: (t: string) => t
                .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
                ?.map(x => x.toLowerCase())
                .join('-') || ''
        }
    ]

    return (
        <ToolLayout
            title="Text Case Converter"
            description="Instantly switch your text between 8 different professional casing formats."
            icon={Type}
            onReset={() => setInput('')}
        >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-[var(--text-primary)]">
                {/* Left Column: Input & Statistics */}
                <div className="space-y-6">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Source Text</label>
                            <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest">
                                <Zap className="w-4 h-4 text-brand animate-pulse" />
                                <span>Live Processing</span>
                            </div>
                        </div>
                        <textarea
                            className="w-full h-[400px] font-mono text-sm resize-none p-6 glass rounded-2xl bg-[var(--input-bg)] shadow-inner border-[var(--border-primary)]"
                            placeholder="Type or paste your text here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    {/* Word & Character Counter */}
                    {input && (
                        <div className="glass rounded-xl p-4 bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]">
                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Text Statistics</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-black text-brand">{input.trim().split(/\s+/).filter(word => word.length > 0).length}</div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Words</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-brand">{input.length}</div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Characters</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-brand">{input.replace(/\s/g, '').length}</div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">No Spaces</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-brand">{input.split('\n').length}</div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Lines</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => copyToClipboard(input)}
                                disabled={!input}
                                className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:border-brand/40 transition-colors disabled:opacity-50"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                            </button>
                            <button
                                onClick={() => {
                                    const blob = new Blob([input], { type: 'text/plain;charset=utf-8' })
                                    const url = URL.createObjectURL(blob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = 'text-content.txt'
                                    link.click()
                                    URL.revokeObjectURL(url)
                                }}
                                disabled={!input}
                                className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:border-brand/40 transition-colors disabled:opacity-50"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Download
                            </button>
                        </div>
                        <button
                            onClick={() => setInput('')}
                            disabled={!input}
                            className="w-full px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg font-bold text-xs text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            Clear All Text
                        </button>
                    </div>
                </div>

                {/* Right Column: Tools Tabs */}
                <div className="space-y-4">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-[var(--border-primary)]">
                        <button
                            onClick={() => setActiveTab('cases')}
                            className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                                activeTab === 'cases'
                                    ? 'border-brand text-brand bg-brand/5'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Case Conversions
                        </button>
                        <button
                            onClick={() => setActiveTab('processing')}
                            className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                                activeTab === 'processing'
                                    ? 'border-brand text-brand bg-brand/5'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Wrench className="w-3.5 h-3.5 inline mr-1" />
                            Processing
                        </button>
                        <button
                            onClick={() => setActiveTab('programming')}
                            className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                                activeTab === 'programming'
                                    ? 'border-brand text-brand bg-brand/5'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Code className="w-3.5 h-3.5 inline mr-1" />
                            Code
                        </button>
                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                                activeTab === 'seo'
                                    ? 'border-brand text-brand bg-brand/5'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Search className="w-3.5 h-3.5 inline mr-1" />
                            SEO
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        {activeTab === 'cases' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {formats.map((fmt) => {
                                        const output = input ? fmt.convert(input) : ''
                                        return (
                                            <div key={fmt.id} className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all flex flex-col space-y-3 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{fmt.name}</p>
                                                    <button
                                                        onClick={() => copyToClipboard(output)}
                                                        disabled={!output}
                                                        className="p-2 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-0"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="min-h-12 font-mono text-sm text-[var(--text-primary)] break-all select-all font-medium opacity-80 group-hover:opacity-100 transition-opacity flex items-center bg-[var(--bg-primary)]/50 p-3 rounded-lg border border-[var(--border-primary)]/50">
                                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'processing' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Remove Extra Spaces */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Remove Spaces</p>
                                        <button
                                            onClick={() => setInput(input.replace(/\s+/g, ' ').trim())}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Fix messy spacing</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.replace(/\s+/g, ' ').trim() : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Reverse Text */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Reverse Text</p>
                                        <button
                                            onClick={() => setInput(input.split('').reverse().join(''))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Character reversal</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.split('').reverse().join('') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Reverse Word Order */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Reverse Words</p>
                                        <button
                                            onClick={() => setInput(input.trim().split(/\s+/).reverse().join(' '))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Word order reversal</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.trim().split(/\s+/).reverse().join(' ') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Remove Duplicate Words */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Remove Duplicates</p>
                                        <button
                                            onClick={() => setInput([...new Set(input.trim().split(/\s+/))].join(' '))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Remove duplicate words</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? [...new Set(input.trim().split(/\s+/))].join(' ') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Remove Special Characters */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Remove Special Chars</p>
                                        <button
                                            onClick={() => setInput(input.replace(/[^a-zA-Z0-9\s]/g, ''))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Clean special characters</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.replace(/[^a-zA-Z0-9\s]/g, '') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Sort Text */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Sort Alphabetically</p>
                                        <button
                                            onClick={() => setInput(input.trim().split('\n').sort().join('\n'))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Sort lines A-Z</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center whitespace-pre-line">
                                        {input ? input.trim().split('\n').sort().join('\n') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Extract Emails */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Extract Emails</p>
                                        <button
                                            onClick={() => setInput(input.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g)?.join('\n') || '')}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Extract email addresses</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center whitespace-pre-line">
                                        {input ? (input.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g)?.join('\n') || 'No emails found') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Extract URLs */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Extract URLs</p>
                                        <button
                                            onClick={() => setInput(input.match(/https?:\/\/[^\s]+/g)?.join('\n') || '')}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Extract web URLs</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center whitespace-pre-line">
                                        {input ? (input.match(/https?:\/\/[^\s]+/g)?.join('\n') || 'No URLs found') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'programming' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* JSON Array */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">JSON Array</p>
                                        <button
                                            onClick={() => setInput(`[${input.trim().split(/\s+/).map(word => `"${word}"`).join(', ')}]`)}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Convert to JSON array</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? `[${input.trim().split(/\s+/).map(word => `"${word}"`).join(', ')}]` : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* SQL IN Clause */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">SQL IN Clause</p>
                                        <button
                                            onClick={() => setInput(`IN (${input.trim().split(/\s+/).map(word => `'${word}'`).join(', ')})`)}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Convert to SQL IN clause</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? `IN (${input.trim().split(/\s+/).map(word => `'${word}'`).join(', ')})` : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* CSV Format */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">CSV Format</p>
                                        <button
                                            onClick={() => setInput(input.trim().split(/\s+/).join(','))}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Convert to CSV format</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.trim().split(/\s+/).join(',') : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* HTML List */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">HTML List</p>
                                        <button
                                            onClick={() => setInput(`<ul>\n${input.trim().split(/\s+/).map(word => `  <li>${word}</li>`).join('\n')}\n</ul>`)}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Convert to HTML list</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center whitespace-pre-line">
                                        {input ? `<ul>\n${input.trim().split(/\s+/).map(word => `  <li>${word}</li>`).join('\n')}\n</ul>` : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seo' && (
                            <div className="space-y-4">
                                {/* Slug Generator */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Slug Generator</p>
                                        <button
                                            onClick={() => setInput(input.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim())}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Generate SEO-friendly slug</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[50px] flex items-center">
                                        {input ? input.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Keyword Density */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Keyword Density</p>
                                        <button
                                            onClick={() => {
                                                const words = input.toLowerCase().match(/\b\w+\b/g) || []
                                                const totalWords = words.length
                                                const wordCount: Record<string, number> = {}
                                                words.forEach(word => wordCount[word] = (wordCount[word] || 0) + 1)
                                                const sortedWords = Object.entries(wordCount)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 10)
                                                    .map(([word, count]) => `${word}: ${count} (${((count / totalWords) * 100).toFixed(1)}%)`)
                                                    .join('\n')
                                                setInput(sortedWords)
                                            }}
                                            disabled={!input}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">Analyze keyword density</div>
                                    <div className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded-lg border border-[var(--border-primary)]/50 min-h-[80px] flex items-start whitespace-pre-line p-3 overflow-auto">
                                        {input ? (() => {
                                            const words = input.toLowerCase().match(/\b\w+\b/g) || []
                                            const totalWords = words.length
                                            const wordCount: Record<string, number> = {}
                                            words.forEach(word => wordCount[word] = (wordCount[word] || 0) + 1)
                                            return Object.entries(wordCount)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 10)
                                                .map(([word, count]) => `${word}: ${count} (${((count / totalWords) * 100).toFixed(1)}%)`)
                                                .join('\n')
                                        })() : <span className="text-[var(--text-muted)] opacity-30 italic">Result...</span>}
                                    </div>
                                </div>

                                {/* Meta Title Length */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Meta Title Check</div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-3">Check title length for SEO (30-60 characters optimal)</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Length:</span>
                                            <span className={`text-sm font-bold ${input.length > 60 ? 'text-red-400' : input.length >= 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {input.length}/60
                                            </span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-primary)] rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all ${
                                                    input.length > 60 ? 'bg-red-400' :
                                                    input.length >= 30 ? 'bg-green-400' : 'bg-yellow-400'
                                                }`}
                                                style={{ width: `${Math.min((input.length / 60) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">
                                            {input.length < 30 ? 'Too short for SEO' :
                                             input.length <= 60 ? 'Perfect length ✓' : 'Too long for search engines'}
                                        </div>
                                    </div>
                                </div>

                                {/* Random Text Generator */}
                                <div className="glass rounded-xl p-4 border-[var(--border-primary)] group hover:border-brand/40 transition-all bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm">
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Random Generator</div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-3">Generate random content for testing</div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setInput(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))}
                                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-xs font-bold hover:border-brand/40 transition-colors"
                                        >
                                            Generate Password
                                        </button>
                                        <button
                                            onClick={() => setInput('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.')}
                                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-xs font-bold hover:border-brand/40 transition-colors"
                                        >
                                            Lorem Ipsum Text
                                        </button>
                                        <button
                                            onClick={() => {
                                                const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson', 'Diana Davis', 'Mike Chen', 'Sarah Johnson', 'David Brown', 'Lisa Wilson']
                                                setInput(names[Math.floor(Math.random() * names.length)])
                                            }}
                                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-xs font-bold hover:border-brand/40 transition-colors"
                                        >
                                            Random Name
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
