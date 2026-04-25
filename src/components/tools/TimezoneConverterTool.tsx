import { useMemo, useState } from 'react'
import { Copy, Check, Settings, Globe, Calendar, RefreshCw, ArrowUpDown, TrendingUp, Info } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const TIMEZONES = [
    'UTC',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Europe/Moscow',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Sao_Paulo',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
] as const

type TimezoneId = typeof TIMEZONES[number]

function formatInZoneWithOffset(date: Date, timeZone: string) {
    const fmt = new Intl.DateTimeFormat(undefined, {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
    })
    return fmt.format(date)
}

function getTimezoneOffset(timeZone: string) {
    const now = new Date()
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone }))
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
    return offset >= 0 ? `UTC+${offset}` : `UTC${offset}`
}

export function TimezoneConverterTool() {
    const [input, setInput] = usePersistentState<string>('tz_input', new Date().toISOString())
    const [fromTz, setFromTz] = usePersistentState<TimezoneId>('tz_from', 'UTC')
    const [toTz, setToTz] = usePersistentState<TimezoneId>('tz_to', 'Asia/Kolkata')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showMultiple, setShowMultiple] = useState(false)
    const [copied, setCopied] = useState(false)
    const [format24Hour, setFormat24Hour] = usePersistentState('tz_format_24hour', true)
    const [showOffsets, setShowOffsets] = usePersistentState('tz_show_offsets', false)
    const [conversionHistory, setConversionHistory] = usePersistentState<Array<{from: string, to: string, input: string, timestamp: string}>>('tz_history', [])

    const computed = useMemo(() => {
        const raw = input.trim()
        if (!raw) return { error: null as string | null, date: null as Date | null }
        
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return { error: 'Invalid date/time', date: null as Date | null }
        
        // Add to history
        if (fromTz !== toTz) {
            const newConversion = {
                from: fromTz,
                to: toTz,
                input: raw,
                timestamp: new Date().toISOString()
            }
            setConversionHistory(prev => [newConversion, ...prev.slice(0, 9)])
        }
        
        return { error: null as string | null, date: d }
    }, [input, fromTz, toTz])

    const conversions = useMemo(() => {
        if (!computed.date) return []
        
        const results = []
        if (showMultiple) {
            // Show multiple conversions
            const popularTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']
            popularTimezones.forEach(tz => {
                if (tz !== fromTz) {
                    const formatted = formatInZoneWithOffset(computed.date!, tz)
                    results.push({ timezone: tz, formatted, offset: getTimezoneOffset(tz), timestamp: new Date().toISOString() })
                }
            })
        } else {
            // Single conversion with additional details
            const fromFormatted = formatInZoneWithOffset(computed.date!, fromTz)
            const toFormatted = formatInZoneWithOffset(computed.date!, toTz)
            results.push({ timezone: fromTz, formatted: fromFormatted, offset: getTimezoneOffset(fromTz), timestamp: new Date().toISOString() })
            results.push({ timezone: toTz, formatted: toFormatted, offset: getTimezoneOffset(toTz), timestamp: new Date().toISOString() })
        }
        
        return results
    }, [computed.date, fromTz, toTz, showMultiple])

    const handleCopy = () => {
        const text = conversions.map(c => `${c.timezone}: ${c.formatted}`).join('\n')
        copyToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSwapTimezones = () => {
        setFromTz(toTz)
        setToTz(fromTz)
    }

    const handleClearHistory = () => {
        setConversionHistory([])
    }

    const handleCurrentTime = () => {
        setInput(new Date().toISOString())
    }

    return (
        <ToolLayout
            title="Timezone Converter"
            description="View the same moment in different time zones with advanced features."
            icon={Globe}
            onReset={() => setInput(new Date().toISOString())}
            onCopy={conversions.length > 0 ? handleCopy : undefined}
            copyDisabled={conversions.length === 0}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Timezone Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">Compare time zones with precision and history tracking</p>
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
                            onClick={() => setShowMultiple(!showMultiple)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showMultiple ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Globe className="w-4 h-4" />
                            <span>{showMultiple ? 'Single' : 'Multiple'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="font-bold">Date/Time Error</span>
                        </div>
                        {computed.error}
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Date/Time Input</label>
                            <input
                                type="text"
                                placeholder="2026-02-17T09:30:00Z"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                            />
                            <button
                                onClick={handleCurrentTime}
                                className="mt-3 px-3 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            >
                                <Calendar className="w-3 h-3" />
                                <span>Current Time</span>
                            </button>
                        </div>

                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">From Timezone</label>
                            <select value={fromTz} onChange={(e) => setFromTz(e.target.value as TimezoneId)}>
                                {TIMEZONES.map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>

                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">To Timezone</label>
                            <div className="flex items-center space-x-2">
                                <select value={toTz} onChange={(e) => setToTz(e.target.value as TimezoneId)}>
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleSwapTimezones}
                                    className="p-2 glass rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                    title="Swap timezones"
                                >
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="format24hour"
                                    checked={format24Hour}
                                    onChange={(e) => setFormat24Hour(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format24hour" className="text-sm text-[var(--text-primary)]">24-hour format</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="showOffsets"
                                    checked={showOffsets}
                                    onChange={(e) => setShowOffsets(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="showOffsets" className="text-sm text-[var(--text-primary)]">Show UTC offsets</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Conversions</label>
                            <button
                                onClick={handleClearHistory}
                                disabled={conversionHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    conversionHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Clear History</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {conversions.length > 0 ? (
                                <div className="p-4 space-y-3">
                                    {conversions.map((conversion, index) => (
                                        <div key={index} className="p-4 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {conversion.timezone}
                                                    {showOffsets && (
                                                        <span className="ml-2 text-[var(--text-primary)]">
                                                            ({conversion.offset})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(conversion.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-lg font-bold text-[var(--text-primary)] break-words">
                                                {conversion.formatted}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No conversions yet</p>
                                    <p className="text-xs">Select timezones and enter a date/time to see conversions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Actions</label>
                            <button
                                onClick={handleCopy}
                                disabled={conversions.length === 0}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    conversions.length > 0 ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied!' : 'Copy All'}</span>
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <div className="p-6 text-blue-300 font-mono text-xs overflow-auto custom-scrollbar">
                                <div className="text-xs text-gray-400 mb-2">
                                    {computed.date ? `Original: ${computed.date.toISOString()}` : 'No date/time entered'}
                                </div>
                                {conversions.length > 0 && (
                                    <div className="text-xs text-gray-400">
                                        {conversions.length} conversion{conversions.length === 1 ? '' : 's'} available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
