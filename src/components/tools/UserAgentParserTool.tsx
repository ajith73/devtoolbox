import { useMemo, useState, useRef } from 'react'
import { Fingerprint, Upload, Copy, CheckCircle, FileText, Monitor, BookOpen, Shield } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced user agent result type
type UAResult = {
    userAgent: string
    platform: string
    language: string
    languages: string[]
    mobile: boolean
    browser: {
        name: string
        version: string
        engine: string
        engineVersion: string
        majorVersion: string
    }
    os: {
        name: string
        version: string
        architecture: string
        family: string
    }
    device: {
        type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
        vendor: string
        model: string
        brand: string
    }
    hardware: {
        cpu: string
        gpu: string
        cores: number
        memory: string
        screen: {
            width: number
            height: number
            colorDepth: number
            pixelRatio: number
        }
    }
    features: {
        cookies: boolean
        localStorage: boolean
        sessionStorage: boolean
        geolocation: boolean
        webgl: boolean
        webgl2: boolean
        canvas: boolean
        websockets: boolean
        serviceWorkers: boolean
        notifications: boolean
        fullscreen: boolean
        camera: boolean
        microphone: boolean
    }
    network: {
        connection: string
        effectiveType: string
        downlink: number
        rtt: number
        saveData: boolean
    }
    security: {
        doNotTrack: string
        cookieEnabled: boolean
        onLine: boolean
        pdfViewerEnabled: boolean
        plugins: string[]
    }
    performance: {
        timing: {
            navigationStart: number
            loadEventEnd: number
            domContentLoaded: number
        }
        memory: {
            usedJSHeapSize: number
            totalJSHeapSize: number
            jsHeapSizeLimit: number
        }
    }
}

// Enhanced browser detection
function parseBrowser(ua: string) {
    const u = ua.toLowerCase()
    let name = 'Unknown'
    let version = ''
    let engine = 'Unknown'
    let engineVersion = ''
    
    // Browser detection
    if (u.includes('edg/')) {
        name = 'Microsoft Edge'
        const match = u.match(/edg\/(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'Blink'
    } else if (u.includes('opr/') || u.includes('opera')) {
        name = 'Opera'
        const match = u.match(/(?:opr|opera)\/(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'Blink'
    } else if (u.includes('chrome/') && !u.includes('chromium') && !u.includes('edg/')) {
        name = 'Google Chrome'
        const match = u.match(/chrome\/(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'Blink'
    } else if (u.includes('safari/') && !u.includes('chrome/')) {
        name = 'Safari'
        const match = u.match(/version\/(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'WebKit'
    } else if (u.includes('firefox/')) {
        name = 'Firefox'
        const match = u.match(/firefox\/(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'Gecko'
    } else if (u.includes('msie') || u.includes('trident')) {
        name = 'Internet Explorer'
        const match = u.match(/(?:msie |rv:)(\d+[\.\d]+)/)
        version = match ? match[1] : ''
        engine = 'Trident'
    }
    
    // Engine version detection
    if (engine === 'Blink') {
        const match = u.match(/chrome\/(\d+[\.\d]+)/)
        engineVersion = match ? match[1] : ''
    } else if (engine === 'WebKit') {
        const match = u.match(/applewebkit\/(\d+[\.\d]+)/)
        engineVersion = match ? match[1] : ''
    } else if (engine === 'Gecko') {
        const match = u.match(/rv:(\d+[\.\d]+)/)
        engineVersion = match ? match[1] : ''
    } else if (engine === 'Trident') {
        const match = u.match(/trident\/(\d+[\.\d]+)/)
        engineVersion = match ? match[1] : ''
    }
    
    const majorVersion = version.split('.')[0] || ''
    
    return { name, version, engine, engineVersion, majorVersion }
}

// Enhanced OS detection
function parseOS(ua: string) {
    const u = ua.toLowerCase()
    let name = 'Unknown'
    let version = ''
    let architecture = 'Unknown'
    let family = 'Unknown'
    
    if (u.includes('windows nt')) {
        name = 'Windows'
        family = 'Windows'
        const match = u.match(/windows nt (\d+[\.\d]+)/)
        version = match ? match[1] : ''
        if (u.includes('win64') || u.includes('x64') || u.includes('wow64')) {
            architecture = 'x64'
        } else if (u.includes('arm')) {
            architecture = 'ARM'
        } else {
            architecture = 'x86'
        }
    } else if (u.includes('android')) {
        name = 'Android'
        family = 'Linux'
        const match = u.match(/android (\d+[\.\d]+)/)
        version = match ? match[1] : ''
        if (u.includes('arm64') || u.includes('x86_64')) {
            architecture = 'x64'
        } else if (u.includes('arm')) {
            architecture = 'ARM'
        } else {
            architecture = 'x86'
        }
    } else if (u.includes('iphone') || u.includes('ipad')) {
        name = 'iOS'
        family = 'Darwin'
        const match = u.match(/os (\d+[\.\d]+)/)
        version = match ? match[1] : ''
        architecture = 'ARM'
    } else if (u.includes('mac os x') || u.includes('macintosh')) {
        name = 'macOS'
        family = 'Darwin'
        const match = u.match(/mac os x ([\d_]+)/)
        version = match ? match[1].replace(/_/g, '.') : ''
        if (u.includes('intel')) {
            architecture = 'x64'
        } else if (u.includes('arm')) {
            architecture = 'ARM'
        }
    } else if (u.includes('linux')) {
        name = 'Linux'
        family = 'Linux'
        if (u.includes('ubuntu')) {
            name = 'Ubuntu'
        } else if (u.includes('debian')) {
            name = 'Debian'
        } else if (u.includes('fedora')) {
            name = 'Fedora'
        }
        if (u.includes('x86_64') || u.includes('x64')) {
            architecture = 'x64'
        } else if (u.includes('arm')) {
            architecture = 'ARM'
        } else {
            architecture = 'x86'
        }
    }
    
    return { name, version, architecture, family }
}

// Device detection
function parseDevice(ua: string) {
    const u = ua.toLowerCase()
    let type: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown'
    let vendor = 'Unknown'
    let model = 'Unknown'
    let brand = 'Unknown'
    
    if (u.includes('mobile') || u.includes('android') || u.includes('iphone')) {
        type = 'mobile'
    } else if (u.includes('tablet') || u.includes('ipad')) {
        type = 'tablet'
    } else if (u.includes('windows') || u.includes('macintosh') || u.includes('linux')) {
        type = 'desktop'
    }
    
    // Vendor detection
    if (u.includes('apple')) vendor = 'Apple'
    else if (u.includes('samsung')) vendor = 'Samsung'
    else if (u.includes('huawei')) vendor = 'Huawei'
    else if (u.includes('xiaomi')) vendor = 'Xiaomi'
    else if (u.includes('oneplus')) vendor = 'OnePlus'
    else if (u.includes('google')) vendor = 'Google'
    else if (u.includes('microsoft')) vendor = 'Microsoft'
    else if (u.includes('dell')) vendor = 'Dell'
    else if (u.includes('hp')) vendor = 'HP'
    else if (u.includes('lenovo')) vendor = 'Lenovo'
    
    // Model detection
    if (u.includes('iphone')) {
        const match = u.match(/iphone (os )?([\d_]+)/)
        model = match ? `iPhone ${match[2].replace(/_/g, '.')}` : 'iPhone'
    } else if (u.includes('ipad')) {
        const match = u.match(/ipad (os )?([\d_]+)/)
        model = match ? `iPad ${match[2].replace(/_/g, '.')}` : 'iPad'
    } else if (u.includes('galaxy')) {
        const match = u.match(/galaxy ([\w-]+)/)
        model = match ? `Galaxy ${match[1]}` : 'Galaxy'
    }
    
    return { type, vendor, model, brand }
}

// Feature detection
function detectFeatures() {
    return {
        cookies: navigator.cookieEnabled,
        localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
        sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
        geolocation: 'geolocation' in navigator,
        webgl: (() => {
            try {
                const canvas = document.createElement('canvas')
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
            } catch (e) {
                return false
            }
        })(),
        webgl2: (() => {
            try {
                const canvas = document.createElement('canvas')
                return !!canvas.getContext('webgl2')
            } catch (e) {
                return false
            }
        })(),
        canvas: !!document.createElement('canvas').getContext,
        websockets: 'WebSocket' in window,
        serviceWorkers: 'serviceWorker' in navigator,
        notifications: 'Notification' in window,
        fullscreen: 'fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    }
}

// Network information
function getNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
        return {
            connection: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false
        }
    }
    
    return {
        connection: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
    }
}

// Hardware information
function getHardwareInfo() {
    const screen = window.screen
    
    return {
        cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'Unknown',
        gpu: (() => {
            try {
                const canvas = document.createElement('canvas')
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
                if (gl && gl instanceof WebGLRenderingContext) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
                    if (debugInfo) {
                        return (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + ' ' + (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                    }
                }
            } catch (e) {
                // Silent fail
            }
            return 'Unknown'
        })(),
        cores: navigator.hardwareConcurrency || 0,
        memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown',
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1
        }
    }
}

// Security information
function getSecurityInfo() {
    return {
        doNotTrack: navigator.doNotTrack || 'unspecified',
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        pdfViewerEnabled: navigator.pdfViewerEnabled || false,
        plugins: Array.from(navigator.plugins).map(p => p.name)
    }
}

// Performance information
function getPerformanceInfo() {
    const timing = performance.timing
    const memory = (performance as any).memory
    
    return {
        timing: {
            navigationStart: timing.navigationStart,
            loadEventEnd: timing.loadEventEnd,
            domContentLoaded: timing.domContentLoadedEventEnd
        },
        memory: memory ? {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
        } : {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0
        }
    }
}

// Sample user agents
function getSampleUserAgents() {
    return [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/109.0 Firefox/120.0',
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ]
}

export function UserAgentParserTool() {
    const [input, setInput] = usePersistentState('ua_parser_input', '')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showHardware, setShowHardware] = useState(false)
    const [showFeatures, setShowFeatures] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const effectiveUa = input.trim() || navigator.userAgent

    const enhancedParsed = useMemo<UAResult>(() => {
        const ua = effectiveUa
        const platform = navigator.platform || ''
        const language = navigator.language || ''
        const languages = navigator.languages ? Array.from(navigator.languages) : []
        const mobile = /mobi|android|iphone|ipad/i.test(ua)
        
        const browser = parseBrowser(ua)
        const os = parseOS(ua)
        const device = parseDevice(ua)
        const hardware = getHardwareInfo()
        const features = detectFeatures()
        const network = getNetworkInfo()
        const security = getSecurityInfo()
        const performance = getPerformanceInfo()

        return { 
            userAgent: ua, 
            platform, 
            language, 
            languages, 
            mobile, 
            browser,
            os,
            device,
            hardware,
            features,
            network,
            security,
            performance
        }
    }, [effectiveUa])

    const output = useMemo(() => JSON.stringify(enhancedParsed, null, 2), [enhancedParsed])

    const handleCopy = async () => {
        if (output) {
            await copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setInput(content)
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSampleUserAgents()
        setInput(samples[Math.floor(Math.random() * samples.length)])
    }

    return (
        <ToolLayout
            title="User Agent Parser Pro"
            description="Advanced user agent parser with comprehensive browser, device, and hardware detection."
            icon={Fingerprint}
            onReset={() => setInput('')}
            onCopy={handleCopy}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Fingerprint className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">User Agent Parser</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced browser and device detection</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.log,.csv"
                        multiple
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                    </button>

                    <button
                        onClick={insertSample}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Sample UA</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAdvanced 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowHardware(!showHardware)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showHardware 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Hardware</span>
                        </button>
                        
                        <button
                            onClick={() => setShowFeatures(!showFeatures)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showFeatures 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Features</span>
                        </button>
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-blue-400">{enhancedParsed.browser.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Browser</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-green-400">{enhancedParsed.os.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">OS</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-yellow-400 capitalize">{enhancedParsed.device.type}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Device Type</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-purple-400">{enhancedParsed.hardware.cores}</div>
                        <div className="text-xs text-[var(--text-secondary)]">CPU Cores</div>
                    </div>
                </div>

                {/* Main Input */}
                <div className="glass rounded-2xl border-[var(--border-primary)] p-6 bg-[var(--bg-secondary)]/30">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">User-Agent String</label>
                    <textarea
                        className="h-[140px] font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border-primary)] outline-none custom-scrollbar"
                        placeholder="Leave empty to use your current browser UA..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">If blank, uses navigator.userAgent</p>
                </div>

                {/* Advanced Details */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Details</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Browser Information</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Name:</span>
                                        <span className="text-blue-400">{enhancedParsed.browser.name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Version:</span>
                                        <span className="text-green-400">{enhancedParsed.browser.version}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Engine:</span>
                                        <span className="text-yellow-400">{enhancedParsed.browser.engine}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Engine Version:</span>
                                        <span className="text-orange-400">{enhancedParsed.browser.engineVersion}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Operating System</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Name:</span>
                                        <span className="text-blue-400">{enhancedParsed.os.name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Version:</span>
                                        <span className="text-green-400">{enhancedParsed.os.version}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Architecture:</span>
                                        <span className="text-yellow-400">{enhancedParsed.os.architecture}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Family:</span>
                                        <span className="text-orange-400">{enhancedParsed.os.family}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Device Information</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Type:</span>
                                        <span className="text-blue-400 capitalize">{enhancedParsed.device.type}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Vendor:</span>
                                        <span className="text-green-400">{enhancedParsed.device.vendor}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Model:</span>
                                        <span className="text-yellow-400">{enhancedParsed.device.model}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Mobile:</span>
                                        <span className={enhancedParsed.mobile ? 'text-orange-400' : 'text-green-400'}>
                                            {enhancedParsed.mobile ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hardware Information */}
                {showHardware && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Monitor className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Hardware Information</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">CPU & Memory</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">CPU:</span>
                                        <span className="text-blue-400">{enhancedParsed.hardware.cpu}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Memory:</span>
                                        <span className="text-green-400">{enhancedParsed.hardware.memory}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Cores:</span>
                                        <span className="text-yellow-400">{enhancedParsed.hardware.cores}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Display</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Resolution:</span>
                                        <span className="text-blue-400">{enhancedParsed.hardware.screen.width}x{enhancedParsed.hardware.screen.height}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Color Depth:</span>
                                        <span className="text-green-400">{enhancedParsed.hardware.screen.colorDepth} bit</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Pixel Ratio:</span>
                                        <span className="text-yellow-400">{enhancedParsed.hardware.screen.pixelRatio}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Graphics</div>
                                <div className="text-xs text-[var(--text-primary)] break-all">
                                    {enhancedParsed.hardware.gpu}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features */}
                {showFeatures && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Browser Features</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Object.entries(enhancedParsed.features).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <span className="text-xs text-[var(--text-primary] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Output */}
                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {output}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
