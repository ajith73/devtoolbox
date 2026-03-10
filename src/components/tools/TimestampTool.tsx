import { useState, useEffect, useMemo } from 'react'
import {
    Clock, RefreshCcw, Copy, History,
    Settings2, Play, Zap, Calendar,
    ArrowRightLeft, Trash2, Check,
    Clock3
} from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { format, isValid } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

type TimestampFormat = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds'

interface HistoryItem {
    id: string
    timestamp: string
    date: string
    format: TimestampFormat
    label?: string
}

export function TimestampTool() {
    // Persistent States
    const [input, setInput] = usePersistentState('timestamp_input', '')
    const [formatType, setFormatType] = usePersistentState<TimestampFormat>('timestamp_format', 'seconds')
    const [history, setHistory] = usePersistentState<HistoryItem[]>('timestamp_history_v2', [])
    const [autoUpdate, setAutoUpdate] = usePersistentState('timestamp_auto_update', true)

    // Local States
    const [now, setNow] = useState(new Date())
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedTimezone, setSelectedTimezone] = usePersistentState('timestamp_tz', Intl.DateTimeFormat().resolvedOptions().timeZone)

    const TIMEZONES = [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'Pacific/Auckland'
    ]

    // Sync Logic
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (autoUpdate) {
            interval = setInterval(() => {
                setNow(new Date())
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [autoUpdate])

    // Core Logic
    const currentTimestamp = useMemo(() => {
        const ms = now.getTime()
        switch (formatType) {
            case 'seconds': return Math.floor(ms / 1000)
            case 'milliseconds': return ms
            case 'microseconds': return ms * 1000
            case 'nanoseconds': return ms * 1000000
            default: return Math.floor(ms / 1000)
        }
    }, [now, formatType])

    const decodedDate = useMemo(() => {
        if (!input.trim()) return null
        const num = parseInt(input.replace(/,/g, ''))
        if (isNaN(num)) return null

        let ms = num
        switch (formatType) {
            case 'seconds': ms = num * 1000; break
            case 'milliseconds': ms = num; break
            case 'microseconds': ms = Math.floor(num / 1000); break
            case 'nanoseconds': ms = Math.floor(num / 1000000); break
        }

        const date = new Date(ms)
        return isValid(date) ? date : null
    }, [input, formatType])

    // Actions
    const handleConvert = () => {
        if (decodedDate) {
            const newItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: input,
                date: decodedDate.toISOString(),
                format: formatType
            }
            setHistory([newItem, ...history].slice(0, 15))
        }
    }

    const clearHistory = () => setHistory([])

    const handleCopy = (text: string, id: string) => {
        copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Pro Format String (Escaped literals to prevent RangeError in date-fns v3+)
    const displayFormat = "EEEE', 'MMMM do', 'yyyy' | 'HH:mm:ss' 'O"

    return (
        <ToolLayout
            title="Timestamp Converter"
            description="Enterprise-grade temporal synchronization engine with sub-nanosecond precision and historical delta tracking."
            icon={Clock}
            onReset={() => {
                setInput('')
                setHistory([])
            }}
        >
            <div className="space-y-8 text-[var(--text-primary)]">

                {/* Real-time Telemetry Card */}
                <div className="p-10 glass rounded-[3.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand/10 transition-all duration-1000" />

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative">
                        <div className="space-y-6 text-center lg:text-left flex-1">
                            <div className="flex items-center justify-center lg:justify-start space-x-4">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
                                </span>
                                <span className="text-[10px] font-black text-brand uppercase tracking-[0.5em]">Quantum Temporal Stream</span>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] font-mono tracking-tighter drop-shadow-sm">
                                    {currentTimestamp.toLocaleString().replace(/,/g, ' ')}
                                </h2>
                                <div className="flex items-center justify-center lg:justify-start space-x-3 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-60">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatInTimeZone(now, selectedTimezone, displayFormat)}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-2">
                                {TIMEZONES.map(tz => (
                                    <button
                                        key={tz}
                                        onClick={() => setSelectedTimezone(tz)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                                            selectedTimezone === tz
                                                ? "bg-brand/20 border-brand text-brand"
                                                : "glass border-transparent text-[var(--text-muted)] hover:border-[var(--border-primary)]"
                                        )}
                                    >
                                        {tz.split('/').pop()?.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setAutoUpdate(!autoUpdate)}
                                className={cn(
                                    "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-3 border",
                                    autoUpdate
                                        ? "bg-brand/10 text-brand border-brand/20 shadow-lg shadow-brand/5"
                                        : "glass text-[var(--text-muted)] border-[var(--border-primary)]"
                                )}
                            >
                                {autoUpdate ? <RefreshCcw className="w-4 h-4 animate-spin-slow" /> : <Play className="w-4 h-4" />}
                                <span>{autoUpdate ? 'Sync Active' : 'Stream Paused'}</span>
                            </button>

                            <button
                                onClick={() => handleCopy(currentTimestamp.toString(), 'current')}
                                className="px-8 py-4 brand-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand/20 flex items-center space-x-3"
                            >
                                {copiedId === 'current' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span>{copiedId === 'current' ? 'Copied' : 'Extract Unit'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Configuration & Logic Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Resolution Prefset */}
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Settings2 className="w-5 h-5 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Precision Vectors</h3>
                            </div>
                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Select Resolution</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {(['seconds', 'milliseconds', 'microseconds', 'nanoseconds'] as TimestampFormat[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormatType(f)}
                                    className={cn(
                                        "p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col items-center justify-center space-y-2",
                                        formatType === f
                                            ? "bg-brand text-white border-transparent shadow-xl scale-[1.02]"
                                            : "glass text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                                    )}
                                >
                                    <Clock3 className="w-4 h-4 opacity-40" />
                                    <span>{f}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Decode Engine */}
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Zap className="w-5 h-5 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Decoding Logic</h3>
                            </div>
                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Input Stream</span>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Paste epoch vector..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border-[var(--border-primary)] rounded-[2rem] px-8 py-6 text-xl font-mono text-brand focus:ring-[12px] focus:ring-brand/5 transition-all outline-none font-black shadow-inner"
                                />
                                <button
                                    onClick={handleConvert}
                                    className="absolute right-3 top-3 bottom-3 px-6 brand-gradient text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className={cn(
                                "p-6 rounded-[2.5rem] border transition-all duration-500 min-h-[140px] flex flex-col justify-center",
                                decodedDate ? "bg-brand/5 border-brand/20" : "bg-black/5 border-dashed border-[var(--border-primary)]"
                            )}>
                                {decodedDate ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-brand">
                                            <span>Decoded Object</span>
                                            <button
                                                onClick={() => handleCopy(decodedDate.toISOString(), 'decoded')}
                                                className="p-2 glass rounded-lg hover:bg-brand/10 transition-all"
                                            >
                                                {copiedId === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-black text-[var(--text-primary)] font-mono tracking-tight leading-none">
                                                {format(decodedDate, "yyyy-MM-dd HH:mm:ss")}
                                            </p>
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] italic opacity-60">
                                                {format(decodedDate, displayFormat)}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center opacity-20 space-y-2">
                                        <Clock className="w-10 h-10" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Temporal Unit</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evolution History Matrix */}
                <div className="p-10 glass rounded-[3.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-4">
                            <History className="w-6 h-6 text-brand" />
                            <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.6em]">Temporal Drift Ledger</h3>
                        </div>
                        <button
                            onClick={clearHistory}
                            className="p-3 glass rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
                            title="Purge Ledger"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-[2rem]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Input Stream</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Resolved ISO-8601</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vector Type</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]/50">
                                {history.length > 0 ? history.map(item => (
                                    <tr key={item.id} className="group hover:bg-brand/5 transition-all duration-300">
                                        <td className="px-8 py-6 font-mono text-sm text-[var(--text-primary)] font-bold">{item.timestamp}</td>
                                        <td className="px-8 py-6 font-mono text-sm text-brand font-black">{item.date}</td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest">
                                                {item.format}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleCopy(item.timestamp, item.id + 't')}
                                                    className="p-2.5 glass rounded-xl text-[var(--text-muted)] hover:text-brand transition-all"
                                                    title="Copy Timestamp"
                                                >
                                                    {copiedId === item.id + 't' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(item.date, item.id + 'd')}
                                                    className="p-2.5 glass rounded-xl text-[var(--text-muted)] hover:text-brand transition-all"
                                                    title="Copy ISO"
                                                >
                                                    {copiedId === item.id + 'd' ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-20 space-y-4">
                                                <History className="w-16 h-16" />
                                                <p className="text-[12px] font-black uppercase tracking-[1em]">Ledger Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
