import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, Settings, Globe, Plus, X, Sun, Moon, MapPin, TrendingUp } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const ZONES = [
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

type ZoneId = typeof ZONES[number]

interface ZoneInfo {
    tz: ZoneId
    text: string
    offset: string
    isDaytime: boolean
    country: string
    city: string
}

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

function getTimezoneOffset(tz: string) {
    const now = new Date()
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }))
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
    return offset >= 0 ? `UTC+${offset}` : `UTC${offset}`
}

function isDaytime(tz: string) {
    const hour = new Date().toLocaleString("en-US", { timeZone: tz, hour: '2-digit', hour12: false })
    const h = parseInt(hour.split(':')[0])
    return h >= 6 && h < 18
}

function getZoneInfo(tz: ZoneId): { country: string, city: string } {
    const parts = tz.split('/')
    return {
        country: parts[0] || 'Unknown',
        city: parts[1]?.replace(/_/g, ' ') || 'Unknown'
    }
}

export function WorldClockTool() {
    const [selected, setSelected] = usePersistentState<ZoneId[]>('world_clock_zones', ['UTC', 'Asia/Kolkata', 'America/New_York'])
    const [now, setNow] = useState(() => new Date())
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [format24Hour, setFormat24Hour] = usePersistentState('world_clock_24hour', true)
    const [showOffsets, setShowOffsets] = usePersistentState('world_clock_offsets', true)
    const [showSeconds, setShowSeconds] = usePersistentState('world_clock_seconds', true)

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const rows = useMemo(() => {
        const uniq = Array.from(new Set(selected)).filter((z): z is ZoneId => (ZONES as readonly string[]).includes(z))
        return uniq.map((tz) => {
            const info = getZoneInfo(tz)
            return {
                tz,
                text: fmtTime(now, tz),
                offset: getTimezoneOffset(tz),
                isDaytime: isDaytime(tz),
                country: info.country,
                city: info.city
            } as ZoneInfo
        })
    }, [now, selected])

    const handleCopy = () => {
        const text = rows.map(r => `${r.tz}: ${r.text} (${r.offset})`).join('\n')
        copyToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleAddZone = (zone: ZoneId) => {
        if (!selected.includes(zone)) {
            setSelected([...selected, zone])
        }
    }

    const handleRemoveZone = (zone: ZoneId) => {
        setSelected(selected.filter(z => z !== zone))
    }

    const handleReset = () => {
        setSelected(['UTC', 'Asia/Kolkata', 'America/New_York'])
    }

    return (
        <ToolLayout
            title="World Clock"
            description="Track current time across multiple time zones with advanced features."
            icon={Globe}
            onReset={handleReset}
            onCopy={rows.length > 0 ? handleCopy : undefined}
            copyDisabled={rows.length === 0}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced World Clock</h2>
                            <p className="text-sm text-[var(--text-muted)]">Track time across multiple zones with real-time updates</p>
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
                            disabled={rows.length === 0}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                rows.length > 0 ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy All'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Time Zones</label>
                        <div className="space-y-3">
                            <select
                                multiple
                                value={selected}
                                onChange={(e) => {
                                    const vals = Array.from(e.target.selectedOptions).map(o => o.value as ZoneId)
                                    setSelected(vals)
                                }}
                                className="h-40 w-full"
                            >
                                {ZONES.map((z) => (
                                    <option key={z} value={z}>{z}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Hold Ctrl/Cmd to select multiple</p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Quick Add</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'] as ZoneId[]).map((zone) => (
                                <button
                                    key={zone}
                                    onClick={() => handleAddZone(zone)}
                                    disabled={selected.includes(zone)}
                                    className={cn(
                                        "px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                                        selected.includes(zone) 
                                            ? "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed" 
                                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>{zone.split('/')[1]?.replace(/_/g, ' ') || zone}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Display Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="showSeconds"
                                    checked={showSeconds}
                                    onChange={(e) => setShowSeconds(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="showSeconds" className="text-sm text-[var(--text-primary)]">Show seconds</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Clock Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rows.map((row) => (
                        <div key={row.tz} className="glass rounded-2xl border p-5 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-tertiary)] transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        {row.isDaytime ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
                                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-brand">{row.city}</div>
                                        <div className="text-xs text-[var(--text-muted)]">{row.country}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveZone(row.tz)}
                                    className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all"
                                    title="Remove timezone"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="text-lg font-black text-[var(--text-primary)] font-mono mb-2">{row.text}</div>
                            {showOffsets && (
                                <div className="text-xs text-[var(--text-muted)] font-mono">{row.offset}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {rows.length === 0 && (
                    <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No time zones selected</p>
                        <p className="text-xs">Select time zones above to track current time</p>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
