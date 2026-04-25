import { useMemo, useState, useRef } from 'react'
import { Link, Upload, Copy, CheckCircle, FileText, Globe, Shield, Key, Zap, AlertCircle } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced URL parsing functions
function safeParseUrl(input: string, baseUrl?: string) {
    const trimmed = input.trim()
    if (!trimmed) return null
    try {
        return new URL(trimmed)
    } catch {
        try {
            return new URL(trimmed, baseUrl || 'https://example.com')
        } catch {
            return null
        }
    }
}

function validateUrl(url: URL) {
    const issues: string[] = []
    
    // Check for common issues
    if (!url.protocol || !['http:', 'https:', 'ftp:', 'file:', 'ws:', 'wss:'].includes(url.protocol)) {
        issues.push('Unusual or missing protocol')
    }
    
    if (!url.hostname) {
        issues.push('Missing hostname')
    }
    
    if (url.username && !url.password) {
        issues.push('Username without password')
    }
    
    if (url.port && (parseInt(url.port) < 1 || parseInt(url.port) > 65535)) {
        issues.push('Invalid port number')
    }
    
    // Check for suspicious patterns
    if (url.hostname.includes('..') || url.pathname.includes('..')) {
        issues.push('Path traversal detected')
    }
    
    if (url.hostname.includes('localhost') && url.protocol === 'http:') {
        issues.push('Insecure localhost connection')
    }
    
    return issues
}

function getSecurityInfo(url: URL) {
    const info = {
        secure: false,
        encrypted: false,
        hasAuth: false,
        hasCredentials: false,
        protocol: url.protocol,
        risks: [] as string[]
    }
    
    if (url.protocol === 'https:' || url.protocol === 'wss:') {
        info.secure = true
        info.encrypted = true
    }
    
    if (url.username || url.password) {
        info.hasAuth = true
        info.hasCredentials = true
        info.risks.push('Credentials in URL')
    }
    
    if (url.protocol === 'http:') {
        info.risks.push('Unencrypted connection')
    }
    
    if (url.hostname.includes('localhost') || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.')) {
        info.risks.push('Private network address')
    }
    
    return info
}

function encodeUrlComponent(component: string) {
    try {
        return encodeURIComponent(component)
    } catch {
        return component
    }
}

function decodeUrlComponent(component: string) {
    try {
        return decodeURIComponent(component)
    } catch {
        return component
    }
}

function formatQueryParams(params: URLSearchParams) {
    const formatted: Record<string, any> = {}
    
    params.forEach((value, key) => {
        // Try to detect if it's a number or boolean
        let parsedValue: any = value
        
        // Check for boolean
        if (value.toLowerCase() === 'true') {
            parsedValue = true
        } else if (value.toLowerCase() === 'false') {
            parsedValue = false
        }
        // Check for number
        else if (!isNaN(Number(value)) && value.trim() !== '') {
            parsedValue = Number(value)
        }
        // Check for JSON
        else if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
            try {
                parsedValue = JSON.parse(value)
            } catch {
                // Keep as string if not valid JSON
            }
        }
        
        if (formatted[key]) {
            // Convert to array if multiple values
            if (!Array.isArray(formatted[key])) {
                formatted[key] = [formatted[key]]
            }
            formatted[key].push(parsedValue)
        } else {
            formatted[key] = parsedValue
        }
    })
    
    return formatted
}

function getPathSegments(pathname: string) {
    return pathname.split('/').filter(segment => segment.length > 0)
}

function getFileExtension(pathname: string) {
    const lastSegment = pathname.split('/').pop() || ''
    const dotIndex = lastSegment.lastIndexOf('.')
    return dotIndex > 0 ? lastSegment.substring(dotIndex + 1) : ''
}

function getDomainInfo(hostname: string) {
    const parts = hostname.split('.')
    return {
        subdomain: parts.length > 2 ? parts.slice(0, -2).join('.') : '',
        domain: parts.length >= 2 ? parts.slice(-2).join('.') : hostname,
        tld: parts.length >= 1 ? parts[parts.length - 1] : '',
        isIp: /^\d+\.\d+\.\d+\.\d+$/.test(hostname),
        isLocalhost: hostname === 'localhost' || hostname.endsWith('.localhost')
    }
}

function getSampleUrls() {
    return [
        'https://api.example.com/v1/users?active=true&limit=10&sort=name#results',
        'ftp://user:pass@ftp.example.com:21/files/document.pdf',
        'ws://localhost:8080/socket?token=abc123&room=general',
        'https://sub.domain.example.co.uk/path/to/file.html?param=value&array[]=1&array[]=2#section',
        'http://192.168.1.1:3000/admin?debug=true&verbose=false'
    ]
}

export function UrlParserTool() {
    const [input, setInput] = usePersistentState('url_parser_input', '')
    const [showSecurity, setShowSecurity] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showEncoding, setShowEncoding] = useState(false)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedComputed = useMemo(() => {
        const startTime = performance.now()
        
        if (!input.trim()) {
            setProcessingTime(null)
            return { 
                output: '', 
                error: null as string | null, 
                url: null as URL | null,
                validation: [] as string[],
                security: null as any,
                advanced: null as any,
                encoding: null as any
            }
        }

        const url = safeParseUrl(input)
        if (!url) {
            setProcessingTime(null)
            return { 
                output: '', 
                error: 'Invalid URL', 
                url: null,
                validation: [],
                security: null,
                advanced: null,
                encoding: null
            }
        }

        const validation = validateUrl(url)
        const security = getSecurityInfo(url)
        const queryParams = formatQueryParams(url.searchParams)
        const pathSegments = getPathSegments(url.pathname)
        const fileExtension = getFileExtension(url.pathname)
        const domainInfo = getDomainInfo(url.hostname)
        
        const advanced = {
            pathSegments,
            fileExtension,
            domainInfo,
            queryParams,
            pathDepth: pathSegments.length,
            hasQuery: url.search.length > 0,
            hasHash: url.hash.length > 0,
            isRelative: !url.protocol,
            isAbsolute: !!url.protocol
        }
        
        const encoding = {
            encodedPathname: encodeUrlComponent(url.pathname),
            decodedPathname: decodeUrlComponent(url.pathname),
            encodedSearch: encodeUrlComponent(url.search),
            decodedSearch: decodeUrlComponent(url.search),
            encodedHash: encodeUrlComponent(url.hash),
            decodedHash: decodeUrlComponent(url.hash)
        }

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

        const endTime = Date.now()
        setProcessingTime(Math.round(endTime - startTime))

        return { 
            output: JSON.stringify(parsed, null, 2), 
            error: null, 
            url,
            validation,
            security,
            advanced,
            encoding
        }
    }, [input])

    const handleCopy = async () => {
        if (enhancedComputed.output) {
            await copyToClipboard(enhancedComputed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setInput(content)
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSampleUrls()
        setInput(samples[Math.floor(Math.random() * samples.length)])
    }

    return (
        <ToolLayout
            title="URL Parser Pro"
            description="Advanced URL parser with security analysis, encoding, and component breakdown."
            icon={Link}
            onReset={() => setInput('')}
            onCopy={enhancedComputed.output ? handleCopy : undefined}
            copyDisabled={!enhancedComputed.output}
        >
            <div className="space-y-6">
                {/* Header with Performance */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Link className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">URL Parser</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced URL analysis and component extraction</p>
                        </div>
                    </div>

                    {/* Performance */}
                    {processingTime !== null && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-[var(--border-primary)]">
                            <Zap className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{processingTime}ms</span>
                        </div>
                    )}
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
                        onClick={insertSample}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Sample URL</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!enhancedComputed.output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowSecurity(!showSecurity)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showSecurity 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Security</span>
                        </button>
                        
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAdvanced 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowEncoding(!showEncoding)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showEncoding 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>Encoding</span>
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {enhancedComputed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Parse Error</div>
                            <div>{enhancedComputed.error}</div>
                        </div>
                    </div>
                )}

                {/* Security Analysis */}
                {showSecurity && enhancedComputed.security && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Security Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedComputed.security.secure ? 'text-green-400' : 'text-red-400'}`}>
                                    {enhancedComputed.security.secure ? 'Secure' : 'Insecure'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">Protocol</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedComputed.security.encrypted ? 'text-green-400' : 'text-orange-400'}`}>
                                    {enhancedComputed.security.encrypted ? 'Encrypted' : 'Plain'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">Encryption</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedComputed.security.hasAuth ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {enhancedComputed.security.hasAuth ? 'Yes' : 'No'}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">Auth</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-lg font-black ${enhancedComputed.security.risks.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {enhancedComputed.security.risks.length}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">Risks</div>
                            </div>
                        </div>

                        {enhancedComputed.security.risks.length > 0 && (
                            <div className="mt-4">
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Security Risks</div>
                                <div className="flex flex-wrap gap-2">
                                    {enhancedComputed.security.risks.map((risk: string, idx: number) => (
                                        <div key={idx} className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                                            {risk}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Advanced Analysis */}
                {showAdvanced && enhancedComputed.advanced && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Domain Information</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Subdomain:</span>
                                        <span className="text-brand font-mono">{enhancedComputed.advanced.domainInfo.subdomain || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Domain:</span>
                                        <span className="text-blue-400 font-mono">{enhancedComputed.advanced.domainInfo.domain}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">TLD:</span>
                                        <span className="text-green-400 font-mono">{enhancedComputed.advanced.domainInfo.tld}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Is IP:</span>
                                        <span className={enhancedComputed.advanced.domainInfo.isIp ? 'text-orange-400' : 'text-green-400'}>
                                            {enhancedComputed.advanced.domainInfo.isIp ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Path Information</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Depth:</span>
                                        <span className="text-brand">{enhancedComputed.advanced.pathDepth}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Extension:</span>
                                        <span className="text-blue-400 font-mono">{enhancedComputed.advanced.fileExtension || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Has Query:</span>
                                        <span className={enhancedComputed.advanced.hasQuery ? 'text-green-400' : 'text-[var(--text-muted)]'}>
                                            {enhancedComputed.advanced.hasQuery ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Has Hash:</span>
                                        <span className={enhancedComputed.advanced.hasHash ? 'text-green-400' : 'text-[var(--text-muted)]'}>
                                            {enhancedComputed.advanced.hasHash ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {enhancedComputed.advanced.pathSegments.length > 0 && (
                            <div className="mt-4">
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Path Segments</div>
                                <div className="flex flex-wrap gap-2">
                                    {enhancedComputed.advanced.pathSegments.map((segment: string, idx: number) => (
                                        <div key={idx} className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                            {segment}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Encoding Analysis */}
                {showEncoding && enhancedComputed.encoding && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Key className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Encoding Analysis</span>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Path</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                        <div className="text-[var(--text-muted)] mb-1">Original:</div>
                                        <div className="font-mono break-all">{enhancedComputed.encoding.decodedPathname}</div>
                                    </div>
                                    <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                        <div className="text-[var(--text-muted)] mb-1">Encoded:</div>
                                        <div className="font-mono break-all">{enhancedComputed.encoding.encodedPathname}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {(enhancedComputed.encoding.decodedSearch || enhancedComputed.encoding.encodedSearch) && (
                                <div>
                                    <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Query String</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                            <div className="text-[var(--text-muted)] mb-1">Original:</div>
                                            <div className="font-mono break-all">{enhancedComputed.encoding.decodedSearch}</div>
                                        </div>
                                        <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                            <div className="text-[var(--text-muted)] mb-1">Encoded:</div>
                                            <div className="font-mono break-all">{enhancedComputed.encoding.encodedSearch}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input URL</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder="https://example.com/path?x=1&x=2#section"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="px-2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Relative URLs are resolved against https://example.com</p>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Parsed</label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {enhancedComputed.output.length} chars
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {enhancedComputed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
