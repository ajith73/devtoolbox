import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Languages, ArrowRightLeft, Copy, Check, Volume2 } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' }
]

export function TranslatorTool() {
    const [sourceText, setSourceText] = useState('')
    const [translatedText, setTranslatedText] = useState('')
    const [sourceLang, setSourceLang] = useState('en')
    const [targetLang, setTargetLang] = useState('es')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleTranslate = async () => {
        if (!sourceText.trim()) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${sourceLang}|${targetLang}`
            )
            const data = await res.json()

            if (data.responseStatus === 200) {
                setTranslatedText(data.responseData.translatedText)
            } else {
                throw new Error(data.responseDetails || 'Translation failed')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to translate. Try again later.')
        } finally {
            setLoading(false)
        }
    }

    const swapLanguages = () => {
        setSourceLang(targetLang)
        setTargetLang(sourceLang)
        setSourceText(translatedText)
        setTranslatedText(sourceText)
    }

    const handleCopy = () => {
        copyToClipboard(translatedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const playAudio = (text: string, lang: string) => {
        if (!text) return
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        window.speechSynthesis.speak(utterance)
    }

    return (
        <ToolLayout
            title="Language Translator"
            description="Translate text between 15+ languages instantly."
            icon={Languages}
            onReset={() => {
                setSourceText('')
                setTranslatedText('')
                setError(null)
            }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Controls */}
                <div className="glass p-4 rounded-[2rem] border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-4">
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="w-full md:w-48 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-brand/20 outline-none"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={swapLanguages}
                        className="p-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-muted)] hover:text-brand"
                    >
                        <ArrowRightLeft className="w-6 h-6" />
                    </button>

                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full md:w-48 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-brand/20 outline-none"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleTranslate}
                        disabled={loading || !sourceText.trim()}
                        className={cn(
                            "w-full md:w-auto px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all",
                            loading || !sourceText.trim()
                                ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                        )}
                    >
                        {loading ? 'Translating...' : 'Translate'}
                    </button>
                </div>

                {/* Text Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Source */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Source</label>
                            <button
                                onClick={() => playAudio(sourceText, sourceLang)}
                                className="p-1 hover:text-brand text-[var(--text-muted)] transition-colors"
                                disabled={!sourceText}
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            className="w-full h-64 p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-lg resize-none focus:ring-4 focus:ring-brand/10 outline-none transition-all custom-scrollbar"
                            placeholder="Enter text to translate..."
                        />
                    </div>

                    {/* Target */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Translation</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => playAudio(translatedText, targetLang)}
                                    className="p-1 hover:text-brand text-[var(--text-muted)] transition-colors"
                                    disabled={!translatedText}
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        "p-1 transition-colors",
                                        copied ? "text-green-500" : "text-[var(--text-muted)] hover:text-brand"
                                    )}
                                    disabled={!translatedText}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="relative w-full h-64 rounded-[2rem] bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)] overflow-hidden">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={translatedText}
                                    className="w-full h-full p-6 bg-transparent text-lg resize-none outline-none custom-scrollbar"
                                    placeholder="Translation will appear here..."
                                />
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-500 font-bold text-sm">
                        {error}
                    </div>
                )}

                <div className="text-center text-xs text-[var(--text-muted)]">
                    Powered by MyMemory Translation API • Free Usage
                </div>
            </div>
        </ToolLayout>
    )
}
