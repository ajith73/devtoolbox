import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    DatabaseZap, Terminal, Settings2,
    AlertTriangle, CheckCircle2,
    Database, Zap, FileCode2, RefreshCw, Copy, Download
} from 'lucide-react'
import { format } from 'sql-formatter'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function SqlTool() {
    // Persistent States
    const [input, setInput] = usePersistentState('sql_input', 'SELECT * FROM users JOIN orders ON users.id = orders.user_id WHERE orders.status = "shipped" ORDER BY orders.created_at DESC;')
    const [dialect, setDialect] = usePersistentState<'sql' | 'mysql' | 'postgresql' | 'snowflake' | 'bigquery'>('sql_dialect', 'sql')
    const [keywordCase, setKeywordCase] = usePersistentState<'upper' | 'lower' | 'preserve'>('sql_case', 'upper')
    const [tabWidth, setTabWidth] = usePersistentState('sql_tab_width', 2)
    const [commaStyle] = usePersistentState<'trailing' | 'leading'>('sql_comma_style', 'trailing')
    const [minifyMode, setMinifyMode] = usePersistentState('sql_minify', false)
    const [savedQueries, setSavedQueries] = usePersistentState<string[]>('sql_saved_queries_v2', [])

    // Local States
    const [output, setOutput] = useState('')
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [explanation, setExplanation] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // SQL Dialect Options
    const DIALECTS = [
        { value: 'sql', label: 'Standard SQL', icon: Database },
        { value: 'mysql', label: 'MySQL', icon: Database },
        { value: 'postgresql', label: 'PostgreSQL', icon: Database },
        { value: 'snowflake', label: 'Snowflake', icon: Database },
        { value: 'bigquery', label: 'BigQuery', icon: Database }
    ]

    // Core Logic
    useEffect(() => {
        if (!input.trim()) {
            setOutput('')
            setValidationErrors([])
            setExplanation('')
            return
        }

        setIsProcessing(true)
        const timer = setTimeout(() => {
            try {
                // Validation (Basic)
                const errors: string[] = []
                if (!input.trim().endsWith(';')) errors.push('Missing semicolon termination')
                const quotes = (input.match(/'/g) || []).length + (input.match(/"/g) || []).length
                if (quotes % 2 !== 0) errors.push('Possible unclosed string literal detected')
                if (input.toLowerCase().includes('select') && !input.toLowerCase().includes('from')) errors.push('Potential SELECT syntax violation (missing FROM)')
                setValidationErrors(errors)

                // Formatting
                if (minifyMode) {
                    const minified = input.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim()
                    setOutput(minified)
                } else {
                    const formatted = format(input, {
                        language: dialect as any,
                        tabWidth,
                        keywordCase,
                        useTabs: false
                    })
                    setOutput(formatted)
                }

                // AI-style Explanation
                const lowerSql = input.toLowerCase().trim()
                if (lowerSql.startsWith('select')) {
                    const tableMatch = lowerSql.match(/from\s+([a-zA-Z0-9_\.]+)/)
                    if (tableMatch) {
                        setExplanation(`Synthesizing data from \`${tableMatch[1]}\` with focus on specific projection vectors.`)
                    } else {
                        setExplanation('Parsing projection from unknown origin.')
                    }
                } else if (lowerSql.startsWith('insert')) {
                    setExplanation('Executing data ingestion protocol.')
                } else if (lowerSql.startsWith('update')) {
                    setExplanation('Applying state mutation to existing records.')
                } else {
                    setExplanation('Parsing general DDL/DML instruction.')
                }

            } catch (e: any) {
                setOutput(input)
                setExplanation('Divergence detected in processing engine.')
            } finally {
                setIsProcessing(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [input, dialect, keywordCase, tabWidth, commaStyle, minifyMode])

    // Actions
    const handleDownload = () => {
        if (output) {
            const blob = new Blob([output], { type: 'text/sql;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `query_${Date.now()}.sql`
            link.click()
            URL.revokeObjectURL(url)
        }
    }

    const handleSaveQuery = () => {
        if (input.trim() && !savedQueries.includes(input)) {
            setSavedQueries([input, ...savedQueries].slice(0, 20))
        }
    }

    const handleCopy = (text: string, id: string) => {
        copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <ToolLayout
            title="SQL Pro Formatter"
            description="Enterprise-grade query sanitation engine with dialect-specific semantic analysis and ultra-high fidelity formatting."
            icon={DatabaseZap}
            onReset={() => { setInput(''); setOutput(''); setSavedQueries([]); }}
            onDownload={handleDownload}
        >
            <div className="space-y-8 text-[var(--text-primary)]">

                {/* Dialect & Config Toolbar */}
                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-2xl space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex glass rounded-2xl p-1 border-[var(--border-primary)] bg-[var(--bg-primary)]/50 shadow-inner">
                                {DIALECTS.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => setDialect(d.value as any)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            dialect === d.value ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:text-brand"
                                        )}
                                    >
                                        {d.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>

                            <div className="flex glass rounded-2xl p-1 border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
                                {(['upper', 'lower', 'preserve'] as const).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setKeywordCase(c)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            keywordCase === c ? "bg-brand text-white shadow-lg" : "text-[var(--text-muted)] hover:text-brand"
                                        )}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2 glass rounded-2xl p-1 px-4 border-[var(--border-primary)]">
                                <Settings2 className="w-4 h-4 text-brand" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tab:</span>
                                {[2, 4].map(w => (
                                    <button
                                        key={w}
                                        onClick={() => setTabWidth(w)}
                                        className={cn(
                                            "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                                            tabWidth === w ? "bg-brand/20 text-brand" : "text-[var(--text-muted)] hover:text-brand"
                                        )}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setMinifyMode(!minifyMode)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center space-x-3",
                                    minifyMode ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : "glass text-[var(--text-muted)] border-[var(--border-primary)]"
                                )}
                            >
                                <Zap className={cn("w-4 h-4", minifyMode && "animate-pulse")} />
                                <span>{minifyMode ? 'Minified' : 'Pretty'}</span>
                            </button>
                        </div>
                    </div>

                    {explanation && (
                        <div className="p-6 rounded-[2rem] bg-brand/5 border border-brand/10 flex items-center space-x-6 animate-in slide-in-from-top-4 duration-500">
                            <Database className="w-6 h-6 text-brand" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Engine Inference</p>
                                <p className="text-sm font-medium text-[var(--text-primary)] opacity-80 italic leading-relaxed">{explanation}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Logic Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <div className="flex items-center justify-between px-8">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] transition-colors group-focus-within:text-brand flex items-center space-x-2">
                                <Terminal className="w-4 h-4" />
                                <span>Source Query [Buffer]</span>
                            </label>
                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{input.length} Tokens</span>
                        </div>
                        <div className="relative flex-1">
                            <textarea
                                className="absolute inset-0 w-full h-full font-mono text-sm resize-none p-10 rounded-[3.5rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-2xl custom-scrollbar transition-all focus:ring-[12px] focus:ring-brand/5 outline-none font-medium leading-relaxed"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="SELECT * FROM digital_stream..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4 group">
                        <div className="flex items-center justify-between px-8">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] transition-colors group-hover:text-brand flex items-center space-x-2">
                                <FileCode2 className="w-4 h-4" />
                                <span>Refined Projection</span>
                            </label>
                            <div className="flex items-center space-x-4">
                                {isProcessing && <RefreshCw className="w-3 h-3 animate-spin text-brand" />}
                                {validationErrors.length > 0 && (
                                    <div className="flex items-center space-x-1 text-red-500 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">{validationErrors.length} Risks</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => handleCopy(output, 'main')}
                                    className="p-2 glass rounded-xl hover:bg-brand/10 transition-all text-brand"
                                >
                                    {copiedId === 'main' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative glass rounded-[3.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-3xl transition-all group-hover:shadow-brand/5">
                            <pre className="absolute inset-0 p-10 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all">
                                {output || <span className="text-[var(--text-muted)] opacity-20 italic font-medium uppercase tracking-[0.5em] text-center w-full block mt-20">Awaiting query ingestion...</span>}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Validation Ledger */}
                {validationErrors.length > 0 && (
                    <div className="p-8 glass rounded-[3rem] border-red-500/20 bg-red-500/5 space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center space-x-3 text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Sanitation Report</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {validationErrors.map((err, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-xs font-bold text-red-900/80 dark:text-red-300 italic">{err}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Footer */}
                <div className="p-10 glass rounded-[3.5rem] border-dashed border-brand/20 bg-brand/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] text-brand font-black uppercase tracking-[0.5em]">Ledger Archive</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-bold italic opacity-60">Store significant query vectors in persistent session cache.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveQuery}
                            className="px-8 py-4 glass border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white transition-all shadow-lg"
                        >
                            Commit to History
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 brand-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center space-x-3"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export SQL</span>
                        </button>
                    </div>
                </div>

            </div>
        </ToolLayout>
    )
}
