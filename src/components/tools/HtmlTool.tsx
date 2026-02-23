import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Eye, Smartphone, Monitor, Layout, Tablet, Play, Settings } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function HtmlTool() {
    const [html, setHtml] = usePersistentState('html_html', '<div class="card">\n  <h1>Hello Developer!</h1>\n  <p>Start building your preview here...</p>\n</div>')
    const [css, setCss] = usePersistentState('html_css', 'body { \n  font-family: sans-serif;\n  padding: 2rem;\n  display: flex;\n  justify-content: center;\n  background: #f8fafc;\n}\n.card {\n  background: white;\n  padding: 2rem;\n  border-radius: 1rem;\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);\n  border: 1px solid #e2e8f0;\n}\nh1 { color: #2563eb; margin-top: 0; }')
    const [js, setJs] = usePersistentState('html_js', '')
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [fullScreen, setFullScreen] = useState(false)
    const [externalLibs, setExternalLibs] = usePersistentState<string[]>('html_libs', [])

    const templates = {
        starter: {
            html: '<h1>Hello World</h1>',
            css: 'body { font-family: Arial, sans-serif; padding: 2rem; }',
            js: ''
        },
        flexbox: {
            html: '<div class="container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
            css: '.container { display: flex; gap: 1rem; }\n.item { background: #2563eb; color: white; padding: 1rem; border-radius: 0.5rem; }',
            js: ''
        },
        card: {
            html: '<div class="card">\n  <h2>Card Title</h2>\n  <p>Card content goes here.</p>\n  <button>Action</button>\n</div>',
            css: '.card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 300px; margin: 2rem auto; }\nbutton { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; }',
            js: ''
        },
        form: {
            html: '<form>\n  <label>Name:</label>\n  <input type="text" placeholder="Enter name">\n  <label>Email:</label>\n  <input type="email" placeholder="Enter email">\n  <button type="submit">Submit</button>\n</form>',
            css: 'form { display: flex; flex-direction: column; gap: 1rem; max-width: 300px; margin: 2rem auto; }\nlabel { font-weight: bold; }\ninput { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }\nbutton { background: #2563eb; color: white; padding: 0.5rem; border: none; border-radius: 0.5rem; cursor: pointer; }',
            js: 'document.querySelector(\'form\').addEventListener(\'submit\', (e) => { e.preventDefault(); console.log(\'Form submitted!\'); });'
        }
    }

    const srcDoc = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${externalLibs.map(lib => `<script src="${lib}"></script>`).join('\n        ')}
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
    </html>
  `

    const handleRun = () => {
        // Force refresh if needed
    }

    const handleDownload = () => {
        const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    ${externalLibs.map(lib => `<script src="${lib}"></script>`).join('\n    ')}
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`
        const blob = new Blob([fullHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'preview.html'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleCopyEmbed = () => {
        const embedCode = `<iframe srcdoc="${srcDoc.replace(/"/g, '&quot;')}" width="800" height="600" frameborder="0"></iframe>`
        copyToClipboard(embedCode)
    }

    const loadTemplate = (key: keyof typeof templates) => {
        const template = templates[key]
        setHtml(template.html)
        setCss(template.css)
        setJs(template.js)
        if (autoRefresh) handleRun()
    }

    const addLibrary = (lib: string) => {
        if (lib && !externalLibs.includes(lib)) {
            setExternalLibs([...externalLibs, lib])
        }
    }

    return (
        <ToolLayout
            title="HTML Preview"
            description="Live split-screen sandbox for HTML, CSS, and JavaScript."
            icon={Eye}
            onReset={() => {
                setHtml('')
                setCss('')
                setJs('')
                setExternalLibs([])
            }}
            onDownload={handleDownload}
            onCopy={handleCopyEmbed}
        >
            <div className={cn("grid grid-cols-1 gap-4", fullScreen ? "lg:grid-cols-1" : "lg:grid-cols-2", fullScreen ? "h-[800px]" : "h-[650px]")}>
                {!fullScreen && (
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Templates</label>
                                <select
                                    onChange={(e) => loadTemplate(e.target.value as keyof typeof templates)}
                                    className="text-xs px-2 py-1 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded"
                                >
                                    <option value="">Load Template</option>
                                    {Object.keys(templates).map(key => (
                                        <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Add CDN URL"
                                    className="flex-1 text-xs px-2 py-1 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addLibrary((e.target as HTMLInputElement).value)
                                            ;(e.target as HTMLInputElement).value = ''
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => addLibrary('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css')}
                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                                >
                                    Bootstrap
                                </button>
                                <button
                                    onClick={() => addLibrary('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css')}
                                    className="text-xs px-2 py-1 bg-purple-500 text-white rounded"
                                >
                                    FontAwesome
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    Auto Refresh
                                </label>
                                {!autoRefresh && (
                                    <button onClick={handleRun} className="flex items-center space-x-1 text-xs px-3 py-1 bg-green-500 text-white rounded">
                                        <Play className="w-3 h-3" />
                                        <span>Run</span>
                                    </button>
                                )}
                                <button onClick={() => setFullScreen(!fullScreen)} className="flex items-center space-x-1 text-xs px-3 py-1 bg-gray-500 text-white rounded">
                                    <Settings className="w-3 h-3" />
                                    <span>{fullScreen ? 'Exit Full' : 'Full Screen'}</span>
                                </button>
                            </div>
                            {externalLibs.length > 0 && (
                                <div className="text-xs text-[var(--text-muted)]">
                                    <div className="font-bold">Libraries:</div>
                                    {externalLibs.map((lib, i) => (
                                        <div key={i} className="truncate">{lib}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-primary)]">
                            <button
                                onClick={() => setActiveTab('html')}
                                className={cn("flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'html' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                HTML
                            </button>
                            <button
                                onClick={() => setActiveTab('css')}
                                className={cn("flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'css' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                CSS
                            </button>
                            <button
                                onClick={() => setActiveTab('js')}
                                className={cn("flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'js' ? "brand-gradient text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                JS
                            </button>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none bg-[var(--input-bg)] border-[var(--border-primary)] rounded-[3rem] p-10 shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
                            placeholder={
                                activeTab === 'html' ? '<div>Your HTML here</div>' :
                                activeTab === 'css' ? 'body { font-family: Arial; }' :
                                'console.log("Hello World");'
                            }
                            value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                            onChange={(e) => {
                                if (activeTab === 'html') setHtml(e.target.value)
                                else if (activeTab === 'css') setCss(e.target.value)
                                else setJs(e.target.value)
                                if (autoRefresh) handleRun()
                            }}
                        />
                    </div>
                )}

                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] flex items-center space-x-3">
                            <Layout className="w-5 h-5 text-brand" />
                            <span>Active Render</span>
                        </label>
                        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('desktop')}
                                className={cn("p-2 rounded-lg transition-all", viewMode === 'desktop' ? "bg-brand text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('tablet')}
                                className={cn("p-2 rounded-lg transition-all", viewMode === 'tablet' ? "bg-brand text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                <Tablet className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('mobile')}
                                className={cn("p-2 rounded-lg transition-all", viewMode === 'mobile' ? "bg-brand text-white shadow-sm" : "text-[var(--text-muted)] hover:text-brand")}
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 glass rounded-[3rem] overflow-hidden flex justify-center bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] relative shadow-sm">
                        <div className={cn(
                            "transition-all duration-500 h-full bg-white",
                            viewMode === 'desktop' ? "w-full" :
                            viewMode === 'tablet' ? "w-[768px] my-6 rounded-[2.5rem] shadow-2xl overflow-hidden border-[12px] border-[var(--bg-primary)] ring-1 ring-[var(--border-primary)]" :
                            "w-[375px] my-6 rounded-[2.5rem] shadow-2xl overflow-hidden border-[12px] border-[var(--bg-primary)] ring-1 ring-[var(--border-primary)]"
                        )}>
                            <iframe
                                title="preview"
                                srcDoc={srcDoc}
                                className="w-full h-full border-none"
                                sandbox="allow-scripts"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
