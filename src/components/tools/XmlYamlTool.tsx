import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileCode, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import yaml from 'js-yaml'
import formatXml from 'xml-formatter'
import { motion } from 'framer-motion'

export function XmlYamlTool() {
    const [input, setInput] = usePersistentState('xml_yaml_input', '')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [type, setType] = useState<'xml' | 'yaml'>('yaml')

    const processData = (val: string, currentType: 'xml' | 'yaml') => {
        if (!val.trim()) {
            setOutput('')
            setError(null)
            return
        }
        try {
            if (currentType === 'yaml') {
                const parsed = yaml.load(val)
                const formatted = yaml.dump(parsed, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true
                })
                setOutput(formatted)
            } else {
                const formatted = formatXml(val, {
                    indentation: '  ',
                    collapseContent: true,
                    lineSeparator: '\n'
                })
                setOutput(formatted)
            }
            setError(null)
        } catch (e: any) {
            setError(e.message)
            setOutput('')
        }
    }

    useEffect(() => {
        processData(input, type)
    }, [input, type])

    const handleDownload = () => {
        const mimeType = type === 'xml' ? 'application/xml' : 'application/x-yaml'
        const extension = type === 'xml' ? 'xml' : 'yaml'
        const blob = new Blob([output], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devbox-formatted.${extension}`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title={`${type.toUpperCase()} Formatter`}
            description={`Clean, format and validate your ${type.toUpperCase()} data with sub-millisecond precision.`}
            icon={type === 'xml' ? FileCode : FileText}
            onReset={() => { setInput(''); setOutput(''); setError(null); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={output ? handleDownload : undefined}
        >
            <div className="space-y-8">
                <div className="flex items-center justify-center">
                    <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-3xl border border-[var(--border-primary)] shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setType('yaml')}
                            className={cn(
                                "px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative z-10",
                                type === 'yaml' ? "brand-gradient text-white shadow-lg shadow-brand/20" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            YAML Protocol
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setType('xml')}
                            className={cn(
                                "px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative z-10",
                                type === 'xml' ? "brand-gradient text-white shadow-lg shadow-brand/20" : "text-[var(--text-muted)] hover:text-brand"
                            )}
                        >
                            XML Schema
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[500px] h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Input Data Stream</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none custom-scrollbar p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
                            placeholder={type === 'xml' ? '<root>\n  <item>data</item>\n</root>' : 'id: tool-vault\nstatus: active\nmeta:\n  version: 1.0'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Engine Projection</label>
                            {input && (
                                <div className={cn(
                                    "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm",
                                    error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'
                                )}>
                                    {error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span className="tracking-[0.1em]">{error ? 'Parsing Violation' : 'Schema Verified'}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 group shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40">
                            {error ? (
                                <div className="absolute inset-0 p-10 text-red-500/80 font-mono text-sm overflow-auto custom-scrollbar">
                                    <div className="flex items-center space-x-3 mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="font-black uppercase tracking-widest text-[10px]">Logical Disruption Detected</p>
                                    </div>
                                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] italic leading-relaxed text-[11px] font-black opacity-80 whitespace-pre-wrap">
                                        {error}
                                    </div>
                                </div>
                            ) : (
                                <pre className="absolute inset-0 p-10 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all">
                                    {output || <span className="text-[var(--text-muted)] opacity-30 italic font-medium uppercase tracking-widest text-[10px]">Structural expansion pending...</span>}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
