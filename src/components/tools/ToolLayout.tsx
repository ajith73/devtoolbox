import React, { useState, useEffect } from 'react'
import { Copy, Download, RefreshCcw, Check, ArrowLeft, HelpCircle, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import confetti from 'canvas-confetti'
import { TOOLS } from '../../lib/config'
import { useRecentlyUsed } from '../../lib/storage'

interface ToolPageProps {
    title: string
    description: string
    icon: React.ElementType
    children: React.ReactNode
    onReset?: () => void
    onCopy?: () => void
    onDownload?: () => void
    copyDisabled?: boolean
    downloadDisabled?: boolean
}

export function ToolLayout({
    title,
    description,
    icon: Icon,
    children,
    onReset,
    onCopy,
    onDownload,
    copyDisabled,
    downloadDisabled
}: ToolPageProps) {
    const [copied, setCopied] = useState(false)
    const { addToRecent } = useRecentlyUsed()

    const toolInfo = TOOLS.find(t => t.name === title || t.seoTitle?.includes(title) || t.description === description)

    useEffect(() => {
        if (toolInfo) {
            document.title = toolInfo.seoTitle || `${title} - DevBox Online`
            addToRecent(toolInfo.id)
        } else {
            document.title = `${title} - DevBox Online`
        }
    }, [title, toolInfo, addToRecent])

    const handleCopy = () => {
        if (onCopy) {
            onCopy()
            setCopied(true)
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#3b82f6', '#8b5cf6', '#d946ef']
            })
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter' && onReset) {
                e.preventDefault()
                onReset()
            }
            if (e.ctrlKey && e.key === 'c' && onCopy && !copyDisabled) {
                const selectedText = window.getSelection()?.toString()
                if (selectedText) return
                e.preventDefault()
                handleCopy()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onReset, onCopy, copyDisabled])

    return (
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in text-[var(--text-primary)] transition-colors duration-500">
            <Link
                to="/"
                className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand transition-all group mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight underline decoration-brand/20 underline-offset-8 decoration-4">{title}</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl">{description}</p>
                </div>

                <div className="flex items-center space-x-3">
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="p-3 text-[var(--text-muted)] hover:text-brand hover:bg-brand/5 rounded-xl transition-all"
                            title="Reset (Ctrl+Enter)"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    )}
                    {onDownload && (
                        <button
                            disabled={downloadDisabled}
                            onClick={onDownload}
                            className="px-5 py-2.5 glass text-[var(--text-secondary)] hover:text-brand rounded-xl transition-all flex items-center space-x-2 border-[var(--border-primary)] hover:border-brand/40 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            <span className="font-bold text-sm">Download</span>
                        </button>
                    )}
                    {onCopy && (
                        <button
                            disabled={copyDisabled}
                            onClick={handleCopy}
                            className={cn(
                                "px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center space-x-2 shadow-xl",
                                copied
                                    ? "bg-green-500 text-white"
                                    : "brand-gradient text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                            )}
                            title="Copy Result (Ctrl+C)"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                {children}
            </div>

            {/* How to Use Section */}
            {toolInfo && toolInfo.howToUse && (
                <div className="pt-16 border-t border-white/5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 text-brand">
                                <HelpCircle className="w-5 h-5" />
                                <h2 className="text-xl font-bold">How to use {title}</h2>
                            </div>
                            <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] space-y-4">
                                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                                    {toolInfo.howToUse}
                                </p>
                                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--border-primary)]/30">
                                    <div className="flex items-center space-x-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                        <Zap className="w-3.5 h-3.5 text-brand" />
                                        <span>Ctrl + Enter: Reset</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                        <Copy className="w-3.5 h-3.5 text-brand" />
                                        <span>Ctrl + C: Copy</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 text-purple-400">
                                <Zap className="w-5 h-5" />
                                <h2 className="text-xl font-bold">Why use DevBox?</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 glass rounded-2xl border-[var(--border-primary)] space-y-2">
                                    <p className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest">100% Privacy</p>
                                    <p className="text-[11px] text-[var(--text-secondary)] italic">No data ever leaves your computer. Everything is processed locally.</p>
                                </div>
                                <div className="p-6 glass rounded-2xl border-[var(--border-primary)] space-y-2">
                                    <p className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest">Extreme Speed</p>
                                    <p className="text-[11px] text-[var(--text-secondary)] italic">No loading screens, no server lag. Just instant results.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
