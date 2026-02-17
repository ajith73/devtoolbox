import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function scorePassword(pw: string) {
    const length = pw.length
    const hasLower = /[a-z]/.test(pw)
    const hasUpper = /[A-Z]/.test(pw)
    const hasNumber = /[0-9]/.test(pw)
    const hasSymbol = /[^a-zA-Z0-9]/.test(pw)
    const uniqueChars = new Set(Array.from(pw)).size
    const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length

    let score = 0
    score += Math.min(40, length * 2)
    score += variety * 12
    score += Math.min(20, Math.max(0, uniqueChars - 6) * 2)

    const warnings: string[] = []
    if (length < 12) warnings.push('Use 12+ characters')
    if (!hasLower) warnings.push('Add lowercase letters')
    if (!hasUpper) warnings.push('Add uppercase letters')
    if (!hasNumber) warnings.push('Add numbers')
    if (!hasSymbol) warnings.push('Add symbols')
    if (/^(.)\1+$/.test(pw) && pw.length > 0) warnings.push('Avoid repeated characters')

    const label = score >= 80 ? 'Strong' : score >= 55 ? 'Good' : score >= 35 ? 'Weak' : 'Very Weak'
    return { score: Math.min(100, score), label, warnings, length, hasLower, hasUpper, hasNumber, hasSymbol, uniqueChars }
}

export function PasswordCheckerTool() {
    const [input, setInput] = usePersistentState('password_checker_input', '')

    const result = useMemo(() => scorePassword(input), [input])

    const exportText = useMemo(() => {
        return [
            `Strength: ${result.label} (${result.score}/100)`,
            `Length: ${result.length}`,
            `Unique chars: ${result.uniqueChars}`,
            `Lowercase: ${result.hasLower}`,
            `Uppercase: ${result.hasUpper}`,
            `Numbers: ${result.hasNumber}`,
            `Symbols: ${result.hasSymbol}`,
            `Suggestions: ${result.warnings.length ? result.warnings.join(', ') : 'None'}`,
        ].join('\n')
    }, [result])

    return (
        <ToolLayout
            title="Password Checker"
            description="Check password strength locally (heuristics only; not a guarantee)."
            icon={ShieldCheck}
            onReset={() => setInput('')}
            onCopy={input ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!input}
        >
            <div className="space-y-6">
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Password</label>
                    <input
                        type="text"
                        placeholder="Type a password to evaluate..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Processed locally; not sent anywhere.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card label="Strength" value={`${result.label} (${result.score}/100)`} />
                    <Card label="Length" value={String(result.length)} />
                    <Card label="Unique characters" value={String(result.uniqueChars)} />
                </div>

                <div className="glass rounded-[2.5rem] border-[var(--border-primary)] p-8 bg-[var(--bg-secondary)]/30">
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Suggestions</div>
                    {result.warnings.length === 0 ? (
                        <div className="text-sm text-[var(--text-secondary)]">No suggestions.</div>
                    ) : (
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            {result.warnings.map((w) => (
                                <li key={w}>- {w}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ToolLayout>
    )
}

function Card({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
            <div className="mt-2 text-xl font-black text-[var(--text-primary)] break-words">{value}</div>
        </div>
    )
}
