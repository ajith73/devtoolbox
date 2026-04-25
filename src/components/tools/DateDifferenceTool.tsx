import { useMemo, useState } from 'react'
import { CalendarClock, Copy, Check, Settings, Clock, Shield, Database, Calendar } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function safeDate(input: string) {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
}

export function DateDifferenceTool() {
    const [from, setFrom] = usePersistentState('date_diff_from', '')
    const [to, setTo] = usePersistentState('date_diff_to', '')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [dateHistory, setDateHistory] = usePersistentState('date_diff_history', [] as Array<{from: string, to: string, result: string, timestamp: string}>)
    const [includeWeeks, setIncludeWeeks] = usePersistentState('date_diff_include_weeks', true)
    const [includeMonths, setIncludeMonths] = usePersistentState('date_diff_include_months', true)
    const [includeYears, setIncludeYears] = usePersistentState('date_diff_include_years', true)
    const [outputFormat, setOutputFormat] = usePersistentState('date_diff_format', 'detailed')

    const computed = useMemo(() => {
        const d1 = from.trim() ? safeDate(from) : null
        const d2 = to.trim() ? safeDate(to) : null
        if (!d1 || !d2) return { error: null as string | null, output: '', details: null as any }

        const ms = Math.abs(d2.getTime() - d1.getTime())
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const weeks = Math.floor(days / 7)
        const months = Math.floor(days / 30.44) // Average month length
        const years = Math.floor(days / 365.25) // Account for leap years

        const details = {
            milliseconds: ms,
            seconds,
            minutes,
            hours,
            days,
            weeks,
            months,
            years
        }

        let output = ''
        if (outputFormat === 'detailed') {
            const parts = []
            if (includeYears && years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
            if (includeMonths && months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
            if (includeWeeks && weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`)
            parts.push(`${days} day${days !== 1 ? 's' : ''}`)
            parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
            parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
            parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`)
            output = parts.join(', ')
        } else {
            output = [
                `Milliseconds: ${ms}`,
                `Seconds: ${seconds}`,
                `Minutes: ${minutes}`,
                `Hours: ${hours}`,
                `Days: ${days}`,
                includeWeeks && `Weeks: ${weeks}`,
                includeMonths && `Months: ${months}`,
                includeYears && `Years: ${years}`
            ].filter(Boolean).join('\n')
        }

        return { error: null as string | null, output, details }
    }, [from, to, includeWeeks, includeMonths, includeYears, outputFormat])

    const handleCopy = () => {
        if (computed.output) {
            copyToClipboard(computed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (fromValue: string, toValue: string, resultValue: string) => {
        const newEntry = {
            from: fromValue,
            to: toValue,
            result: resultValue,
            timestamp: new Date().toISOString()
        }
        setDateHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setDateHistory([])
    }

    const handleHistoryClick = (entry: {from: string, to: string}) => {
        setFrom(entry.from)
        setTo(entry.to)
    }

    // Add to history when computation succeeds
    useMemo(() => {
        if (computed.output && computed.error === null && from && to) {
            addToHistory(from, to, computed.output)
        }
    }, [computed.output, computed.error, from, to])

    const getFormattedDate = (dateString: string) => {
        if (!dateString) return 'Not set'
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    return (
        <ToolLayout
            title="Date Difference"
            description="Calculate the duration between two dates/times with advanced features."
            icon={Calendar}
            onReset={() => { setFrom(''); setTo('') }}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Date Difference</h2>
                            <p className="text-sm text-[var(--text-muted)]">Calculate duration between dates/times</p>
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
                            onClick={handleCopy}
                            disabled={!computed.output}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                computed.output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Date Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-2">
                            <CalendarClock className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">From Date</label>
                        </div>
                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <input
                                type="datetime-local"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                            />
                            <div className="mt-3 text-xs text-[var(--text-muted)]">
                                {getFormattedDate(from)}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">To Date</label>
                        </div>
                        <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                            <input
                                type="datetime-local"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                            />
                            <div className="mt-3 text-xs text-[var(--text-muted)]">
                                {getFormattedDate(to)}
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
                                    type="radio"
                                    id="format_detailed"
                                    name="format"
                                    checked={outputFormat === 'detailed'}
                                    onChange={() => setOutputFormat('detailed')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_detailed" className="text-sm text-[var(--text-primary)]">Detailed Format</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="format_list"
                                    name="format"
                                    checked={outputFormat === 'list'}
                                    onChange={() => setOutputFormat('list')}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="format_list" className="text-sm text-[var(--text-primary)]">List Format</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="include_years"
                                    checked={includeYears}
                                    onChange={(e) => setIncludeYears(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="include_years" className="text-sm text-[var(--text-primary)]">Include Years</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="include_months"
                                    checked={includeMonths}
                                    onChange={(e) => setIncludeMonths(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="include_months" className="text-sm text-[var(--text-primary)]">Include Months</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="include_weeks"
                                    checked={includeWeeks}
                                    onChange={(e) => setIncludeWeeks(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="include_weeks" className="text-sm text-[var(--text-primary)]">Include Weeks</label>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Calculation Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Calculates precise differences including years (365.25 days), months (30.44 days), weeks, days, hours, minutes, seconds, and milliseconds.
                            </p>
                        </div>
                    </div>
                )}

                {/* Results and History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Results</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {computed.output ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {computed.output}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {computed.output.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <CalendarClock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No calculation yet</p>
                                    <p className="text-xs">Select two dates to calculate difference</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                disabled={dateHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    dateHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[600px]">
                            {dateHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {dateHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {outputFormat === 'detailed' ? 'Detailed' : 'List'}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                From: {getFormattedDate(entry.from)}
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate mt-1">
                                                To: {getFormattedDate(entry.to)}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                                {entry.result.substring(0, 60)}{entry.result.length > 60 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your date difference history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
