import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function toIsoSafe(d: Date) {
    try {
        return d.toISOString()
    } catch {
        return ''
    }
}

export function Iso8601Tool() {
    const [input, setInput] = usePersistentState('iso8601_input', '')

    const computed = useMemo(() => {
        const raw = input.trim()
        if (!raw) return { error: null as string | null, date: null as Date | null }

        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return { error: 'Invalid date/time', date: null as Date | null }
        return { error: null as string | null, date: d }
    }, [input])

    const output = useMemo(() => {
        if (!computed.date) return ''
        const d = computed.date
        const epochMs = d.getTime()
        const epochSeconds = Math.floor(epochMs / 1000)
        const parts = [
            `ISO (UTC): ${toIsoSafe(d)}`,
            `Epoch (ms): ${epochMs}`,
            `Epoch (s): ${epochSeconds}`,
            `Locale: ${d.toLocaleString()}`,
            `UTC: ${d.toUTCString()}`,
        ]
        return parts.join('\n')
    }, [computed.date])

    return (
        <ToolLayout
            title="ISO 8601 Parser"
            description="Parse ISO 8601 timestamps and view epoch + formatted outputs."
            icon={Clock}
            onReset={() => setInput('')}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {computed.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder="2026-02-17T09:30:00Z"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Accepts anything Date.parse can parse (ISO recommended).</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
