import { useMemo, useState, useRef, useEffect } from 'react'
import { Clock, Upload, Copy, CheckCircle, AlertCircle, FileText, BookOpen, Calendar, Globe, Play } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced timestamp parsing result type
type TimestampResult = {
    input: string
    isValid: boolean
    date: Date | null
    error: string | null
    iso: {
        utc: string
        local: string
        dateOnly: string
        timeOnly: string
        withOffset: string
    }
    epoch: {
        milliseconds: number
        seconds: number
        nanoseconds: number
        unix: string
    }
    components: {
        year: number
        month: number
        day: number
        hour: number
        minute: number
        second: number
        millisecond: number
        timezone: {
            offset: string
            name: string
            abbreviation: string
        }
    }
    formats: {
        locale: string
        utc: string
        iso: string
        rfc: string
        custom: {
            short: string
            medium: string
            long: string
            full: string
        }
    }
    relative: {
        fromNow: string
        toNow: string
        timeAgo: string
        inTime: string
    }
    timezone: {
        local: {
            name: string
            offset: string
            formatted: string
        }
        utc: {
            name: string
            offset: string
            formatted: string
        }
    }
}

// Enhanced ISO 8601 parsing function
function parseIso8601(input: string): TimestampResult {
    const raw = input.trim()
    if (!raw) {
        return {
            input: raw,
            isValid: false,
            date: null,
            error: 'Empty input',
            iso: { utc: '', local: '', dateOnly: '', timeOnly: '', withOffset: '' },
            epoch: { milliseconds: 0, seconds: 0, nanoseconds: 0, unix: '' },
            components: { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0, millisecond: 0, timezone: { offset: '', name: '', abbreviation: '' } },
            formats: { locale: '', utc: '', iso: '', rfc: '', custom: { short: '', medium: '', long: '', full: '' } },
            relative: { fromNow: '', toNow: '', timeAgo: '', inTime: '' },
            timezone: { local: { name: '', offset: '', formatted: '' }, utc: { name: '', offset: '', formatted: '' } }
        }
    }

    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) {
        return {
            input: raw,
            isValid: false,
            date: null,
            error: 'Invalid date/time format',
            iso: { utc: '', local: '', dateOnly: '', timeOnly: '', withOffset: '' },
            epoch: { milliseconds: 0, seconds: 0, nanoseconds: 0, unix: '' },
            components: { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0, millisecond: 0, timezone: { offset: '', name: '', abbreviation: '' } },
            formats: { locale: '', utc: '', iso: '', rfc: '', custom: { short: '', medium: '', long: '', full: '' } },
            relative: { fromNow: '', toNow: '', timeAgo: '', inTime: '' },
            timezone: { local: { name: '', offset: '', formatted: '' }, utc: { name: '', offset: '', formatted: '' } }
        }
    }

    // Get timezone information
    const getTimezoneInfo = () => {
        const offset = d.getTimezoneOffset()
        const offsetHours = Math.floor(Math.abs(offset) / 60)
        const offsetMinutes = Math.abs(offset) % 60
        const offsetSign = offset <= 0 ? '+' : '-'
        const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
        
        // Try to get timezone name
        let timezoneName = 'Unknown'
        let timezoneAbbrev = 'Unknown'
        let ianaTimezone = 'UTC'
        
        try {
            ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZoneName: 'long'
            })
            const parts = formatter.formatToParts(d)
            const timeZonePart = parts.find(part => part.type === 'timeZoneName')
            if (timeZonePart) {
                timezoneName = timeZonePart.value
            }
            
            const shortFormatter = new Intl.DateTimeFormat('en-US', {
                timeZoneName: 'short'
            })
            const shortParts = shortFormatter.formatToParts(d)
            const shortTimeZonePart = shortParts.find(part => part.type === 'timeZoneName')
            if (shortTimeZonePart) {
                timezoneAbbrev = shortTimeZonePart.value
            }
        } catch (e) {
            // Fallback to basic timezone detection
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            timezoneName = timezone
            timezoneAbbrev = timezone
            ianaTimezone = timezone
        }
        
        return {
            offset: offsetString,
            name: timezoneName,
            abbreviation: timezoneAbbrev,
            ianaName: ianaTimezone
        }
    }

    const timezoneInfo = getTimezoneInfo()
    const epochMs = d.getTime()
    const epochSeconds = Math.floor(epochMs / 1000)
    const epochNanos = epochMs * 1000000
    
    // Get date components
    const components = {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
        millisecond: d.getMilliseconds(),
        timezone: timezoneInfo
    }
    
    // Get ISO formats
    const iso = {
        utc: d.toISOString(),
        local: d.toISOString().replace('Z', timezoneInfo.offset),
        dateOnly: d.toISOString().split('T')[0],
        timeOnly: d.toISOString().split('T')[1].replace('Z', timezoneInfo.offset).split('.')[0],
        withOffset: d.toISOString().replace('Z', timezoneInfo.offset)
    }
    
    // Get custom formats
    const custom = {
        short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        medium: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        long: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }),
        full: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'long' })
    }
    
    // Get RFC format
    const rfc = d.toUTCString()
    
    // Get relative time
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    
    const getRelativeTime = (ms: number) => {
        const abs = Math.abs(ms)
        const seconds = Math.floor(abs / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const months = Math.floor(days / 30)
        const years = Math.floor(days / 365)
        
        if (ms < 0) {
            if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
            if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
            return `${seconds} second${seconds > 1 ? 's' : ''} ago`
        } else {
            if (years > 0) return `in ${years} year${years > 1 ? 's' : ''}`
            if (months > 0) return `in ${months} month${months > 1 ? 's' : ''}`
            if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`
            if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`
            if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`
            return `in ${seconds} second${seconds > 1 ? 's' : ''}`
        }
    }
    
    return {
        input: raw,
        isValid: true,
        date: d,
        error: null,
        iso,
        epoch: {
            milliseconds: epochMs,
            seconds: epochSeconds,
            nanoseconds: epochNanos,
            unix: epochMs.toString()
        },
        components,
        formats: {
            locale: d.toLocaleString(),
            utc: d.toUTCString(),
            iso: d.toISOString(),
            rfc,
            custom
        },
        relative: {
            fromNow: getRelativeTime(diffMs),
            toNow: getRelativeTime(-diffMs),
            timeAgo: diffMs < 0 ? 'in the future' : getRelativeTime(diffMs),
            inTime: diffMs > 0 ? 'in the past' : getRelativeTime(-diffMs)
        },
        timezone: {
            local: {
                name: timezoneInfo.name,
                offset: timezoneInfo.offset,
                formatted: d.toLocaleString('en-US', { timeZone: timezoneInfo.ianaName || timezoneInfo.name })
            },
            utc: {
                name: 'UTC',
                offset: '+00:00',
                formatted: d.toLocaleString('en-US', { timeZone: 'UTC' })
            }
        }
    }
}

// Sample timestamps
function getSampleTimestamps() {
    const now = new Date()
    return [
        now.toISOString(),
        '2024-01-01T00:00:00Z',
        '2023-12-31T23:59:59.999Z',
        '2024-06-15T12:30:45+05:30',
        '2024-02-29T23:59:59Z', // Leap year
        '2024-01-01', // Date only
        '12:30:45', // Time only
        '2024-01-01T12:00:00.000Z', // With milliseconds
        '2024-01-01T12:00:00+00:00', // UTC with offset
        '2024-01-01T12:00:00-08:00' // PST offset
    ]
}

export function Iso8601Tool() {
    const [input, setInput] = usePersistentState('iso8601_input', '')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showRelative, setShowRelative] = useState(false)
    const [showTimezone, setShowTimezone] = useState(false)
    const [copied, setCopied] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const fileInputRef = useRef<HTMLInputElement>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    const enhancedParsed = useMemo(() => {
        return parseIso8601(input)
    }, [input])

    const output = useMemo(() => {
        if (!enhancedParsed.isValid) return ''
        
        const parts = [
            `Input: ${enhancedParsed.input}`,
            `ISO (UTC): ${enhancedParsed.iso.utc}`,
            `ISO (Local): ${enhancedParsed.iso.local}`,
            `Date Only: ${enhancedParsed.iso.dateOnly}`,
            `Time Only: ${enhancedParsed.iso.timeOnly}`,
            `With Offset: ${enhancedParsed.iso.withOffset}`,
            `Epoch (ms): ${enhancedParsed.epoch.milliseconds}`,
            `Epoch (s): ${enhancedParsed.epoch.seconds}`,
            `Epoch (ns): ${enhancedParsed.epoch.nanoseconds}`,
            `Locale: ${enhancedParsed.formats.locale}`,
            `UTC: ${enhancedParsed.formats.utc}`,
            `RFC: ${enhancedParsed.formats.rfc}`,
            `Custom Short: ${enhancedParsed.formats.custom.short}`,
            `Custom Medium: ${enhancedParsed.formats.custom.medium}`,
            `Custom Long: ${enhancedParsed.formats.custom.long}`,
            `Custom Full: ${enhancedParsed.formats.custom.full}`,
            `From Now: ${enhancedParsed.relative.fromNow}`,
            `To Now: ${enhancedParsed.relative.toNow}`,
            `Time Ago: ${enhancedParsed.relative.timeAgo}`,
            `In Time: ${enhancedParsed.relative.inTime}`,
            `Local TZ: ${enhancedParsed.timezone.local.name} (${enhancedParsed.timezone.local.offset})`,
            `UTC TZ: ${enhancedParsed.timezone.utc.name} (${enhancedParsed.timezone.utc.offset})`,
            `Year: ${enhancedParsed.components.year}`,
            `Month: ${enhancedParsed.components.month}`,
            `Day: ${enhancedParsed.components.day}`,
            `Hour: ${enhancedParsed.components.hour}`,
            `Minute: ${enhancedParsed.components.minute}`,
            `Second: ${enhancedParsed.components.second}`,
            `Millisecond: ${enhancedParsed.components.millisecond}`,
            `Timezone: ${enhancedParsed.components.timezone.name}`,
            `Timezone Offset: ${enhancedParsed.components.timezone.offset}`
        ]
        return parts.join('\n')
    }, [enhancedParsed])

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
                setInput(content)
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSampleTimestamps()
        setInput(samples[Math.floor(Math.random() * samples.length)])
    }

    const useCurrentTime = () => {
        setInput(currentTime.toISOString())
    }

    return (
        <ToolLayout
            title="ISO 8601 Parser Pro"
            description="Advanced ISO 8601 timestamp parser with epoch conversion, timezone analysis, and multiple format outputs."
            icon={Clock}
            onReset={() => setInput('')}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">ISO 8601 Parser</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced timestamp parsing with comprehensive format support</p>
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

                    <button
                        onClick={useCurrentTime}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Play className="w-4 h-4" />
                        <span>Current Time</span>
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
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowRelative(!showRelative)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showRelative 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Relative</span>
                        </button>
                        
                        <button
                            onClick={() => setShowTimezone(!showTimezone)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showTimezone 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Timezone</span>
                        </button>
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-blue-400">{enhancedParsed.isValid ? enhancedParsed.iso.dateOnly : 'Invalid'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Date</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-green-400">{enhancedParsed.isValid ? enhancedParsed.iso.timeOnly : '--:--'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Time</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-yellow-400">{enhancedParsed.epoch.seconds}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Epoch (s)</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-purple-400">{enhancedParsed.relative.fromNow}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Relative</div>
                    </div>
                </div>

                {/* Error Display */}
                {!enhancedParsed.isValid && enhancedParsed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Parse Error</div>
                            <div>{enhancedParsed.error}</div>
                        </div>
                    </div>
                )}

                {/* Advanced Details */}
                {showAdvanced && enhancedParsed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Details</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Date Components</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Year:</span>
                                        <span className="text-blue-400">{enhancedParsed.components.year}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Month:</span>
                                        <span className="text-green-400">{enhancedParsed.components.month}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Day:</span>
                                        <span className="text-yellow-400">{enhancedParsed.components.day}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Hour:</span>
                                        <span className="text-orange-400">{enhancedParsed.components.hour}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Minute:</span>
                                        <span className="text-purple-400">{enhancedParsed.components.minute}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Second:</span>
                                        <span className="text-pink-400">{enhancedParsed.components.second}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Millisecond:</span>
                                        <span className="text-cyan-400">{enhancedParsed.components.millisecond}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Epoch Values</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Milliseconds:</span>
                                        <span className="text-blue-400">{enhancedParsed.epoch.milliseconds}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Seconds:</span>
                                        <span className="text-green-400">{enhancedParsed.epoch.seconds}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Nanoseconds:</span>
                                        <span className="text-yellow-400">{enhancedParsed.epoch.nanoseconds}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">ISO Formats</div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted] mb-1">UTC:</div>
                                        <div className="font-mono text-blue-400">{enhancedParsed.iso.utc}</div>
                                    </div>
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted)] mb-1">Local:</div>
                                        <div className="font-mono text-green-400">{enhancedParsed.iso.local}</div>
                                    </div>
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted)] mb-1">Date Only:</div>
                                        <div className="font-mono text-yellow-400">{enhancedParsed.iso.dateOnly}</div>
                                    </div>
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted)] mb-1">Time Only:</div>
                                        <div className="font-mono text-orange-400">{enhancedParsed.iso.timeOnly}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Relative Time */}
                {showRelative && enhancedParsed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Relative Time</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">From Now</div>
                                <div className="text-lg font-black text-blue-400">{enhancedParsed.relative.fromNow}</div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">To Now</div>
                                <div className="text-lg font-black text-green-400">{enhancedParsed.relative.toNow}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timezone Information */}
                {showTimezone && enhancedParsed.isValid && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Timezone Information</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Local Timezone</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Name:</span>
                                        <span className="text-blue-400">{enhancedParsed.timezone.local.name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Offset:</span>
                                        <span className="text-green-400">{enhancedParsed.timezone.local.offset}</span>
                                    </div>
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted)] mb-1">Formatted:</div>
                                        <div className="font-mono text-yellow-400">{enhancedParsed.timezone.local.formatted}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">UTC Timezone</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Name:</span>
                                        <span className="text-blue-400">{enhancedParsed.timezone.utc.name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Offset:</span>
                                        <span className="text-green-400">{enhancedParsed.timezone.utc.offset}</span>
                                    </div>
                                    <div className="text-xs text-[var(--text-primary)] break-all">
                                        <div className="text-[var(--text-muted)] mb-1">Formatted:</div>
                                        <div className="font-mono text-yellow-400">{enhancedParsed.timezone.utc.formatted}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Input */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border-primary)] outline-none custom-scrollbar"
                            placeholder="2024-01-01T12:30:00Z"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Accepts ISO 8601 formats and common date strings</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Parsed Output</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {output.length} chars
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
