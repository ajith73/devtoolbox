import { useMemo } from 'react'
import { Link } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function safeParseUrl(input: string) {
    const trimmed = input.trim()
    if (!trimmed) return null
    try {
        return new URL(trimmed)
    } catch {
        try {
            return new URL(trimmed, 'https://example.com')
        } catch {
            return null
        }
    }
}

export function UrlParserTool() {
    const [input, setInput] = usePersistentState('url_parser_input', '')

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null }

        const url = safeParseUrl(input)
        if (!url) return { output: '', error: 'Invalid URL' }

        const params: Record<string, string[]> = {}
        url.searchParams.forEach((value, key) => {
            params[key] = params[key] ? [...params[key], value] : [value]
        })

        const parsed = {
            href: url.href,
            origin: url.origin,
            protocol: url.protocol,
            username: url.username,
            password: url.password ? '***' : '',
            host: url.host,
            hostname: url.hostname,
            port: url.port,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            query: params,
        }

        return { output: JSON.stringify(parsed, null, 2), error: null as string | null }
    }, [input])

    return (
        <ToolLayout
            title="URL Parser"
            description="Parse a URL into its components and query parameters."
            icon={Link}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {computed.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input URL</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder="https://example.com/path?x=1&x=2#section"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Relative URLs are resolved against https://example.com</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Parsed</label>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
