import { useMemo } from 'react'
import { Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type StatusRow = {
    code: number
    reason: string
    category: 'Informational' | 'Success' | 'Redirection' | 'Client Error' | 'Server Error'
    description: string
}

const STATUSES: StatusRow[] = [
    { code: 100, reason: 'Continue', category: 'Informational', description: 'Initial part of a request has been received and has not yet been rejected.' },
    { code: 101, reason: 'Switching Protocols', category: 'Informational', description: 'Server is switching protocols as requested by the client.' },
    { code: 102, reason: 'Processing', category: 'Informational', description: 'Server has received and is processing the request, but no response is available yet.' },
    { code: 103, reason: 'Early Hints', category: 'Informational', description: 'Used to return some response headers before final HTTP message.' },

    { code: 200, reason: 'OK', category: 'Success', description: 'The request has succeeded.' },
    { code: 201, reason: 'Created', category: 'Success', description: 'The request has been fulfilled and has resulted in one or more new resources being created.' },
    { code: 202, reason: 'Accepted', category: 'Success', description: 'The request has been accepted for processing, but the processing has not been completed.' },
    { code: 204, reason: 'No Content', category: 'Success', description: 'The server successfully processed the request and is not returning any content.' },
    { code: 206, reason: 'Partial Content', category: 'Success', description: 'The server is delivering only part of the resource due to a range header sent by the client.' },

    { code: 301, reason: 'Moved Permanently', category: 'Redirection', description: 'The requested resource has been assigned a new permanent URI.' },
    { code: 302, reason: 'Found', category: 'Redirection', description: 'The requested resource resides temporarily under a different URI.' },
    { code: 304, reason: 'Not Modified', category: 'Redirection', description: 'Indicates that the resource has not been modified since the version specified by request headers.' },
    { code: 307, reason: 'Temporary Redirect', category: 'Redirection', description: 'The request should be repeated with another URI; future requests should still use the original URI.' },
    { code: 308, reason: 'Permanent Redirect', category: 'Redirection', description: 'The request and all future requests should be repeated using another URI.' },

    { code: 400, reason: 'Bad Request', category: 'Client Error', description: 'The server cannot or will not process the request due to a client error.' },
    { code: 401, reason: 'Unauthorized', category: 'Client Error', description: 'Authentication is required and has failed or has not yet been provided.' },
    { code: 403, reason: 'Forbidden', category: 'Client Error', description: 'The server understood the request, but refuses to authorize it.' },
    { code: 404, reason: 'Not Found', category: 'Client Error', description: 'The server cannot find the requested resource.' },
    { code: 405, reason: 'Method Not Allowed', category: 'Client Error', description: 'The method specified is not allowed for the requested resource.' },
    { code: 408, reason: 'Request Timeout', category: 'Client Error', description: 'The server timed out waiting for the request.' },
    { code: 409, reason: 'Conflict', category: 'Client Error', description: 'The request conflicts with the current state of the server.' },
    { code: 410, reason: 'Gone', category: 'Client Error', description: 'The requested resource is no longer available.' },
    { code: 413, reason: 'Payload Too Large', category: 'Client Error', description: 'Request entity is larger than limits defined by server.' },
    { code: 415, reason: 'Unsupported Media Type', category: 'Client Error', description: 'The media format of the requested data is not supported.' },
    { code: 418, reason: "I'm a teapot", category: 'Client Error', description: 'A playful code defined by RFC 2324.' },
    { code: 422, reason: 'Unprocessable Content', category: 'Client Error', description: 'The server understands the content type and syntax, but cannot process the contained instructions.' },
    { code: 429, reason: 'Too Many Requests', category: 'Client Error', description: 'The user has sent too many requests in a given amount of time.' },

    { code: 500, reason: 'Internal Server Error', category: 'Server Error', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.' },
    { code: 501, reason: 'Not Implemented', category: 'Server Error', description: 'The server does not support the functionality required to fulfill the request.' },
    { code: 502, reason: 'Bad Gateway', category: 'Server Error', description: 'The server received an invalid response from the upstream server.' },
    { code: 503, reason: 'Service Unavailable', category: 'Server Error', description: 'The server is not ready to handle the request.' },
    { code: 504, reason: 'Gateway Timeout', category: 'Server Error', description: 'The server did not receive a timely response from an upstream server.' },
]

export function HttpStatusCodesTool() {
    const [query, setQuery] = usePersistentState('http_status_query', '')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return STATUSES
        return STATUSES.filter((s) => {
            return (
                String(s.code).includes(q) ||
                s.reason.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            )
        })
    }, [query])

    const exportText = useMemo(() => {
        if (filtered.length === 0) return ''
        return filtered.map((s) => `${s.code}\t${s.reason}\t${s.category}\t${s.description}`).join('\n')
    }, [filtered])

    return (
        <ToolLayout
            title="HTTP Status Codes"
            description="Offline reference for common HTTP status codes with search."
            icon={Globe}
            onReset={() => setQuery('')}
            onCopy={exportText ? () => copyToClipboard(exportText) : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Search</label>
                    <input
                        type="text"
                        placeholder="Try: 404, unauthorized, client error..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Copy exports TSV: code, reason, category, description</p>
                </div>

                <div className="glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner overflow-hidden">
                    <div className="max-h-[520px] overflow-auto custom-scrollbar">
                        <table className="w-full text-xs font-mono text-[var(--text-primary)]">
                            <thead className="sticky top-0 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border-primary)] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                                <tr>
                                    <th className="text-left p-4 w-[90px]">Code</th>
                                    <th className="text-left p-4 w-[220px]">Reason</th>
                                    <th className="text-left p-4 w-[160px]">Category</th>
                                    <th className="text-left p-4">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td className="p-8 text-[var(--text-muted)] italic" colSpan={4}>No matches.</td>
                                    </tr>
                                ) : (
                                    filtered.map((s) => (
                                        <tr key={s.code} className="border-t border-[var(--border-primary)]/40">
                                            <td className="p-4 font-black">{s.code}</td>
                                            <td className="p-4">{s.reason}</td>
                                            <td className="p-4 text-[var(--text-secondary)]">{s.category}</td>
                                            <td className="p-4 text-[var(--text-secondary)]">{s.description}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
