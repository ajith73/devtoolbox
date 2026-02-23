import { useState, useEffect } from 'react'
import { Clock, RefreshCcw, Copy, History, Settings, Play } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { format, isValid } from 'date-fns'

type TimestampFormat = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds'

interface HistoryItem {
    id: string
    timestamp: number
    date: string
    format: TimestampFormat
}

export function TimestampTool() {
    const [input, setInput] = usePersistentState('timestamp_input', '')
    const [formatType, setFormatType] = usePersistentState<TimestampFormat>('timestamp_format', 'seconds')
    const [history, setHistory] = usePersistentState<HistoryItem[]>('timestamp_history', [])
    const [autoUpdate, setAutoUpdate] = useState(true)
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (autoUpdate) {
            interval = setInterval(() => {
                setNow(new Date())
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [autoUpdate])

    const getTimestamp = (date: Date, type: TimestampFormat) => {
        const ms = date.getTime()
        switch (type) {
            case 'seconds': return Math.floor(ms / 1000)
            case 'milliseconds': return ms
            case 'microseconds': return ms * 1000
            case 'nanoseconds': return ms * 1000000
            default: return ms
        }
    }

    const parseTimestamp = (val: string, type: TimestampFormat): Date | null => {
        const num = parseInt(val)
        if (isNaN(num)) return null

        let ms = num
        switch (type) {
            case 'seconds': ms = num * 1000; break
            case 'milliseconds': ms = num; break
            case 'microseconds': ms = Math.floor(num / 1000); break
            case 'nanoseconds': ms = Math.floor(num / 1000000); break
        }

        const date = new Date(ms)
        return isValid(date) ? date : null
    }

    const handleConvert = () => {
        const date = parseTimestamp(input, formatType)
        if (date) {
            const newItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: parseInt(input),
                date: date.toISOString(),
                format: formatType
            }
            setHistory([newItem, ...history].slice(0, 10))
        }
    }

    const currentTimestamp = getTimestamp(now, formatType)

    return (
        <ToolLayout
            title="Timestamp Converter"
            description="Professional Unix timestamp transformer with sub-second precision and history tracking."
            icon={Clock}
            onReset={() => {
                setInput('')
                setHistory([])
            }}
            onCopy={() => copyToClipboard(currentTimestamp.toString())}
        >
            <div className="space-y-6">
                {/* Real-time Clock Section */}
                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand/10 transition-colors" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start space-x-3">
                                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Live Temporal Sync</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] font-mono tracking-tighter">
                                {currentTimestamp}
                            </h2>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
                                {format(now, 'EEEE, MMMM do, yyyy | HH:mm:ss v')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setAutoUpdate(!autoUpdate)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border",
                                    autoUpdate
                                        ? "bg-brand/10 text-brand border-brand/20"
                                        : "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-primary)]"
                                )}
                            >
                                {autoUpdate ? <RefreshCcw className="w-4 h-4 animate-spin-slow" /> : <Play className="w-4 h-4" />}
                                <span>{autoUpdate ? 'Syncing' : 'Paused'}</span>
                            </button>
                            <button
                                onClick={() => copyToClipboard(currentTimestamp.toString())}
                                className="px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20"
                            >
                                <Copy className="w-4 h-4 inline-block mr-2" />
                                Copy Current
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conversion Logic Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                        <div className="flex items-center space-x-3">
                            <Settings className="w-4 h-4 text-brand" />
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Configuration</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-2">Resolution</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['seconds', 'milliseconds', 'microseconds', 'nanoseconds'] as TimestampFormat[]).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFormatType(f)}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                                formatType === f
                                                    ? "bg-brand text-white border-transparent"
                                                    : "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                                            )}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                        <div className="flex items-center space-x-3">
                            <RefreshCcw className="w-4 h-4 text-brand" />
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Bidirectional Logic</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter timestamp to decode..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-mono focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                                />
                                <button
                                    onClick={handleConvert}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-brand text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            </div>

                            {input && (
                                <div className="p-4 bg-brand/5 rounded-2xl border border-brand/10 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand">
                                        <span>Full ISO-8601</span>
                                        <Copy
                                            className="w-3 h-3 cursor-pointer hover:scale-110 transition-transform"
                                            onClick={() => {
                                                const d = parseTimestamp(input, formatType)
                                                if (d) copyToClipboard(d.toISOString())
                                            }}
                                        />
                                    </div>
                                    <p className="font-mono text-xs text-[var(--text-primary)]">
                                        {parseTimestamp(input, formatType)?.toISOString() || 'Invalid Temporal Format'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Matrix */}
                {history.length > 0 && (
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <History className="w-4 h-4 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Temporal History</h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[var(--border-primary)]">
                                        <th className="pb-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Input Vector</th>
                                        <th className="pb-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Output ISO</th>
                                        <th className="pb-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Format</th>
                                        <th className="pb-4 text-right pr-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-primary)]/50">
                                    {history.map(item => (
                                        <tr key={item.id} className="group hover:bg-brand/5 transition-colors">
                                            <td className="py-4 font-mono text-xs text-[var(--text-primary)]">{item.timestamp}</td>
                                            <td className="py-4 font-mono text-xs text-brand">{item.date}</td>
                                            <td className="py-4">
                                                <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[8px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
                                                    {item.format}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => copyToClipboard(item.timestamp.toString())}
                                                    className="p-2 hover:bg-brand hover:text-white rounded-lg transition-all text-[var(--text-muted)]"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
