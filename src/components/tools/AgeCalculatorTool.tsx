import { useState, useMemo, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Baby, Star, Share2, Download, Copy, Users, Target } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'

export function AgeCalculatorTool() {
    const [birthDate, setBirthDate] = useState('')
    const [specificDate, setSpecificDate] = useState('')
    const [compareDate, setCompareDate] = useState('')
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'comparison' | 'milestones'>('basic')
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    // Zodiac signs data
    const zodiacSigns = [
        { name: 'Aries', symbol: '♈', start: '03-21', end: '04-19' },
        { name: 'Taurus', symbol: '♉', start: '04-20', end: '05-20' },
        { name: 'Gemini', symbol: '♊', start: '05-21', end: '06-20' },
        { name: 'Cancer', symbol: '♋', start: '06-21', end: '07-22' },
        { name: 'Leo', symbol: '♌', start: '07-23', end: '08-22' },
        { name: 'Virgo', symbol: '♍', start: '08-23', end: '09-22' },
        { name: 'Libra', symbol: '♎', start: '09-23', end: '10-22' },
        { name: 'Scorpio', symbol: '♏', start: '10-23', end: '11-21' },
        { name: 'Sagittarius', symbol: '♐', start: '11-22', end: '12-21' },
        { name: 'Capricorn', symbol: '♑', start: '12-22', end: '01-19' },
        { name: 'Aquarius', symbol: '♒', start: '01-20', end: '02-18' },
        { name: 'Pisces', symbol: '♓', start: '02-19', end: '03-20' }
    ]

    // Calculate age details
    const ageDetails = useMemo(() => {
        if (!birthDate) return null

        const birth = new Date(birthDate)
        const now = new Date()
        const targetDate = specificDate ? new Date(specificDate) : now

        if (isNaN(birth.getTime()) || isNaN(targetDate.getTime())) return null

        const diffTime = Math.abs(targetDate.getTime() - birth.getTime())
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const totalHours = Math.floor(diffTime / (1000 * 60 * 60))
        const totalMinutes = Math.floor(diffTime / (1000 * 60))
        const totalSeconds = Math.floor(diffTime / 1000)

        let years = targetDate.getFullYear() - birth.getFullYear()
        let months = targetDate.getMonth() - birth.getMonth()
        let days = targetDate.getDate() - birth.getDate()

        if (days < 0) {
            months -= 1
            const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0)
            days += prevMonth.getDate()
        }

        if (months < 0) {
            years -= 1
            months += 12
        }

        const totalMonths = years * 12 + months
        const totalWeeks = Math.floor(totalDays / 7)

        // Next Birthday calculation (only for current date)
        let nextBirthday = null
        let daysUntilBirthday = null
        if (!specificDate) {
            nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
            if (nextBirthday < now) {
                nextBirthday.setFullYear(now.getFullYear() + 1)
            }
            daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Zodiac sign
        const birthMonth = birth.getMonth() + 1
        const birthDay = birth.getDate()
        const zodiac = zodiacSigns.find(sign => {
            const [startMonth, startDay] = sign.start.split('-').map(Number)
            const [endMonth, endDay] = sign.end.split('-').map(Number)

            if (sign.name === 'Capricorn') {
                return (birthMonth === 12 && birthDay >= startDay) || (birthMonth === 1 && birthDay <= endDay)
            }

            const start = new Date(2000, startMonth - 1, startDay)
            const end = new Date(2000, endMonth - 1, endDay)
            const current = new Date(2000, birthMonth - 1, birthDay)

            return current >= start && current <= end
        })

        // Fun statistics
        const funStats = {
            days: totalDays.toLocaleString(),
            hours: totalHours.toLocaleString(),
            minutes: totalMinutes.toLocaleString(),
            seconds: totalSeconds.toLocaleString()
        }

        // Milestones
        const milestones = [18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
        const upcomingMilestone = milestones.find(m => m > years)
        const milestoneYears = upcomingMilestone ? upcomingMilestone - years : null
        const milestoneMonths = upcomingMilestone ? Math.floor((totalMonths % 12) - months) : null

        return {
            years, months, days,
            totalMonths, totalWeeks, totalDays, totalHours,
            nextBirthday, daysUntilBirthday, zodiac,
            funStats, upcomingMilestone, milestoneYears, milestoneMonths
        }
    }, [birthDate, specificDate])

    // Age comparison
    const ageComparison = useMemo(() => {
        if (!birthDate || !compareDate) return null

        const birth1 = new Date(birthDate)
        const birth2 = new Date(compareDate)

        if (isNaN(birth1.getTime()) || isNaN(birth2.getTime())) return null

        const diffTime = Math.abs(birth2.getTime() - birth1.getTime())
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        let years = Math.floor(totalDays / 365.25)
        let months = Math.floor((totalDays % 365.25) / 30.44)
        let days = Math.floor(totalDays % 30.44)

        const isOlder = birth1 < birth2

        return { years, months, days, isOlder, totalDays }
    }, [birthDate, compareDate])

    // Live countdown timer
    useEffect(() => {
        if (!ageDetails?.nextBirthday) return

        const updateCountdown = () => {
            const now = new Date()
            const nextBirthday = ageDetails.nextBirthday
            if (!nextBirthday) return

            const diff = nextBirthday.getTime() - now.getTime()

            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                setCountdown({ days, hours, minutes, seconds })
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [ageDetails?.nextBirthday])

    // Generate share text
    const getShareText = () => {
        if (!ageDetails) return ''

        let text = `🎂 Age Calculator Results\n\n`
        text += `Birth Date: ${new Date(birthDate).toLocaleDateString()}\n`
        text += `Current Age: ${ageDetails.years} years, ${ageDetails.months} months, ${ageDetails.days} days\n`
        text += `Total Days Lived: ${ageDetails.funStats.days}\n`

        if (ageDetails.daysUntilBirthday) {
            text += `Days Until Next Birthday: ${ageDetails.daysUntilBirthday}\n`
        }

        if (ageDetails.zodiac) {
            text += `Zodiac Sign: ${ageDetails.zodiac.name} ${ageDetails.zodiac.symbol}\n`
        }

        text += `\nCalculated by DevBox Age Calculator`
        return text
    }

    // Share functions
    const handleCopyResult = () => {
        copyToClipboard(getShareText())
    }

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(getShareText())
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    const handleDownloadResult = () => {
        const blob = new Blob([getShareText()], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'age-calculator-results.txt'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="Age Calculator"
            description="Calculate your exact age with detailed breakdowns, zodiac signs, milestones, and more."
            icon={Baby}
            onReset={() => {
                setBirthDate('')
                setSpecificDate('')
                setCompareDate('')
                setActiveTab('basic')
            }}
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-[var(--border-primary)]">
                    {[
                        { id: 'basic', label: 'Basic', icon: Baby },
                        { id: 'advanced', label: 'Advanced', icon: Star },
                        { id: 'comparison', label: 'Compare', icon: Users },
                        { id: 'milestones', label: 'Milestones', icon: Target }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-brand text-brand bg-brand/5'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5 inline mr-1" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Input Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-8 glass rounded-2xl space-y-6 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Birth Date</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full h-16 px-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-lg font-bold text-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none shadow-inner"
                            />
                        </div>

                        {activeTab === 'advanced' && (
                            <div className="p-8 glass rounded-2xl space-y-6 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Calculate Age On Specific Date</label>
                                <input
                                    type="date"
                                    value={specificDate}
                                    onChange={(e) => setSpecificDate(e.target.value)}
                                    className="w-full h-16 px-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-lg font-bold text-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all outline-none shadow-inner"
                                />
                                <p className="text-xs text-[var(--text-secondary)]">Enter a future date to see your age on that day</p>
                            </div>
                        )}

                        {activeTab === 'comparison' && (
                            <div className="p-8 glass rounded-2xl space-y-6 border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Compare With Another Birth Date</label>
                                <input
                                    type="date"
                                    value={compareDate}
                                    onChange={(e) => setCompareDate(e.target.value)}
                                    className="w-full h-16 px-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-lg font-bold text-green-400 focus:ring-4 focus:ring-green-400/10 transition-all outline-none shadow-inner"
                                />
                                <p className="text-xs text-[var(--text-secondary)]">Compare ages between two people</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {activeTab === 'basic' && ageDetails && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Age Breakdown */}
                                <div className="p-8 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">Exact Age Breakdown</h3>
                                    <div className="text-center space-y-4">
                                        <div className="text-3xl font-black text-brand">
                                            {ageDetails.years} years {ageDetails.months} months {ageDetails.days} days
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-purple-400">{ageDetails.totalMonths.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Months</div>
                                            </div>
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-pink-400">{ageDetails.totalWeeks.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Weeks</div>
                                            </div>
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-blue-400">{ageDetails.totalDays.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Days</div>
                                            </div>
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-green-400">{ageDetails.totalHours.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Hours</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Zodiac Sign */}
                                {ageDetails.zodiac && (
                                    <div className="p-8 glass rounded-2xl border-[var(--border-primary)] bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4">Zodiac Sign</h3>
                                        <div className="text-center">
                                            <div className="text-6xl mb-2">{ageDetails.zodiac.symbol}</div>
                                            <div className="text-2xl font-black text-purple-400">{ageDetails.zodiac.name}</div>
                                            <div className="text-xs text-[var(--text-secondary)] mt-2">
                                                {ageDetails.zodiac.start} - {ageDetails.zodiac.end}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Birthday Countdown */}
                                {ageDetails.daysUntilBirthday && (
                                    <div className="p-8 glass rounded-2xl border-brand/20 bg-brand/5">
                                        <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-6">Live Birthday Countdown</h3>
                                        <div className="text-center space-y-4">
                                            <div className="text-4xl font-black text-brand">
                                                {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)]">
                                                Next birthday: {ageDetails.nextBirthday?.toLocaleDateString()}
                                            </div>
                                            <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                                                <div
                                                    className="h-2 bg-brand rounded-full transition-all duration-1000"
                                                    style={{ width: `${(1 - countdown.days / 365) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fun Statistics */}
                                <div className="p-8 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">Fun Statistics</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Days Lived', value: ageDetails.funStats.days, color: 'text-blue-400' },
                                            { label: 'Hours Lived', value: ageDetails.funStats.hours, color: 'text-green-400' },
                                            { label: 'Minutes Lived', value: ageDetails.funStats.minutes, color: 'text-purple-400' },
                                            { label: 'Seconds Lived', value: ageDetails.funStats.seconds, color: 'text-pink-400' }
                                        ].map((stat) => (
                                            <div key={stat.label} className="flex justify-between items-center p-4 glass rounded-xl bg-[var(--bg-primary)]/30">
                                                <span className="text-sm font-bold text-[var(--text-secondary)]">{stat.label}</span>
                                                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && ageDetails && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">
                                        Age on {specificDate ? new Date(specificDate).toLocaleDateString() : 'Today'}
                                    </h3>
                                    <div className="text-center">
                                        <div className="text-5xl font-black text-purple-400 mb-4">
                                            {ageDetails.years}y {ageDetails.months}m {ageDetails.days}d
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-blue-400">{ageDetails.totalMonths.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Months</div>
                                            </div>
                                            <div className="p-4 glass rounded-xl bg-[var(--bg-primary)]/50">
                                                <div className="text-xl font-black text-green-400">{ageDetails.totalDays.toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Days</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'comparison' && ageComparison && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">Age Difference</h3>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-green-400 mb-4">
                                            {ageComparison.years}y {ageComparison.months}m {ageComparison.days}d
                                        </div>
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            Person 1 is {ageComparison.isOlder ? 'older' : 'younger'} by {ageComparison.totalDays.toLocaleString()} days
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'milestones' && ageDetails && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {ageDetails.upcomingMilestone && (
                                    <div className="p-8 glass rounded-2xl border-brand/20 bg-brand/5">
                                        <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-6">Next Milestone</h3>
                                        <div className="text-center">
                                            <div className="text-6xl font-black text-brand mb-2">{ageDetails.upcomingMilestone}th</div>
                                            <div className="text-xl font-bold text-[var(--text-secondary)] mb-4">Birthday</div>
                                            <div className="text-sm text-[var(--text-muted)]">
                                                {ageDetails.milestoneYears} years, {ageDetails.milestoneMonths} months away
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {[18, 21, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100].map((milestone) => {
                                        const isPast = milestone <= ageDetails.years
                                        return (
                                            <div key={milestone} className={`p-6 glass rounded-xl border ${isPast ? 'border-green-400/30 bg-green-400/5' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/30'}`}>
                                                <div className={`text-2xl font-black text-center ${isPast ? 'text-green-400' : 'text-[var(--text-secondary)]'}`}>
                                                    {milestone}
                                                </div>
                                                <div className="text-[9px] font-black text-center text-[var(--text-muted)] uppercase tracking-widest mt-1">
                                                    {isPast ? '✓ Achieved' : 'Upcoming'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Share Actions */}
                        {ageDetails && (
                            <div className="p-6 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4">Share Results</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyResult}
                                        className="flex-1 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:border-brand/40 transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleShareWhatsApp}
                                        className="flex-1 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg font-bold text-xs text-green-400 flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={handleDownloadResult}
                                        className="flex-1 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:border-brand/40 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
