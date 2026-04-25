import { useState, useEffect, useMemo } from 'react'
import { Eye, Upload, ArrowUpDown, Trash2, Zap, Shield, FileText, Hash } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// Monaco Editor types (we'll use dynamic import)
declare global {
    interface Window {
        monaco: any
    }
}

// Encoding functions
function encodeHtmlEntities(input: string, options: { security?: boolean } = {}) {
    if (options.security) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    const el = document.createElement('div')
    el.textContent = input
    return el.innerHTML
}

function decodeHtmlEntities(input: string) {
    const el = document.createElement('div')
    el.innerHTML = input
    return el.textContent ?? ''
}

function encodeUrl(input: string) {
    return encodeURIComponent(input)
}

function decodeUrl(input: string) {
    try {
        return decodeURIComponent(input)
    } catch {
        return input
    }
}

function encodeBase64(input: string) {
    return btoa(unescape(encodeURIComponent(input)))
}

function decodeBase64(input: string) {
    try {
        return decodeURIComponent(escape(atob(input)))
    } catch {
        return input
    }
}

function jsonEscape(input: string) {
    return JSON.stringify(input)
}

function markdownEscape(input: string) {
    return input
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/`/g, '\\`')
        .replace(/</g, '\\<')
        .replace(/>/g, '\\>')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
}

export function HtmlEntityTool() {
    const [input, setInput] = usePersistentState('html_entity_input', '')
    const [output, setOutput] = useState('')
    const [mode, setMode] = usePersistentState<'encode' | 'decode' | 'auto'>('html_entity_mode', 'encode')
    const [encodingType, setEncodingType] = usePersistentState<'html' | 'url' | 'base64' | 'json' | 'markdown'>('html_entity_type', 'html')
    const [batchMode, setBatchMode] = usePersistentState('html_entity_batch', false)
    const [securityMode, setSecurityMode] = usePersistentState('html_entity_security', false)
    const [partialOptions, setPartialOptions] = usePersistentState('html_entity_partial', {
        lessThan: true,
        greaterThan: true,
        ampersand: true,
        quotes: true,
        all: false
    })

    const [monacoLoaded, setMonacoLoaded] = useState(false)

    // Load Monaco Editor
    useEffect(() => {
        const loadMonaco = async () => {
            try {
                const { loader } = await import('@monaco-editor/react')
                await loader.init()
                setMonacoLoaded(true)
            } catch (error) {
                console.warn('Monaco Editor failed to load, falling back to textarea')
            }
        }
        loadMonaco()
    }, [])

    // Auto-detect mode
    const detectMode = (text: string) => {
        if (!text) return 'encode'

        // Check for HTML entities
        const hasEntities = /&[a-zA-Z0-9#]+;/.test(text)
        // Check for HTML tags that might need encoding
        const hasTags = /[<>&"']/.test(text)

        if (hasEntities && !hasTags) return 'decode'
        if (hasTags) return 'encode'

        return 'encode'
    }

    // Process input
    const processedOutput = useMemo(() => {
        if (!input) return ''

        try {
            let result = input

            if (batchMode) {
                // Process each line separately
                const lines = input.split('\n')
                result = lines.map(line => {
                    if (!line.trim()) return line
                    return processSingleLine(line)
                }).join('\n')
            } else {
                result = processSingleLine(input)
            }

            return result
        } catch {
            return 'Error: Invalid input'
        }
    }, [input, mode, encodingType, securityMode, partialOptions, batchMode])

    function processSingleLine(text: string) {
        let result = text

        if (mode === 'auto') {
            const detected = detectMode(text)
            if (detected === 'encode') {
                result = encodeText(text)
            } else {
                result = decodeText(text)
            }
        } else if (mode === 'encode') {
            result = encodeText(text)
        } else {
            result = decodeText(text)
        }

        return result
    }

    function encodeText(text: string) {
        switch (encodingType) {
            case 'html':
                if (partialOptions.all) {
                    return encodeHtmlEntities(text, { security: securityMode })
                }

                let result = text
                if (partialOptions.ampersand) result = result.replace(/&/g, '&amp;')
                if (partialOptions.lessThan) result = result.replace(/</g, '&lt;')
                if (partialOptions.greaterThan) result = result.replace(/>/g, '&gt;')
                if (partialOptions.quotes) {
                    result = result.replace(/"/g, '&quot;')
                    result = result.replace(/'/g, '&#39;')
                }
                return result

            case 'url':
                return encodeUrl(text)
            case 'base64':
                return encodeBase64(text)
            case 'json':
                return jsonEscape(text)
            case 'markdown':
                return markdownEscape(text)
            default:
                return text
        }
    }

    function decodeText(text: string) {
        switch (encodingType) {
            case 'html':
                return decodeHtmlEntities(text)
            case 'url':
                return decodeUrl(text)
            case 'base64':
                return decodeBase64(text)
            case 'json':
                try {
                    return JSON.parse(text)
                } catch {
                    return text
                }
            case 'markdown':
                // Basic markdown unescape
                return text.replace(/\\(.)/g, '$1')
            default:
                return text
        }
    }

    // Update output when processed output changes
    useEffect(() => {
        setOutput(processedOutput)
    }, [processedOutput])

    // File upload handler
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const allowedTypes = ['text/html', 'text/plain', 'application/json', 'text/markdown']
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(html|txt|json|md)$/)) {
            toast.error('Please upload .html, .txt, .json, or .md files')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const content = e.target?.result as string
            setInput(content)
            toast.success(`Loaded ${file.name}`)
        }
        reader.readAsText(file)
    }

    // Download handler
    const handleDownload = () => {
        if (!output) return

        const extensions = {
            html: 'html',
            url: 'txt',
            base64: 'txt',
            json: 'json',
            markdown: 'md'
        }

        const extension = extensions[encodingType] || 'txt'
        const mimeType = {
            html: 'text/html',
            url: 'text/plain',
            base64: 'text/plain',
            json: 'application/json',
            markdown: 'text/markdown'
        }[encodingType] || 'text/plain'
        const blob = new Blob([output], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `converted.${extension}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`Downloaded as .${extension}`)
    }

    // Swap input/output
    const handleSwap = () => {
        setInput(output)
        setOutput('')
    }

    // Insert special character
    const insertCharacter = (char: string, entity: string) => {
        if (mode === 'encode') {
            setInput(prev => prev + char)
        } else {
            setInput(prev => prev + entity)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
                if (mode === 'encode') setMode('decode')
                else if (mode === 'decode') setMode('encode')
                else setMode('auto')
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                setMode('auto')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mode])

    const specialChars = [
        { char: '<', entity: '&lt;', name: 'Less than' },
        { char: '>', entity: '&gt;', name: 'Greater than' },
        { char: '&', entity: '&amp;', name: 'Ampersand' },
        { char: '"', entity: '&quot;', name: 'Double quote' },
        { char: "'", entity: '&#39;', name: 'Single quote' },
        { char: '©', entity: '&copy;', name: 'Copyright' },
        { char: '®', entity: '&reg;', name: 'Registered' },
        { char: '™', entity: '&trade;', name: 'Trademark' },
        { char: '€', entity: '&euro;', name: 'Euro' },
        { char: '£', entity: '&pound;', name: 'Pound' },
        { char: '¥', entity: '&yen;', name: 'Yen' },
        { char: '§', entity: '&sect;', name: 'Section' },
        { char: '¶', entity: '&para;', name: 'Paragraph' },
        { char: '†', entity: '&dagger;', name: 'Dagger' },
        { char: '‡', entity: '&Dagger;', name: 'Double dagger' },
        { char: '•', entity: '&bull;', name: 'Bullet' }
    ]

    return (
        <ToolLayout
            title="HTML Entity Pro"
            description="Professional HTML entity encoding/decoding with Monaco Editor, file upload, and advanced features."
            icon={Eye}
            onReset={() => { setInput(''); setOutput('') }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={output ? handleDownload : undefined}
            copyDisabled={!output}
            downloadDisabled={!output}
        >
            <div className="space-y-8">
                {/* Mode Selection */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)]">
                        {[
                            { key: 'encode', label: 'Encode' },
                            { key: 'decode', label: 'Decode' },
                            { key: 'auto', label: 'Auto Detect' }
                        ].map(item => (
                            <button
                                key={item.key}
                                onClick={() => setMode(item.key as any)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    mode === item.key ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)]">
                        {[
                            { key: 'html', label: 'HTML' },
                            { key: 'url', label: 'URL' },
                            { key: 'base64', label: 'Base64' },
                            { key: 'json', label: 'JSON' },
                            { key: 'markdown', label: 'Markdown' }
                        ].map(item => (
                            <button
                                key={item.key}
                                onClick={() => setEncodingType(item.key as any)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    encodingType === item.key ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Options - Make them more prominent */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 glass rounded-2xl border-[var(--border-primary)]">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Processing Mode</h4>
                        <label className="flex items-center space-x-3 p-3 glass rounded-xl border-[var(--border-primary)] cursor-pointer group hover:border-brand/40 transition-all">
                            <input
                                type="checkbox"
                                checked={batchMode}
                                onChange={(e) => setBatchMode(e.target.checked)}
                                className="w-5 h-5 rounded border-[var(--border-primary)] text-brand focus:ring-brand"
                            />
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-brand" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-brand">Batch Mode</span>
                            </div>
                        </label>
                    </div>

                    {encodingType === 'html' && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Security</h4>
                            <label className="flex items-center space-x-3 p-3 glass rounded-xl border-[var(--border-primary)] cursor-pointer group hover:border-brand/40 transition-all">
                                <input
                                    type="checkbox"
                                    checked={securityMode}
                                    onChange={(e) => setSecurityMode(e.target.checked)}
                                    className="w-5 h-5 rounded border-[var(--border-primary)] text-brand focus:ring-brand"
                                />
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-red-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-brand">XSS Safe</span>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">File Operations</h4>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 p-3 glass rounded-xl border-[var(--border-primary)] cursor-pointer group hover:border-brand/40 transition-all">
                                <input
                                    type="file"
                                    accept=".html,.txt,.json,.md"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="flex items-center space-x-2 cursor-pointer flex-1">
                                    <Upload className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-brand" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-brand">Upload File</span>
                                </label>
                            </label>

                            <button
                                onClick={handleSwap}
                                className="flex items-center space-x-3 p-3 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all group w-full"
                            >
                                <ArrowUpDown className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-brand" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-brand">Swap I/O</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Editor</h4>
                        <div className="flex items-center space-x-2 p-3 glass rounded-xl border-[var(--border-primary)]">
                            <Hash className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                                {monacoLoaded ? 'Monaco Editor' : 'Enhanced Textarea'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Partial Encoding Options for HTML */}
                {encodingType === 'html' && mode === 'encode' && (
                    <div className="p-6 glass rounded-2xl border-[var(--border-primary)] space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Partial Encoding</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { key: 'lessThan', label: '<', value: 'lessThan' },
                                { key: 'greaterThan', label: '>', value: 'greaterThan' },
                                { key: 'ampersand', label: '&', value: 'ampersand' },
                                { key: 'quotes', label: '" \'', value: 'quotes' },
                                { key: 'all', label: 'All', value: 'all' }
                            ].map(item => (
                                <label key={item.key} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={partialOptions[item.value as keyof typeof partialOptions]}
                                        onChange={(e) => setPartialOptions(prev => ({
                                            ...prev,
                                            [item.value]: e.target.checked
                                        }))}
                                        className="w-4 h-4 rounded border-[var(--border-primary)] text-brand focus:ring-brand"
                                    />
                                    <span className="text-[9px] font-bold text-[var(--text-secondary)]">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Character Counter */}
                {input && (
                    <div className="flex justify-center">
                        <div className="px-6 py-3 glass rounded-2xl border-[var(--border-primary)] space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Statistics</div>
                            <div className="flex space-x-6 text-[11px] font-mono">
                                <span>Input: {input.length} chars ({new Blob([input]).size} bytes)</span>
                                <span>Output: {output.length} chars ({new Blob([output]).size} bytes)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Special Characters Table */}
                <div className="p-6 glass rounded-2xl border-[var(--border-primary)]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4">Special Characters</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {specialChars.map(({ char, entity, name }) => (
                            <motion.button
                                key={char}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => insertCharacter(char, entity)}
                                className="p-2 glass rounded-lg border-[var(--border-primary)] hover:border-brand/40 text-center group"
                                title={name}
                            >
                                <div className="text-xs font-mono">{char}</div>
                                <div className="text-[8px] font-bold text-[var(--text-muted)] group-hover:text-brand">{entity}</div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[600px]">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                            <button
                                onClick={() => setInput('')}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                title="Clear input"
                            >
                                <Trash2 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-red-400" />
                            </button>
                        </div>

                        {monacoLoaded ? (
                            <div className="flex-1 border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                                {/* Monaco Editor would go here - for now fallback to textarea */}
                                <textarea
                                    className="w-full h-full p-6 font-mono text-sm resize-none bg-[var(--input-bg)] focus:outline-none"
                                    placeholder={mode === 'encode' ? 'Paste HTML or text to encode...' : 'Paste entities to decode...'}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>
                        ) : (
                            <textarea
                                className="flex-1 p-6 font-mono text-sm resize-none bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl focus:ring-2 focus:ring-brand/20 focus:border-brand"
                                placeholder={mode === 'encode' ? 'Paste HTML or text to encode...' : 'Paste entities to decode...'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                            <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                <Zap className="w-3 h-3 text-green-400" />
                                <span>Local Processing</span>
                            </div>
                        </div>

                        <div className="flex-1 glass rounded-2xl overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <pre className="h-full p-6 text-[var(--text-primary)] font-mono text-sm overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Result will appear here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Info */}
                <div className="flex justify-center">
                    <div className="px-6 py-4 glass rounded-2xl border-[var(--border-primary)]">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Keyboard Shortcuts</div>
                        <div className="flex space-x-6 text-[10px] font-mono">
                            <span><kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Enter</kbd> Toggle mode</span>
                            <span><kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Shift</kbd> + <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Enter</kbd> Auto-detect</span>
                            <span><kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-[var(--bg-secondary)] rounded">C</kbd> Copy output</span>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
