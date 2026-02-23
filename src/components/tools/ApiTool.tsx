import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Globe, Send, Plus, Trash2, Clock, RefreshCcw } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface Header {
    key: string
    value: string
}

interface QueryParam {
    key: string
    value: string
}

interface RequestHistory {
    method: string
    url: string
    timestamp: number
}

interface EnvVar {
    key: string
    value: string
}

interface AuthData {
    token?: string
    username?: string
    password?: string
    key?: string
    value?: string
}

export function ApiTool() {
    const [method, setMethod] = usePersistentState('api_method', 'GET')
    const [url, setUrl] = usePersistentState('api_url', 'https://jsonplaceholder.typicode.com/todos/1')
    const [headers, setHeaders] = usePersistentState<Header[]>('api_headers', [{ key: 'Content-Type', value: 'application/json' }])
    const [queryParams, setQueryParams] = usePersistentState<QueryParam[]>('api_query_params', [])
    const [body, setBody] = usePersistentState('api_body', '')
    const [bodyError, setBodyError] = useState<string | null>(null)
    const [response, setResponse] = useState<string>('')
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
    const [size, setSize] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<number | null>(null)
    const [time, setTime] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'headers' | 'status'>('pretty')
    const [history, setHistory] = usePersistentState<RequestHistory[]>('api_history', [])
    const [envVars, setEnvVars] = usePersistentState<EnvVar[]>('api_env_vars', [])
    const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'api-key'>('none')
    const [authData, setAuthData] = useState<AuthData>({})
    const [files, setFiles] = useState<File[]>([])

    const addHeader = () => setHeaders([...headers, { key: '', value: '' }])
    const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index))
    const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
        const newHeaders = [...headers]
        newHeaders[index][field] = val
        setHeaders(newHeaders)
    }

    const addQueryParam = () => setQueryParams([...queryParams, { key: '', value: '' }])
    const removeQueryParam = (index: number) => setQueryParams(queryParams.filter((_, i) => i !== index))
    const updateQueryParam = (index: number, field: 'key' | 'value', val: string) => {
        const newParams = [...queryParams]
        newParams[index][field] = val
        setQueryParams(newParams)
    }

    const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }])
    const removeEnvVar = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index))
    const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
        const newVars = [...envVars]
        newVars[index][field] = val
        setEnvVars(newVars)
    }

    const replaceEnvVars = (str: string) => {
        let result = str
        envVars.forEach(v => {
            if (v.key && v.value) {
                const regex = new RegExp(`{{${v.key}}}`, 'g')
                result = result.replace(regex, v.value)
            }
        })
        return result
    }

    const getAuthHeaders = () => {
        const authHeaders: Record<string, string> = {}
        if (authType === 'bearer' && authData.token) {
            authHeaders['Authorization'] = `Bearer ${authData.token}`
        } else if (authType === 'basic' && authData.username && authData.password) {
            authHeaders['Authorization'] = `Basic ${btoa(`${authData.username}:${authData.password}`)}`
        } else if (authType === 'api-key' && authData.key && authData.value) {
            authHeaders[authData.key] = authData.value
        }
        return authHeaders
    }

    const formatBody = () => {
        if (!body.trim()) return
        try {
            const parsed = JSON.parse(body)
            const formatted = JSON.stringify(parsed, null, 2)
            setBody(formatted)
            setBodyError(null)
        } catch (e: any) {
            setBodyError(e.message)
        }
    }

    const handleBodyChange = (val: string) => {
        setBody(val)
        if (val.trim()) {
            try {
                JSON.parse(val)
                setBodyError(null)
            } catch (e: any) {
                setBodyError(e.message)
            }
        } else {
            setBodyError(null)
        }
    }

    const loadHistory = (item: RequestHistory) => {
        setMethod(item.method)
        setUrl(item.url)
    }

    const getFullUrl = () => {
        let fullUrl = replaceEnvVars(url)
        const params = queryParams.filter(p => p.key && p.value).map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        if (params.length > 0) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + params.join('&')
        }
        return fullUrl
    }

    const generateCurl = () => {
        const fullUrl = getFullUrl()
        const headerStr = headers.filter(h => h.key).map(h => `-H "${h.key}: ${h.value}"`).join(' ')
        const bodyStr = body && ['POST', 'PUT', 'PATCH'].includes(method) ? `-d '${body}'` : ''
        return `curl -X ${method} ${headerStr} ${bodyStr} "${fullUrl}"`
    }

    const generateFetch = () => {
        const fullUrl = getFullUrl()
        const headerObj = headers.filter(h => h.key).reduce((acc, h) => {
            acc[h.key] = h.value
            return acc
        }, {} as any)
        const headerStr = Object.keys(headerObj).length ? `headers: ${JSON.stringify(headerObj)}, ` : ''
        const bodyStr = body && ['POST', 'PUT', 'PATCH'].includes(method) ? `body: \`${body}\`, ` : ''
        return `fetch('${fullUrl}', {\n  method: '${method}',\n  ${headerStr}${bodyStr}\n})`
    }

    const generateAxios = () => {
        const fullUrl = getFullUrl()
        const headerObj = headers.filter(h => h.key).reduce((acc, h) => {
            acc[h.key] = h.value
            return acc
        }, {} as any)
        const headerStr = Object.keys(headerObj).length ? `, { headers: ${JSON.stringify(headerObj)} }` : ''
        const bodyStr = body && ['POST', 'PUT', 'PATCH'].includes(method) ? `'${body}'` : ''
        const methodLower = method.toLowerCase()
        return `axios.${methodLower}('${fullUrl}'${bodyStr ? `, ${bodyStr}` : ''}${headerStr})`
    }

    const sendRequest = async () => {
        if (!url) return
        setLoading(true)
        setResponse('')
        setStatus(null)
        const start = performance.now()

        try {
            // Build URL with query params
            let fullUrl = getFullUrl()

            const replacedHeaders = headers.map(h => ({ key: h.key, value: replaceEnvVars(h.value) }))
            const authHeaders = getAuthHeaders()
            const headerObj = {
                ...replacedHeaders.reduce((acc, h) => {
                    if (h.key) acc[h.key] = h.value
                    return acc
                }, {} as any), ...authHeaders
            }

            const options: RequestInit = {
                method,
                headers: headerObj,
            }

            if (files.length > 0) {
                const formData = new FormData()
                files.forEach(f => formData.append('file', f))
                options.body = formData
                delete headerObj['Content-Type'] // Let browser set multipart/form-data
            } else if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
                options.body = replaceEnvVars(body)
            }

            const res = await fetch(fullUrl, options)
            const text = await res.text()

            setResponseHeaders(Object.fromEntries(res.headers.entries()))
            setSize(new Blob([text]).size / 1024)

            const end = performance.now()
            setTime(Math.round(end - start))
            setStatus(res.status)

            // Save to history
            setHistory((prev: RequestHistory[]) => [{ method, url: fullUrl, timestamp: Date.now() }, ...prev.slice(0, 9)])

            try {
                const json = JSON.parse(text)
                setResponse(JSON.stringify(json, null, 2))
            } catch {
                setResponse(text)
            }
        } catch (e: any) {
            setResponse(`Error: ${e.message}`)
            setStatus(0)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ToolLayout
            title="API Request Tester"
            description="Debug and test your REST APIs directly from the browser."
            icon={Globe}
            onReset={() => { setResponse(''); setStatus(null); setTime(null); }}
            onCopy={response ? () => copyToClipboard(response) : undefined}
        >
            <div className="grid grid-cols-1 gap-8 text-[var(--text-primary)]">
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="md:w-32 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl px-4 font-black text-brand transition-all hover:border-brand/40 focus:ring-2 focus:ring-brand/20"
                        >
                            <option>GET</option>
                            <option>POST</option>
                            <option>PUT</option>
                            <option>DELETE</option>
                            <option>PATCH</option>
                        </select>
                        <input
                            type="text"
                            className="flex-1"
                            placeholder="https://api.example.com/v1/resource"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button
                            onClick={sendRequest}
                            disabled={loading}
                            className="px-8 py-3 brand-gradient text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                        >
                            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>{loading ? 'Sending...' : 'Send'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6 flex flex-col">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Headers</label>
                                    <button onClick={addHeader} className="text-[10px] font-black text-brand hover:text-brand-light flex items-center space-x-1 uppercase tracking-widest transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Header</span>
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {headers.map((h, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Key"
                                                value={h.key}
                                                onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                            />
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Value"
                                                value={h.value}
                                                onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                            />
                                            <button onClick={() => removeHeader(i)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all hover:scale-110">
                                                <Trash2 className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Authentication</label>
                                </div>
                                <div className="space-y-2">
                                    <select
                                        value={authType}
                                        onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer' | 'basic' | 'api-key')}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="none">None</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="api-key">API Key</option>
                                    </select>
                                    {authType === 'bearer' && (
                                        <input
                                            type="text"
                                            placeholder="Token"
                                            value={authData.token || ''}
                                            onChange={(e) => setAuthData({ ...authData, token: e.target.value })}
                                            className="w-full text-xs py-2 px-3"
                                        />
                                    )}
                                    {authType === 'basic' && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Username"
                                                value={authData.username || ''}
                                                onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                                                className="w-full text-xs py-2 px-3"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={authData.password || ''}
                                                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                                                className="w-full text-xs py-2 px-3"
                                            />
                                        </div>
                                    )}
                                    {authType === 'api-key' && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Header Key"
                                                value={authData.key || ''}
                                                onChange={(e) => setAuthData({ ...authData, key: e.target.value })}
                                                className="w-full text-xs py-2 px-3"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value"
                                                value={authData.value || ''}
                                                onChange={(e) => setAuthData({ ...authData, value: e.target.value })}
                                                className="w-full text-xs py-2 px-3"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Query Params</label>
                                    <button onClick={addQueryParam} className="text-[10px] font-black text-brand hover:text-brand-light flex items-center space-x-1 uppercase tracking-widest transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Param</span>
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {queryParams.map((p, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Key"
                                                value={p.key}
                                                onChange={(e) => updateQueryParam(i, 'key', e.target.value)}
                                            />
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Value"
                                                value={p.value}
                                                onChange={(e) => updateQueryParam(i, 'value', e.target.value)}
                                            />
                                            <button onClick={() => removeQueryParam(i)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all hover:scale-110">
                                                <Trash2 className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Environment Variables</label>
                                    <button onClick={addEnvVar} className="text-[10px] font-black text-brand hover:text-brand-light flex items-center space-x-1 uppercase tracking-widest transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Var</span>
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {envVars.map((v, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Key"
                                                value={v.key}
                                                onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                                            />
                                            <input
                                                className="flex-1 text-xs py-2 px-3"
                                                placeholder="Value"
                                                value={v.value}
                                                onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                                            />
                                            <button onClick={() => removeEnvVar(i)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all hover:scale-110">
                                                <Trash2 className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {['POST', 'PUT', 'PATCH'].includes(method) && (
                                <div className="space-y-3 flex-1 flex flex-col min-h-[250px] group">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] transition-colors group-focus-within:text-brand">Request Body (JSON)</label>
                                        <button onClick={formatBody} className="text-[10px] font-black text-brand hover:text-brand-light uppercase tracking-widest transition-colors">
                                            Format
                                        </button>
                                    </div>
                                    <textarea
                                        className={cn("flex-1 font-mono text-xs resize-none", bodyError ? "border-red-500" : "")}
                                        placeholder='{ "name": "John Doe" }'
                                        value={body}
                                        onChange={(e) => handleBodyChange(e.target.value)}
                                    />
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                        className="w-full text-xs py-2 px-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                    />
                                    {bodyError && (
                                        <div className="text-red-500 text-[10px] font-mono">
                                            {bodyError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Response</label>
                                    {response && (
                                        <div className="flex glass rounded-xl p-1 border-[var(--border-primary)] shadow-sm bg-[var(--bg-secondary)]/50">
                                            <button
                                                onClick={() => setViewMode('pretty')}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                    viewMode === 'pretty' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                )}
                                            >
                                                Pretty
                                            </button>
                                            <button
                                                onClick={() => setViewMode('raw')}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                    viewMode === 'raw' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                )}
                                            >
                                                Raw
                                            </button>
                                            <button
                                                onClick={() => setViewMode('headers')}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                    viewMode === 'headers' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                )}
                                            >
                                                Headers
                                            </button>
                                            <button
                                                onClick={() => setViewMode('status')}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                    viewMode === 'status' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                )}
                                            >
                                                Status
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {(status !== null) && (
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", status >= 200 && status < 300 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                                            Status: {status}
                                        </div>
                                        <div className="flex items-center space-x-1 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter">
                                            <Clock className="w-3 h-3" />
                                            <span>{time}ms</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 relative glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] min-h-[400px] bg-[var(--input-bg)] shadow-inner">
                                <pre className={cn(
                                    "absolute inset-0 p-8 font-mono text-xs overflow-auto transition-all custom-scrollbar",
                                    status === 0 ? "text-red-500" : "text-[var(--text-primary)] opacity-90",
                                    viewMode === 'raw' ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                                )}>
                                    {(() => {
                                        switch (viewMode) {
                                            case 'pretty':
                                            case 'raw':
                                                return response || <span className="text-[var(--text-muted)] opacity-30 italic">Hit send to see the response payload...</span>
                                            case 'headers':
                                                return JSON.stringify(responseHeaders, null, 2)
                                            case 'status':
                                                return `Status: ${status}\nTime: ${time}ms\nSize: ${size?.toFixed(2)} KB`
                                            default:
                                                return response || <span className="text-[var(--text-muted)] opacity-30 italic">Hit send to see the response payload...</span>
                                        }
                                    })()}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Recent Requests</label>
                        <div className="flex flex-wrap gap-2">
                            {history.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => loadHistory(item)}
                                    className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-mono hover:bg-[var(--bg-primary)] transition-all"
                                >
                                    {item.method} {item.url}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Copy as Code</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(generateCurl())}
                            className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-mono hover:bg-[var(--bg-primary)] transition-all"
                        >
                            cURL
                        </button>
                        <button
                            onClick={() => copyToClipboard(generateFetch())}
                            className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-mono hover:bg-[var(--bg-primary)] transition-all"
                        >
                            Fetch
                        </button>
                        <button
                            onClick={() => copyToClipboard(generateAxios())}
                            className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-mono hover:bg-[var(--bg-primary)] transition-all"
                        >
                            Axios
                        </button>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
