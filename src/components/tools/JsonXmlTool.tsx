import { useMemo } from 'react'
import { FileJson } from 'lucide-react'
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

function jsonToXml(value: any, rootName = 'root'): string {
    const toNode = (v: any, name: string): string => {
        if (v === null || v === undefined) return `<${name}/>`
        if (Array.isArray(v)) return v.map((item) => toNode(item, name)).join('')
        if (typeof v === 'object') {
            const inner = Object.entries(v)
                .map(([k, val]) => toNode(val, k))
                .join('')
            return `<${name}>${inner}</${name}>`
        }
        return `<${name}>${escapeXml(String(v))}</${name}>`
    }

    return `<?xml version="1.0" encoding="UTF-8"?>${toNode(value, rootName)}`
}

function xmlToJson(xmlText: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'application/xml')
    const parserError = doc.getElementsByTagName('parsererror')[0]
    if (parserError) {
        throw new Error('Invalid XML')
    }

    const nodeToValue = (node: Element): any => {
        const elementChildren = Array.from(node.children)
        if (elementChildren.length === 0) {
            return node.textContent ?? ''
        }

        const obj: Record<string, any> = {}
        for (const child of elementChildren) {
            const key = child.tagName
            const val = nodeToValue(child)
            if (obj[key] === undefined) {
                obj[key] = val
            } else if (Array.isArray(obj[key])) {
                obj[key].push(val)
            } else {
                obj[key] = [obj[key], val]
            }
        }
        return obj
    }

    const root = doc.documentElement
    return { [root.tagName]: nodeToValue(root) }
}

export function JsonXmlTool() {
    const [input, setInput] = usePersistentState('json_xml_input', '')
    const [mode, setMode] = usePersistentState<'json-to-xml' | 'xml-to-json'>('json_xml_mode', 'json-to-xml')

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null }
        try {
            if (mode === 'json-to-xml') {
                const parsed = JSON.parse(input)
                return { output: jsonToXml(parsed, 'root'), error: null as string | null }
            }
            const obj = xmlToJson(input)
            return { output: JSON.stringify(obj, null, 2), error: null as string | null }
        } catch (e: any) {
            return { output: '', error: e?.message || 'Invalid input' }
        }
    }, [input, mode])

    return (
        <ToolLayout
            title="JSON ↔ XML"
            description="Convert JSON to XML and XML to JSON locally (basic conversion)."
            icon={FileJson}
            onReset={() => setInput('')}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('json-to-xml')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'json-to-xml' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        JSON to XML
                    </button>
                    <button
                        onClick={() => setMode('xml-to-json')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'xml-to-json' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        XML to JSON
                    </button>
                </div>

                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        {computed.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none"
                            placeholder={mode === 'json-to-xml' ? '{\n  "hello": "world"\n}' : '<root><hello>world</hello></root>'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
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
