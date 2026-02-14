import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { Baby, Calendar, Clock, Gift, Star } from 'lucide-react'

export function AgeCalculatorTool() {
    const [birthDate, setBirthDate] = useState('')

    const age = useMemo(() => {
        if (!birthDate) return null

        const birth = new Date(birthDate)
        const now = new Date()

        if (isNaN(birth.getTime())) return null

        let years = now.getFullYear() - birth.getFullYear()
        let months = now.getMonth() - birth.getMonth()
        let days = now.getDate() - birth.getDate()

        if (days < 0) {
            months -= 1
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
            days += prevMonth.getDate()
        }

        if (months < 0) {
            years -= 1
            months += 12
        }

        // Next Birthday calculation
        const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
        if (nextBday < now) {
            nextBday.setFullYear(now.getFullYear() + 1)
        }
        const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return { years, months, days, daysUntil }
    }, [birthDate])

    return (
        <ToolLayout
            title="Age Calculator"
            description="Calculate your exact age and see how many days until your next birthday."
            icon={Baby}
            onReset={() => setBirthDate('')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[var(--text-primary)]">
                <div className="space-y-8">
                    <div className="p-10 glass rounded-[3rem] space-y-8 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors">Temporal Origin</label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full h-20 px-8 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] text-2xl font-black text-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none shadow-inner"
                        />

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center space-x-5 p-6 bg-brand/5 rounded-[2rem] border border-brand/20 shadow-sm">
                                <Star className="w-6 h-6 text-brand" />
                                <p className="text-[11px] font-black uppercase text-[var(--text-muted)] leading-relaxed tracking-widest opacity-80">
                                    Chronological resolution relative to: <span className="text-brand font-black">{new Date().toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {age ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Years', value: age.years, color: 'text-brand' },
                                    { label: 'Months', value: age.months, color: 'text-purple-400' },
                                    { label: 'Days', value: age.days, color: 'text-pink-400' }
                                ].map((stat) => (
                                    <div key={stat.label} className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] flex flex-col items-center justify-center space-y-2 bg-[var(--bg-secondary)]/50 shadow-sm transition-all hover:border-brand/40">
                                        <span className={`text-5xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 glass rounded-[3rem] border-brand/20 bg-brand/5 relative overflow-hidden group shadow-sm transition-all hover:bg-brand/[0.07]">
                                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                                    <Gift className="w-32 h-32 text-brand" />
                                </div>

                                <div className="relative space-y-6">
                                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Celebration Proximity</h3>
                                    <div className="flex items-baseline space-x-4">
                                        <span className="text-6xl font-black tracking-tighter text-[var(--text-primary)]">{age.daysUntil}</span>
                                        <span className="text-xl font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Cycles</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-80">Until the next annual recurrence marker. 🎉</p>

                                    <div className="pt-8 flex items-center space-x-5">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-primary)] shadow-inner">
                                            <Calendar className="w-6 h-6 text-brand opacity-60" />
                                        </div>
                                        <div className="h-2 flex-1 bg-[var(--border-primary)] rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-brand transition-all duration-1000"
                                                style={{ width: `${(1 - age.daysUntil / 365) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 glass rounded-[2rem] border-[var(--border-primary)] space-y-2 bg-[var(--bg-secondary)]/30 shadow-sm transition-all hover:bg-[var(--bg-secondary)]/50">
                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Aggregate Months</p>
                                    <p className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight">{(age.years * 12 + age.months).toLocaleString()}</p>
                                </div>
                                <div className="p-8 glass rounded-[2rem] border-[var(--border-primary)] space-y-2 bg-[var(--bg-secondary)]/30 shadow-sm transition-all hover:bg-[var(--bg-secondary)]/50">
                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Aggregate Days</p>
                                    <p className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight">{(age.years * 365 + Math.floor(age.years / 4) + age.months * 30 + age.days).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-8 p-12 glass rounded-[4rem] border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/20 shadow-inner group">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-primary)] shadow-sm group-hover:scale-110 transition-transform duration-700">
                                <Clock className="w-10 h-10 text-[var(--text-muted)] opacity-20 animate-[spin_20s_linear_infinite]" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] opacity-40 text-center leading-relaxed max-w-[200px]">Awaiting temporal origin parameters for age resolution.</p>
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    )
}
