import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Clock, Calendar, Globe, MapPin } from 'lucide-react'
import { format, fromUnixTime, getUnixTime } from 'date-fns'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const MAJOR_ZONES = [
    { name: 'London', tz: 'Europe/London' },
    { name: 'New York', tz: 'America/New_York' },
    { name: 'Tokyo', tz: 'Asia/Tokyo' },
    { name: 'Dubai', tz: 'Asia/Dubai' },
    { name: 'Sydney', tz: 'Australia/Sydney' },
    { name: 'Mumbai', tz: 'Asia/Kolkata' },
    { name: 'Paris', tz: 'Europe/Paris' }
]

export function TimestampTool() {
    const [timestamp, setTimestamp] = usePersistentState<string>('timestamp_input', Math.floor(Date.now() / 1000).toString())
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    useEffect(() => {
        updateFromTimestamp(timestamp)
    }, [])

    const updateFromTimestamp = (val: string) => {
        const num = parseInt(val)
        if (!isNaN(num)) {
            try {
                const d = fromUnixTime(num)
                setDate(format(d, "yyyy-MM-dd'T'HH:mm"))
                setCurrentDate(d)
            } catch (e) { }
        }
    }

    const updateFromDate = (val: string) => {
        try {
            const d = new Date(val)
            if (!isNaN(d.getTime())) {
                setTimestamp(getUnixTime(d).toString())
                setCurrentDate(d)
            }
        } catch (e) { }
    }

    const formatWithTZ = (d: Date, tz: string) => {
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: tz
        }).format(d)
    }

    return (
        <ToolLayout
            title="Timestamp Converter"
            description="Convert Unix epochs to human-readable dates across all timezones."
            icon={Globe}
            onReset={() => {
                const now = Math.floor(Date.now() / 1000).toString()
                setTimestamp(now)
                updateFromTimestamp(now)
            }}
            onCopy={() => copyToClipboard(currentDate.toString())}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-[var(--text-primary)]">
                <div className="space-y-6">
                    <div className="p-8 glass rounded-[2rem] space-y-4 border-white/5">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-2 pl-2">
                            <Clock className="w-5 h-5 text-brand" />
                            <span>Unix Temporal Index</span>
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full font-mono text-3xl md:text-4xl bg-transparent border-none p-0 focus:ring-0 text-brand font-black"
                                value={timestamp}
                                onChange={(e) => {
                                    setTimestamp(e.target.value)
                                    updateFromTimestamp(e.target.value)
                                }}
                            />
                            <div className="mt-6 pt-6 border-t border-[var(--border-primary)] grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        const now = Math.floor(Date.now() / 1000).toString()
                                        setTimestamp(now)
                                        updateFromTimestamp(now)
                                    }}
                                    className="px-6 py-2.5 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                >
                                    Sync Live Time
                                </button>
                                <div className="flex items-center space-x-2 text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                                    <MapPin className="w-4 h-4 text-brand" />
                                    <span>Locale Sensing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 glass rounded-[2rem] space-y-4 border-white/5">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-2 pl-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <span>Temporal Calendar Mapping</span>
                        </h3>
                        <input
                            type="datetime-local"
                            className="w-full font-mono text-xl bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 focus:ring-2 focus:ring-brand/20 text-[var(--text-primary)] font-black uppercase tracking-widest"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value)
                                updateFromDate(e.target.value)
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-10 glass rounded-[3rem] space-y-10 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 relative overflow-hidden shadow-2xl">
                        <Globe className="absolute -right-8 -top-8 w-48 h-48 text-brand/5 animate-[spin_60s_linear_infinite]" />

                        <div className="relative space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] pl-1">Primary Node Time</p>
                                <p className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] leading-tight">{currentDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' })}</p>
                            </div>

                            <div className="pt-8 border-t border-[var(--border-primary)] space-y-6">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-1">Global Constellation Sync</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {MAJOR_ZONES.map((zone) => (
                                        <div key={zone.tz} className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/50 rounded-2xl group hover:brand-gradient transition-all border border-[var(--border-primary)] hover:border-transparent shadow-sm">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-black text-brand group-hover:bg-white/20 group-hover:text-white transition-colors">
                                                    {zone.name.substring(0, 1)}
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-secondary)] group-hover:text-white uppercase tracking-widest">{zone.name}</span>
                                            </div>
                                            <span className="font-mono text-xs text-[var(--text-muted)] group-hover:text-white/90 transition-colors font-black">
                                                {formatWithTZ(currentDate, zone.tz)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
