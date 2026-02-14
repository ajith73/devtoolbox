import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { SearchCode, AlertCircle, Sparkles } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function RegexTool() {
    const [pattern, setPattern] = usePersistentState('regex_pattern', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}')
    const [flags, setFlags] = usePersistentState('regex_flags', 'g')
    const [testString, setTestString] = usePersistentState('regex_test_string', 'Contact us at support@devbox.io or hello@example.com')
    const [matches, setMatches] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!pattern) {
            setMatches([])
            setError(null)
            return
        }

        try {
            const regex = new RegExp(pattern, flags)
            const found = [...testString.matchAll(regex)]
            setMatches(found)
            setError(null)
        } catch (e: any) {
            setError(e.message)
            setMatches([])
        }
    }, [pattern, flags, testString])

    return (
        <ToolLayout
            title="Regex Tester"
            description="Powerful regular expression debugger with live matching."
            icon={SearchCode}
            onReset={() => {
                setPattern('')
                setTestString('')
                setMatches([])
            }}
            onCopy={() => copyToClipboard(JSON.stringify(matches.map(m => m[0]), null, 2))}
        >
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Structural Pattern</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand font-mono text-xl">/</div>
                            <input
                                className="w-full pl-12 pr-24 font-mono text-lg bg-[var(--input-bg)] border-[var(--border-primary)] rounded-[2.5rem] p-7 focus:ring-4 focus:ring-brand/10 transition-all shadow-inner text-brand font-black tracking-widest"
                                placeholder="[a-zA-Z0-9]+"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <div className="text-brand font-mono text-xl">/</div>
                                <input
                                    className="w-12 bg-transparent border-none p-0 focus:ring-0 text-brand font-mono text-xl font-bold"
                                    value={flags}
                                    onChange={(e) => setFlags(e.target.value)}
                                    placeholder="g"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-4 text-red-500 shadow-lg shadow-red-500/5 animate-shake">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <span className="text-sm font-mono font-bold leading-relaxed">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Source String</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none custom-scrollbar p-8 rounded-[2.5rem] bg-[var(--input-bg)] shadow-inner"
                            placeholder="Enter text to test your regex against..."
                            value={testString}
                            onChange={(e) => setTestString(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Engine Intersection ({matches.length})</label>
                            {matches.length > 0 && (
                                <div className="px-4 py-1.5 rounded-full bg-brand/10 text-brand text-[9px] font-black uppercase flex items-center space-x-2 border border-brand/20 shadow-sm">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Logic Validated</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 glass rounded-[3rem] overflow-y-auto p-10 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] shadow-sm">
                            {testString.split(new RegExp(`(${pattern})`, flags)).map((part, i) => {
                                const isMatch = matches.some(m => m[0] === part)
                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            "transition-all rounded px-1 py-0.5",
                                            isMatch ? "bg-brand/20 text-brand font-black border-b-2 border-brand shadow-[0_4px_12px_-4px_rgba(var(--brand-rgb),0.3)]" : "text-[var(--text-secondary)] opacity-80"
                                        )}
                                    >
                                        {part}
                                    </span>
                                )
                            })}
                            {!testString && <span className="text-[var(--text-muted)] opacity-30 italic font-medium tracking-widest text-[10px] uppercase">Logic analysis awaiting payload...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
