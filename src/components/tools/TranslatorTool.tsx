import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { usePersistentState } from '../../lib/storage'
import { Languages, ArrowRightLeft, Copy, Check, Volume2, Zap } from 'lucide-react'
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
    const [sourceText, setSourceText] = usePersistentState('translator_source', '')
    const [translatedText, setTranslatedText] = usePersistentState('translator_result', '')
    const [sourceLang, setSourceLang] = usePersistentState('translator_source_lang', 'en')
    const [targetLang, setTargetLang] = usePersistentState('translator_target_lang', 'es')
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
            description="Professional language transformation engine powered by high-fidelity neural translation vectors."
            icon={Languages}
            onReset={() => {
                setSourceText('')
                setTranslatedText('')
                setError(null)
            }}
            onCopy={handleCopy}
        >
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Controls */}
                <div className="glass p-6 rounded-[2.5rem] border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-6 bg-[var(--bg-secondary)]/30">
                    <div className="flex flex-1 items-center gap-4 w-full">
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="w-full md:w-48 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] font-black text-xs uppercase tracking-widest text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 outline-none appearance-none cursor-pointer transition-all"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={swapLanguages}
                            className="p-4 rounded-2xl glass hover:bg-brand hover:text-white transition-all text-brand border-[var(--border-primary)] shadow-lg"
                            title="Swap Languages"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>

                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full md:w-48 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] font-black text-xs uppercase tracking-widest text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 outline-none appearance-none cursor-pointer transition-all"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={loading || !sourceText.trim()}
                        className={cn(
                            "w-full md:auto px-12 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all relative overflow-hidden group shadow-xl",
                            loading || !sourceText.trim()
                                ? "bg-[var(--text-muted)]/10 text-[var(--text-muted)] cursor-not-allowed opacity-50"
                                : "brand-gradient text-white hover:scale-105 active:scale-95"
                        )}
                    >
                        <div className="flex items-center justify-center space-x-3">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                            <span>{loading ? 'Processing...' : 'Execute Translation'}</span>
                        </div>
                    </button>
                </div>

                {/* Text Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Source */}
                    <div className="space-y-4 group">
                        <div className="flex items-center justify-between px-6">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] transition-colors group-focus-within:text-brand">Input Source</label>
                            <button
                                onClick={() => playAudio(sourceText, sourceLang)}
                                className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all"
                                disabled={!sourceText}
                                title="Listen to Source"
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                className="w-full h-80 p-10 rounded-[3.5rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-lg resize-none focus:ring-8 focus:ring-brand/5 outline-none transition-all shadow-2xl custom-scrollbar placeholder:opacity-20 font-medium leading-relaxed"
                                placeholder="Enter linguistic markers to translate..."
                            />
                        </div>
                    </div>

                    {/* Target */}
                    <div className="space-y-4 group">
                        <div className="flex items-center justify-between px-6">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] transition-colors group-focus-within:text-brand">Output Matrix</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => playAudio(translatedText, targetLang)}
                                    className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all"
                                    disabled={!translatedText}
                                    title="Listen to Translation"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        "p-2 rounded-xl transition-all",
                                        copied ? "bg-green-500 text-white shadow-lg" : "text-[var(--text-muted)] hover:bg-brand/10 hover:text-brand"
                                    )}
                                    disabled={!translatedText}
                                    title="Copy Transformation"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="relative w-full h-80 rounded-[3.5rem] bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-2xl overflow-hidden group-hover:border-brand/30 transition-all">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-brand/20 rounded-full" />
                                        <div className="absolute inset-0 w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">Analyzing Semantics...</p>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={translatedText}
                                    className="w-full h-full p-10 bg-transparent text-lg resize-none outline-none custom-scrollbar font-medium leading-relaxed"
                                    placeholder="Linguistic transformation results will manifest here..."
                                />
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center text-red-500 font-black text-[10px] uppercase tracking-widest shadow-lg">
                        {error}
                    </div>
                )}

                <div className="p-8 glass rounded-[2.5rem] border-dashed border-brand/20 flex flex-col items-center justify-center space-y-2 bg-brand/5 shadow-inner">
                    <p className="text-[10px] text-brand font-black uppercase tracking-[0.4em]">API Connectivity</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                        Neural Engine: MyMemory Neural Network • Free Compute Tier
                    </p>
                </div>
            </div>
        </ToolLayout>
    )
}
