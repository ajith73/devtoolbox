import { ToolLayout } from './ToolLayout'
import { Type, Copy, Zap } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function TextTool() {
    const [input, setInput] = usePersistentState('text_input', '')

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
            id: 'camel',
            name: 'camelCase',
            convert: (t: string) => t
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                    index === 0 ? word.toLowerCase() : word.toUpperCase()
                )
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
        },
        {
            id: 'pascal',
            name: 'PascalCase',
            convert: (t: string) => t
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
                .replace(/\s+/g, '')
        }
    ]

    return (
        <ToolLayout
            title="Text Case Converter"
            description="Instantly switch your text between 6 different professional casing formats."
            icon={Type}
            onReset={() => setInput('')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-6">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Source Prototype</label>
                            <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest">
                                <Zap className="w-4 h-4 text-brand animate-pulse" />
                                <span>Reactive Buffer</span>
                            </div>
                        </div>
                        <textarea
                            className="w-full h-[500px] font-mono text-sm resize-none p-8 glass rounded-[2.5rem] bg-[var(--input-bg)] shadow-inner border-[var(--border-primary)]"
                            placeholder="Type or paste your text here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2 mb-4 block">Casing Mutations</label>
                    <div className="grid grid-cols-1 gap-6">
                        {formats.map((fmt) => {
                            const output = input ? fmt.convert(input) : ''
                            return (
                                <div key={fmt.id} className="glass rounded-[2rem] p-6 border-[var(--border-primary)] group hover:border-brand/40 transition-all flex flex-col space-y-4 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-[4rem] group-hover:bg-brand/10 transition-colors pointer-events-none" />
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-1 font-black">{fmt.name}</p>
                                        <button
                                            onClick={() => copyToClipboard(output)}
                                            disabled={!output}
                                            className="p-3 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 rounded-2xl transition-all disabled:opacity-0 shadow-sm border border-transparent hover:border-brand/20 z-10"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="min-h-12 font-mono text-sm text-[var(--text-primary)] break-all select-all font-black opacity-80 group-hover:opacity-100 transition-opacity flex items-center bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-[var(--border-primary)]/50">
                                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Logic processing state: idle...</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-8 glass rounded-[2.5rem] border-dashed border-brand/20 flex flex-col items-center justify-center space-y-3 mt-8 bg-brand/5 shadow-sm">
                        <p className="text-[10px] text-brand font-black uppercase tracking-[0.4em]">Engine Advice</p>
                        <p className="text-xs text-center text-[var(--text-secondary)] italic leading-relaxed px-4 opacity-80 font-medium">Seeking variable sanitation? Utilize <span className="text-brand font-black">snake_case</span> or <span className="text-brand font-black">kebab-case</span> for automated semantic purification.</p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
