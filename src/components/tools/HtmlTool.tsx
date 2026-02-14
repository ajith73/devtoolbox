import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Eye, Code, Smartphone, Monitor, Layout } from 'lucide-react'
import { cn } from '../../lib/utils'

export function HtmlTool() {
    const [html, setHtml] = useState('<!-- Enter your HTML here -->\n<div class="card">\n  <h1>Hello Developer!</h1>\n  <p>Start building your preview here...</p>\n</div>\n\n<style>\n  body { \n    font-family: sans-serif;\n    padding: 2rem;\n    display: flex;\n    justify-content: center;\n    background: #f8fafc;\n  }\n  .card {\n    background: white;\n    padding: 2rem;\n    border-radius: 1rem;\n    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);\n    border: 1px solid #e2e8f0;\n  }\n  h1 { color: #2563eb; margin-top: 0; }\n</style>')
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

    const srcDoc = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; font-family: -apple-system, system-ui, sans-serif; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `

    return (
        <ToolLayout
            title="HTML Preview"
            description="Live split-screen sandbox for HTML and CSS snippets."
            icon={Eye}
            onReset={() => setHtml('')}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[650px]">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] flex items-center space-x-3">
                            <Code className="w-5 h-5 text-brand" />
                            <span>Script Manifest</span>
                        </label>
                        <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-40">Isolated Sandbox</div>
                    </div>
                    <textarea
                        className="flex-1 font-mono text-sm resize-none bg-[var(--input-bg)] border-[var(--border-primary)] rounded-[3rem] p-10 shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
                        placeholder="<html>..."
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                    />
                </div>

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
                            viewMode === 'desktop' ? "w-full" : "w-[375px] my-6 rounded-[2.5rem] shadow-2xl overflow-hidden border-[12px] border-[var(--bg-primary)] ring-1 ring-[var(--border-primary)]"
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
