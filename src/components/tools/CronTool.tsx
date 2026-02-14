import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { CalendarClock, Info, ChevronRight, Sparkles, BookOpen, Clock } from 'lucide-react'
import cronstrue from 'cronstrue'
import * as cronParserImport from 'cron-parser'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const cronParser = cronParserImport as any

const COMMON_PATTERNS = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every 5 Mins', value: '*/5 * * * *' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Every Day (Midnight)', value: '0 0 * * *' },
    { label: 'Every Sunday', value: '0 0 * * 0' },
    { label: 'First of Month', value: '0 0 1 * *' },
    { label: 'Every Weekday', value: '0 0 * * 1-5' }
]

export function CronTool() {
    const [input, setInput] = usePersistentState('cron_input', '*/15 * * * *')
    const [explanation, setExplanation] = useState('')
    const [nextRuns, setNextRuns] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!input.trim()) {
            setExplanation('')
            setNextRuns([])
            setError(null)
            return
        }

        try {
            const verbose = cronstrue.toString(input)
            setExplanation(verbose)

            const interval = cronParser.parseExpression(input)
            const runs: string[] = []
            for (let i = 0; i < 5; i++) {
                runs.push(format(interval.next().toDate(), 'yyyy-MM-dd HH:mm:ss'))
            }
            setNextRuns(runs)
            setError(null)
        } catch (e: any) {
            setError(e.message || 'Invalid cron expression')
            setExplanation('')
            setNextRuns([])
        }
    }, [input])

    return (
        <ToolLayout
            title="Cron Expression Viewer"
            description="Translate cron schedules into plain English and preview upcoming runs."
            icon={CalendarClock}
            onReset={() => setInput('')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-[var(--text-primary)]">
                <div className="space-y-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Temporal Blueprint</label>
                            <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest">
                                <Clock className="w-4 h-4 text-brand" />
                                <span>5-Part Protocol</span>
                            </div>
                        </div>
                        <input
                            className="w-full font-mono text-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] focus:border-brand/40 focus:ring-0 transition-all text-center text-brand font-black tracking-widest shadow-inner"
                            placeholder="* * * * *"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <div className="grid grid-cols-5 gap-2 px-8">
                            {['Minute', 'Hour', 'M-Day', 'Month', 'W-Day'].map((u) => (
                                <span key={u} className="text-[9px] font-black text-[var(--text-muted)] uppercase text-center tracking-widest">{u}</span>
                            ))}
                        </div>
                    </div>

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
                            <span>Pattern Archetypes</span>
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

                <div className="space-y-6">
                    <div className="p-8 glass rounded-[3rem] space-y-8 border-[var(--border-primary)] shadow-sm bg-[var(--bg-secondary)]/30">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center space-x-4 pl-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            <span>Temporal Trajectory</span>
                        </h3>

                        <div className="space-y-4">
                            {nextRuns.map((run, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-[1.5rem] group hover:border-brand/40 transition-all shadow-sm">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)] group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all">
                                            {i + 1}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Predicted Ingress</p>
                                            <span className="font-mono text-xs text-[var(--text-primary)] font-black uppercase tracking-tighter">{run}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] opacity-20 group-hover:text-brand group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                            {!nextRuns.length && (
                                <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 px-10">
                                    <div className="w-20 h-20 rounded-[2rem] glass border-dashed border-[var(--border-primary)] flex items-center justify-center bg-[var(--bg-primary)]/50 group">
                                        <CalendarClock className="w-10 h-10 text-[var(--text-muted)] opacity-30 group-hover:text-brand group-hover:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[220px]">A valid temporal pattern is required to extrapolate future scheduler cycles.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
