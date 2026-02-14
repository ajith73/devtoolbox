import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { ShieldCheck, RefreshCcw } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function PasswordTool() {
    const [password, setPassword] = useState('')
    const [length, setLength] = usePersistentState('password_length', 16)
    const [options, setOptions] = usePersistentState('password_options', {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
    })

    const generate = () => {
        let charset = ''
        if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
        if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        if (options.numbers) charset += '0123456789'
        if (options.symbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-='

        if (!charset) {
            setPassword('Select at least one option')
            return
        }

        let result = ''
        const array = new Uint32Array(length)
        window.crypto.getRandomValues(array)

        for (let i = 0; i < length; i++) {
            result += charset[array[i] % charset.length]
        }
        setPassword(result)
    }

    useEffect(() => {
        generate()
    }, [length, options])

    const strength = password.length >= 16 ? 'Excellent' : password.length >= 12 ? 'Great' : 'Weak'
    const strengthColor = password.length >= 16 ? 'text-green-400' : password.length >= 12 ? 'text-yellow-400' : 'text-red-400'

    return (
        <ToolLayout
            title="Password Generator"
            description="Create cryptographically strong passwords instantly."
            icon={ShieldCheck}
            onReset={generate}
            onCopy={() => copyToClipboard(password)}
        >
            <div className="max-w-3xl mx-auto space-y-8 text-[var(--text-primary)]">
                <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-brand/20 via-purple-500/20 to-brand/20 rounded-[3.5rem] blur-xl group-hover:opacity-100 transition duration-1000 opacity-40 animate-pulse"></div>
                    <div className="relative glass rounded-[3rem] p-12 flex items-center justify-between border-[var(--border-primary)] shadow-2xl bg-[var(--bg-secondary)]/50 backdrop-blur-2xl">
                        <code className="text-3xl md:text-4xl font-mono text-brand break-all font-black tracking-tight select-all leading-tight">{password}</code>
                        <button
                            onClick={generate}
                            className="p-5 bg-brand text-white hover:scale-110 active:scale-95 rounded-[2rem] transition-all ml-10 shrink-0 shadow-xl shadow-brand/20 border-2 border-white/20 group-hover:rotate-180 duration-500"
                            title="Regenerate Entropy"
                        >
                            <RefreshCcw className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-10 glass rounded-[3rem] border-[var(--border-primary)] space-y-8 shadow-sm bg-[var(--bg-secondary)]/30">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pl-4">
                                <span>Complexity Gradient</span>
                                <span className="text-brand font-black font-mono text-3xl">{length}</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-3 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-brand shadow-inner"
                            />
                            <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] px-2 opacity-40">
                                <span>Basic</span>
                                <span>Resilient</span>
                                <span>Fortress</span>
                            </div>
                        </div>

                        <div className={`p-8 glass rounded-[2.5rem] border-[var(--border-primary)] flex items-center justify-between shadow-sm bg-[var(--bg-secondary)]/40 transition-all hover:bg-[var(--bg-secondary)]/60`}>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">Engine Integrity</span>
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full border shadow-sm transition-all", strengthColor, password.length >= 16 ? "bg-green-500/10 border-green-500/20 shadow-green-500/10" : password.length >= 12 ? "bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/10" : "bg-red-500/10 border-red-500/20 shadow-red-500/10")}>{strength} Archetype</span>
                        </div>
                    </div>

                    <div className="p-10 glass rounded-[3.5rem] space-y-10 border-[var(--border-primary)] shadow-sm bg-[var(--bg-secondary)]/30">
                        <h3 className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.4em] pl-4">Logic Control Gates</h3>
                        <div className="space-y-8">
                            {Object.entries(options).map(([key, val]) => (
                                <label key={key} className="flex items-center justify-between cursor-pointer group px-4 hover:translate-x-1 transition-transform">
                                    <span className="text-[11px] font-black text-[var(--text-secondary)] group-hover:text-brand uppercase tracking-[0.15em] transition-colors capitalize">{key} Primitives</span>
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={val}
                                            onChange={() => setOptions({ ...options, [key]: !val })}
                                        />
                                        <div className="w-14 h-7 bg-[var(--input-bg)] border border-[var(--border-primary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[var(--text-muted)] peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand peer-checked:border-brand shadow-inner"></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
