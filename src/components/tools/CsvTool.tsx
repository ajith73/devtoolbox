import { useState, useRef, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileJson, Upload, FileCode, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function CsvTool() {
    const [input, setInput] = usePersistentState('csv_input', '')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (input) handleConvert(input)
    }, [])

    const handleConvert = (val: string) => {
        setInput(val)
        setFileName(null)
        if (!val.trim()) {
            setOutput('')
            setError(null)
            return
        }

        Papa.parse(val, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results: any) => {
                if (results.errors.length > 0) {
                    setError(results.errors[0].message)
                    setOutput('')
                } else {
                    setOutput(JSON.stringify(results.data, null, 2))
                    setError(null)
                }
            },
            error: (err: any) => {
                setError(err.message)
            }
        })
    }

    const handleFile = (file: File) => {
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            handleConvert(text)
        }
        reader.readAsText(file)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
            handleFile(file)
        }
    }

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devbox-export-${fileName ? fileName.replace('.csv', '') : 'data'}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="CSV to JSON"
            description="Professional spreadsheet transformer. Supports large files and auto-typing."
            icon={FileJson}
            onReset={() => {
                setInput('')
                setOutput('')
                setError(null)
                setFileName(null)
            }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={output ? handleDownload : undefined}
        >
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className="space-y-6 text-[var(--text-primary)] min-h-[500px]"
            >
                <div className={cn(
                    "grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px] lg:h-[500px] transition-all",
                    isDragging && "opacity-50 scale-[0.98]"
                )}>
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
                                {isDragging ? 'Drop CSV Node' : 'Source Dataset'}
                            </label>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-5 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center space-x-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Ingest CSV</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv"
                                className="hidden"
                            />
                        </div>
                        <textarea
                            className="flex-1 font-mono text-xs resize-none p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80"
                            placeholder="Format: identifier,attribute,location\n7DE-1,Prime,Sector-9"
                            value={input}
                            onChange={(e) => handleConvert(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Structured Manifest</label>
                            {output && (
                                <div className="px-4 py-1.5 rounded-full bg-brand/10 text-brand text-[9px] font-black uppercase flex items-center space-x-2 border border-brand/20 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Logic Verified</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40">
                            {error ? (
                                <div className="absolute inset-0 p-10 flex flex-col items-center justify-center text-center space-y-6">
                                    <AlertCircle className="w-16 h-16 text-red-500/40 animate-pulse" />
                                    <div className="space-y-3">
                                        <p className="font-black text-red-500 uppercase tracking-[0.2em]">Logical Disruption</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase leading-relaxed">{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <pre className="absolute inset-0 p-10 text-brand font-mono text-[11px] overflow-auto custom-scrollbar font-black opacity-90 select-all leading-relaxed">
                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[9px]">Awaiting source dataset ingress...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-brand/10 flex items-center justify-center shadow-inner border border-brand/20">
                            <FileCode className="w-8 h-8 text-brand" />
                        </div>
                        <div>
                            <p className="font-black text-[var(--text-primary)] text-base uppercase tracking-widest leading-none">{fileName || 'Synthetic Node 001'}</p>
                            <div className="mt-2 flex items-center space-x-3">
                                <span className="px-2 py-0.5 rounded-md bg-brand/5 text-[9px] font-black text-brand uppercase tracking-widest border border-brand/10">Active Session</span>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-60">
                                    {output ? `${JSON.parse(output).length} Tuple Clusters Resolved` : 'System Standby'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] max-w-[200px] text-right hidden md:block opacity-40 leading-relaxed">
                            Engine automatically resolves semantic headers and structural typings for tuple clusters.
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
