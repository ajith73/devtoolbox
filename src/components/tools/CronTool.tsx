import { useState, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    CalendarClock, Info, ChevronRight, Sparkles, BookOpen, Clock,
    Globe, AlertTriangle, Zap, Settings2, Download, Calendar,
    BarChart3, Wand2, RefreshCw, Copy, Check, FileJson, FileCode
} from 'lucide-react'
import cronstrue from 'cronstrue'
import * as cronParserImport from 'cron-parser'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const cronParser = cronParserImport as any

const TIMEZONES = [
    { label: 'UTC', value: 'UTC' },
    { label: 'IST (India)', value: 'Asia/Kolkata' },
    { label: 'PST (Pacific)', value: 'America/Los_Angeles' },
    { label: 'CET (Central Europe)', value: 'Europe/Berlin' },
    { label: 'GMT (London)', value: 'Europe/London' },
    { label: 'JST (Tokyo)', value: 'Asia/Tokyo' },
    { label: 'EST (Eastern)', value: 'America/New_York' },
]

const COMMON_PATTERNS = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every 5 Mins', value: '*/5 * * * *' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Every Day (Midnight)', value: '0 0 * * *' },
    { label: 'Every Sunday', value: '0 0 * * 0' },
    { label: 'First of Month', value: '0 0 1 * *' },
    { label: 'Every Weekday', value: '0 0 * * 1-5' }
]

const PRESETS = [
    { label: 'Linux Cron', value: 'linux', example: '0 0 * * *', fields: 5 },
    { label: 'K8s CronJob', value: 'k8s', example: '0 0 * * *', fields: 5 },
    { label: 'AWS EventBridge', value: 'aws', example: '0 0 * * ? *', fields: 6 },
    { label: 'Quartz', value: 'quartz', example: '0 0 0 * * ? *', fields: 7 },
    { label: 'GitHub Actions', value: 'gh', example: '0 0 * * *', fields: 5 }
]

export function CronTool() {
    const [input, setInput] = usePersistentState('cron_input', '*/15 * * * *')
    const [timezone, setTimezone] = useState('Local')
    const [showNextCount, setShowNextCount] = useState(5)
    const [activeTab, setActiveTab] = useState<'info' | 'generator' | 'frequency' | 'calendar' | 'export'>('info')
    const [preset, setPreset] = useState('linux')

    // Reverse Generator States
    const [genFreq, setGenFreq] = useState('minutes')
    const [genValue, setGenValue] = useState('5')

    const [explanation, setExplanation] = useState('')
    const [nextRuns, setNextRuns] = useState<{ local: string, utc: string, target: string }[]>([])
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const fieldCount = useMemo(() => input.trim().split(/\s+/).length, [input])

    useEffect(() => {
        if (!input.trim()) {
            setExplanation('')
            setNextRuns([])
            setError(null)
            return
        }

        try {
            const isQuartz = preset === 'quartz' || fieldCount === 7
            const verbose = cronstrue.toString(input, {
                throwExceptionOnParseError: true,
                useQuartzFormat: isQuartz
            } as any)
            setExplanation(verbose)

            const targetTz = timezone === 'Local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone
            const options = {
                currentDate: new Date(),
                tz: targetTz
            }
            const interval = cronParser.parseExpression(input, options)
            const runs: { local: string, utc: string, target: string }[] = []

            for (let i = 0; i < showNextCount; i++) {
                const date = interval.next().toDate()
                runs.push({
                    local: format(date, 'yyyy-MM-dd HH:mm:ss'),
                    utc: formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss'),
                    target: formatInTimeZone(date, targetTz, 'yyyy-MM-dd HH:mm:ss')
                })
            }
            setNextRuns(runs)
            setError(null)
        } catch (e: any) {
            let msg = e.message || 'Invalid cron expression'
            if (msg.includes('Day of month and day of week both specified')) {
                msg = "Validation Error: Day of month and day of week both specified — check logic. (Try using '?' for one of them in Quartz/AWS formats)"
            }
            setError(msg)
            setExplanation('')
            setNextRuns([])
        }
    }, [input, timezone, showNextCount, preset, fieldCount])

    const handleCopy = () => {
        navigator.clipboard.writeText(input)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const frequencyStats = useMemo(() => {
        if (error || !input.trim()) return null
        try {
            // Approximate calculation
            let hourCount = 0
            let dayCount = 0

            const start = new Date()

            // Count for 1 hour
            const hourEnd = new Date(start.getTime() + 3600000)
            try {
                const it = cronParser.parseExpression(input, { currentDate: start })
                while (it.next().toDate() <= hourEnd) hourCount++
            } catch (e) { }

            // Count for 1 day
            const dayEnd = new Date(start.getTime() + 86400000)
            try {
                const it2 = cronParser.parseExpression(input, { currentDate: start })
                while (it2.next().toDate() <= dayEnd) dayCount++
            } catch (e) { }

            return {
                perHour: hourCount,
                perDay: dayCount,
                perMonth: dayCount * 30,
                perYear: dayCount * 365
            }
        } catch (e) {
            return null
        }
    }, [input, error])

    const risks = useMemo(() => {
        if (!frequencyStats) return []
        const warningList = []
        if (frequencyStats.perDay > 1440) warningList.push("High frequency: Runs more than once per minute.")
        if (frequencyStats.perDay > 86400) warningList.push("Extreme frequency: Runs every second or more.")
        if (input.includes('* * *')) warningList.push("Broad wildcard usage: Ensure this is intentional for production.")
        return warningList
    }, [frequencyStats, input])

    const generateCron = () => {
        let newCron = '* * * * *'
        if (genFreq === 'minutes') newCron = `*/${genValue} * * * *`
        if (genFreq === 'hours') newCron = `0 */${genValue} * * *`
        if (genFreq === 'days') newCron = `0 0 */${genValue} * *`
        if (genFreq === 'weekdays') newCron = `0 9 * * 1-5`
        if (genFreq === 'last-friday') newCron = `0 0 ? * 6L` // Quartz format for last Friday
        setInput(newCron)
        if (genFreq === 'last-friday') setPreset('quartz')
        setActiveTab('info')
    }

    return (
        <ToolLayout
            title="Cron Expression Viewer"
            description="Pro-level cron tool for translation, validation, and schedule visualization."
            icon={CalendarClock}
            onReset={() => {
                setInput('*/15 * * * *')
                setPreset('linux')
                setTimezone('UTC')
            }}
        >
            <div className="flex flex-col space-y-8 text-[var(--text-primary)]">
                {/* Header Inputs Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center space-x-3">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Cron Protocol</label>
                                <div className="flex space-x-1">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => {
                                                setPreset(p.value)
                                                setInput(p.example)
                                            }}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all border",
                                                preset === p.value ? "bg-brand text-white border-brand" : "bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-brand"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest">
                                <Clock className="w-4 h-4 text-brand" />
                                <span>{fieldCount} Fields Detected</span>
                            </div>
                        </div>
                        <div className="relative group">
                            <input
                                className={cn(
                                    "w-full font-mono text-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all text-center text-brand font-black tracking-widest shadow-inner",
                                    error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/5"
                                )}
                                placeholder="* * * * *"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                onClick={handleCopy}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 transition-all"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="grid grid-cols-5 md:grid-cols-7 gap-2 px-8">
                            {['Seconds', 'Minutes', 'Hours', 'Day (M)', 'Month', 'Day (W)', 'Year'].slice(fieldCount === 5 ? 1 : 0, fieldCount === 5 ? 6 : (fieldCount === 6 ? 7 : 8)).map((u, idx) => (
                                <span key={idx} className="text-[9px] font-black text-[var(--text-muted)] uppercase text-center tracking-widest">{u}</span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Global Temporal Context</label>
                        <div className="p-6 glass rounded-[2.5rem] border-[var(--border-primary)] space-y-4 h-[calc(100%-24px)] flex flex-col justify-center">
                            <div className="flex items-center space-x-4">
                                <Globe className="w-5 h-5 text-brand" />
                                <div className="flex-1">
                                    <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Target Timezone</p>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-brand"
                                    >
                                        <option value="Local">Browser Local</option>
                                        {TIMEZONES.map(tz => (
                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Settings2 className="w-5 h-5 text-brand" />
                                <div className="flex-1">
                                    <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Preview Limit</p>
                                    <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-1">
                                        {[5, 10, 25].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setShowNextCount(n)}
                                                className={cn(
                                                    "flex-1 py-1 rounded-lg text-[10px] font-black transition-all",
                                                    showNextCount === n ? "bg-brand text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand"
                                                )}
                                            >
                                                {n} RUNS
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="flex items-center space-x-2 border-b border-[var(--border-primary)] px-2">
                    {[
                        { id: 'info', icon: Info, label: 'Overview' },
                        { id: 'generator', icon: Wand2, label: 'Generator' },
                        { id: 'frequency', icon: BarChart3, label: 'Analysis' },
                        { id: 'calendar', icon: Calendar, label: 'Calendar' },
                        { id: 'export', icon: Download, label: 'Export' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center space-x-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                activeTab === tab.id ? "text-brand" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[400px]">
                    <div className="lg:col-span-12">
                        {activeTab === 'info' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="p-10 glass rounded-[3rem] space-y-4 border-brand/20 bg-brand/5 relative overflow-hidden group min-h-[160px] flex flex-col justify-center shadow-sm">
                                        <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-brand/5 group-hover:rotate-12 transition-transform duration-1000" />
                                        <div className="space-y-4 relative">
                                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] pl-1">Linguistic Translation</p>
                                            <h3 className="text-2xl font-black tracking-tight text-[var(--text-primary)] leading-tight opacity-90">
                                                {error ? <span className="text-red-500 font-mono text-base uppercase font-black italic tracking-widest">Logic Decryption Error</span> : explanation || '...'}
                                            </h3>
                                            {error && <p className="text-xs text-red-500/80 font-mono mt-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10 italic leading-relaxed">{error}</p>}
                                        </div>
                                    </div>

                                    <div className="p-8 glass rounded-[3rem] space-y-6 border-[var(--border-primary)] shadow-sm">
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-2 pl-2">
                                            <BookOpen className="w-4 h-4 text-brand" />
                                            <span>Universal Archetypes</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-2.5 px-1">
                                            {COMMON_PATTERNS.map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setInput(p.value)}
                                                    className={cn(
                                                        "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                        input === p.value
                                                            ? "bg-brand text-white border-brand shadow-sm scale-105"
                                                            : "bg-[var(--bg-secondary)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:border-brand/40 hover:text-brand"
                                                    )}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-8 px-2">
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-4">
                                            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin-slow" />
                                            <span>Temporal Trajectory</span>
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[8px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase">{timezone === 'Local' ? 'Browser' : timezone}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {nextRuns.map((run, i) => (
                                            <div key={i} className="group p-5 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-[1.8rem] hover:border-brand/40 transition-all flex items-center space-x-6">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)] group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[8px] text-[var(--text-muted)] font-black uppercase mb-1">{timezone}</p>
                                                        <p className="font-mono text-[11px] text-[var(--text-primary)] font-black">{run.target}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] text-[var(--text-muted)] font-black uppercase mb-1">UTC Reference</p>
                                                        <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold">{run.utc}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        ))}
                                        {!nextRuns.length && (
                                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                                <CalendarClock className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] max-w-[200px]">Awaiting temporal input to extrapolate cycles.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'generator' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 glass rounded-[3rem] border-[var(--border-primary)] max-w-2xl mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] flex items-center space-x-2">
                                        <Wand2 className="w-4 h-4" />
                                        <span>Pro-Level Wizard</span>
                                    </h3>
                                    <p className="text-sm text-[var(--text-muted)] font-medium">Construct complex schedules using natural logic parameters.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Frequency Archetype</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: 'minutes', label: 'Every X Minutes', icon: Clock },
                                                { id: 'hours', label: 'Every X Hours', icon: Clock },
                                                { id: 'days', label: 'Every X Days', icon: Calendar },
                                                { id: 'weekdays', label: 'Every Weekday', icon: Calendar },
                                                { id: 'last-friday', label: 'Last Fri of Month', icon: Calendar }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => {
                                                        setGenFreq(opt.id)
                                                        if (opt.id === 'weekdays') setGenValue('9 AM')
                                                        if (opt.id === 'last-friday') setGenValue('L')
                                                    }}
                                                    className={cn(
                                                        "flex items-center space-x-3 p-4 rounded-2xl border transition-all text-left",
                                                        genFreq === opt.id ? "bg-brand/10 border-brand text-brand shadow-sm" : "bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:border-brand/40"
                                                    )}
                                                >
                                                    <opt.icon className="w-4 h-4" />
                                                    <span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Quantum Value</label>
                                        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] flex flex-col justify-center h-full space-y-4">
                                            {genFreq !== 'weekdays' && genFreq !== 'last-friday' ? (
                                                <div className="space-y-4 text-center">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max={genFreq === 'minutes' ? '59' : (genFreq === 'hours' ? '23' : '30')}
                                                        value={genValue}
                                                        onChange={(e) => setGenValue(e.target.value)}
                                                        className="w-full accent-brand"
                                                    />
                                                    <div className="text-4xl font-black text-brand">{genValue}</div>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                                        {genFreq.slice(0, -1)} intervals
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-4">
                                                    <div className="text-2xl font-black text-brand uppercase">{genFreq === 'weekdays' ? '09:00 AM' : '12:00 AM'}</div>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                                                        {genFreq === 'weekdays' ? 'Fixed morning trigger' : 'End of month cycle'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={generateCron}
                                    className="w-full py-6 bg-brand text-white rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-brand/90 hover:scale-[1.02] transition-all shadow-xl shadow-brand/20 flex items-center justify-center space-x-4"
                                >
                                    <Zap className="w-6 h-6" />
                                    <span>Synthesize Expression</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'frequency' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Runs Per Hour', value: frequencyStats?.perHour || 0, color: 'text-blue-500' },
                                        { label: 'Runs Per Day', value: frequencyStats?.perDay || 0, color: 'text-brand' },
                                        { label: 'Runs Per Month', value: (frequencyStats?.perMonth || 0).toLocaleString(), color: 'text-purple-500' },
                                        { label: 'Annual Total', value: (frequencyStats?.perYear || 0).toLocaleString(), color: 'text-emerald-500' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] space-y-2">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
                                            <p className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 glass rounded-[3rem] border-red-500/20 bg-red-500/5 space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Critical Risk Assessment</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {risks.length > 0 ? risks.map((risk, i) => (
                                            <div key={i} className="flex items-center space-x-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <p className="text-xs font-bold text-red-900/80 dark:text-red-300 italic">{risk}</p>
                                            </div>
                                        )) : (
                                            <div className="flex items-center space-x-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600">
                                                <Check className="w-5 h-5 text-emerald-500" />
                                                <p className="text-xs font-black uppercase tracking-widest">Scheduler Stability: Nominal</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'calendar' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 glass rounded-[3rem] border-[var(--border-primary)] space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] flex items-center space-x-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Monthly Grid Projection</span>
                                    </h3>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                        {format(new Date(), 'MMMM yyyy')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="text-center text-[9px] font-black text-[var(--text-muted)] uppercase py-2">{d}</div>
                                    ))}
                                    {/* Simplified Calendar Implementation */}
                                    {(() => {
                                        const now = new Date()
                                        const start = startOfMonth(now)
                                        const end = endOfMonth(now)
                                        const days = eachDayOfInterval({ start, end })

                                        // Calculate run days for this month
                                        let runDays: Date[] = []
                                        try {
                                            const options = { currentDate: start, endDate: end }
                                            const interval = cronParser.parseExpression(input, options)
                                            while (true) {
                                                try {
                                                    runDays.push(interval.next().toDate())
                                                } catch (e) { break }
                                            }
                                        } catch (e) { }

                                        return days.map(day => {
                                            const hasRun = runDays.some(rd => isSameDay(rd, day))
                                            const isToday = isSameDay(day, now)
                                            return (
                                                <div
                                                    key={day.toString()}
                                                    className={cn(
                                                        "aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all",
                                                        hasRun ? "bg-brand/10 border-brand text-brand shadow-sm font-black" : "bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] text-[var(--text-muted)]",
                                                        isToday && "ring-2 ring-brand ring-offset-4 ring-offset-[var(--bg-primary)]"
                                                    )}
                                                >
                                                    <span className="text-xs">{format(day, 'd')}</span>
                                                    {hasRun && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />}
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] space-y-6">
                                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] flex items-center space-x-2">
                                        <FileCode className="w-4 h-4" />
                                        <span>System Architectures</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            {
                                                title: 'Kubernetes CronJob',
                                                icon: FileCode,
                                                code: `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: automated-task\nspec:\n  schedule: "${input}"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          containers:\n          - name: worker\n            image: alpine\n          restartPolicy: OnFailure`
                                            },
                                            {
                                                title: 'GitHub Actions',
                                                icon: Clock,
                                                code: `on:\n  schedule:\n    - cron: '${input}'\n\njobs:\n  run_task:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "Temporal trigger activated"`
                                            }
                                        ].map((exp, i) => (
                                            <div key={i} className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{exp.title}</p>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(exp.code)
                                                        }}
                                                        className="p-2 rounded-xl hover:bg-brand/10 text-[var(--text-muted)] hover:text-brand transition-all"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <pre className="text-[10px] font-mono text-[var(--text-muted)] overflow-hidden line-clamp-4">
                                                    {exp.code}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] space-y-6">
                                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] flex items-center space-x-2">
                                        <FileJson className="w-4 h-4" />
                                        <span>Data Serialization</span>
                                    </h3>
                                    <div className="p-6 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-[2.5rem] space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">JSON Payload</p>
                                            <pre className="text-xs font-mono text-brand bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-primary)]">
                                                {JSON.stringify({
                                                    cron: input,
                                                    translation: explanation,
                                                    timezone: timezone,
                                                    next_runs: nextRuns.map(r => r.target)
                                                }, null, 2)}
                                            </pre>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const data = JSON.stringify({ cron: input, translation: explanation }, null, 2)
                                                const blob = new Blob([data], { type: 'application/json' })
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = 'cron-config.json'
                                                a.click()
                                            }}
                                            className="w-full py-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center space-x-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Download Configuration</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
