import { useMemo } from 'react'
import { FileEdit } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function countWords(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).filter(Boolean).length
}

function countSentences(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    const matches = trimmed.match(/[^.!?]+[.!?]+/g)
    return matches ? matches.length : 1
}

export function TextStatisticsTool() {
    const [input, setInput] = usePersistentState('text_stats_input', '')

    const stats = useMemo(() => {
        const chars = input.length
        const charsNoSpaces = input.replace(/\s/g, '').length
        const words = countWords(input)
        const lines = input ? input.split(/\r\n|\r|\n/).length : 0
        const bytes = new TextEncoder().encode(input).length
        const sentences = countSentences(input)
        return { chars, charsNoSpaces, words, lines, bytes, sentences }
    }, [input])

    const exportText = useMemo(() => {
        return [
            `Characters: ${stats.chars}`,
            `Characters (no spaces): ${stats.charsNoSpaces}`,
            `Words: ${stats.words}`,
            `Lines: ${stats.lines}`,
            `Bytes (UTF-8): ${stats.bytes}`,
            `Sentences (approx): ${stats.sentences}`,
        ].join('\n')
    }, [stats])

    return (
        <ToolLayout
            title="Text Statistics"
            description="Count words, characters, lines and more."
            icon={FileEdit}
            onReset={() => setInput('')}
            onCopy={input ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!input}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="h-[360px] font-mono text-sm resize-none"
                            placeholder="Paste text here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Stats</label>
                        <div className="glass rounded-[2.5rem] border-[var(--border-primary)] p-8 bg-[var(--bg-secondary)]/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Stat label="Characters" value={stats.chars} />
                                <Stat label="Words" value={stats.words} />
                                <Stat label="Lines" value={stats.lines} />
                                <Stat label="Bytes (UTF-8)" value={stats.bytes} />
                                <Stat label="Chars (no spaces)" value={stats.charsNoSpaces} />
                                <Stat label="Sentences (approx)" value={stats.sentences} />
                            </div>
                            <div className="pt-6 mt-6 border-t border-[var(--border-primary)]/40">
                                <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap break-words">{exportText}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function Stat({ label, value }: { label: string, value: number }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
            <div className="mt-2 text-2xl font-black text-[var(--text-primary)]">{value}</div>
        </div>
    )
}
