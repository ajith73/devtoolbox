import { useMemo, useState, useRef } from 'react'
import { FileJson, Upload, FileText, ArrowRightLeft, Zap, Database, Download, Copy, Check, Settings, Eye, EyeOff, RefreshCw, Code, FileCode } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function escapeXml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function jsonToXml(value: any, rootName = 'root', options: { indent?: boolean; attributes?: boolean } = {}): string {
    const { indent = false, attributes = false } = options
    let depth = 0
    
    const toNode = (v: any, name: string): string => {
        const spaces = indent ? '  '.repeat(depth) : ''
        const newline = indent ? '\n' : ''
        
        if (v === null || v === undefined) return `${spaces}<${name}/>${newline}`
        
        if (Array.isArray(v)) {
            if (v.length === 0) return `${spaces}<${name}/>${newline}`
            depth++
            const items = v.map((item, index) => {
                const itemName = attributes && index === 0 ? name : `${name}_${index}`
                return toNode(item, itemName)
            }).join('')
            depth--
            return `${spaces}<${name}>${newline}${items}${spaces}</${name}>${newline}`
        }
        
        if (typeof v === 'object') {
            const entries = Object.entries(v)
            if (entries.length === 0) return `${spaces}<${name}/>${newline}`
            
            depth++
            const inner = entries
                .map(([k, val]) => toNode(val, k))
                .join('')
            depth--
            return `${spaces}<${name}>${newline}${inner}${spaces}</${name}>${newline}`
        }
        
        return `${spaces}<${name}>${escapeXml(String(v))}</${name}>${newline}`
    }

    const xml = toNode(value, rootName)
    return `<?xml version="1.0" encoding="UTF-8"?>${indent ? '\n' : ''}${xml}`.trim()
}

function xmlToJson(xmlText: string) {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xmlText, 'application/xml')
        const parserError = doc.getElementsByTagName('parsererror')[0]
        
        if (parserError) {
            const errorText = parserError.textContent || ''
            throw new Error(`Invalid XML: ${errorText.substring(0, 100)}...`)
        }

        const nodeToValue = (node: Element): any => {
            const elementChildren = Array.from(node.children)
            if (elementChildren.length === 0) {
                const text = node.textContent?.trim()
                return text === '' ? '' : text
            }

            const obj: Record<string, any> = {}
            const childMap = new Map<string, any[]>()
            
            for (const child of elementChildren) {
                const key = child.tagName
                const val = nodeToValue(child)
                
                if (!childMap.has(key)) {
                    childMap.set(key, [])
                }
                childMap.get(key)!.push(val)
            }
            
            for (const [key, values] of childMap) {
                if (values.length === 1) {
                    obj[key] = values[0]
                } else {
                    obj[key] = values
                }
            }
            
            return obj
        }

        const root = doc.documentElement
        return { [root.tagName]: nodeToValue(root) }
    } catch (error: any) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to parse XML')
    }
}

export function JsonXmlTool() {
    const [input, setInput] = usePersistentState('json_xml_input', '')
    const [mode, setMode] = usePersistentState<'json-to-xml' | 'xml-to-json'>('json_xml_mode', 'json-to-xml')
    const [rootName, setRootName] = usePersistentState('json_xml_root', 'root')
    const [prettyPrint, setPrettyPrint] = usePersistentState('json_xml_pretty', true)
    const [showStats, setShowStats] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showLineNumbers, setShowLineNumbers] = useState(false)
    const [copied, setCopied] = useState(false)
    const [validationMode, setValidationMode] = usePersistentState<'strict' | 'lenient'>('json_xml_validation', 'strict')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null, stats: null }
        try {
            if (mode === 'json-to-xml') {
                const parsed = JSON.parse(input)
                const xml = jsonToXml(parsed, rootName, { indent: prettyPrint })
                const stats = {
                    inputSize: input.length,
                    outputSize: xml.length,
                    inputType: 'JSON',
                    outputType: 'XML',
                    jsonKeys: countJsonKeys(parsed),
                    xmlNodes: countXmlNodes(xml)
                }
                return { output: xml, error: null, stats }
            }
            const obj = xmlToJson(input)
            const json = JSON.stringify(obj, null, prettyPrint ? 2 : 0)
            const stats = {
                inputSize: input.length,
                outputSize: json.length,
                inputType: 'XML',
                outputType: 'JSON',
                xmlNodes: countXmlNodes(input),
                jsonKeys: countJsonKeys(obj)
            }
            return { output: json, error: null, stats }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Invalid input', stats: null }
        }
    }, [input, mode, rootName, prettyPrint])

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const text = e.target?.result as string
                setInput(text)
            }
            reader.readAsText(file)
        }
    }

    const handleExport = () => {
        const data = {
            input,
            mode,
            rootName,
            prettyPrint,
            validationMode,
            timestamp: new Date().toISOString(),
            version: '1.0'
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `json-xml-conversion-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopy = () => {
        if (computed.output) {
            copyToClipboard(computed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const validateInput = () => {
        if (mode === 'json-to-xml') {
            try {
                JSON.parse(input)
                return { valid: true, errors: [] }
            } catch (e: any) {
                return { valid: false, errors: [e.message] }
            }
        } else {
            try {
                const parser = new DOMParser()
                parser.parseFromString(input, 'application/xml')
                const parserError = parser.parseFromString(input, 'application/xml').getElementsByTagName('parsererror')[0]
                return { valid: !parserError, errors: parserError ? [parserError.textContent || 'Unknown XML error'] : [] }
            } catch (e: any) {
                return { valid: false, errors: [e.message] }
            }
        }
    }

    const insertSample = () => {
        if (mode === 'json-to-xml') {
            setInput(JSON.stringify({
                user: {
                    id: 123,
                    name: "John Doe",
                    email: "john@example.com",
                    roles: ["admin", "user"],
                    active: true,
                    profile: null
                },
                timestamp: new Date().toISOString()
            }, null, 2))
        } else {
            setInput(`<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user>
    <id>123</id>
    <name>John Doe</name>
    <email>john@example.com</email>
    <roles>admin</roles>
    <roles>user</roles>
    <active>true</active>
    <profile/>
  </user>
  <timestamp>2026-04-01T12:00:00Z</timestamp>
</root>`)
        }
    }

    const swapMode = () => {
        if (computed.output) {
            setInput(computed.output)
        }
        setMode(mode === 'json-to-xml' ? 'xml-to-json' : 'json-to-xml')
    }

    function countJsonKeys(obj: any): number {
        if (obj === null || typeof obj !== 'object') return 0
        if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countJsonKeys(item), 0)
        return Object.keys(obj).reduce((sum, key) => sum + 1 + countJsonKeys(obj[key]), 0)
    }

    function countXmlNodes(xml: string): number {
        return (xml.match(/<[^\/][^>]*>/g) || []).length
    }

    return (
        <ToolLayout
            title="JSON ↔ XML"
            description="Convert JSON to XML and XML to JSON locally with advanced formatting."
            icon={FileJson}
            onReset={() => setInput('')}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <FileJson className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">JSON ↔ XML Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">Advanced conversion with validation and export</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand hover:scale-105 active:scale-95 transition-all bg-white dark:bg-black border-[var(--border-primary)]"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
                {/* Enhanced Mode Selection */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setMode('json-to-xml')}
                            className={cn(
                                "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2",
                                mode === 'json-to-xml' 
                                    ? "brand-gradient text-white shadow-lg" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <FileCode className="w-4 h-4" />
                            <span>JSON → XML</span>
                        </button>
                        <button
                            onClick={swapMode}
                            className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Swap input and output"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setMode('xml-to-json')}
                            className={cn(
                                "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2",
                                mode === 'xml-to-json' 
                                    ? "brand-gradient text-white shadow-lg" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Code className="w-4 h-4" />
                            <span>XML → JSON</span>
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".json,.xml,.txt"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Upload file"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <button
                            onClick={insertSample}
                            className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Insert sample"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            className={cn(
                                "p-3 rounded-xl transition-colors",
                                showLineNumbers ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                            title="Toggle line numbers"
                        >
                            {showLineNumbers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Enhanced Options */}
                <div className="p-4 glass rounded-2xl border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Configuration</h3>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={cn(
                                "flex items-center space-x-2 text-sm transition-colors px-3 py-1 rounded-lg",
                                showStats ? "brand-gradient text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Zap className="w-4 h-4" />
                            <span>{showStats ? 'Hide' : 'Show'} Stats</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mode === 'json-to-xml' && (
                            <div className="flex items-center space-x-2">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Root Element:</label>
                                <input
                                    type="text"
                                    value={rootName}
                                    onChange={(e) => setRootName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                    placeholder="root"
                                />
                            </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="prettyPrint"
                                checked={prettyPrint}
                                onChange={(e) => setPrettyPrint(e.target.checked)}
                                className="rounded border-[var(--border-primary)]"
                            />
                            <label htmlFor="prettyPrint" className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                                Pretty Print
                            </label>
                        </div>

                        {showAdvanced && (
                            <div className="flex items-center space-x-2">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Validation:</label>
                                <select
                                    value={validationMode}
                                    onChange={(e) => setValidationMode(e.target.value as 'strict' | 'lenient')}
                                    className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="strict">Strict</option>
                                    <option value="lenient">Lenient</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <Database className="w-4 h-4" />
                            <span className="font-bold">Conversion Error</span>
                        </div>
                        {computed.error}
                    </div>
                )}

                {/* Statistics */}
                {showStats && computed.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-blue-400">{computed.stats.inputSize}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Input Size</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-green-400">{computed.stats.outputSize}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Output Size</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-purple-400">{computed.stats.jsonKeys}</div>
                            <div className="text-xs text-[var(--text-secondary)]">JSON Keys</div>
                        </div>
                        <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                            <div className="text-2xl font-bold text-orange-400">{computed.stats.xmlNodes}</div>
                            <div className="text-xs text-[var(--text-secondary)]">XML Nodes</div>
                        </div>
                    </div>
                )}

                {/* Enhanced Input/Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Input ({mode === 'json-to-xml' ? 'JSON' : 'XML'})
                            </label>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        const validation = validateInput()
                                        if (validation.valid) {
                                            setInput('')
                                        }
                                    }}
                                    className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                    title="Clear input"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner relative">
                            <textarea
                                className="w-full h-full p-6 text-[var(--text-primary)] font-mono text-sm resize-none bg-transparent outline-none custom-scrollbar"
                                placeholder={mode === 'json-to-xml' ? '{\n  "hello": "world"\n}' : '<root><hello>world</hello></root>'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            {showLineNumbers && (
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[var(--bg-secondary)]/50 border-r border-[var(--border-primary)] flex flex-col items-center py-6 text-[var(--text-muted)] text-xs font-mono pointer-events-none">
                                    {input.split('\n').map((_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Output ({mode === 'json-to-xml' ? 'XML' : 'JSON'})
                            </label>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleCopy}
                                    disabled={!computed.output}
                                    className={cn(
                                        "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        computed.output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                    )}
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border-[var(--border-primary)] bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <pre className="h-full p-6 text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                            {showLineNumbers && computed.output && (
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1a1f2e]/50 border-r border-[#30363d] flex flex-col items-center py-6 text-[#8b949e] text-xs font-mono pointer-events-none">
                                    {computed.output.split('\n').map((_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
