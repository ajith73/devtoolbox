import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const UNITS = [
    { id: 'ms', label: 'Milliseconds', factor: 1 },
    { id: 's', label: 'Seconds', factor: 1000 },
    { id: 'min', label: 'Minutes', factor: 60 * 1000 },
    { id: 'h', label: 'Hours', factor: 60 * 60 * 1000 },
    { id: 'd', label: 'Days', factor: 24 * 60 * 60 * 1000 },
] as const

type UnitId = typeof UNITS[number]['id']

export function DurationConverterTool() {
    const [value, setValue] = usePersistentState<string>('duration_value', '')
    const [unit, setUnit] = usePersistentState<UnitId>('duration_unit', 'ms')

    const computed = useMemo(() => {
        const raw = value.trim()
        if (!raw) return { error: null as string | null, ms: null as number | null }
        const n = Number(raw)
        if (!Number.isFinite(n)) return { error: 'Not a number', ms: null as number | null }
        const factor = UNITS.find((u) => u.id === unit)?.factor ?? 1
        return { error: null as string | null, ms: n * factor }
    }, [value, unit])

    const output = useMemo(() => {
        if (computed.ms === null) return ''
        const ms = computed.ms
        const lines = UNITS.map((u) => {
            const v = ms / u.factor
            return `${u.id}\t${v}`
        })
        return lines.join('\n')
    }, [computed.ms])

    return (
        <ToolLayout
            title="Duration Converter"
            description="Convert durations between ms, seconds, minutes, hours and days."
            icon={Clock}
            onReset={() => setValue('')}
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
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Value</label>
                        <input
                            type="text"
                            placeholder="1500"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Unit</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value as UnitId)}>
                            {UNITS.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Milliseconds</label>
                        <div className="font-mono text-sm break-words text-[var(--text-primary)]">
                            {computed.ms === null ? <span className="text-[var(--text-muted)] opacity-50 italic">—</span> : computed.ms}
                        </div>
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
