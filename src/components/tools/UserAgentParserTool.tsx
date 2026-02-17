import { useMemo } from 'react'
import { Fingerprint } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type UAResult = {
    userAgent: string
    platform: string
    language: string
    languages: string[]
    mobile: boolean
    browserGuess: string
    osGuess: string
}

function guessBrowser(ua: string) {
    const u = ua.toLowerCase()
    if (u.includes('edg/')) return 'Microsoft Edge'
    if (u.includes('opr/') || u.includes('opera')) return 'Opera'
    if (u.includes('chrome/') && !u.includes('chromium') && !u.includes('edg/')) return 'Google Chrome'
    if (u.includes('safari/') && !u.includes('chrome/')) return 'Safari'
    if (u.includes('firefox/')) return 'Firefox'
    return 'Unknown'
}

function guessOS(ua: string) {
    const u = ua.toLowerCase()
    if (u.includes('windows nt')) return 'Windows'
    if (u.includes('android')) return 'Android'
    if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) return 'iOS'
    if (u.includes('mac os x') || u.includes('macintosh')) return 'macOS'
    if (u.includes('linux')) return 'Linux'
    return 'Unknown'
}

export function UserAgentParserTool() {
    const [input, setInput] = usePersistentState('ua_parser_input', '')

    const effectiveUa = input.trim() || navigator.userAgent

    const parsed = useMemo<UAResult>(() => {
        const ua = effectiveUa
        const platform = navigator.platform || ''
        const language = navigator.language || ''
        const languages = navigator.languages ? Array.from(navigator.languages) : []
        const mobile = /mobi|android|iphone|ipad/i.test(ua)
        const browserGuess = guessBrowser(ua)
        const osGuess = guessOS(ua)

        return { userAgent: ua, platform, language, languages, mobile, browserGuess, osGuess }
    }, [effectiveUa])

    const output = useMemo(() => JSON.stringify(parsed, null, 2), [parsed])

    return (
        <ToolLayout
            title="User Agent Parser"
            description="Parse and inspect a user-agent string locally."
            icon={Fingerprint}
            onReset={() => setInput('')}
            onCopy={() => copyToClipboard(output)}
        >
            <div className="space-y-6">
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">User-Agent</label>
                    <textarea
                        className="h-[140px] font-mono text-sm resize-none"
                        placeholder="Leave empty to use your current browser UA..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">If blank, uses navigator.userAgent</p>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
