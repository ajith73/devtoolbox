import { useState, useEffect, useRef } from 'react'
import { Monitor, Code2, Copy, AlertCircle, RefreshCw, ExternalLink, Maximize2, Eye, EyeOff } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface PreviewSettings {
    autoRefresh: boolean
    refreshDelay: number
    showLineNumbers: boolean
    theme: 'light' | 'dark' | 'auto'
    consoleLogging: boolean
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to HTML Preview</h1>
        <p>This is a live HTML preview with split-screen editing.</p>
        <button class="btn" onclick="showMessage()">Click Me!</button>
        <div id="message" style="margin-top: 10px; padding: 10px; background: #d4edda; border-radius: 4px; display: none;">
            Dynamic content will appear here!
        </div>
    </div>
    
    <script>
        function showMessage() {
            const messageDiv = document.getElementById('message');
            messageDiv.style.display = 'block';
            console.log('Button clicked!');
        }
        
        // Log page load
        console.log('HTML Preview loaded successfully');
    </script>
</body>
</html>`

const HTML_TEMPLATES = [
    {
        name: 'Basic Page',
        description: 'Simple HTML5 page structure',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Basic Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a basic HTML page.</p>
</body>
</html>`
    },
    {
        name: 'Interactive Form',
        description: 'Form with JavaScript validation',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .error { color: red; font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <h2>Contact Form</h2>
    <form onsubmit="return validateForm(event)">
        <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" required>
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
        </div>
        <button type="submit">Submit</button>
        <div id="error" class="error"></div>
    </form>
    
    <script>
        function validateForm(event) {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const errorDiv = document.getElementById('error');
            
            if (!name || !email) {
                errorDiv.textContent = 'Please fill in all fields';
                return false;
            }
            
            if (!email.includes('@')) {
                errorDiv.textContent = 'Please enter a valid email';
                return false;
            }
            
            errorDiv.textContent = 'Form submitted successfully!';
            console.log('Form data:', { name, email });
            return false;
        }
    </script>
</body>
</html>`
    },
    {
        name: 'CSS Animation',
        description: 'Page with CSS animations and transitions',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Animation Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .animation-container {
            text-align: center;
        }
        .box {
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 10px;
            margin: 20px;
            display: inline-block;
            animation: bounce 2s infinite;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .rotate {
            animation: rotate 3s linear infinite;
        }
        .fade {
            animation: fade 2s ease-in-out infinite alternate;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
        }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes fade {
            from { opacity: 1; }
            to { opacity: 0.3; }
        }
        h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div class="animation-container">
        <h1>CSS Animation Demo</h1>
        <div class="box">Bounce</div>
        <div class="box rotate">Rotate</div>
        <div class="box fade">Fade</div>
    </div>
</body>
</html>`
    }
]

export function HtmlPreviewTool() {
    const [html, setHtml] = usePersistentState('html_preview_html', DEFAULT_HTML)
    const [css, setCss] = usePersistentState('html_preview_css', '')
    const [javascript, setJavascript] = usePersistentState('html_preview_js', '')
    const [activeTab, setActiveTab] = usePersistentState<'html' | 'css' | 'js'>('html_preview_active_tab', 'html')
    const [settings] = usePersistentState<PreviewSettings>('html_preview_settings', {
        autoRefresh: true,
        refreshDelay: 1000,
        showLineNumbers: true,
        theme: 'auto',
        consoleLogging: true
    })
    const [consoleOutput, setConsoleOutput] = useState<string[]>([])
    const [showConsole, setShowConsole] = usePersistentState('html_preview_show_console', false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const consoleEndRef = useRef<HTMLDivElement>(null)

    // Auto-refresh preview
    useEffect(() => {
        if (!settings.autoRefresh) return
        
        const timer = setTimeout(() => {
            updatePreview()
        }, settings.refreshDelay)
        
        return () => clearTimeout(timer)
    }, [html, css, javascript, settings.autoRefresh, settings.refreshDelay])

    // Console logging
    useEffect(() => {
        const iframeWindow = iframeRef.current?.contentWindow
        if (!iframeWindow) return
        
        const originalConsole = (iframeWindow as any).console
        const customConsole = {
            log: (...args: any[]) => {
                if (settings.consoleLogging) {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ')
                    setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
                    originalConsole.log(...args)
                }
            },
            error: (...args: any[]) => {
                if (settings.consoleLogging) {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ')
                    setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${message}`])
                    originalConsole.error(...args)
                }
            },
            warn: (...args: any[]) => {
                if (settings.consoleLogging) {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ')
                    setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] WARN: ${message}`])
                    originalConsole.warn(...args)
                }
            }
        }
        
        ;(iframeWindow as any).console = customConsole
    }, [settings.consoleLogging])

    // Auto-scroll console to bottom
    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollTop = consoleEndRef.current.scrollHeight
        }
    }, [consoleOutput])

    const updatePreview = () => {
        if (!iframeRef.current) return
        
        const combinedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    ${css ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
    ${html}
    ${javascript ? `<script>\n${javascript}\n</script>` : ''}
</body>
</html>`
        
        iframeRef.current.srcdoc = combinedContent
    }

    const loadTemplate = (template: typeof HTML_TEMPLATES[number]) => {
        setHtml(template.html)
        setCss('')
        setJavascript('')
    }

    const clearConsole = () => {
        setConsoleOutput([])
    }

    const copyCode = (type: 'html' | 'css' | 'js' | 'combined') => {
        let code = ''
        switch (type) {
            case 'html':
                code = html
                break
            case 'css':
                code = css
                break
            case 'js':
                code = javascript
                break
            case 'combined':
                code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    ${css ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
    ${html}
    ${javascript ? `<script>\n${javascript}\n</script>` : ''}
</body>
</html>`
                break
        }
        copyToClipboard(code)
    }

    const openInNewWindow = () => {
        const combinedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    ${css ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
    ${html}
    ${javascript ? `<script>\n${javascript}\n</script>` : ''}
</body>
</html>`
        
        const blob = new Blob([combinedContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    return (
        <ToolLayout
            title="HTML Preview"
            description="Live split-screen sandbox for HTML, CSS, and JavaScript."
            icon={Monitor}
            onReset={() => {
                setHtml(DEFAULT_HTML)
                setCss('')
                setJavascript('')
                setActiveTab('html')
                clearConsole()
            }}
        >
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setActiveTab('html')}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                activeTab === 'html' 
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Code2 className="w-4 h-4 mr-2" />
                            HTML
                        </button>
                        <button
                            onClick={() => setActiveTab('css')}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                activeTab === 'css' 
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            CSS
                        </button>
                        <button
                            onClick={() => setActiveTab('js')}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                activeTab === 'js' 
                                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/25" 
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            JavaScript
                        </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={updatePreview}
                            className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Refresh Preview"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={openInNewWindow}
                            className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Open in New Window"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Toggle Fullscreen"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Templates */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Templates:</label>
                        <button
                            onClick={() => setShowConsole(!showConsole)}
                            className="flex items-center space-x-2 px-3 py-1 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        >
                            {showConsole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            Console
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {HTML_TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => loadTemplate(template)}
                                className="px-3 py-1 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                                title={template.description}
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className={cn(
                    "grid gap-4 transition-all duration-300",
                    isFullscreen 
                        ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4" 
                        : "grid-cols-1 lg:grid-cols-2 h-[600px]"
                )}>
                    {/* Code Editor */}
                    <div className={cn(
                        "flex flex-col space-y-2",
                        isFullscreen ? "h-full" : ""
                    )}>
                        <div className="flex items-center justify-between p-3 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Code Editor</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => copyCode(activeTab)}
                                    className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                    title={`Copy ${activeTab.toUpperCase()}`}
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-2xl border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner overflow-hidden">
                            {activeTab === 'html' && (
                                <textarea
                                    value={html}
                                    onChange={(e) => setHtml(e.target.value)}
                                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                                    placeholder="Enter your HTML here..."
                                    spellCheck={false}
                                />
                            )}
                            {activeTab === 'css' && (
                                <textarea
                                    value={css}
                                    onChange={(e) => setCss(e.target.value)}
                                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                                    placeholder="Enter your CSS here..."
                                    spellCheck={false}
                                />
                            )}
                            {activeTab === 'js' && (
                                <textarea
                                    value={javascript}
                                    onChange={(e) => setJavascript(e.target.value)}
                                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                                    placeholder="Enter your JavaScript here..."
                                    spellCheck={false}
                                />
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className={cn(
                        "flex flex-col space-y-2",
                        isFullscreen ? "h-full" : ""
                    )}>
                        <div className="flex items-center justify-between p-3 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Live Preview</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => copyCode('combined')}
                                    className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                    title="Copy Combined HTML"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-2xl border-[var(--border-primary)] bg-white dark:bg-gray-900 shadow-inner overflow-hidden">
                            <iframe
                                ref={iframeRef}
                                className="w-full h-full border-0"
                                title="HTML Preview"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
                                onLoad={updatePreview}
                            />
                        </div>
                    </div>
                </div>

                {/* Console */}
                {showConsole && (
                    <div className="glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Console Output</span>
                            <button
                                onClick={clearConsole}
                                className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                title="Clear Console"
                            >
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div 
                            ref={consoleEndRef}
                            className="h-32 p-3 overflow-y-auto font-mono text-xs bg-black text-green-400 custom-scrollbar"
                        >
                            {consoleOutput.length === 0 ? (
                                <div className="text-gray-500 italic">Console output will appear here...</div>
                            ) : (
                                consoleOutput.map((log, index) => (
                                    <div key={index} className="mb-1">{log}</div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
