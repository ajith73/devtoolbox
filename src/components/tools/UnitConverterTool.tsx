import { useMemo, useState } from 'react'
import { Calculator, Copy, Check, Settings, History, RefreshCw, ArrowUpDown, TrendingUp, Info } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
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
    const [value, setValue] = usePersistentState<string>('unit_value', '10')
    const [fromUnit, setFromUnit] = usePersistentState<string>('unit_from', 'm')
    const [toUnit, setToUnit] = usePersistentState<string>('unit_to', 'cm')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [copied, setCopied] = useState(false)
    const [precision, setPrecision] = usePersistentState<number>('unit_precision', 6)
    const [conversionHistory, setConversionHistory] = usePersistentState<Array<{from: string, to: string, value: string, timestamp: string}>>('unit_history', [])

    const { output, error, toLabel } = useMemo(() => {
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
        const roundedOutput = converted.toFixed(precision)

        // Add to history
        const newConversion = {
            from: fromUnit,
            to: toUnit,
            value: roundedOutput,
            timestamp: new Date().toISOString()
        }
        setConversionHistory(prev => [newConversion, ...prev.slice(0, 9)])

        return {
            output: roundedOutput,
            error: null as string | null,
            fromLabel: from.label,
            toLabel: to.label,
        }
    }, [category, value, fromUnit, toUnit, precision])

    const options = UNITS[category].units

    const exportText = useMemo(() => {
        if (!output) return ''
        return `${value} ${fromUnit} = ${output} ${toUnit}`
    }, [value, fromUnit, output, toUnit])

    const handleCopy = () => {
        if (exportText) {
            copyToClipboard(exportText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSwapUnits = () => {
        setFromUnit(toUnit)
        setToUnit(fromUnit)
        setValue(output || '1')
    }

    const handleClearHistory = () => {
        setConversionHistory([])
    }

    const handlePrecisionChange = (newPrecision: number) => {
        setPrecision(Math.max(0, Math.min(15, newPrecision)))
    }

    return (
        <ToolLayout
            title="Unit Converter"
            description="Convert common units locally with advanced features and precision control."
            icon={Calculator}
            onReset={() => setValue('')}
            onCopy={exportText ? handleCopy : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Calculator className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Unit Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">Precise unit conversions with history tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showHistory ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <History className="w-4 h-4" />
                            <span>{showHistory ? 'Hide History' : 'Show History'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="font-bold">Conversion Error</span>
                        </div>
                        {error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Category</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value as Category)}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        >
                            <option value="length">Length</option>
                            <option value="weight">Weight</option>
                            <option value="data">Data</option>
                        </select>
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Value</label>
                        <input 
                            type="text" 
                            value={value} 
                            onChange={(e) => setValue(e.target.value)} 
                            placeholder="Enter value to convert"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        />
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">From</label>
                        <select 
                            value={fromUnit} 
                            onChange={(e) => setFromUnit(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        >
                            {options.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">To</label>
                        <select 
                            value={toUnit} 
                            onChange={(e) => setToUnit(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                        >
                            {options.map((u) => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Precision</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="range"
                                min="0"
                                max="15"
                                value={precision}
                                onChange={(e) => handlePrecisionChange(parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-sm font-mono text-[var(--text-primary)] min-w-[3ch]">{precision} decimal places</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={handleSwapUnits}
                        className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Swap Units</span>
                    </button>
                    <button
                        onClick={() => setValue('1')}
                        className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset Value</span>
                    </button>
                </div>

                {/* Enhanced Result Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Result</label>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <div className="p-6 text-blue-300 font-mono text-xs overflow-auto custom-scrollbar">
                                <div className="text-4xl font-bold text-blue-400 break-words">
                                    {output ? `${output} ${toLabel}` : <span className="text-gray-500">—</span>}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {output ? `${value} ${fromUnit} = ${output} ${toUnit}` : ''}
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                {output ? `${output.length} chars` : '0 chars'}
                            </div>
                        </div>
                    </div>

                    {/* Conversion History */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Conversion History</label>
                            <button
                                onClick={handleClearHistory}
                                disabled={conversionHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    conversionHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Clear</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[var(--input-bg)] shadow-inner max-h-[400px] overflow-hidden">
                            {conversionHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {conversionHistory.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all">
                                            <div className="flex-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {item.from} → {item.to}
                                                </div>
                                                <div className="text-sm font-bold text-[var(--text-primary)]">
                                                    {item.value}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No conversions yet</p>
                                    <p className="text-xs">Start converting to see your history</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
