import { useMemo, useState, useRef } from 'react'
import { Globe, Upload, Copy, CheckCircle, BookOpen, Search, ArrowUpDown, RefreshCw } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced status code type
type StatusRow = {
    code: number
    reason: string
    category: 'Informational' | 'Success' | 'Redirection' | 'Client Error' | 'Server Error'
    description: string
    rfc?: string
    examples?: string[]
    commonCauses?: string[]
    solutions?: string[]
    relatedCodes?: number[]
}

// Comprehensive HTTP status codes database
const STATUSES: StatusRow[] = [
    // 1xx Informational
    { code: 100, reason: 'Continue', category: 'Informational', description: 'Initial part of a request has been received and has not yet been rejected.', rfc: 'RFC 7231', examples: ['PUT request with Expect header'], commonCauses: ['Large uploads', 'Continue header'], solutions: ['Continue with request', 'Check headers'] },
    { code: 101, reason: 'Switching Protocols', category: 'Informational', description: 'Server is switching protocols as requested by the client.', rfc: 'RFC 7231', examples: ['WebSocket upgrade'], commonCauses: ['Protocol upgrade request'], solutions: ['Switch to new protocol'] },
    { code: 102, reason: 'Processing', category: 'Informational', description: 'Server has received and is processing the request, but no response is available yet.', rfc: 'RFC 2518', examples: ['WebDAV operations'], commonCauses: ['Long-running operations'], solutions: ['Wait for completion'] },
    { code: 103, reason: 'Early Hints', category: 'Informational', description: 'Used to return some response headers before final HTTP message.', rfc: 'RFC 8297', examples: ['Preloading resources'], commonCauses: ['Performance optimization'], solutions: ['Process early hints'] },

    // 2xx Success
    { code: 200, reason: 'OK', category: 'Success', description: 'The request has succeeded.', rfc: 'RFC 7231', examples: ['GET /api/users'], commonCauses: ['Successful request'], solutions: ['Process response data'] },
    { code: 201, reason: 'Created', category: 'Success', description: 'The request has been fulfilled and has resulted in one or more new resources being created.', rfc: 'RFC 7231', examples: ['POST /api/users'], commonCauses: ['Resource creation'], solutions: ['Check Location header'] },
    { code: 202, reason: 'Accepted', category: 'Success', description: 'The request has been accepted for processing, but the processing has not been completed.', rfc: 'RFC 7231', examples: ['Async operations'], commonCauses: ['Background processing'], solutions: ['Check status later'] },
    { code: 203, reason: 'Non-Authoritative Information', category: 'Success', description: 'The returned metainformation is not the definitive set as available from the origin server.', rfc: 'RFC 7231', examples: ['Proxy responses'], commonCauses: ['Proxy modification'], solutions: ['Verify with origin'] },
    { code: 204, reason: 'No Content', category: 'Success', description: 'The server successfully processed the request and is not returning any content.', rfc: 'RFC 7231', examples: ['DELETE /api/users/1'], commonCauses: ['Successful deletion'], solutions: ['No action needed'] },
    { code: 205, reason: 'Reset Content', category: 'Success', description: 'The server has fulfilled the request and desires that the client reset the document view.', rfc: 'RFC 7231', examples: ['Form reset'], commonCauses: ['View reset needed'], solutions: ['Reset UI state'] },
    { code: 206, reason: 'Partial Content', category: 'Success', description: 'The server is delivering only part of the resource due to a range header sent by the client.', rfc: 'RFC 7233', examples: ['Video streaming'], commonCauses: ['Range requests'], solutions: ['Handle partial data'] },

    // 3xx Redirection
    { code: 300, reason: 'Multiple Choices', category: 'Redirection', description: 'The request has more than one possible response.', rfc: 'RFC 7231', examples: ['Content negotiation'], commonCauses: ['Multiple representations'], solutions: ['Choose preferred option'] },
    { code: 301, reason: 'Moved Permanently', category: 'Redirection', description: 'The requested resource has been assigned a new permanent URI.', rfc: 'RFC 7231', examples: ['URL changes'], commonCauses: ['Permanent relocation'], solutions: ['Update bookmarks'] },
    { code: 302, reason: 'Found', category: 'Redirection', description: 'The requested resource resides temporarily under a different URI.', rfc: 'RFC 7231', examples: ['Temporary redirects'], commonCauses: ['Temporary relocation'], solutions: ['Follow redirect'] },
    { code: 303, reason: 'See Other', category: 'Redirection', description: 'The response to the request can be found at another URI.', rfc: 'RFC 7231', examples: ['POST to GET redirect'], commonCauses: ['Method change'], solutions: ['Use GET on new URL'] },
    { code: 304, reason: 'Not Modified', category: 'Redirection', description: 'Indicates that the resource has not been modified since the version specified by request headers.', rfc: 'RFC 7232', examples: ['Cache validation'], commonCauses: ['Cached content'], solutions: ['Use cached version'] },
    { code: 305, reason: 'Use Proxy', category: 'Redirection', description: 'The requested resource MUST be accessed through the proxy given by the Location field.', rfc: 'RFC 7231', examples: ['Proxy configuration'], commonCauses: ['Proxy requirement'], solutions: ['Route through proxy'] },
    { code: 307, reason: 'Temporary Redirect', category: 'Redirection', description: 'The request should be repeated with another URI; future requests should still use the original URI.', rfc: 'RFC 7231', examples: ['Method-preserving redirect'], commonCauses: ['Temporary relocation'], solutions: ['Repeat with same method'] },
    { code: 308, reason: 'Permanent Redirect', category: 'Redirection', description: 'The request and all future requests should be repeated using another URI.', rfc: 'RFC 7538', examples: ['Permanent method-preserving redirect'], commonCauses: ['Permanent relocation'], solutions: ['Update URLs permanently'] },

    // 4xx Client Error
    { code: 400, reason: 'Bad Request', category: 'Client Error', description: 'The server cannot or will not process the request due to a client error.', rfc: 'RFC 7231', examples: ['Invalid JSON'], commonCauses: ['Malformed request', 'Invalid syntax'], solutions: ['Fix request format'] },
    { code: 401, reason: 'Unauthorized', category: 'Client Error', description: 'Authentication is required and has failed or has not yet been provided.', rfc: 'RFC 7235', examples: ['Missing API key'], commonCauses: ['No authentication', 'Invalid credentials'], solutions: ['Provide valid credentials'] },
    { code: 402, reason: 'Payment Required', category: 'Client Error', description: 'Reserved for future use.', rfc: 'RFC 7231', examples: ['Payment APIs'], commonCauses: ['Payment required'], solutions: ['Provide payment'] },
    { code: 403, reason: 'Forbidden', category: 'Client Error', description: 'The server understood the request, but refuses to authorize it.', rfc: 'RFC 7231', examples: ['Access denied'], commonCauses: ['Insufficient permissions'], solutions: ['Check permissions'] },
    { code: 404, reason: 'Not Found', category: 'Client Error', description: 'The server cannot find the requested resource.', rfc: 'RFC 7231', examples: ['Invalid URL'], commonCauses: ['Resource doesn\' exist', 'Wrong URL'], solutions: ['Verify URL', 'Check resource'] },
    { code: 405, reason: 'Method Not Allowed', category: 'Client Error', description: 'The method specified is not allowed for the requested resource.', rfc: 'RFC 7231', examples: ['POST to read-only endpoint'], commonCauses: ['Wrong HTTP method'], solutions: ['Use correct method'] },
    { code: 406, reason: 'Not Acceptable', category: 'Client Error', description: 'The requested resource cannot produce a response matching the list of acceptable values.', rfc: 'RFC 7231', examples: ['Unsupported format'], commonCauses: ['Content negotiation failure'], solutions: ['Adjust Accept header'] },
    { code: 407, reason: 'Proxy Authentication Required', category: 'Client Error', description: 'Authentication with the proxy is required.', rfc: 'RFC 7235', examples: ['Proxy access'], commonCauses: ['Proxy authentication'], solutions: ['Authenticate with proxy'] },
    { code: 408, reason: 'Request Timeout', category: 'Client Error', description: 'The server timed out waiting for the request.', rfc: 'RFC 7231', examples: ['Slow client'], commonCauses: ['Client too slow'], solutions: ['Increase timeout'] },
    { code: 409, reason: 'Conflict', category: 'Client Error', description: 'The request conflicts with the current state of the server.', rfc: 'RFC 7231', examples: ['Concurrent modification'], commonCauses: ['Resource conflict'], solutions: ['Resolve conflict'] },
    { code: 410, reason: 'Gone', category: 'Client Error', description: 'The requested resource is no longer available.', rfc: 'RFC 7231', examples: ['Deleted resource'], commonCauses: ['Resource removed'], solutions: ['Remove references'] },
    { code: 411, reason: 'Length Required', category: 'Client Error', description: 'The request requires a Content-Length header.', rfc: 'RFC 7231', examples: ['Missing Content-Length'], commonCauses: ['No length header'], solutions: ['Add Content-Length'] },
    { code: 412, reason: 'Precondition Failed', category: 'Client Error', description: 'One or more preconditions given in the request header fields evaluated to false.', rfc: 'RFC 7232', examples: ['If-Match failure'], commonCauses: ['Precondition not met'], solutions: ['Check preconditions'] },
    { code: 413, reason: 'Payload Too Large', category: 'Client Error', description: 'Request entity is larger than limits defined by server.', rfc: 'RFC 7231', examples: ['Large file upload'], commonCauses: ['Request too large'], solutions: ['Reduce payload size'] },
    { code: 414, reason: 'URI Too Long', category: 'Client Error', description: 'The URI provided was too long for the server to process.', rfc: 'RFC 7231', examples: ['Very long URL'], commonCauses: ['URL too long'], solutions: ['Shorten URL'] },
    { code: 415, reason: 'Unsupported Media Type', category: 'Client Error', description: 'The media format of the requested data is not supported.', rfc: 'RFC 7231', examples: ['Wrong content type'], commonCauses: ['Unsupported format'], solutions: ['Use supported format'] },
    { code: 416, reason: 'Range Not Satisfiable', category: 'Client Error', description: 'The range specified by the Range header field in the request cannot be fulfilled.', rfc: 'RFC 7233', examples: ['Invalid range'], commonCauses: ['Invalid range request'], solutions: ['Fix range header'] },
    { code: 417, reason: 'Expectation Failed', category: 'Client Error', description: 'The expectation given in the Expect request header could not be met.', rfc: 'RFC 7231', examples: ['Expect header failure'], commonCauses: ['Expectation not met'], solutions: ['Remove Expect header'] },
    { code: 418, reason: "I'm a teapot", category: 'Client Error', description: 'A playful code defined by RFC 2324.', rfc: 'RFC 2324', examples: ['April Fools'], commonCauses: ['Easter egg'], solutions: ['Brew coffee'] },
    { code: 421, reason: 'Misdirected Request', category: 'Client Error', description: 'The request was directed at a server that is not able to produce a response.', rfc: 'RFC 7540', examples: ['Wrong server'], commonCauses: ['Server misconfiguration'], solutions: ['Correct routing'] },
    { code: 422, reason: 'Unprocessable Content', category: 'Client Error', description: 'The server understands the content type and syntax, but cannot process the contained instructions.', rfc: 'RFC 4918', examples: ['Validation errors'], commonCauses: ['Semantic errors'], solutions: ['Fix content'] },
    { code: 423, reason: 'Locked', category: 'Client Error', description: 'The resource that is being accessed is locked.', rfc: 'RFC 4918', examples: ['Resource locked'], commonCauses: ['Resource in use'], solutions: ['Wait for unlock'] },
    { code: 424, reason: 'Failed Dependency', category: 'Client Error', description: 'The request failed due to failure of a previous request.', rfc: 'RFC 4918', examples: ['Dependent operation failed'], commonCauses: ['Dependency failure'], solutions: ['Fix dependency'] },
    { code: 425, reason: 'Too Early', category: 'Client Error', description: 'The server is unwilling to risk processing a request that might be replayed.', rfc: 'RFC 8470', examples: ['Idempotency concerns'], commonCauses: ['Replay risk'], solutions: ['Retry later'] },
    { code: 426, reason: 'Upgrade Required', category: 'Client Error', description: 'The server refuses to perform the request using the current protocol.', rfc: 'RFC 7231', examples: ['Protocol upgrade'], commonCauses: ['Protocol required'], solutions: ['Upgrade protocol'] },
    { code: 428, reason: 'Precondition Required', category: 'Client Error', description: 'The origin server requires the request to be conditional.', rfc: 'RFC 6585', examples: ['Missing conditional header'], commonCauses: ['Conditional request required'], solutions: ['Add conditional header'] },
    { code: 429, reason: 'Too Many Requests', category: 'Client Error', description: 'The user has sent too many requests in a given amount of time.', rfc: 'RFC 6585', examples: ['Rate limiting'], commonCauses: ['Rate limit exceeded'], solutions: ['Reduce request rate'] },
    { code: 431, reason: 'Request Header Fields Too Large', category: 'Client Error', description: 'The server is unwilling to process the request because its header fields are too large.', rfc: 'RFC 6585', examples: ['Large headers'], commonCauses: ['Headers too big'], solutions: ['Reduce header size'] },
    { code: 451, reason: 'Unavailable For Legal Reasons', category: 'Client Error', description: 'The server is denying access for legal reasons.', rfc: 'RFC 7725', examples: ['Legal restrictions'], commonCauses: ['Legal requirements'], solutions: ['Contact legal'] },

    // 5xx Server Error
    { code: 500, reason: 'Internal Server Error', category: 'Server Error', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.', rfc: 'RFC 7231', examples: ['Application crash'], commonCauses: ['Server error', 'Bug'], solutions: ['Check server logs'] },
    { code: 501, reason: 'Not Implemented', category: 'Server Error', description: 'The server does not support the functionality required to fulfill the request.', rfc: 'RFC 7231', examples: ['Unsupported feature'], commonCauses: ['Feature not implemented'], solutions: ['Implement feature'] },
    { code: 502, reason: 'Bad Gateway', category: 'Server Error', description: 'The server received an invalid response from the upstream server.', rfc: 'RFC 7231', examples: ['Upstream server error'], commonCauses: ['Upstream failure'], solutions: ['Check upstream server'] },
    { code: 503, reason: 'Service Unavailable', category: 'Server Error', description: 'The server is not ready to handle the request.', rfc: 'RFC 7231', examples: ['Server maintenance'], commonCauses: ['Server down', 'Maintenance'], solutions: ['Wait and retry'] },
    { code: 504, reason: 'Gateway Timeout', category: 'Server Error', description: 'The server did not receive a timely response from an upstream server.', rfc: 'RFC 7231', examples: ['Upstream timeout'], commonCauses: ['Upserver timeout'], solutions: ['Increase timeout'] },
    { code: 505, reason: 'HTTP Version Not Supported', category: 'Server Error', description: 'The server does not support the HTTP protocol version used in the request.', rfc: 'RFC 7231', examples: ['Unsupported HTTP version'], commonCauses: ['Protocol version mismatch'], solutions: ['Use supported version'] },
    { code: 506, reason: 'Variant Also Negotiates', category: 'Server Error', description: 'The server has an internal configuration error.', rfc: 'RFC 2295', examples: ['Content negotiation error'], commonCauses: ['Negotiation error'], solutions: ['Fix configuration'] },
    { code: 507, reason: 'Insufficient Storage', category: 'Server Error', description: 'The server is unable to store the representation needed to complete the request.', rfc: 'RFC 4918', examples: ['Disk full'], commonCauses: ['Storage full'], solutions: ['Free up space'] },
    { code: 508, reason: 'Loop Detected', category: 'Server Error', description: 'The server detected an infinite loop while processing the request.', rfc: 'RFC 5842', examples: ['Redirect loop'], commonCauses: ['Infinite loop'], solutions: ['Break loop'] },
    { code: 510, reason: 'Not Extended', category: 'Server Error', description: 'Further extensions to the request are required for the server to fulfill it.', rfc: 'RFC 2774', examples: ['Missing extensions'], commonCauses: ['Extensions required'], solutions: ['Add extensions'] },
    { code: 511, reason: 'Network Authentication Required', category: 'Server Error', description: 'The client needs to authenticate to gain network access.', rfc: 'RFC 6585', examples: ['Network authentication'], commonCauses: ['Network auth required'], solutions: ['Authenticate with network'] }
]

// Helper functions
function getCategoryColor(category: string) {
    const colors = {
        'Informational': 'text-blue-400',
        'Success': 'text-green-400',
        'Redirection': 'text-yellow-400',
        'Client Error': 'text-orange-400',
        'Server Error': 'text-red-400'
    }
    return colors[category as keyof typeof colors] || 'text-gray-400'
}

function getCategoryBgColor(category: string) {
    const colors = {
        'Informational': 'bg-blue-500/10 border-blue-500/30',
        'Success': 'bg-green-500/10 border-green-500/30',
        'Redirection': 'bg-yellow-500/10 border-yellow-500/30',
        'Client Error': 'bg-orange-500/10 border-orange-500/30',
        'Server Error': 'bg-red-500/10 border-red-500/30'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 border-gray-500/30'
}

function getStatusCodeRange(code: number) {
    if (code >= 100 && code < 200) return '1xx'
    if (code >= 200 && code < 300) return '2xx'
    if (code >= 300 && code < 400) return '3xx'
    if (code >= 400 && code < 500) return '4xx'
    if (code >= 500 && code < 600) return '5xx'
    return 'Unknown'
}

function searchStatusCodes(statuses: StatusRow[], query: string, category: string, range: string) {
    const q = query.trim().toLowerCase()
    return statuses.filter((s) => {
        const matchesQuery = !q || 
            String(s.code).includes(q) ||
            s.reason.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            (s.rfc && s.rfc.toLowerCase().includes(q))
        
        const matchesCategory = !category || category === 'all' || s.category === category
        const matchesRange = !range || range === 'all' || getStatusCodeRange(s.code) === range
        
        return matchesQuery && matchesCategory && matchesRange
    })
}

function getCategories() {
    return ['all', 'Informational', 'Success', 'Redirection', 'Client Error', 'Server Error']
}

function getRanges() {
    return ['all', '1xx', '2xx', '3xx', '4xx', '5xx']
}

function sortByCode(statuses: StatusRow[], order: 'asc' | 'desc') {
    return [...statuses].sort((a, b) => order === 'asc' ? a.code - b.code : b.code - a.code)
}

export function HttpStatusCodesTool() {
    const [query, setQuery] = usePersistentState('http_status_query', '')
    const [selectedCategory, setSelectedCategory] = usePersistentState('http_status_category', 'all')
    const [selectedRange, setSelectedRange] = usePersistentState('http_status_range', 'all')
    const [sortOrder, setSortOrder] = usePersistentState<'asc' | 'desc'>('http_status_sort', 'asc')
    const [showDetails, setShowDetails] = useState(false)
    const [copied, setCopied] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<StatusRow | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedFiltered = useMemo(() => {
        let results = searchStatusCodes(STATUSES, query, selectedCategory, selectedRange)
        results = sortByCode(results, sortOrder)
        return results
    }, [query, selectedCategory, selectedRange, sortOrder])

    const exportText = useMemo(() => {
        if (enhancedFiltered.length === 0) return ''
        return enhancedFiltered.map((s) => `${s.code}\t${s.reason}\t${s.category}\t${s.description}${s.rfc ? `\t${s.rfc}` : ''}`).join('\n')
    }, [enhancedFiltered])

    const handleCopy = async () => {
        if (exportText) {
            await copyToClipboard(exportText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                // Parse status codes from file
                const lines = content.split('\n')
                const firstCode = lines.find(line => /^\d{3}/.test(line))
                if (firstCode) {
                    const code = parseInt(firstCode.match(/^\d{3}/)?.[0] || '404')
                    setQuery(code.toString())
                }
            }
            reader.readAsText(file)
        })
    }

    const selectRandomStatus = () => {
        const randomStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)]
        setSelectedStatus(randomStatus)
        setQuery(randomStatus.code.toString())
    }

    return (
        <ToolLayout
            title="HTTP Status Codes Pro"
            description="Comprehensive HTTP status codes reference with advanced search, filtering, and detailed analysis."
            icon={Globe}
            onReset={() => setQuery('')}
            onCopy={exportText ? handleCopy : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">HTTP Status Codes</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Comprehensive reference with advanced search and filtering</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.log,.csv"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                    </button>

                    <button
                        onClick={selectRandomStatus}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Random</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!exportText}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showDetails 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Details</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Search</label>
                        <div className="relative">
                            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Code, reason, category..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-5 pr-5 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        >
                            {getCategories().map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Range</label>
                        <select
                            value={selectedRange}
                            onChange={(e) => setSelectedRange(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        >
                            {getRanges().map(range => (
                                <option key={range} value={range}>
                                    {range === 'all' ? 'All Ranges' : range}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Sort</label>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm hover:border-brand/40 transition-all"
                        >
                            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Status Details */}
                {showDetails && selectedStatus && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Status Details</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className={`text-2xl font-black ${getCategoryColor(selectedStatus.category)}`}>
                                        {selectedStatus.code}
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-[var(--text-primary)]">{selectedStatus.reason}</div>
                                        <div className={`text-xs font-bold ${getCategoryColor(selectedStatus.category)}`}>
                                            {selectedStatus.category}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Description</div>
                                        <div className="text-sm text-[var(--text-primary)]">{selectedStatus.description}</div>
                                    </div>
                                    
                                    {selectedStatus.rfc && (
                                        <div>
                                            <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">RFC</div>
                                            <div className="text-sm text-blue-400 font-mono">{selectedStatus.rfc}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {selectedStatus.examples && selectedStatus.examples.length > 0 && (
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Examples</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStatus.examples.map((example, idx) => (
                                                <div key={idx} className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                                    {example}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedStatus.commonCauses && selectedStatus.commonCauses.length > 0 && (
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Common Causes</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStatus.commonCauses.map((cause, idx) => (
                                                <div key={idx} className="px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-400">
                                                    {cause}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedStatus.solutions && selectedStatus.solutions.length > 0 && (
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Solutions</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStatus.solutions.map((solution, idx) => (
                                                <div key={idx} className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                                                    {solution}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner overflow-hidden">
                    <div className="max-h-[600px] overflow-auto custom-scrollbar">
                        <table className="w-full text-xs font-mono text-[var(--text-primary)]">
                            <thead className="sticky top-0 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border-primary)] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                                <tr>
                                    <th className="text-left p-4 w-[90px]">Code</th>
                                    <th className="text-left p-4 w-[200px]">Reason</th>
                                    <th className="text-left p-4 w-[160px]">Category</th>
                                    <th className="text-left p-4">Description</th>
                                    {showDetails && <th className="text-left p-4 w-[100px]">RFC</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {enhancedFiltered.length === 0 ? (
                                    <tr>
                                        <td className="p-8 text-[var(--text-muted)] italic" colSpan={showDetails ? 5 : 4}>
                                            No matches found. Try adjusting your search or filters.
                                        </td>
                                    </tr>
                                ) : (
                                    enhancedFiltered.map((s: StatusRow) => (
                                        <tr 
                                            key={s.code} 
                                            className="border-t border-[var(--border-primary)]/40 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedStatus(s)}
                                        >
                                            <td className="p-4 font-black">{s.code}</td>
                                            <td className="p-4">{s.reason}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${getCategoryBgColor(s.category)} ${getCategoryColor(s.category)}`}>
                                                    {s.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--text-secondary)]">{s.description}</td>
                                            {showDetails && (
                                                <td className="p-4">
                                                    {s.rfc && (
                                                        <span className="text-blue-400 font-mono text-xs">{s.rfc}</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 glass rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="text-lg font-black text-blue-400">{STATUSES.filter(s => s.category === 'Informational').length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">1xx Informational</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="text-lg font-black text-green-400">{STATUSES.filter(s => s.category === 'Success').length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">2xx Success</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="text-lg font-black text-yellow-400">{STATUSES.filter(s => s.category === 'Redirection').length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">3xx Redirection</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="text-lg font-black text-orange-400">{STATUSES.filter(s => s.category === 'Client Error').length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">4xx Client Error</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="text-lg font-black text-red-400">{STATUSES.filter(s => s.category === 'Server Error').length}</div>
                        <div className="text-xs text-[var(--text-secondary)]">5xx Server Error</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
