import { useMemo } from 'react'
import { Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function isValidIPv4(ip: string) {
    const parts = ip.trim().split('.')
    if (parts.length !== 4) return false
    return parts.every((p) => {
        if (!/^\d+$/.test(p)) return false
        const n = Number(p)
        return n >= 0 && n <= 255
    })
}

function isValidIPv6(ip: string) {
    // Simple check; not a full RFC implementation but good enough for validation UI
    const v = ip.trim()
    if (!v) return false
    if (!/^[0-9a-fA-F:]+$/.test(v)) return false
    if (v.split(':').length < 3) return false
    return true
}

export function IpValidatorTool() {
    const [input, setInput] = usePersistentState('ip_validator_input', '')

    const computed = useMemo(() => {
        const v = input.trim()
        if (!v) return { output: '', valid: null as boolean | null }

        const ipv4 = isValidIPv4(v)
        const ipv6 = !ipv4 && isValidIPv6(v)
        const valid = ipv4 || ipv6
        const kind = ipv4 ? 'IPv4' : ipv6 ? 'IPv6' : 'Invalid'
        const output = JSON.stringify({ input: v, valid, type: kind }, null, 2)
        return { output, valid }
    }, [input])

    return (
        <ToolLayout
            title="IP Validator"
            description="Validate IPv4/IPv6 addresses locally."
            icon={Globe}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">IP Address</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="8.8.8.8 or 2001:4860:4860::8888"
                    />
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
