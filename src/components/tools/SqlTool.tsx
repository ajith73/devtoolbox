import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Database } from 'lucide-react'
import { format } from 'sql-formatter'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function SqlTool() {
    const [input, setInput] = usePersistentState('sql_input', '')
    const [output, setOutput] = useState('')
    const [dialect, setDialect] = useState<'sql' | 'mysql' | 'postgresql' | 'snowflake' | 'bigquery'>('sql')
    const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper')
    const [tabWidth, setTabWidth] = useState(2)
    const [commaStyle, setCommaStyle] = useState<'trailing' | 'leading'>('trailing')
    const [alignColumns] = useState(false)
    const [minifyMode, setMinifyMode] = useState(false)
    const [savedQueries, setSavedQueries] = usePersistentState('sql_saved_queries', [] as string[])
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [explanation, setExplanation] = useState('')

    const handleDownload = () => {
        if (output) {
            const blob = new Blob([output], { type: 'text/sql;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'query.sql'
            link.click()
            URL.revokeObjectURL(url)
        }
    }

    const handleSaveQuery = () => {
        if (input.trim() && !savedQueries.includes(input)) {
            setSavedQueries([...savedQueries, input])
        }
    }

    const explainQuery = (sql: string) => {
        const lowerSql = sql.toLowerCase().trim()

        // Simple SELECT explanation
        if (lowerSql.startsWith('select')) {
            const match = lowerSql.match(/select\s+(.+)\s+from\s+(.+?)(?:\s+where\s+(.+))?/i)
            if (match) {
                const columns = match[1] ? match[1].split(',').map(c => c.trim()) : ['all columns']
                const table = match[2] || 'specified table'
                const condition = match[3] ? `where ${match[3]}` : ''

                if (condition) {
                    setExplanation(`This query selects ${columns.join(', ')} from the ${table} table ${condition}.`)
                } else {
                    setExplanation(`This query selects ${columns.join(', ')} from the ${table} table.`)
                }
                return
            }
        }

        // Default explanation
        setExplanation('Enter a SQL query to see an explanation.')
    }

    const validateSQL = (sql: string) => {
        const errors: string[] = []

        // Check for missing semicolon
        if (!sql.trim().endsWith(';')) {
            errors.push('Missing semicolon at end of query')
        }

        // Check for unclosed quotes
        const quotes = (sql.match(/'/g) || []).length
        if (quotes % 2 !== 0) {
            errors.push('Unclosed quotes in query')
        }

        // Check for basic syntax
        if (sql.toLowerCase().includes('select') && !sql.toLowerCase().includes('from')) {
            errors.push('SELECT statement without FROM clause')
        }

        return errors
    }

    useEffect(() => {
        if (!input.trim()) {
            setOutput('')
            setValidationErrors([])
            return
        }

        // Validate SQL
        const errors = validateSQL(input)
        setValidationErrors(errors)

        try {
            if (minifyMode) {
                // Minify: remove extra whitespace and newlines
                const minified = input.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim()
                setOutput(minified)
            } else {
                const formatted = format(input, {
                    language: dialect,
                    tabWidth,
                    keywordCase
                })
                setOutput(formatted)
            }
        } catch (e: any) {
            setOutput(input) // fallback to raw
        }
    }, [input, dialect, keywordCase, tabWidth, commaStyle, alignColumns, minifyMode])

    return (
        <ToolLayout
            title="SQL Formatter"
            description="Prettify your SQL queries for better readability."
            icon={Database}
            onReset={() => { setInput(''); setOutput(''); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={handleDownload}
        >
            <div className="space-y-6">
                {/* Formatting Controls */}
                <div className="flex flex-wrap gap-4 p-4 glass rounded-2xl border-[var(--border-primary)]">
                    {/* SQL Dialect */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">SQL Dialect</label>
                        <select
                            value={dialect}
                            onChange={(e) => setDialect(e.target.value as 'sql' | 'mysql' | 'postgresql' | 'snowflake' | 'bigquery')}
                            className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="sql">Standard SQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="snowflake">Snowflake</option>
                            <option value="bigquery">BigQuery</option>
                        </select>
                    </div>
                    {/* Keyword Case */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Keyword Case</label>
                        <select
                            value={keywordCase}
                            onChange={(e) => setKeywordCase(e.target.value as 'upper' | 'lower' | 'preserve')}
                            className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="upper">UPPER</option>
                            <option value="lower">lower</option>
                            <option value="preserve">Preserve</option>
                        </select>
                    </div>
                    {/* Mode */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Mode</label>
                        <select
                            value={minifyMode ? 'minify' : 'format'}
                            onChange={(e) => setMinifyMode(e.target.value === 'minify')}
                            className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="format">Format</option>
                            <option value="minify">Minify</option>
                        </select>
                    </div>
                    {/* Indent Size */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Indent Size</label>
                        <select
                            value={tabWidth}
                            onChange={(e) => setTabWidth(Number(e.target.value))}
                            className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="2">2 spaces</option>
                            <option value="4">4 spaces</option>
                            <option value="8">8 spaces</option>
                        </select>
                    </div>
                    {/* Comma Style */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-2">Comma Style</label>
                        <select
                            value={commaStyle}
                            onChange={(e) => setCommaStyle(e.target.value as 'trailing' | 'leading')}
                            className="px-3 py-2 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="trailing">Trailing</option>
                            <option value="leading">Leading</option>
                        </select>
                    </div>
                    {/* Save Query */}
                    <div className="flex flex-col">
                        <button
                            onClick={handleSaveQuery}
                            className="px-3 py-2 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-colors"
                        >
                            Save Query
                        </button>
                    </div>
                    {/* Explain Query */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => explainQuery(input)}
                            className="px-3 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-colors"
                        >
                            Explain Query
                        </button>
                    </div>
                </div>

                {/* Query Explanation */}
                {explanation && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                        <h3 className="text-sm font-bold mb-3 text-purple-500">Query Explanation</h3>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm text-purple-700">{explanation}</span>
                        </div>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)]">
                        <h3 className="text-sm font-bold mb-3 text-red-500">Validation Errors</h3>
                        <div className="space-y-2">
                            {validationErrors.map((err: string, idx: number) => (
                                <div key={idx} className="flex items-center p-2 bg-red-50 rounded-lg">
                                    <span className="text-sm text-red-700">{err}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px] h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Query Source</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none custom-scrollbar shadow-inner p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-[var(--text-primary)]"
                            placeholder="SELECT * FROM logic_nodes WHERE status = 'active' ORDER BY priority DESC;"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-hover:text-brand">Engine Output</label>
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm transition-all group-hover:shadow-brand/5">
                            <pre className="absolute inset-0 p-8 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[10px]">Synthetic formatting pending...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
