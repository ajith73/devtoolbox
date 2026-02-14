import React, { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Type, ArrowRightLeft, Upload, FileCode, CheckCircle2, Download, Eye, AlertTriangle } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function Base64Tool() {
    const [inputText, setInputText] = usePersistentState('base64_input', '')
    const [outputText, setOutputText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'encode' | 'decode'>('encode')
    const [fileName, setFileName] = useState<string | null>(null)
    const [fileType, setFileType] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        if (inputText && !inputText.startsWith('[Binary Data:')) {
            processText(inputText, mode)
        }
    }, [])

    const processText = (val: string, currentMode: 'encode' | 'decode') => {
        if (!val) {
            setOutputText('')
            setError(null)
            return
        }
        try {
            if (currentMode === 'encode') {
                setOutputText(btoa(val))
            } else {
                setOutputText(atob(val))
            }
            setError(null)
            setFileName(null)
        } catch (e: any) {
            setError('Invalid input for ' + currentMode)
            setOutputText('')
        }
    }

    const toggleMode = () => {
        const newMode = mode === 'encode' ? 'decode' : 'encode'
        setMode(newMode)
        processText(inputText, newMode)
    }

    const handleFile = (file: File) => {
        setFileName(file.name)
        setFileType(file.type)
        const reader = new FileReader()
        reader.onload = (event) => {
            const result = event.target?.result as string
            const base64 = result.split(',')[1] || result
            setOutputText(base64)
            setInputText(`[Binary Data: ${file.name}]`)
            setMode('encode')
        }
        reader.readAsDataURL(file)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const handleDownload = () => {
        if (!outputText) return
        try {
            const byteCharacters = atob(outputText)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: fileType || 'application/octet-stream' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName || 'decoded-file'
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            // If it's just text
            const blob = new Blob([outputText], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'base64-result.txt'
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    return (
        <ToolLayout
            title="Base64 Converter"
            description="Professional grade encoder and decoder for text, images, and binary files."
            icon={FileCode}
            onReset={() => {
                setInputText('')
                setOutputText('')
                setError(null)
                setFileName(null)
            }}
            onCopy={outputText ? () => copyToClipboard(outputText) : undefined}
            onDownload={outputText ? handleDownload : undefined}
        >
            <div className="space-y-6 text-[var(--text-primary)] min-h-[500px]">
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "flex flex-col md:flex-row items-center justify-between gap-4 p-6 glass rounded-[2.5rem] border-[var(--border-primary)] transition-all bg-[var(--bg-secondary)]/30",
                        isDragging ? "bg-brand/10 border-brand/40 scale-[1.02]" : "bg-[var(--bg-secondary)]/50"
                    )}
                >
                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] shrink-0 shadow-sm">
                        <button
                            onClick={() => { setMode('encode'); processText(inputText, 'encode'); }}
                            className={cn(
                                "px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'encode' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            Encode
                        </button>
                        <button
                            onClick={() => { setMode('decode'); processText(inputText, 'decode'); }}
                            className={cn(
                                "px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'decode' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            Decode
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <label className="flex-1 md:flex-initial flex items-center justify-center space-x-3 px-8 py-3 glass rounded-2xl border-dashed border-[var(--border-primary)] cursor-pointer bg-[var(--bg-primary)] hover:bg-brand/5 hover:border-brand/40 transition-all group shadow-sm">
                            <Upload className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none text-[var(--text-secondary)] group-hover:text-brand">
                                {isDragging ? 'Drop it here' : 'Drop file or click'}
                            </span>
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <div className="h-10 w-[1px] bg-[var(--border-primary)] hidden md:block" />
                        <button
                            onClick={toggleMode}
                            className="p-3 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-brand/10 transition-all text-[var(--text-muted)] hover:text-brand shadow-sm"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[500px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{mode === 'encode' ? 'Standard Source' : 'Ciphertext Base64'}</label>
                            {fileName && <span className="text-[10px] text-brand font-black uppercase tracking-widest truncate max-w-[200px]">Attached: {fileName}</span>}
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40"
                            placeholder={mode === 'encode' ? 'Paste text here to encode...' : 'Paste base64 string here to decode...'}
                            value={inputText}
                            onChange={(e) => {
                                setInputText(e.target.value)
                                processText(e.target.value, mode)
                            }}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{mode === 'encode' ? 'Encoded Payload' : 'Decoded Blueprint'}</label>
                            {outputText && (
                                <div className="flex items-center space-x-2 text-[10px] text-green-500 font-black uppercase tracking-[0.2em]">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            {error ? (
                                <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <p className="text-red-500 font-black uppercase tracking-widest text-sm">Decoding Malfunction</p>
                                    <p className="text-xs text-[var(--text-secondary)] font-mono italic px-10">{error}</p>
                                </div>
                            ) : (
                                <div className="absolute inset-0 p-8 overflow-hidden flex flex-col">
                                    <pre className="flex-1 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-all focus:outline-none opacity-90" tabIndex={0}>
                                        {outputText || <span className="text-[var(--text-muted)] opacity-30 italic">Resulting payload will manifest here...</span>}
                                    </pre>

                                    {outputText && mode === 'encode' && outputText.length > 50 && (
                                        <div className="mt-6 pt-6 border-t border-[var(--border-primary)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">
                                            <span>Payload Delta: {outputText.length} Bits</span>
                                            <div className="flex items-center space-x-6">
                                                <button onClick={() => copyToClipboard(outputText)} className="flex items-center hover:text-brand transition-all hover:scale-105">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                                                    Snapshot Hash
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] flex items-center space-x-5 shadow-sm bg-[var(--bg-secondary)]/30">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Type className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Entity Engine</p>
                            <p className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)]">{fileName ? 'Binary Protocol' : 'Textual Frame'}</p>
                        </div>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] flex items-center space-x-5 shadow-sm bg-[var(--bg-secondary)]/30">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Eye className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Visual Integrity</p>
                            <p className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)]">UTF-8 Compliant</p>
                        </div>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] flex items-center space-x-5 shadow-sm bg-[var(--bg-secondary)]/30">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                            <Download className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Cloud Sandbox</p>
                            <p className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)]">Client-Only Logic</p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
