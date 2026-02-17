import { useMemo } from 'react'
import { Calculator } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function ipToInt(ip: string) {
    const parts = ip.trim().split('.')
    if (parts.length !== 4) throw new Error('Invalid IPv4')
    const nums = parts.map((p) => {
        const n = Number(p)
        if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('Invalid IPv4')
        return n
    })
    return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3]
}

function intToIp(v: number) {
    return [
        (v >>> 24) & 255,
        (v >>> 16) & 255,
        (v >>> 8) & 255,
        v & 255,
    ].join('.')
}

function maskFromCidr(cidr: number) {
    if (cidr < 0 || cidr > 32) throw new Error('CIDR must be 0-32')
    if (cidr === 0) return 0
    return (0xffffffff << (32 - cidr)) >>> 0
}

function countHosts(cidr: number) {
    const hostBits = 32 - cidr
    if (hostBits <= 0) return 1
    return 2 ** hostBits
}

export function SubnetCalculatorTool() {
    const [input, setInput] = usePersistentState('subnet_input', '192.168.1.10/24')

    const computed = useMemo(() => {
        const raw = input.trim()
        if (!raw) return { error: null as string | null, data: null as any }

        try {
            const [ipPart, cidrPart] = raw.includes('/') ? raw.split('/') : [raw, '32']
            const cidr = Number(cidrPart)
            if (!Number.isInteger(cidr)) throw new Error('Invalid CIDR')
            const ipInt = ipToInt(ipPart)
            const mask = maskFromCidr(cidr)
            const network = (ipInt & mask) >>> 0
            const broadcast = (network | (~mask >>> 0)) >>> 0
            const total = countHosts(cidr)

            const firstUsable = cidr >= 31 ? network : (network + 1) >>> 0
            const lastUsable = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0
            const usableCount = cidr >= 31 ? total : Math.max(0, total - 2)

            const wildcard = (~mask) >>> 0

            const data = {
                input: raw,
                ip: intToIp(ipInt),
                cidr,
                subnetMask: intToIp(mask),
                wildcardMask: intToIp(wildcard),
                networkAddress: intToIp(network),
                broadcastAddress: intToIp(broadcast),
                firstUsable: intToIp(firstUsable),
                lastUsable: intToIp(lastUsable),
                totalAddresses: total,
                usableAddresses: usableCount,
            }

            return { error: null as string | null, data }
        } catch (e: any) {
            return { error: e?.message || 'Invalid input', data: null as any }
        }
    }, [input])

    const exportText = useMemo(() => {
        if (!computed.data) return ''
        return JSON.stringify(computed.data, null, 2)
    }, [computed.data])

    return (
        <ToolLayout
            title="Subnet Calculator"
            description="Calculate IPv4 subnet details from IP/CIDR."
            icon={Calculator}
            onReset={() => setInput('')}
            onCopy={exportText ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{computed.error}</div>
                )}

                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">IP / CIDR</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="192.168.1.10/24"
                    />
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Examples: 10.0.0.1/8, 172.16.0.1/12, 192.168.1.10/24</p>
                </div>

                <div className="glass rounded-[2.5rem] border-[var(--border-primary)] p-8 bg-[var(--bg-secondary)]/30">
                    {computed.data ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Row k="Subnet Mask" v={computed.data.subnetMask} />
                            <Row k="Wildcard Mask" v={computed.data.wildcardMask} />
                            <Row k="Network Address" v={computed.data.networkAddress} />
                            <Row k="Broadcast Address" v={computed.data.broadcastAddress} />
                            <Row k="First Usable" v={computed.data.firstUsable} />
                            <Row k="Last Usable" v={computed.data.lastUsable} />
                            <Row k="Total Addresses" v={String(computed.data.totalAddresses)} />
                            <Row k="Usable Addresses" v={String(computed.data.usableAddresses)} />
                        </div>
                    ) : (
                        <div className="text-[var(--text-muted)] opacity-30 italic">Enter an IP/CIDR to calculate...</div>
                    )}
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[420px]">
                        {exportText || <span className="text-[var(--text-muted)] opacity-30 italic">JSON output will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}

function Row({ k, v }: { k: string, v: string }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{k}</div>
            <div className="mt-2 text-sm font-bold text-[var(--text-primary)] font-mono break-words">{v}</div>
        </div>
    )
}
