import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { usePersistentState } from '../../lib/storage'

const ZONES = [
    'UTC',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney',
] as const

type ZoneId = typeof ZONES[number]

function fmtTime(d: Date, tz: string) {
    const fmt = new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    return fmt.format(d)
}

export function WorldClockTool() {
    const [selected, setSelected] = usePersistentState<ZoneId[]>('world_clock_zones', ['UTC', 'Asia/Kolkata', 'America/New_York'])
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const rows = useMemo(() => {
        const uniq = Array.from(new Set(selected)).filter((z): z is ZoneId => (ZONES as readonly string[]).includes(z))
        return uniq.map((tz) => ({ tz, text: fmtTime(now, tz) }))
    }, [now, selected])

    return (
        <ToolLayout
            title="World Clock"
            description="Track current time across multiple time zones."
            icon={Clock}
            onReset={() => setSelected(['UTC', 'Asia/Kolkata', 'America/New_York'])}
        >
            <div className="space-y-6">
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Time zones</label>
                    <select
                        multiple
                        value={selected}
                        onChange={(e) => {
                            const vals = Array.from(e.target.selectedOptions).map(o => o.value as ZoneId)
                            setSelected(vals)
                        }}
                        className="h-40"
                    >
                        {ZONES.map((z) => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rows.map((r) => (
                        <div key={r.tz} className="p-6 glass rounded-[2rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand">{r.tz}</div>
                            <div className="mt-3 text-lg font-black text-[var(--text-primary)] font-mono">{r.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    )
}
