import { useMemo, useState } from 'react'
import { FileJson, Copy, Check, Settings, Search, Clock, Shield, AlertCircle, TrendingUp, Database, Zap, Code, FileText } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import yaml from 'js-yaml'

export function JsonYamlTool() {
    const [input, setInput] = usePersistentState('json_yaml_input', '')
    const [mode, setMode] = usePersistentState<'json-to-yaml' | 'yaml-to-json'>('json_yaml_mode', 'json-to-yaml')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [conversionHistory, setConversionHistory] = usePersistentState('json_yaml_history', [] as Array<{input: string, output: string, mode: string, timestamp: string}>)
    const [yamlIndent, setYamlIndent] = usePersistentState('json_yaml_indent', 2)
    const [yamlLineWidth, setYamlLineWidth] = usePersistentState('json_yaml_line_width', -1)
    const [jsonIndent, setJsonIndent] = usePersistentState('json_yaml_json_indent', 2)
    const [validateInput, setValidateInput] = usePersistentState('json_yaml_validate', true)

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null as string | null, stats: null as any }
        try {
            let output = ''
            let stats = null
            
            if (mode === 'json-to-yaml') {
                const obj = JSON.parse(input)
                const yamlOptions = { 
                    indent: yamlIndent, 
                    lineWidth: yamlLineWidth, 
                    noRefs: true,
                    sortKeys: false
                }
                output = yaml.dump(obj, yamlOptions)
                stats = {
                    inputType: 'JSON',
                    outputType: 'YAML',
                    inputLines: input.split('\n').length,
                    outputLines: output.split('\n').length,
                    inputChars: input.length,
                    outputChars: output.length
                }
            } else {
                const obj = yaml.load(input)
                output = JSON.stringify(obj, null, jsonIndent)
                stats = {
                    inputType: 'YAML',
                    outputType: 'JSON',
                    inputLines: input.split('\n').length,
                    outputLines: output.split('\n').length,
                    inputChars: input.length,
                    outputChars: output.length
                }
            }
            
            return { output, error: null as string | null, stats }
        } catch (e: unknown) {
            return { output: '', error: (e as Error)?.message || 'Invalid input', stats: null as any }
        }
    }, [input, mode, yamlIndent, yamlLineWidth, jsonIndent, validateInput])

    const handleCopy = () => {
        if (computed.output) {
            copyToClipboard(computed.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (inputValue: string, outputValue: string, modeValue: string) => {
        const newEntry = {
            input: inputValue.substring(0, 100) + (inputValue.length > 100 ? '...' : ''),
            output: outputValue.substring(0, 100) + (outputValue.length > 100 ? '...' : ''),
            mode: modeValue,
            timestamp: new Date().toISOString()
        }
        setConversionHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setConversionHistory([])
    }

    const handleHistoryClick = (entry: {input: string, mode: string}) => {
        setMode(entry.mode as 'json-to-yaml' | 'yaml-to-json')
        setInput(entry.input)
    }

    // Add to history when conversion succeeds
    useMemo(() => {
        if (computed.output && computed.error === null && input) {
            addToHistory(input, computed.output, mode)
        }
    }, [computed.output, computed.error, input, mode])

    const getCharacterCount = () => input.length
    const getLineCount = () => input.split('\n').length
    const getSizeReduction = () => {
        if (!computed.stats) return 0
        return Math.round(((computed.stats.inputChars - computed.stats.outputChars) / computed.stats.inputChars) * 100)
    }

    return (
        <ToolLayout
            title="JSON ↔ YAML"
            description="Convert JSON to YAML and YAML to JSON locally with advanced features."
            icon={Code}
            onReset={() => setInput('')}
            onCopy={computed.output ? handleCopy : undefined}
            copyDisabled={!computed.output}
        >
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Code className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced JSON ↔ YAML</h2>
                            <p className="text-sm text-[var(--text-muted)]">Data format conversion</p>
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
                            disabled={!computed.output}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                computed.output ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Mode Toggle */}
                <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                    <button
                        onClick={() => setMode('json-to-yaml')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                            mode === 'json-to-yaml' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        <FileJson className="w-4 h-4" />
                        <span>JSON to YAML</span>
                    </button>
                    <button
                        onClick={() => setMode('yaml-to-json')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                            mode === 'yaml-to-json' ? 'brand-gradient text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-brand'
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        <span>YAML to JSON</span>
                    </button>
                </div>

                {/* Error Display */}
                {computed.error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold">Conversion Error</span>
                        </div>
                        {computed.error}
                    </div>
                )}

                {/* Enhanced Input/Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Input</label>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {getCharacterCount()} chars • {getLineCount()} lines
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            <textarea
                                className="w-full h-full p-4 bg-transparent text-blue-300 font-mono text-sm resize-none outline-none"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'json-to-yaml' ? '{\n  "hello": "world"\n}' : 'hello: world'}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {getLineCount()} lines
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Output</label>
                            </div>
                            {computed.stats && (
                                <div className="text-xs text-green-400 font-black uppercase tracking-widest">
                                    {computed.stats.outputLines} lines
                                </div>
                            )}
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden">
                            {computed.output ? (
                                <div className="p-4">
                                    <pre className="text-blue-300 font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                        {computed.output}
                                    </pre>
                                    <div className="mt-3 text-xs text-gray-400">
                                        {new Date().toLocaleString()} • {computed.output.length} characters
                                        {computed.stats && ` • ${getSizeReduction()}% size change`}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Zap className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No conversion yet</p>
                                    <p className="text-xs">Enter {mode === 'json-to-yaml' ? 'JSON' : 'YAML'} to convert</p>
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
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">YAML Indent</label>
                                <input
                                    type="number"
                                    value={yamlIndent}
                                    onChange={(e) => setYamlIndent(Number(e.target.value))}
                                    min={0}
                                    max={10}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Number of spaces for YAML indentation</p>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">YAML Line Width</label>
                                <input
                                    type="number"
                                    value={yamlLineWidth}
                                    onChange={(e) => setYamlLineWidth(Number(e.target.value))}
                                    min={-1}
                                    max={200}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">-1 = no line limit</p>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">JSON Indent</label>
                                <input
                                    type="number"
                                    value={jsonIndent}
                                    onChange={(e) => setJsonIndent(Number(e.target.value))}
                                    min={0}
                                    max={10}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Number of spaces for JSON indentation</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="validate_input"
                                    checked={validateInput}
                                    onChange={(e) => setValidateInput(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="validate_input" className="text-sm text-[var(--text-primary)]">Validate Input</label>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Conversion Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses js-yaml library for YAML parsing and formatting. Supports JSON validation and proper indentation for both formats.
                            </p>
                        </div>
                    </div>
                )}

                {/* Results and History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Statistics</label>
                            </div>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                            {computed.stats ? (
                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Input Type</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.inputType}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Output Type</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.outputType}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Input Lines</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.inputLines}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Output Lines</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.outputLines}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Input Chars</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.inputChars}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-widest mb-1">Output Chars</div>
                                            <div className="text-blue-300 font-mono">{computed.stats.outputChars}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No statistics yet</p>
                                    <p className="text-xs">Convert to see statistics</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-brand" />
                                <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                disabled={conversionHistory.length === 0}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    conversionHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                )}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                            {conversionHistory.length > 0 ? (
                                <div className="p-4 space-y-2">
                                    {conversionHistory.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleHistoryClick(entry)}
                                            className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                    {entry.mode === 'json-to-yaml' ? 'JSON→YAML' : 'YAML→JSON'}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                {entry.input}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                                {entry.output}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                    <Clock className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No history yet</p>
                                    <p className="text-xs">Your conversion history will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
