import { useMemo } from 'react'
import { FileCode } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type Row = {
    index: number
    char: string
    codePoint: number
    hex: string
    dec: string
    unicode: string
}

export function AsciiCodepointTool() {
    const [input, setInput] = usePersistentState('ascii_codepoint_input', '')

    const rows = useMemo<Row[]>(() => {
        const text = input ?? ''
        if (!text) return []
        const chars = Array.from(text)
        return chars.map((ch, idx) => {
            const cp = ch.codePointAt(0) ?? 0
            const hex = cp.toString(16).toUpperCase()
            const unicode = cp <= 0xffff
                ? `\\u${cp.toString(16).padStart(4, '0')}`
                : `\\u{${cp.toString(16)}}`
            return {
                index: idx,
                char: ch,
                codePoint: cp,
                hex: `0x${hex}`,
                dec: String(cp),
                unicode
            }
        })
    }, [input])

    const exportText = useMemo(() => {
        if (rows.length === 0) return ''
        return rows
            .map((r) => `${r.index}\t${JSON.stringify(r.char)}\t${r.dec}\t${r.hex}\t${r.unicode}`)
            .join('\n')
    }, [rows])

    return (
        <ToolLayout
            title="ASCII / Code Point"
            description="Inspect characters: Unicode code point, hex, and escape sequences."
            icon={FileCode}
            onReset={() => setInput('')}
            onCopy={exportText ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="h-[220px] font-mono text-sm resize-none"
                            placeholder="Type or paste text..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                            Copy exports a TSV table: index, char, dec, hex, unicode
                        </p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Preview</label>
                        <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <div className="p-6 overflow-auto custom-scrollbar max-h-[300px]">
                                {rows.length === 0 ? (
                                    <div className="text-[var(--text-muted)] opacity-30 italic text-sm p-2">No input yet...</div>
                                ) : (
                                    <table className="w-full text-xs font-mono text-[var(--text-primary)]">
                                        <thead className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                                            <tr>
                                                <th className="text-left py-2 pr-4">#</th>
                                                <th className="text-left py-2 pr-4">Char</th>
                                                <th className="text-left py-2 pr-4">Dec</th>
                                                <th className="text-left py-2 pr-4">Hex</th>
                                                <th className="text-left py-2">Unicode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r) => (
                                                <tr key={r.index} className="border-t border-[var(--border-primary)]/40">
                                                    <td className="py-2 pr-4 text-[var(--text-muted)]">{r.index}</td>
                                                    <td className="py-2 pr-4">{r.char === ' ' ? <span className="text-[var(--text-muted)]">␠</span> : r.char}</td>
                                                    <td className="py-2 pr-4">{r.dec}</td>
                                                    <td className="py-2 pr-4">{r.hex}</td>
                                                    <td className="py-2">{r.unicode}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
