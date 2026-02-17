import { useMemo } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type Category = 'length' | 'weight' | 'data'

type Unit = {
    id: string
    label: string
    factorToBase: number
}

const UNITS: Record<Category, { base: string, units: Unit[] }> = {
    length: {
        base: 'm',
        units: [
            { id: 'mm', label: 'Millimeter (mm)', factorToBase: 0.001 },
            { id: 'cm', label: 'Centimeter (cm)', factorToBase: 0.01 },
            { id: 'm', label: 'Meter (m)', factorToBase: 1 },
            { id: 'km', label: 'Kilometer (km)', factorToBase: 1000 },
            { id: 'in', label: 'Inch (in)', factorToBase: 0.0254 },
            { id: 'ft', label: 'Foot (ft)', factorToBase: 0.3048 },
            { id: 'yd', label: 'Yard (yd)', factorToBase: 0.9144 },
            { id: 'mi', label: 'Mile (mi)', factorToBase: 1609.344 },
        ]
    },
    weight: {
        base: 'kg',
        units: [
            { id: 'g', label: 'Gram (g)', factorToBase: 0.001 },
            { id: 'kg', label: 'Kilogram (kg)', factorToBase: 1 },
            { id: 'lb', label: 'Pound (lb)', factorToBase: 0.45359237 },
            { id: 'oz', label: 'Ounce (oz)', factorToBase: 0.028349523125 },
        ]
    },
    data: {
        base: 'B',
        units: [
            { id: 'B', label: 'Byte (B)', factorToBase: 1 },
            { id: 'KB', label: 'Kilobyte (KB)', factorToBase: 1024 },
            { id: 'MB', label: 'Megabyte (MB)', factorToBase: 1024 ** 2 },
            { id: 'GB', label: 'Gigabyte (GB)', factorToBase: 1024 ** 3 },
        ]
    }
}

export function UnitConverterTool() {
    const [category, setCategory] = usePersistentState<Category>('unit_category', 'length')
    const [value, setValue] = usePersistentState<string>('unit_value', '')
    const [fromUnit, setFromUnit] = usePersistentState<string>('unit_from', 'm')
    const [toUnit, setToUnit] = usePersistentState<string>('unit_to', 'cm')

    const { output, error, fromLabel, toLabel } = useMemo(() => {
        const cat = UNITS[category]
        const from = cat.units.find(u => u.id === fromUnit) ?? cat.units[0]
        const to = cat.units.find(u => u.id === toUnit) ?? cat.units[1] ?? cat.units[0]

        const raw = value.trim()
        if (!raw) {
            return { output: '', error: null as string | null, fromLabel: from.label, toLabel: to.label }
        }

        const n = Number(raw)
        if (!Number.isFinite(n)) {
            return { output: '', error: 'Not a number', fromLabel: from.label, toLabel: to.label }
        }

        const base = n * from.factorToBase
        const converted = base / to.factorToBase
        return {
            output: String(converted),
            error: null as string | null,
            fromLabel: from.label,
            toLabel: to.label,
        }
    }, [category, value, fromUnit, toUnit])

    const exportText = useMemo(() => {
        if (!output) return ''
        return `${value}\t${fromUnit}\t=\t${output}\t${toUnit}`
    }, [value, fromUnit, output, toUnit])

    const options = UNITS[category].units

    return (
        <ToolLayout
            title="Unit Converter"
            description="Convert common units locally (length, weight, data size)."
            icon={ArrowRightLeft}
            onReset={() => setValue('')}
            onCopy={exportText ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                            <option value="length">Length</option>
                            <option value="weight">Weight</option>
                            <option value="data">Data</option>
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Value</label>
                        <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="10" />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">From</label>
                        <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
                            {options.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">To</label>
                        <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
                            {options.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <div className="p-8 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Result</div>
                        <div className="text-xl font-black text-[var(--text-primary)] break-words">
                            {output ? `${output} (${toLabel})` : <span className="text-[var(--text-muted)] opacity-50 italic">—</span>}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-mono break-words">
                            {output ? `${value} (${fromLabel}) = ${output} (${toLabel})` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
