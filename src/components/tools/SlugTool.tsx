import { useMemo, useState } from 'react'
import { Copy, Check, Settings, Search, Clock, Shield, Zap, Hash } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

function slugify(input: string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşšťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const re = new RegExp(a.split('').join('|'), 'g')

    return input
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(re, (c) => b.charAt(a.indexOf(c)))
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

export function SlugTool() {
    const [input, setInput] = usePersistentState('slug_input', '')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [slugHistory, setSlugHistory] = usePersistentState('slug_history', [] as Array<{input: string, output: string, timestamp: string, characterCount: number}>)
    const [lowercaseOnly, setLowercaseOnly] = usePersistentState('slug_lowercase_only', true)
    const [allowHyphens, setAllowHyphens] = usePersistentState('slug_allow_hyphens', true)
    const [maxLength, setMaxLength] = usePersistentState('slug_max_length', 100)
    const [separators, setSeparators] = usePersistentState('slug_separators', '-')

    const output = useMemo(() => {
        if (!input.trim()) return ''
        let result = slugify(input)
        
        // Apply advanced options
        if (!lowercaseOnly) {
            result = result.split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join('')
        }
        
        if (!allowHyphens) {
            result = result.replace(/-/g, '')
        }
        
        if (maxLength > 0 && result.length > maxLength) {
            result = result.substring(0, maxLength)
        }
        
        if (separators !== '-') {
            result = result.replace(/-/g, separators)
        }
        
        return result
    }, [input, lowercaseOnly, allowHyphens, maxLength, separators])

    const handleCopy = () => {
        if (output) {
            copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (inputValue: string, outputValue: string) => {
        const newEntry = {
            input: inputValue,
            output: outputValue,
            timestamp: new Date().toISOString(),
            characterCount: inputValue.length
        }
        setSlugHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setSlugHistory([])
    }

    const handleHistoryClick = (entry: {input: string, output: string}) => {
        setInput(entry.input)
    }

    // Add to history when input changes and output is generated
    useMemo(() => {
        if (input && output) {
            addToHistory(input, output)
        }
    }, [input, output])

    const getCharacterCount = () => input.length
    const getWordCount = () => input.trim().split(/\s+/).filter(word => word.length > 0).length
    const getReductionPercentage = () => {
        if (!input) return 0
        return Math.round(((input.length - output.length) / input.length) * 100)
    }

    return (
        <ToolLayout
            title="Slug Converter"
            description="Convert text into an SEO-friendly URL slug with advanced features."
            icon={Hash}
            onReset={() => setInput('')}
            onCopy={output ? handleCopy : undefined}
            copyDisabled={!output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Hash className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Slug Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">SEO-friendly URL slug generation</p>
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
                            onClick={handleCopy}
                            disabled={!output}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Input/Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {getCharacterCount()} chars • {getWordCount()} words
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <textarea
                                className="w-full h-full p-4 bg-transparent text-blue-300 font-mono text-sm resize-none outline-none"
                                placeholder="This is a great tool!"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {input.length} characters
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Slug</label>
                            </div>
                            {output && input && (
                                <div className="text-xs text-green-400 font-black uppercase tracking-widest">
                                    -{getReductionPercentage()}%
                                </div>
                            )}
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            {output ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {output}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {output.length} characters
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Hash className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No slug yet</p>
                                    <p className="text-xs">Enter text to generate slug</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="lowercase_only"
                                    checked={lowercaseOnly}
                                    onChange={(e) => setLowercaseOnly(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="lowercase_only" className="text-sm text-[var(--text-primary)]">Lowercase Only</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="allow_hyphens"
                                    checked={allowHyphens}
                                    onChange={(e) => setAllowHyphens(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="allow_hyphens" className="text-sm text-[var(--text-primary)]">Allow Hyphens</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Max Length</label>
                                <input
                                    type="number"
                                    value={maxLength}
                                    onChange={(e) => setMaxLength(Number(e.target.value))}
                                    min="0"
                                    max="200"
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">0 = no limit</p>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Separator</label>
                                <select
                                    value={separators}
                                    onChange={(e) => setSeparators(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="-">Hyphen (-)</option>
                                    <option value="_">Underscore (_)</option>
                                    <option value="">None</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">SEO Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                SEO-friendly slugs improve URL readability and search engine ranking. This tool removes special characters, converts spaces to separators, and normalizes text for web use.
                            </p>
                        </div>
                    </div>
                )}

                {/* History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={slugHistory.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                slugHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {slugHistory.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {slugHistory.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {entry.characterCount} chars
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.input.substring(0, 60)}{entry.input.length > 60 ? '...' : ''}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                            → {entry.output}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <Clock className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your slug generation history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
