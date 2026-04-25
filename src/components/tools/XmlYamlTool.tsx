import { useState, useEffect, useRef } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileCode, Upload, Download, Copy, CheckCircle, AlertCircle, Settings, FileText, Code, Zap, Eye, EyeOff, ArrowRightLeft } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import yaml from 'js-yaml'
import { Builder } from 'xml2js'
import ReactSyntaxHighlighter from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Native XML to JSON conversion without XML2JS parsing
const xmlToJson = (xmlString: string): any => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
    
    // Check for XML parsing errors
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
        throw new Error('Invalid XML syntax')
    }
    
    const nodeToObject = (node: Element): any => {
        const obj: any = {}
        
        // Handle attributes
        if (node.attributes && node.attributes.length > 0) {
            obj['@attributes'] = {}
            for (let i = 0; i < node.attributes.length; i++) {
                const attr = node.attributes[i]
                obj['@attributes'][attr.nodeName] = attr.nodeValue
            }
        }
        
        // Handle child nodes
        if (node.childNodes && node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i]
                
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const childObj = nodeToObject(child as Element)
                    
                    if (obj[child.nodeName]) {
                        // If property already exists, convert to array
                        if (!Array.isArray(obj[child.nodeName])) {
                            obj[child.nodeName] = [obj[child.nodeName]]
                        }
                        obj[child.nodeName].push(childObj)
                    } else {
                        obj[child.nodeName] = childObj
                    }
                } else if (child.nodeType === Node.TEXT_NODE && child.nodeValue && child.nodeValue.trim()) {
                    const text = child.nodeValue.trim()
                    if (Object.keys(obj).length === 0) {
                        return text
                    }
                    if (!obj['#text']) {
                        obj['#text'] = text
                    } else {
                        obj['#text'] += text
                    }
                }
            }
        }
        
        return obj
    }
    
    const root = xmlDoc.documentElement
    if (!root) {
        throw new Error('No root element found')
    }
    
    const result: any = {}
    result[root.nodeName] = nodeToObject(root)
    return result
}

export function XmlYamlTool() {
    const [input, setInput] = usePersistentState('xml_yaml_input', '')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'xml-to-yaml' | 'yaml-to-xml'>('xml-to-yaml')
    const [showSyntaxHighlighting, setShowSyntaxHighlighting] = useState(true)
    const [xmlIndent, setXmlIndent] = useState('  ')
    const [yamlIndent, setYamlIndent] = useState(2)
    const [showLineNumbers, setShowLineNumbers] = useState(false)
    const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'empty'>('empty')
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Process data when inputs change
    useEffect(() => {
        const startTime = performance.now()
        const processData = async (val: string, currentMode: 'xml-to-yaml' | 'yaml-to-xml') => {
            if (!val.trim()) {
                setOutput('')
                setError(null)
                setValidationStatus('empty')
                setProcessingTime(null)
                return
            }
            
            try {
                if (currentMode === 'xml-to-yaml') {
                    try {
                        const result = xmlToJson(val)
                        
                        const yamlOutput = yaml.dump(result, { 
                            indent: yamlIndent, 
                            lineWidth: -1, 
                            noRefs: true,
                            sortKeys: false,
                            flowLevel: -1
                        })
                        setOutput(yamlOutput)
                        setError(null)
                        setValidationStatus('valid')
                    } catch (parseErr: any) {
                        setError(parseErr.message || 'Failed to parse XML')
                        setOutput('')
                        setValidationStatus('invalid')
                    }
                } else {
                    // Validate YAML first
                    try {
                        yaml.load(val)
                        setValidationStatus('valid')
                    } catch (yamlErr: any) {
                        setError('Invalid YAML syntax: ' + yamlErr.message)
                        setOutput('')
                        setValidationStatus('invalid')
                        return
                    }
                    
                    const obj = yaml.load(val)
                    const builder = new Builder({ 
                        indent: xmlIndent, 
                        xmldec: { version: '1.0', encoding: 'UTF-8' },
                        renderOpts: { pretty: true }
                    })
                    const xmlOutput = builder.buildObject(obj)
                    setOutput(xmlOutput)
                    setError(null)
                }
            } catch (e: any) {
                setError(e.message || 'Conversion failed')
                setOutput('')
                setValidationStatus('invalid')
            } finally {
                const endTime = performance.now()
                setProcessingTime(Math.round(endTime - startTime))
            }
        }

        processData(input, mode)
    }, [input, mode, xmlIndent, yamlIndent])

    const handleDownload = () => {
        const mimeType = mode === 'xml-to-yaml' ? 'application/x-yaml' : 'application/xml'
        const extension = mode === 'xml-to-yaml' ? 'yaml' : 'xml'
        const blob = new Blob([output], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devbox-converted.${extension}`
        a.click()
        URL.revokeObjectURL(url)
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

    const handleCopy = async () => {
        if (output) {
            await copyToClipboard(output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const swapConversion = () => {
        if (output) {
            setInput(output)
            setMode(mode === 'xml-to-yaml' ? 'yaml-to-xml' : 'xml-to-yaml')
        }
    }

    const insertSample = () => {
        const sample = mode === 'xml-to-yaml' 
            ? `<?xml version="1.0" encoding="UTF-8"?>
<company>
  <name>Tech Corp</name>
  <employees>
    <employee id="1">
      <name>John Doe</name>
      <department>Engineering</department>
      <skills>
        <skill>JavaScript</skill>
        <skill>Python</skill>
      </skills>
    </employee>
    <employee id="2">
      <name>Jane Smith</name>
      <department>Design</department>
    </employee>
  </employees>
</company>`
            : `company:
  name: Tech Corp
  employees:
    - id: 1
      name: John Doe
      department: Engineering
      skills:
        - JavaScript
        - Python
    - id: 2
      name: Jane Smith
      department: Design`
        setInput(sample)
    }

    return (
        <ToolLayout
            title="XML ↔ YAML Pro"
            description="Advanced XML and YAML converter with validation, formatting, and batch processing."
            icon={FileCode}
            onReset={() => { setInput(''); setOutput(''); setError(null); setValidationStatus('empty'); }}
            onCopy={output ? handleCopy : undefined}
            onDownload={output ? handleDownload : undefined}
        >
            <div className="space-y-6">
                {/* Header with Mode Toggle and Stats */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-primary)] w-fit">
                        <button
                            onClick={() => setMode('xml-to-yaml')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'xml-to-yaml' ? "brand-gradient text-white shadow-md" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            XML to YAML
                        </button>
                        <button
                            onClick={() => setMode('yaml-to-xml')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'yaml-to-xml' ? "brand-gradient text-white shadow-md" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            YAML to XML
                        </button>
                    </div>

                    {/* Status and Performance */}
                    <div className="flex items-center space-x-4">
                        {validationStatus !== 'empty' && (
                            <div className={cn(
                                "flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold",
                                validationStatus === 'valid' 
                                    ? "border-green-400/20 bg-green-400/5 text-green-400"
                                    : "border-red-400/20 bg-red-400/5 text-red-400"
                            )}>
                                {validationStatus === 'valid' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                <span>{validationStatus === 'valid' ? 'Valid' : 'Invalid'}</span>
                            </div>
                        )}
                        
                        {processingTime !== null && (
                            <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-[var(--border-primary)]">
                                <Zap className="w-3.5 h-3.5 text-brand" />
                                <span className="text-xs font-bold text-[var(--text-secondary)]">{processingTime}ms</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-bold mb-1">Conversion Error</div>
                            <div>{error}</div>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xml,.yaml,.yml"
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
                        <span>Sample Data</span>
                    </button>

                    <button
                        onClick={swapConversion}
                        disabled={!output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Swap & Convert</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!output}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowSyntaxHighlighting(!showSyntaxHighlighting)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showSyntaxHighlighting 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            {showSyntaxHighlighting ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>Syntax</span>
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-4">
                        <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Formatting Options</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">
                                XML Indentation
                            </label>
                            <select
                                value={xmlIndent}
                                onChange={(e) => setXmlIndent(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm"
                            >
                                <option value="  ">2 Spaces</option>
                                <option value="    ">4 Spaces</option>
                                <option value="\t">Tab</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">
                                YAML Indentation
                            </label>
                            <select
                                value={yamlIndent}
                                onChange={(e) => setYamlIndent(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm"
                            >
                                <option value="2">2 Spaces</option>
                                <option value="4">4 Spaces</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[520px]">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'xml-to-yaml' ? 'XML Input' : 'YAML Input'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'xml-to-yaml' ? '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>value</item>\n</root>' : 'root:\n  item: value'}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                {mode === 'xml-to-yaml' ? 'YAML Output' : 'XML Output'}
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {output.length} chars
                            </div>
                        </div>
                        
                        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            {showSyntaxHighlighting && output ? (
                                <div className="h-full overflow-auto custom-scrollbar">
                                    <ReactSyntaxHighlighter
                                        language={mode === 'xml-to-yaml' ? 'yaml' : 'xml'}
                                        style={oneDark}
                                        customStyle={{
                                            margin: 0,
                                            padding: '2rem',
                                            background: 'transparent',
                                            fontSize: '0.75rem',
                                            fontFamily: 'var(--font-mono)',
                                            lineHeight: '1.5'
                                        }}
                                        showLineNumbers={showLineNumbers}
                                        wrapLines={true}
                                        wrapLongLines={true}
                                    >
                                        {output}
                                    </ReactSyntaxHighlighter>
                                </div>
                            ) : (
                                <pre className="h-full p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic">Output will appear here...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/20">
                    <div className="text-center p-3 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer" onClick={() => setShowLineNumbers(!showLineNumbers)}>
                        <Code className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" />
                        <div className="text-xs font-bold text-[var(--text-secondary)]">Line Numbers</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{showLineNumbers ? 'On' : 'Off'}</div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-all">
                        <FileText className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" />
                        <div className="text-xs font-bold text-[var(--text-secondary)]">Format</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Pretty</div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-all">
                        <Zap className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" />
                        <div className="text-xs font-bold text-[var(--text-secondary)]">Validation</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Real-time</div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-all">
                        <CheckCircle className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" />
                        <div className="text-xs font-bold text-[var(--text-secondary)]">Processing</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Local</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
