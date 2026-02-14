import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Link, ArrowRightLeft } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

export function UrlTool() {
    const [input, setInput] = usePersistentState('url_input', '')
    const [output, setOutput] = useState('')
    const [mode, setMode] = useState<'encode' | 'decode'>('encode')

    useEffect(() => {
        if (input) process(input, mode)
    }, [])

    const process = (val: string, currentMode: 'encode' | 'decode') => {
        setInput(val)
        if (!val.trim()) {
            setOutput('')
            return
        }
        try {
            if (currentMode === 'encode') {
                setOutput(encodeURIComponent(val))
            } else {
                setOutput(decodeURIComponent(val))
            }
        } catch (e) {
            setOutput('Invalid input for decoding')
        }
    }

    const toggleMode = () => {
        const newMode = mode === 'encode' ? 'decode' : 'encode'
        setMode(newMode)
        process(input, newMode)
    }

    return (
        <ToolLayout
            title="URL Encoder / Decoder"
            description="Make URLs safe for transmission across the web."
            icon={Link}
            onReset={() => { setInput(''); setOutput(''); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
        >
            <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-4">
                    <button
                        onClick={toggleMode}
                        className="px-8 py-3 glass rounded-[2rem] flex items-center space-x-4 hover:brand-gradient group transition-all border border-[var(--border-primary)] shadow-sm bg-[var(--bg-secondary)]/30"
                    >
                        <ArrowRightLeft className="w-5 h-5 text-brand group-hover:rotate-180 group-hover:text-white transition-all duration-500" />
                        <span className="font-black uppercase tracking-[0.2em] text-[10px] text-[var(--text-secondary)]">
                            Engine Protocol: <span className="text-brand group-hover:text-white">{mode.toUpperCase()}</span>
                        </span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                    <div className="flex flex-col space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Semantic Entry</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none p-6 glass rounded-[2.5rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)]"
                            placeholder="https://example.com?query=dev-toolkit"
                            value={input}
                            onChange={(e) => process(e.target.value, mode)}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">Engine Manifest</label>
                        <div className="flex-1 relative glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 shadow-sm min-h-[300px]">
                            <pre className="absolute inset-0 p-8 text-[var(--text-primary)] font-mono text-sm overflow-auto whitespace-pre-wrap break-all opacity-80 select-all">
                                {output || <span className="text-[var(--text-muted)] opacity-30 italic">Synthetic output will manifest here...</span>}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
