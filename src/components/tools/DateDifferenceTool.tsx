import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function safeDate(input: string) {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
}

export function DateDifferenceTool() {
    const [from, setFrom] = usePersistentState('date_diff_from', '')
    const [to, setTo] = usePersistentState('date_diff_to', '')

    const computed = useMemo(() => {
        const d1 = from.trim() ? safeDate(from) : null
        const d2 = to.trim() ? safeDate(to) : null
        if (!d1 || !d2) return { error: null as string | null, output: '' }

        const ms = Math.abs(d2.getTime() - d1.getTime())
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        const out = [
            `Milliseconds: ${ms}`,
            `Seconds: ${seconds}`,
            `Minutes: ${minutes}`,
            `Hours: ${hours}`,
            `Days: ${days}`,
        ].join('\n')

        return { error: null as string | null, output: out }
    }, [from, to])

    return (
        <ToolLayout
            title="Date Difference"
            description="Calculate the duration between two dates/times."
            icon={CalendarClock}
            onReset={() => { setFrom(''); setTo('') }}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">From</label>
                        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">To</label>
                        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Select two dates to compute...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
