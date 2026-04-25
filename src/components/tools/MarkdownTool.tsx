import { useState, useEffect, useRef, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    FileEdit, Eye, FileText, Zap, Layout, Bold, Italic, Heading1, Heading2,
    Link, Image, Code, Quote, List, ListOrdered, Table, BookOpen, Copy, FileDown,
    Upload, Clock, Hash, CheckSquare, Save, ChevronDown, ChevronUp, Type
} from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function MarkdownTool() {
    const [markdown, setMarkdown] = usePersistentState('markdown_input', '# Hello World\n\nStart typing on the left to see the **preview** on the right.\n\n### Features\n- Real-time preview\n- Clean aesthetics\n- .md download\n\n```javascript\nconsole.log("Markdown is awesome!");\n```')
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')
    const [showCheatSheet, setShowCheatSheet] = useState(false)
    const [showTableEditor, setShowTableEditor] = useState(false)
    const [tableRows, setTableRows] = useState(3)
    const [tableCols, setTableCols] = useState(3)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Enhanced markdown to HTML converter with GitHub flavored markdown support
    const renderPreview = (text: string): any => {
        if (!text || !text.trim()) return ''

        let html = text
            // Headers (H1-H6)
            .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-black mb-4 mt-8 first:mt-0 text-[var(--text-primary)]">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-3xl font-black mb-3 mt-6 text-[var(--text-primary)]">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-2xl font-black mb-2 mt-5 text-[var(--text-primary)]">$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4 class="text-xl font-black mb-2 mt-4 text-[var(--text-primary)]">$1</h4>')
            .replace(/^##### (.*$)/gm, '<h5 class="text-lg font-black mb-1 mt-3 text-[var(--text-primary)]">$1</h5>')
            .replace(/^###### (.*$)/gm, '<h6 class="text-base font-black mb-1 mt-3 text-[var(--text-primary)]">$1</h6>')

            // Text formatting
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="text-[var(--text-primary)]"><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-primary)]">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-[var(--text-primary)]">$1</em>')
            .replace(/~~(.*?)~~/g, '<del class="text-[var(--text-muted)]">$1</del>')
            .replace(/`([^`\n]+)`/g, '<code class="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--text-primary)]">$1</code>')

            // Links and images
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm border border-[var(--border-primary)] my-4" />')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:text-brand/80 underline" target="_blank" rel="noopener">$1</a>')

            // Lists (including GitHub task lists)
            .replace(/^(\s*)- \[x\] (.*$)/gm, '<li class="ml-4 list-none flex items-start space-x-2"><input type="checkbox" checked disabled class="mt-1 text-brand"><span class="line-through text-[var(--text-muted)]">$2</span></li>')
            .replace(/^(\s*)- \[ \] (.*$)/gm, '<li class="ml-4 list-none flex items-start space-x-2"><input type="checkbox" disabled class="mt-1"><span>$2</span></li>')
            .replace(/^(\s*)\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
            .replace(/^(\s*)- (.*$)/gm, '<li class="ml-4 list-disc">$2</li>')

            // Blockquotes
            .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-brand/30 pl-4 italic text-[var(--text-secondary)] my-4">$1</blockquote>')

            // Tables (basic support)
            .replace(/^\|(.+)\|$/gm, (match) => {
                const cells = match.split('|').slice(1, -1).map((cell: string) => cell.trim())
                return `<tr>${cells.map((cell: string) => `<td class="border border-[var(--border-primary)] px-3 py-2">${cell}</td>`).join('')}</tr>`
            })
            .replace(/^\|---+\|---+$/gm, () => {
                return '' // Skip separator rows
            })

            // Code blocks with language-specific styling
            .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
                const language = lang || 'text'
                const highlightedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                return `<div class="relative my-6"><div class="absolute top-3 right-3 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded">${language}</div><pre class="bg-[var(--bg-secondary)] p-6 pt-10 rounded-2xl font-mono text-sm border border-[var(--border-primary)] shadow-inner overflow-x-auto"><code class="language-${language} text-[var(--text-primary)]">${highlightedCode}</code></pre></div>`
            })

            // Horizontal rules
            .replace(/^---+$/gm, '<hr class="border-[var(--border-primary)] my-8" />')

            // Paragraphs and line breaks
            .replace(/\n\n/g, '</p><p class="mb-4 text-[var(--text-primary)] leading-relaxed">')
            .replace(/\n/g, '<br />')
            .replace(/^/, '<p class="mb-4 text-[var(--text-primary)] leading-relaxed">')
            .replace(/$/, '</p>')

        // Clean up empty paragraphs
        html = html.replace(/<p[^>]*><\/p>/g, '').replace(/<p[^>]*><br \/><\/p>/g, '')
        return html
    }

    // Export functions
    const handleDownload = (format: 'md' | 'html' | 'txt' = 'md') => {
        let content = markdown
        let filename = 'document'
        let mimeType = 'text/plain'

        switch (format) {
            case 'html':
                content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Markdown Document</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3, h4, h5, h6 { color: #1f2937; margin-top: 2rem; }
        code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: 'Monaco', 'Menlo', monospace; }
        pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; color: #6b7280; }
        img { max-width: 100%; height: auto; border-radius: 0.5rem; }
        a { color: #3b82f6; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    ${renderPreview(markdown)}
</body>
</html>`
                filename = 'document.html'
                mimeType = 'text/html'
                break
            case 'txt':
                filename = 'document.txt'
                break
            default:
                filename = 'document.md'
                mimeType = 'text/markdown'
        }

        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    const stats = useMemo(() => {
        const words = markdown.trim().split(/\s+/).filter(word => word.length > 0).length
        const characters = markdown.length
        const charactersNoSpaces = markdown.replace(/\s/g, '').length
        const readingTime = Math.ceil(words / 200) // Assuming 200 words per minute
        const lines = markdown.split('\n').length

        return { words, characters, charactersNoSpaces, readingTime, lines }
    }, [markdown])

    // Toolbar actions
    const insertText = (before: string, after: string = '', placeholder: string = 'text') => {
        if (!textareaRef.current) return

        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = markdown.substring(start, end)
        const replacement = before + (selectedText || placeholder) + after

        const newMarkdown = markdown.substring(0, start) + replacement + markdown.substring(end)
        setMarkdown(newMarkdown)

        // Set cursor position
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + before.length, start + before.length + (selectedText || placeholder).length)
        }, 0)
    }

    const toolbarActions = useMemo(() => [
        { icon: Bold, action: () => insertText('**', '**'), tooltip: 'Bold (Ctrl+B)' },
        { icon: Italic, action: () => insertText('*', '*'), tooltip: 'Italic (Ctrl+I)' },
        { icon: Heading1, action: () => insertText('# ', '', 'Heading'), tooltip: 'Heading 1' },
        { icon: Heading2, action: () => insertText('## ', '', 'Heading'), tooltip: 'Heading 2' },
        { icon: Link, action: () => insertText('[', '](url)'), tooltip: 'Link' },
        { icon: Image, action: () => insertText('![', '](url)'), tooltip: 'Image' },
        { icon: Code, action: () => insertText('`', '`'), tooltip: 'Inline Code' },
        { icon: Quote, action: () => insertText('> ', '', 'Quote'), tooltip: 'Blockquote' },
        { icon: List, action: () => insertText('- ', '', 'List item'), tooltip: 'Bullet List' },
        { icon: ListOrdered, action: () => insertText('1. ', '', 'List item'), tooltip: 'Numbered List' },
        { icon: CheckSquare, action: () => insertText('- [ ] ', '', 'Task'), tooltip: 'Task List' },
        { icon: Table, action: () => setShowTableEditor(true), tooltip: 'Insert Table' },
    ], [insertText])

    // Image upload handler
    const handleImageUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = () => {
                    insertText(`![${file.name}](`, `)`, file.name)
                }
                reader.readAsDataURL(file)
            }
        })
    }

    // Drag and drop handler
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleImageUpload(files)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    // Generate table markdown
    const generateTable = () => {
        const headers = Array.from({ length: tableCols }, (_, i) => `Header ${i + 1}`)
        const separator = Array(tableCols).fill('---').join(' | ')
        const rows = Array.from({ length: tableRows - 1 }, (_, rowIndex) =>
            Array.from({ length: tableCols }, (_, colIndex) => `Row ${rowIndex + 1}, Col ${colIndex + 1}`).join(' | ')
        )

        const tableMarkdown = [
            `| ${headers.join(' | ')} |`,
            `| ${separator} |`,
            ...rows.map(row => `| ${row} |`)
        ].join('\n')

        insertText(tableMarkdown, '', '')
        setShowTableEditor(false)
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault()
                        insertText('**', '**')
                        break
                    case 'i':
                        e.preventDefault()
                        insertText('*', '*')
                        break
                    case 'k':
                        e.preventDefault()
                        insertText('[', '](url)')
                        break
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <ToolLayout
            title="Markdown Editor Pro"
            description="Professional markdown suite with live preview, syntax highlighting, formatting tools, and export options."
            icon={FileEdit}
            onReset={() => setMarkdown('')}
            onCopy={() => copyToClipboard(markdown)}
        >
            <div className="space-y-6 flex flex-col min-h-[60vh] lg:min-h-[750px]">
                {/* View Mode Toggle with Cheat Sheet */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="flex p-1.5 glass rounded-2xl bg-[var(--bg-secondary)] border-[var(--border-primary)] overflow-hidden shadow-lg">
                            {[
                                { id: 'edit', name: 'Editor', icon: FileEdit },
                                { id: 'split', name: 'Split View', icon: Layout },
                                { id: 'preview', name: 'Preview', icon: Eye }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setViewMode(mode.id as any)}
                                    className={cn(
                                        "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all",
                                        viewMode === mode.id
                                            ? "brand-gradient text-white shadow-lg shadow-brand/20"
                                            : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                                    )}
                                >
                                    <mode.icon className="w-4 h-4" />
                                    <span>{mode.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Auto-save status */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-green-400/20 bg-green-400/5">
                            <Save className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs font-bold text-green-400">Auto-saved</span>
                        </div>
                    </div>

                    {/* Cheat sheet toggle */}
                    <button
                        onClick={() => setShowCheatSheet(!showCheatSheet)}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-bold">Cheat Sheet</span>
                        {showCheatSheet ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {/* Markdown Cheat Sheet */}
                {showCheatSheet && (
                    <div className="p-6 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                        <h3 className="text-lg font-black mb-4 text-[var(--text-primary)]">Markdown Cheat Sheet</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Headers</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div># H1 Header</div>
                                    <div>## H2 Header</div>
                                    <div>### H3 Header</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Text Formatting</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div>**bold text**</div>
                                    <div>*italic text*</div>
                                    <div>`inline code`</div>
                                    <div>~~strikethrough~~</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Links & Images</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div>[link text](url)</div>
                                    <div>![alt text](image.jpg)</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Lists</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div>- Bullet item</div>
                                    <div>1. Numbered item</div>
                                    <div>- [x] Task done</div>
                                    <div>- [ ] Task todo</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Code Blocks</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div>```language</div>
                                    <div>code here</div>
                                    <div>```</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-[var(--text-primary)]">Other</h4>
                                <div className="space-y-1 text-[var(--text-secondary)] font-mono text-xs">
                                    <div>&gt; Blockquote</div>
                                    <div>--- Horizontal rule</div>
                                    <div>| Tables | with | pipes |</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mr-2">Format:</span>
                    {toolbarActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.action}
                            className="p-2 rounded-lg hover:bg-brand/10 hover:text-brand transition-all group"
                            title={action.tooltip}
                        >
                            <action.icon className="w-4 h-4" />
                        </button>
                    ))}

                    <div className="w-px h-6 bg-[var(--border-primary)] mx-2" />

                    {/* Image upload */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg hover:bg-brand/10 hover:text-brand transition-all group"
                        title="Upload Images"
                    >
                        <Upload className="w-4 h-4" />
                    </button>

                    {/* Word/Character Counter */}
                    <div className="ml-auto flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                            <Type className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="font-mono">{stats.words} words</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Hash className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="font-mono">{stats.characters} chars</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="font-mono">{stats.readingTime} min read</span>
                        </div>
                    </div>
                </div>

                {/* Table Editor Modal */}
                {showTableEditor && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="p-6 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)] max-w-md w-full">
                            <h3 className="text-lg font-black mb-4 text-[var(--text-primary)]">Create Table</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-[var(--text-secondary)]">Rows</label>
                                        <input
                                            type="number"
                                            min="2"
                                            max="10"
                                            value={tableRows}
                                            onChange={(e) => setTableRows(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-[var(--text-secondary)]">Columns</label>
                                        <input
                                            type="number"
                                            min="2"
                                            max="10"
                                            value={tableCols}
                                            onChange={(e) => setTableCols(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={generateTable}
                                        className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand/90 transition-colors"
                                    >
                                        Insert Table
                                    </button>
                                    <button
                                        onClick={() => setShowTableEditor(false)}
                                        className="px-4 py-2 border border-[var(--border-primary)] rounded-lg font-bold hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={cn(
                    "flex-1 grid gap-8 min-h-[500px]",
                    viewMode === 'split' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                )}>
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div className="flex flex-col space-y-3 h-full group">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Markdown Input</label>
                                <div className="flex items-center space-x-2 text-[10px] text-brand font-black uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    <span>Live Syncing</span>
                                </div>
                            </div>
                            <textarea
                                ref={textareaRef}
                                className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                                placeholder="Type your markdown here... Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links. Drag & drop images here!"
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            />
                        </div>
                    )}

                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex flex-col space-y-3 h-full overflow-hidden">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-2">Live Preview</label>
                            <div className="flex-1 glass rounded-[2.5rem] border-[var(--border-primary)] p-8 overflow-auto custom-scrollbar bg-[var(--bg-secondary)]/50 shadow-inner">
                                {markdown ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: renderPreview(markdown) }}
                                        className="text-[var(--text-primary)] leading-relaxed prose prose-slate max-w-none"
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                        <FileText className="w-16 h-16" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Nothing to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Export Options */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-[var(--border-primary)]/40">
                    <div className="p-4 glass rounded-xl border-[var(--border-primary)] flex items-center space-x-3 group hover:border-brand/30 transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tight">Markdown</p>
                            <button
                                onClick={() => handleDownload('md')}
                                className="text-sm font-bold text-[var(--text-primary)] hover:text-brand transition-colors"
                            >
                                Download .md
                            </button>
                        </div>
                    </div>

                    <div className="p-4 glass rounded-xl border-[var(--border-primary)] flex items-center space-x-3 group hover:border-brand/30 transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <Code className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tight">HTML</p>
                            <button
                                onClick={() => handleDownload('html')}
                                className="text-sm font-bold text-[var(--text-primary)] hover:text-brand transition-colors"
                            >
                                Download .html
                            </button>
                        </div>
                    </div>

                    <div className="p-4 glass rounded-xl border-[var(--border-primary)] flex items-center space-x-3 group hover:border-brand/30 transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <FileDown className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tight">Plain Text</p>
                            <button
                                onClick={() => handleDownload('txt')}
                                className="text-sm font-bold text-[var(--text-primary)] hover:text-brand transition-colors"
                            >
                                Download .txt
                            </button>
                        </div>
                    </div>

                    <div className="p-4 glass rounded-xl border-[var(--border-primary)] flex items-center space-x-3 group hover:border-brand/30 transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <Copy className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tight">Clipboard</p>
                            <button
                                onClick={() => copyToClipboard(markdown)}
                                className="text-sm font-bold text-[var(--text-primary)] hover:text-brand transition-colors"
                            >
                                Copy Markdown
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
