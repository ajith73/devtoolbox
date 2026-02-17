import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const TIMEZONES = [
    'UTC',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Australia/Sydney',
] as const

type TimezoneId = typeof TIMEZONES[number]

function formatInZone(date: Date, timeZone: string) {
    const fmt = new Intl.DateTimeFormat(undefined, {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    return fmt.format(date)
}

export function TimezoneConverterTool() {
    const [input, setInput] = usePersistentState<string>('tz_input', '')
    const [fromTz, setFromTz] = usePersistentState<TimezoneId>('tz_from', 'UTC')
    const [toTz, setToTz] = usePersistentState<TimezoneId>('tz_to', 'Asia/Kolkata')

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
        try {
            const from = formatInZone(d, fromTz)
            const to = formatInZone(d, toTz)
            return `From (${fromTz}): ${from}\nTo (${toTz}): ${to}`
        } catch {
            return ''
        }
    }, [computed.date, fromTz, toTz])

    return (
        <ToolLayout
            title="Timezone Converter"
            description="View the same moment in different time zones."
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Input (ISO preferred)</label>
                        <input
                            type="text"
                            placeholder="2026-02-17T09:30:00Z"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">From TZ</label>
                        <select value={fromTz} onChange={(e) => setFromTz(e.target.value as TimezoneId)}>
                            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">To TZ</label>
                        <select value={toTz} onChange={(e) => setToTz(e.target.value as TimezoneId)}>
                            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
