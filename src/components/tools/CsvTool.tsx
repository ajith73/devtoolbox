import { useState, useRef, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileJson, Upload, FileCode, CheckCircle2, AlertCircle, Download, Copy, Settings, Filter, ArrowRightLeft, Database } from 'lucide-react'
import Papa from 'papaparse'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type CaseMode = 'none' | 'camel' | 'snake' | 'kebab' | 'pascal' | 'upper' | 'lower'
type OutputFormat = 'array-of-objects' | 'array-of-arrays' | 'ndjson' | 'keyed-object'

export function CsvTool() {
    const [input, setInput] = usePersistentState('csv_input_new', '')
    const [delimiter, setDelimiter] = usePersistentState('csv_delimiter', '')
    const [header, setHeader] = usePersistentState('csv_header', true)
    const [dynamicTyping, setDynamicTyping] = usePersistentState('csv_dynamic_typing', true)
    const [skipEmptyLines, setSkipEmptyLines] = usePersistentState('csv_skip_empty', true)
    const [caseMode, setCaseMode] = usePersistentState<CaseMode>('csv_case_mode', 'none')
    const [outputFormat, setOutputFormat] = usePersistentState<OutputFormat>('csv_output_format', 'array-of-objects')
    const [keyColumn, setKeyColumn] = usePersistentState('csv_key_column', '')
    const [wrapProperty, setWrapProperty] = usePersistentState('csv_wrap_prop', '')
    const [treatEmptyAsNull, setTreatEmptyAsNull] = usePersistentState('csv_empty_null', false)

    const [fileName, setFileName] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const transformKey = (key: string, mode: CaseMode): string => {
        if (mode === 'none') return key
        const words = key.split(/[-_\s]+/)
        switch (mode) {
            case 'camel':
                return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
            case 'snake':
                return words.map(w => w.toLowerCase()).join('_')
            case 'kebab':
                return words.map(w => w.toLowerCase()).join('-')
            case 'pascal':
                return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
            case 'upper':
                return key.toUpperCase()
            case 'lower':
                return key.toLowerCase()
            default:
                return key
        }
    }

    const computed = useMemo(() => {
        if (!input.trim()) return { output: '', error: null, stats: { rows: 0, columns: [] as string[] } }

        try {
            const config: Papa.ParseConfig = {
                header: outputFormat !== 'array-of-arrays' && header,
                skipEmptyLines: skipEmptyLines ? 'greedy' : false,
                dynamicTyping,
                delimiter: delimiter || undefined,
            }

            const results = Papa.parse(input, config)

            if (results.errors.length > 0) {
                return { output: '', error: results.errors[0].message, stats: { rows: 0, columns: [] } }
            }

            let data = results.data as any[]
            const columns = results.meta.fields || []

            // Handle transformations
            if (treatEmptyAsNull) {
                data = data.map(row => {
                    const newRow = Array.isArray(row) ? [...row] : { ...row }
                    if (Array.isArray(newRow)) {
                        return newRow.map(v => v === '' ? null : v)
                    } else {
                        Object.keys(newRow).forEach(k => {
                            if (newRow[k] === '') newRow[k] = null
                        })
                        return newRow
                    }
                })
            }

            if (caseMode !== 'none' && header && outputFormat !== 'array-of-arrays') {
                data = data.map(row => {
                    const newRow: any = {}
                    Object.keys(row).forEach(k => {
                        newRow[transformKey(k, caseMode)] = row[k]
                    })
                    return newRow
                })
            }

            let finalOutput: any = data

            if (outputFormat === 'keyed-object' && keyColumn && header) {
                const keyed: any = {}
                const transformedKeyColumn = transformKey(keyColumn, caseMode)
                data.forEach(row => {
                    const key = row[transformedKeyColumn] || row[keyColumn]
                    if (key !== undefined) {
                        keyed[key] = row
                    }
                })
                finalOutput = keyed
            }

            if (wrapProperty.trim()) {
                finalOutput = { [wrapProperty.trim()]: finalOutput }
            }

            let outputString = ''
            if (outputFormat === 'ndjson') {
                outputString = Array.isArray(finalOutput)
                    ? finalOutput.map(row => JSON.stringify(row)).join('\n')
                    : JSON.stringify(finalOutput)
            } else {
                outputString = JSON.stringify(finalOutput, null, 2)
            }

            return {
                output: outputString,
                error: null,
                stats: {
                    rows: data.length,
                    columns: results.meta.fields || (data[0] && Array.isArray(data[0]) ? data[0].map((_: any, i: number) => `Col ${i}`) : [])
                }
            }
        } catch (e: any) {
            return { output: '', error: e.message, stats: { rows: 0, columns: [] } }
        }
    }, [input, delimiter, header, dynamicTyping, skipEmptyLines, caseMode, outputFormat, keyColumn, wrapProperty, treatEmptyAsNull])

    const handleFile = (file: File) => {
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            setInput(text)
        }
        reader.readAsText(file)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.type === 'text/csv')) {
            handleFile(file)
        }
    }

    const handleDownload = () => {
        const ext = outputFormat === 'ndjson' ? 'ndjson' : 'json'
        const blob = new Blob([computed.output], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devbox-export-${fileName ? fileName.split('.')[0] : 'data'}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="CSV to JSON"
            description="Professional spreadsheet transformer. Supports large files, auto-typing, NDJSON, and keyed output."
            icon={FileJson}
            onReset={() => {
                setInput('')
                setFileName(null)
            }}
            onCopy={computed.output ? () => copyToClipboard(computed.output) : undefined}
            onDownload={computed.output ? handleDownload : undefined}
        >
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className="space-y-6 text-[var(--text-primary)]"
            >
                {/* Options Panel */}
                <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Settings className="w-4 h-4 text-brand" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-brand">Conversion Schema</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Output Format</label>
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none"
                            >
                                <option value="array-of-objects">Array of Objects</option>
                                <option value="array-of-arrays">Array of Arrays</option>
                                <option value="ndjson">NDJSON (JSON Lines)</option>
                                <option value="keyed-object">Keyed Object (Hash Table)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Key Case</label>
                            <select
                                value={caseMode}
                                onChange={(e) => setCaseMode(e.target.value as CaseMode)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none"
                            >
                                <option value="none">Original Case</option>
                                <option value="camel">camelCase</option>
                                <option value="snake">snake_case</option>
                                <option value="kebab">kebab-case</option>
                                <option value="pascal">PascalCase</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Delimiter</label>
                            <input
                                type="text"
                                placeholder="Auto (comma, tab, pipe...)"
                                value={delimiter}
                                onChange={(e) => setDelimiter(e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none"
                                maxLength={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Property Wrapper</label>
                            <input
                                type="text"
                                placeholder="e.g. results, users"
                                value={wrapProperty}
                                onChange={(e) => setWrapProperty(e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center space-x-3 p-3 bg-[var(--bg-primary)]/50 rounded-xl border border-[var(--border-primary)]">
                            <input
                                type="checkbox"
                                checked={header}
                                onChange={(e) => setHeader(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--border-primary)] text-brand focus:ring-brand/20 ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Has Header Row</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-[var(--bg-primary)]/50 rounded-xl border border-[var(--border-primary)]">
                            <input
                                type="checkbox"
                                checked={dynamicTyping}
                                onChange={(e) => setDynamicTyping(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--border-primary)] text-brand focus:ring-brand/20 ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Auto-Type Logic</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-[var(--bg-primary)]/50 rounded-xl border border-[var(--border-primary)]">
                            <input
                                type="checkbox"
                                checked={treatEmptyAsNull}
                                onChange={(e) => setTreatEmptyAsNull(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--border-primary)] text-brand focus:ring-brand/20 ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Empty as Null</span>
                        </div>
                        {outputFormat === 'keyed-object' && (
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-brand uppercase tracking-widest block ml-1">Primary Key Column</label>
                                <select
                                    value={keyColumn}
                                    onChange={(e) => setKeyColumn(e.target.value)}
                                    className="w-full bg-[var(--bg-primary)] border-2 border-brand/30 rounded-xl px-3 py-2 text-xs outline-none"
                                >
                                    <option value="">Select ID Column...</option>
                                    {computed.stats.columns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
                                Source Dataset
                            </label>
                            <label className="cursor-pointer px-5 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center space-x-2">
                                <Upload className="w-4 h-4" />
                                <span>Ingest CSV/TSV</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFile(file)
                                    }}
                                    accept=".csv,.tsv,.txt"
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80"
                            placeholder="Example:\nid,name,status\n101,John,Active\n102,Alice,Pending"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Output Logic</label>
                            {computed.output && !computed.error && (
                                <div className="px-4 py-1.5 rounded-full bg-brand/10 text-brand text-[9px] font-black uppercase flex items-center space-x-2 border border-brand/20 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Logic Verified</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40">
                            {computed.error ? (
                                <div className="absolute inset-0 p-10 flex flex-col items-center justify-center text-center space-y-6">
                                    <AlertCircle className="w-16 h-16 text-red-500/40 animate-pulse" />
                                    <div className="space-y-3">
                                        <p className="font-black text-red-500 uppercase tracking-[0.2em]">Disruption Detected</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase leading-relaxed">{computed.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <pre className="absolute inset-0 p-10 text-brand font-mono text-[11px] overflow-auto custom-scrollbar font-black opacity-90 select-all leading-relaxed">
                                    {computed.output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[9px]">Awaiting dataset...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 border-t-2 border-t-brand/20 flex items-center justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="flex items-center space-x-8 relative">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-brand/10 flex items-center justify-center shadow-inner border border-brand/20 backdrop-blur-md">
                            <Database className="w-10 h-10 text-brand" />
                        </div>
                        <div className="space-y-3">
                            <p className="font-black text-[var(--text-primary)] text-xl uppercase tracking-[0.2em] leading-none">{fileName || 'Virtual Cluster 01'}</p>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <span className="text-[10px] font-black text-brand uppercase tracking-widest">Semantic Core Active</span>
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] border-l border-[var(--border-primary)] pl-4">
                                    {computed.stats.rows} Records Map Output
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 relative">
                        <button
                            onClick={() => copyToClipboard(computed.output)}
                            disabled={!computed.output}
                            className="p-4 bg-[var(--bg-primary)] hover:bg-brand hover:text-white text-[var(--text-secondary)] rounded-2xl transition-all border border-[var(--border-primary)] hover:border-transparent group disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]"
                        >
                            <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!computed.output}
                            className="p-4 bg-brand text-white rounded-2xl transition-all shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 group disabled:opacity-30 disabled:hover:scale-100"
                        >
                            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
