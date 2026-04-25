import { useMemo, useState, useRef } from 'react'
import { Clock, Upload, Copy, CheckCircle, AlertCircle, FileText, BookOpen, Timer, Calculator } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced duration units with more options
const UNITS = [
    { id: 'ns', label: 'Nanoseconds', factor: 0.000001, abbreviation: 'ns' },
    { id: 'μs', label: 'Microseconds', factor: 0.001, abbreviation: 'μs' },
    { id: 'ms', label: 'Milliseconds', factor: 1, abbreviation: 'ms' },
    { id: 's', label: 'Seconds', factor: 1000, abbreviation: 's' },
    { id: 'min', label: 'Minutes', factor: 60 * 1000, abbreviation: 'min' },
    { id: 'h', label: 'Hours', factor: 60 * 60 * 1000, abbreviation: 'h' },
    { id: 'd', label: 'Days', factor: 24 * 60 * 60 * 1000, abbreviation: 'd' },
    { id: 'w', label: 'Weeks', factor: 7 * 24 * 60 * 60 * 1000, abbreviation: 'w' },
    { id: 'mo', label: 'Months (30.44 days)', factor: 30.44 * 24 * 60 * 60 * 1000, abbreviation: 'mo' },
    { id: 'y', label: 'Years (365.25 days)', factor: 365.25 * 24 * 60 * 60 * 1000, abbreviation: 'y' },
    { id: 'dec', label: 'Decades', factor: 10 * 365.25 * 24 * 60 * 60 * 1000, abbreviation: 'dec' },
    { id: 'cent', label: 'Centuries', factor: 100 * 365.25 * 24 * 60 * 60 * 1000, abbreviation: 'cent' }
] as const

type UnitId = typeof UNITS[number]['id']
type ConversionResult = {
    isValid: boolean
    error: string | null
    inputValue: string
    inputUnit: UnitId
    baseMs: number | null
    conversions: {
        [K in UnitId]: {
            value: number
            formatted: string
            scientific: string
            engineering: string
        }
    }
    breakdown: {
        largest: {
            unit: UnitId
            value: number
            formatted: string
        }
        components: {
            [K in UnitId]: {
                value: number
                remainder: number
            }
        }
    }
    humanReadable: {
        short: string
        medium: string
        long: string
        verbose: string
    }
    comparisons: {
        commonDurations: {
            name: string
            equivalent: number
            formatted: string
        }[]
        timeUnits: {
            unit: string
            count: number
            formatted: string
        }[]
    }
}

// Enhanced duration conversion function
function convertDuration(value: string, fromUnit: UnitId): ConversionResult {
    const raw = value.trim()
    if (!raw) {
        return {
            isValid: false,
            error: 'Empty input',
            inputValue: raw,
            inputUnit: fromUnit,
            baseMs: null,
            conversions: {} as any,
            breakdown: {} as any,
            humanReadable: {
                short: '',
                medium: '',
                long: '',
                verbose: ''
            },
            comparisons: {
                commonDurations: [],
                timeUnits: []
            }
        }
    }

    const n = Number(raw)
    if (!Number.isFinite(n)) {
        return {
            isValid: false,
            error: 'Not a valid number',
            inputValue: raw,
            inputUnit: fromUnit,
            baseMs: null,
            conversions: {} as any,
            breakdown: {
                largest: { unit: 'ms' as UnitId, value: 0, formatted: '0' },
                components: {} as { [K in UnitId]: { value: number; remainder: number } }
            },
            humanReadable: {
                short: '',
                medium: '',
                long: '',
                verbose: ''
            },
            comparisons: {
                commonDurations: [],
                timeUnits: []
            }
        }
    }

    const factor = UNITS.find((u) => u.id === fromUnit)?.factor ?? 1
    const baseMs = n * factor

    // Generate conversions for all units
    const conversions: any = {}
    UNITS.forEach(unit => {
        const value = baseMs / unit.factor
        conversions[unit.id] = {
            value,
            formatted: value.toLocaleString('en-US', { maximumFractionDigits: 10 }),
            scientific: value.toExponential(6),
            engineering: value.toExponential(3).replace(/e\+?/, 'e+')
        }
    })

    // Find largest unit with value >= 1
    const largestUnit = UNITS.reduce((largest, unit) => {
        const value = baseMs / unit.factor
        const largestFactor = largest ? UNITS.find(u => u.id === largest.unit)?.factor || 0 : 0
        if (value >= 1 && unit.factor > largestFactor) {
            return { unit: unit.id, value, formatted: value.toLocaleString('en-US', { maximumFractionDigits: 2 }) }
        }
        return largest
    }, null as { unit: UnitId, value: number, formatted: string } | null)

    // Generate breakdown components
    const breakdown = {
        largest: largestUnit || { unit: 'ms' as UnitId, value: baseMs, formatted: baseMs.toLocaleString() },
        components: {} as { [K in UnitId]: { value: number; remainder: number } }
    }

    UNITS.forEach(unit => {
        const value = baseMs / unit.factor
        breakdown.components[unit.id] = {
            value,
            remainder: value % 1
        }
    })

    // Generate human readable formats
    const getHumanReadable = (ms: number) => {
        const absMs = Math.abs(ms)
        
        // Find the best unit
        let bestUnitIndex = UNITS.length - 1  // Start with the largest unit
        let bestValue = absMs / UNITS[bestUnitIndex].factor
        
        // Try to find a smaller unit that gives a value >= 1 and < 1000
        for (let i = UNITS.length - 2; i >= 0; i--) {
            const unit = UNITS[i]
            const value = absMs / unit.factor
            if (value >= 1 && value < 1000) {
                bestUnitIndex = i
                bestValue = value
                break
            }
        }
        
        // If we still have a very large value, use scientific notation
        if (bestValue >= 1000) {
            const bestUnit = UNITS[bestUnitIndex]
            return {
                short: `${bestValue.toExponential(2)} ${bestUnit.abbreviation}`,
                medium: `${bestValue.toExponential(2)} ${bestUnit.label}`,
                long: `${bestValue.toExponential(2)} ${bestUnit.label}`,
                verbose: `${bestValue.toExponential(4)} ${bestUnit.label}`
            }
        }
        
        const bestUnit = UNITS[bestUnitIndex]
        const value = ms / bestUnit.factor
        const sign = ms < 0 ? '-' : ''
        
        return {
            short: `${sign}${value.toFixed(2)} ${bestUnit.abbreviation}`,
            medium: `${sign}${value.toFixed(2)} ${bestUnit.label}`,
            long: `${sign}${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${bestUnit.label}`,
            verbose: `${sign}${value.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${bestUnit.label}`
        }
    }

    // Generate comparisons
    const getComparisons = (ms: number) => {
        const absMs = Math.abs(ms)
        
        // Common durations for comparison
        const commonDurations = [
            { name: 'Blink of an eye', ms: 300 },
            { name: 'Second', ms: 1000 },
            { name: 'Minute', ms: 60 * 1000 },
            { name: 'Hour', ms: 60 * 60 * 1000 },
            { name: 'Day', ms: 24 * 60 * 60 * 1000 },
            { name: 'Week', ms: 7 * 24 * 60 * 60 * 1000 },
            { name: 'Month (average)', ms: 30.44 * 24 * 60 * 60 * 1000 },
            { name: 'Year (average)', ms: 365.25 * 24 * 60 * 60 * 1000 },
            { name: 'Decade', ms: 10 * 365.25 * 24 * 60 * 60 * 1000 },
            { name: 'Century', ms: 100 * 365.25 * 24 * 60 * 60 * 1000 }
        ]
        
        const comparisons = commonDurations
            .map(duration => ({
                name: duration.name,
                equivalent: absMs / duration.ms,
                formatted: (absMs / duration.ms).toLocaleString('en-US', { maximumFractionDigits: 2 })
            }))
            .filter(comp => comp.equivalent >= 0.01 && comp.equivalent <= 1000)
            .sort((a, b) => Math.abs(a.equivalent - 1) - Math.abs(b.equivalent - 1))
            .slice(0, 5)
        
        // Time units breakdown
        const timeUnits = [
            { unit: 'Centuries', ms: 100 * 365.25 * 24 * 60 * 60 * 1000 },
            { unit: 'Decades', ms: 10 * 365.25 * 24 * 60 * 60 * 1000 },
            { unit: 'Years', ms: 365.25 * 24 * 60 * 60 * 1000 },
            { unit: 'Months', ms: 30.44 * 24 * 60 * 60 * 1000 },
            { unit: 'Weeks', ms: 7 * 24 * 60 * 60 * 1000 },
            { unit: 'Days', ms: 24 * 60 * 60 * 1000 },
            { unit: 'Hours', ms: 60 * 60 * 1000 },
            { unit: 'Minutes', ms: 60 * 1000 },
            { unit: 'Seconds', ms: 1000 },
            { unit: 'Milliseconds', ms: 1 }
        ]
        
        const unitsBreakdown = timeUnits
            .map(unit => ({
                unit: unit.unit,
                count: Math.floor(absMs / unit.ms),
                formatted: `${Math.floor(absMs / unit.ms)} ${unit.unit}`
            }))
            .filter(unit => unit.count > 0)
            .slice(0, 8)
        
        return {
            commonDurations: comparisons,
            timeUnits: unitsBreakdown
        }
    }

    return {
        isValid: true,
        error: null,
        inputValue: raw,
        inputUnit: fromUnit,
        baseMs,
        conversions,
        breakdown,
        humanReadable: getHumanReadable(baseMs),
        comparisons: getComparisons(baseMs)
    }
}

// Sample durations
function getSampleDurations() {
    return [
        { value: '1000', unit: 'ms' as UnitId },
        { value: '60', unit: 's' as UnitId },
        { value: '24', unit: 'h' as UnitId },
        { value: '7', unit: 'd' as UnitId },
        { value: '365.25', unit: 'd' as UnitId },
        { value: '1000000', unit: 'ms' as UnitId },
        { value: '1', unit: 'y' as UnitId },
        { value: '25', unit: 'y' as UnitId },
        { value: '100', unit: 'y' as UnitId },
        { value: '1', unit: 'cent' as UnitId }
    ]
}

export function DurationConverterTool() {
    const [value, setValue] = usePersistentState<string>('duration_value', '')
    const [unit, setUnit] = usePersistentState<UnitId>('duration_unit', 'ms')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showBreakdown, setShowBreakdown] = useState(false)
    const [showComparisons, setShowComparisons] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedComputed = useMemo(() => {
        return convertDuration(value, unit)
    }, [value, unit])

    const output = useMemo(() => {
        if (!enhancedComputed.isValid) return ''
        
        const lines = [
            `Input: ${enhancedComputed.inputValue} ${enhancedComputed.inputUnit}`,
            `Base (ms): ${enhancedComputed.baseMs}`,
            `Human Readable (Short): ${enhancedComputed.humanReadable.short}`,
            `Human Readable (Medium): ${enhancedComputed.humanReadable.medium}`,
            `Human Readable (Long): ${enhancedComputed.humanReadable.long}`,
            `Human Readable (Verbose): ${enhancedComputed.humanReadable.verbose}`,
            `Largest Unit: ${enhancedComputed.breakdown.largest.unit} (${enhancedComputed.breakdown.largest.value})`,
            '',
            'Conversions:'
        ]
        
        UNITS.forEach(unit => {
            const conv = enhancedComputed.conversions[unit.id]
            lines.push(`${unit.id}: ${conv.formatted} ${unit.label}`)
            lines.push(`  Scientific: ${conv.scientific}`)
            lines.push(`  Engineering: ${conv.engineering}`)
        })
        
        lines.push('')
        lines.push('Breakdown Components:')
        UNITS.forEach(unit => {
            const comp = enhancedComputed.breakdown.components[unit.id]
            lines.push(`${unit.id}: ${comp.value} (remainder: ${comp.remainder})`)
        })
        
        lines.push('')
        lines.push('Comparisons:')
        enhancedComputed.comparisons.commonDurations.forEach(comp => {
            lines.push(`${comp.name}: ${comp.formatted}x`)
        })
        
        enhancedComputed.comparisons.timeUnits.forEach(unit => {
            lines.push(`${unit.formatted}`)
        })
        
        return lines.join('\n')
    }, [enhancedComputed])

    const handleCopy = async () => {
        if (output) {
            await copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                // Parse duration from file (look for number + unit patterns)
                const lines = content.split('\n')
                const firstMatch = lines.find(line => {
                    const match = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Zμ]+)$/)
                    return match && UNITS.some(u => u.id === match[2])
                })
                if (firstMatch) {
                    const match = firstMatch.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Zμ]+)$/)
                    if (match) {
                        setValue(match[1])
                        const unitId = match[2] as UnitId
                        if (UNITS.some(u => u.id === unitId)) {
                            setUnit(unitId)
                        }
                    }
                }
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSampleDurations()
        const sample = samples[Math.floor(Math.random() * samples.length)]
        setValue(sample.value)
        setUnit(sample.unit)
    }

    return (
        <ToolLayout
            title="Duration Converter Pro"
            description="Advanced duration converter with comprehensive unit support, breakdown analysis, and time comparisons."
            icon={Clock}
            onReset={() => setValue('')}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Duration Converter</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced time unit conversion with detailed analysis</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.log,.csv"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                    </button>

                    <button
                        onClick={insertSample}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Sample</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAdvanced 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showBreakdown 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Timer className="w-3.5 h-3.5" />
                            <span>Breakdown</span>
                        </button>
                        
                        <button
                            onClick={() => setShowComparisons(!showComparisons)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showComparisons 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Compare</span>
                        </button>
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-blue-400">{enhancedComputed.humanReadable?.short || '0 ms'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Human Readable</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-green-400">{enhancedComputed.breakdown?.largest?.unit || 'ms'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Largest Unit</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-yellow-400">{enhancedComputed.baseMs?.toLocaleString()}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Base (ms)</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-purple-400">{UNITS.length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Units</div>
                    </div>
                </div>

                {/* Error Display */}
                {!enhancedComputed.isValid && enhancedComputed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Conversion Error</div>
                            <div>{enhancedComputed.error}</div>
                        </div>
                    </div>
                )}

                {/* Main Input */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Value</label>
                        <input
                            type="text"
                            placeholder="1000"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Unit</label>
                        <select 
                            value={unit} 
                            onChange={(e) => setUnit(e.target.value as UnitId)}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        >
                            {UNITS.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Milliseconds</label>
                        <div className="font-mono text-sm break-words text-[var(--text-primary]">
                            {enhancedComputed.baseMs === null ? <span className="text-[var(--text-muted)] opacity-50 italic">—</span> : enhancedComputed.baseMs.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Advanced Details */}
                {showAdvanced && enhancedComputed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Calculator className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Conversions</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {UNITS.slice(0, 9).map(unit => (
                                <div key={unit.id} className="space-y-2">
                                    <div className="text-xs font-bold text-[var(--text-secondary)]">{unit.label}</div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">Value:</span>
                                            <span className="text-blue-400">{enhancedComputed.conversions[unit.id].formatted}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">Scientific:</span>
                                            <span className="text-green-400 font-mono">{enhancedComputed.conversions[unit.id].scientific}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">Engineering:</span>
                                            <span className="text-yellow-400 font-mono">{enhancedComputed.conversions[unit.id].engineering}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breakdown */}
                {showBreakdown && enhancedComputed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Timer className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Duration Breakdown</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Largest Unit</div>
                                <div className="text-lg font-black text-blue-400">
                                    {enhancedComputed.breakdown.largest.formatted} {enhancedComputed.breakdown.largest.unit}
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Component Breakdown</div>
                                <div className="space-y-1">
                                    {UNITS.slice(0, 6).map(unit => (
                                        <div key={unit.id} className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">{unit.abbreviation}:</span>
                                            <span className="text-green-400">{enhancedComputed.breakdown.components[unit.id].value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Comparisons */}
                {showComparisons && enhancedComputed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Time Comparisons</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Common Durations</div>
                                <div className="space-y-1">
                                    {enhancedComputed.comparisons.commonDurations.map((comp, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">{comp.name}:</span>
                                            <span className="text-blue-400">{comp.formatted}x</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Time Units</div>
                                <div className="space-y-1">
                                    {enhancedComputed.comparisons.timeUnits.map((unit, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-[var(--text-muted)]">Contains:</span>
                                            <span className="text-green-400">{unit.formatted}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Output */}
                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
