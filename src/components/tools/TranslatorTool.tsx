import { useState, useEffect, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { usePersistentState } from '../../lib/storage'
import { Languages, ArrowRightLeft, Copy, Check, Volume2, Settings, Shield, AlertCircle, Database, Globe, Mic, MicOff, History, Sparkles, Download, Upload } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'

const LANGUAGES = [
    { code: 'auto', name: 'Automatic', native: 'Auto' },
    { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
    { code: 'sq', name: 'Albanian', native: 'Shqip' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hy', name: 'Armenian', native: 'Հայերեն' },
    { code: 'az', name: 'Azerbaijani', native: 'Azərbaycanca' },
    { code: 'eu', name: 'Basque', native: 'Euskara' },
    { code: 'be', name: 'Belarusian', native: 'Беларуская' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
    { code: 'bg', name: 'Bulgarian', native: 'Български' },
    { code: 'ca', name: 'Catalan', native: 'Català' },
    { code: 'ceb', name: 'Cebuano', native: 'Cebuano' },
    { code: 'ny', name: 'Chichewa', native: 'Chichewa' },
    { code: 'zh-cn', name: 'Chinese Simplified', native: '简体中文' },
    { code: 'zh-tw', name: 'Chinese Traditional', native: '繁體中文' },
    { code: 'co', name: 'Corsican', native: 'Corsu' },
    { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
    { code: 'cs', name: 'Czech', native: 'Čeština' },
    { code: 'da', name: 'Danish', native: 'Dansk' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'en', name: 'English', native: 'English' },
    { code: 'eo', name: 'Esperanto', native: 'Esperanto' },
    { code: 'et', name: 'Estonian', native: 'Eesti' },
    { code: 'tl', name: 'Filipino', native: 'Filipino' },
    { code: 'fi', name: 'Finnish', native: 'Suomi' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'fy', name: 'Frisian', native: 'Frysk' },
    { code: 'gl', name: 'Galician', native: 'Galego' },
    { code: 'ka', name: 'Georgian', native: 'ქართული' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl ayisyen' },
    { code: 'ha', name: 'Hausa', native: 'Hausa' },
    { code: 'haw', name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi' },
    { code: 'iw', name: 'Hebrew', native: 'עברית' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'hmn', name: 'Hmong', native: 'Hmong' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar' },
    { code: 'is', name: 'Icelandic', native: 'Íslenska' },
    { code: 'ig', name: 'Igbo', native: 'Igbo' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'ga', name: 'Irish', native: 'Gaeilge' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'jw', name: 'Javanese', native: 'Basa Jawa' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'kk', name: 'Kazakh', native: 'Қазақша' },
    { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'ku', name: 'Kurdish (Kurmanji)', native: 'Kurdî' },
    { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча' },
    { code: 'lo', name: 'Lao', native: 'ລາວ' },
    { code: 'la', name: 'Latin', native: 'Latina' },
    { code: 'lv', name: 'Latvian', native: 'Latviešu' },
    { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
    { code: 'lb', name: 'Luxembourgish', native: 'Lëtzebuergesch' },
    { code: 'mk', name: 'Macedonian', native: 'Македонски' },
    { code: 'mg', name: 'Malagasy', native: 'Malagasy' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'mt', name: 'Maltese', native: 'Malti' },
    { code: 'mi', name: 'Maori', native: 'Māori' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'mn', name: 'Mongolian', native: 'Монгол' },
    { code: 'my', name: 'Myanmar (Burmese)', native: 'မြန်မာ' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली' },
    { code: 'no', name: 'Norwegian', native: 'Norsk' },
    { code: 'ps', name: 'Pashto', native: 'پښتو' },
    { code: 'fa', name: 'Persian', native: 'فارسی' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ma', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ro', name: 'Romanian', native: 'Română' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'sm', name: 'Samoan', native: 'Gagana faʻa Sāmoa' },
    { code: 'gd', name: 'Scots Gaelic', native: 'Gàidhlig' },
    { code: 'sr', name: 'Serbian', native: 'Српски' },
    { code: 'st', name: 'Sesotho', native: 'Sesotho' },
    { code: 'sn', name: 'Shona', native: 'Shona' },
    { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
    { code: 'si', name: 'Sinhala', native: 'සිංහල' },
    { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
    { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
    { code: 'so', name: 'Somali', native: 'Soomaali' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'su', name: 'Sundanese', native: 'Basa Sunda' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'sv', name: 'Swedish', native: 'Svenska' },
    { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'uz', name: 'Uzbek', native: 'Oʻzbekcha' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'cy', name: 'Welsh', native: 'Cymraeg' },
    { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
    { code: 'yi', name: 'Yiddish', native: 'ייִדיש' },
    { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
    { code: 'zu', name: 'Zulu', native: 'IsiZulu' }
]

export function TranslatorTool() {
    const [sourceText, setSourceText] = usePersistentState('translator_source', '')
    const [translatedText, setTranslatedText] = usePersistentState('translator_result', '')
    const [sourceLang, setSourceLang] = usePersistentState('translator_source_lang', 'en')
    const [targetLang, setTargetLang] = usePersistentState('translator_target_lang', 'es')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [searchHistory, setSearchHistory] = usePersistentState('translator_history', [] as Array<{source: string, target: string, sourceLang: string, targetLang: string, timestamp: string, textLength: number}>)
    const [autoTranslate, setAutoTranslate] = usePersistentState('translator_auto_translate', false)
    const [showNativeNames, setShowNativeNames] = usePersistentState('translator_show_native', true)
    const [voiceEnabled, setVoiceEnabled] = usePersistentState('translator_voice_enabled', true)
    const [maxTextLength, setMaxTextLength] = usePersistentState('translator_max_length', 5000)
    const [translationService, setTranslationService] = usePersistentState('translator_service', 'mymemory')

    const handleTranslate = async () => {
        if (!sourceText.trim()) return

        setLoading(true)
        setError(null)

        try {
            let apiUrl = ''
            
            if (translationService === 'mymemory') {
                apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${sourceLang}|${targetLang}`
            } else if (translationService === 'google') {
                // Use Google Translate API with proper format
                apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&dj=1&q=${encodeURIComponent(sourceText)}`
            } else {
                throw new Error('Translation service not available')
            }

            const res = await fetch(apiUrl)
            const data = await res.json()

            if (translationService === 'mymemory' && data.responseStatus === 200) {
                setTranslatedText(data.responseData.translatedText)
            } else if (translationService === 'google' && data.data && data.data[0]) {
                // Google Translate API returns nested array structure
                const translatedText = data.data[0].map((item: any) => item[0]).join('')
                setTranslatedText(translatedText)
            } else {
                throw new Error(data.responseDetails || data.error?.message || 'Translation failed')
            }

            // Add to history
            const actualTranslatedText = translationService === 'google' && data.data && data.data[0] 
                ? data.data[0].map((item: any) => item[0]).join('')
                : translationService === 'mymemory' 
                    ? data.responseData.translatedText 
                    : translatedText
            
            const newEntry = {
                source: sourceText.trim(),
                target: actualTranslatedText,
                sourceLang,
                targetLang,
                timestamp: new Date().toISOString(),
                textLength: sourceText.length
            }
            setSearchHistory(prev => [newEntry, ...prev.slice(0, 19)])
        } catch (err: any) {
            setError(err.message || 'Failed to translate. Try again later.')
        } finally {
            setLoading(false)
        }
    }

    // Auto translate when text changes
    useEffect(() => {
        if (autoTranslate && sourceText.trim() && sourceText.length <= maxTextLength) {
            const timeoutId = setTimeout(() => {
                handleTranslate()
            }, 1000)
            return () => clearTimeout(timeoutId)
        }
    }, [autoTranslate, sourceText, sourceLang, targetLang, maxTextLength])

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
        if (!text || !voiceEnabled) return
        
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0
        window.speechSynthesis.speak(utterance)
    }

    const startListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition()
            recognition.lang = sourceLang
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event: any) => {
                const transcript = event.results[event.resultIndex][0].transcript
                setSourceText(prev => prev + transcript.slice(prev.length))
            }

            recognition.onerror = () => {
                setIsListening(false)
                setError('Speech recognition not available')
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognition.start()
            setIsListening(true)
        } else {
            setError('Speech recognition not supported in this browser')
        }
    }

    const stopListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition()
            recognition.stop()
            setIsListening(false)
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            setSourceText(text)
        }
        reader.readAsText(file)
    }

    const handleDownload = () => {
        const content = `Translation from ${LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang} to ${LANGUAGES.find(l => l.code === targetLang)?.name || targetLang}\n\nSource:\n${sourceText}\n\nTranslation:\n${translatedText}`
        
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `translation-${sourceLang}-to-${targetLang}-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleClearHistory = () => {
        setSearchHistory([])
    }

    const handleHistoryClick = (entry: {source: string, target: string, sourceLang: string, targetLang: string}) => {
        setSourceText(entry.source)
        setSourceLang(entry.sourceLang)
        setTargetLang(entry.targetLang)
        handleTranslate()
    }

    const computed = useMemo(() => {
        if (!sourceText || !translatedText) return { charCount: 0, wordCount: 0, languagePairs: 0, totalTranslations: 0 }
        
        const languagePairs = new Set(searchHistory.map(h => `${h.sourceLang}-${h.targetLang}`)).size
        const totalTranslations = searchHistory.length
        
        return {
            charCount: sourceText.length,
            wordCount: sourceText.trim().split(/\s+/).filter(word => word.length > 0).length,
            languagePairs,
            totalTranslations
        }
    }, [sourceText, translatedText, searchHistory])

    const getLanguageNativeName = (code: string) => {
        const lang = LANGUAGES.find(l => l.code === code)
        return showNativeNames && lang ? lang.native : lang?.name || code
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
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Languages className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Neural Translator</h2>
                            <p className="text-sm text-[var(--text-muted)]">Advanced language engine</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!translatedText}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                translatedText ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="auto_translate"
                                    checked={autoTranslate}
                                    onChange={(e) => setAutoTranslate(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_translate" className="text-sm text-[var(--text-primary)]">Auto Translate</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_native"
                                    checked={showNativeNames}
                                    onChange={(e) => setShowNativeNames(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_native" className="text-sm text-[var(--text-primary)]">Show Native Names</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="voice_enabled"
                                    checked={voiceEnabled}
                                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="voice_enabled" className="text-sm text-[var(--text-primary)]">Voice Enabled</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Translation Service</label>
                                <select
                                    value={translationService}
                                    onChange={(e) => setTranslationService(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="mymemory">MyMemory</option>
                                    <option value="google">Google Translate</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Max Text Length</label>
                                <select
                                    value={maxTextLength}
                                    onChange={(e) => setMaxTextLength(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value={1000}>1,000 chars</option>
                                    <option value={2500}>2,500 chars</option>
                                    <option value={5000}>5,000 chars</option>
                                    <option value={10000}>10,000 chars</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses MyMemory Neural Network for high-fidelity translations. Supports 30+ languages with real-time processing.
                            </p>
                        </div>
                    </div>
                )}

                {/* Enhanced Controls */}
                <div className="glass p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 bg-[var(--bg-secondary)]/30">
                    <div className="flex flex-1 items-center gap-4 w-full">
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="w-full md:w-48 p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-primary)] font-black text-xs uppercase tracking-widest text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 outline-none appearance-none cursor-pointer transition-all"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{getLanguageNativeName(lang.code)}</option>
                            ))}
                        </select>

                        <button
                            onClick={swapLanguages}
                            className="p-4 rounded-xl glass hover:bg-brand hover:text-white transition-all text-brand border-[var(--border-primary)] shadow-lg"
                            title="Swap Languages"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>

                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full md:w-48 p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-primary)] font-black text-xs uppercase tracking-widest text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 outline-none appearance-none cursor-pointer transition-all"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{getLanguageNativeName(lang.code)}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={loading || !sourceText.trim()}
                        className={cn(
                            "w-full md:auto px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all relative overflow-hidden group shadow-xl",
                            loading || !sourceText.trim()
                                ? "bg-[var(--text-muted)]/10 text-[var(--text-muted)] cursor-not-allowed opacity-50"
                                : "brand-gradient text-white hover:scale-105 active:scale-95"
                        )}
                    >
                        <div className="flex items-center justify-center space-x-3">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span>{loading ? 'Processing...' : 'Translate'}</span>
                        </div>
                    </button>
                </div>

                {/* Statistics Dashboard */}
                {(sourceText || translatedText) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Characters</div>
                            <div className="text-2xl font-black text-brand">{computed.charCount}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Words</div>
                            <div className="text-2xl font-black text-purple-500">{computed.wordCount}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Language Pairs</div>
                            <div className="text-2xl font-black text-cyan-500">{computed.languagePairs}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Translations</div>
                            <div className="text-2xl font-black text-green-500">{computed.totalTranslations}</div>
                        </div>
                    </div>
                )}

                {/* Enhanced Text Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Source */}
                    <div className="space-y-4 group">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-brand" />
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest transition-colors group-focus-within:text-brand">Source Text</label>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept=".txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all cursor-pointer"
                                    title="Upload File"
                                >
                                    <Upload className="w-4 h-4" />
                                </label>
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={cn(
                                        "p-2 rounded-xl transition-all",
                                        isListening ? "bg-red-500 text-white" : "hover:bg-brand/10 hover:text-brand text-[var(--text-muted)]"
                                    )}
                                    title={isListening ? "Stop Listening" : "Start Listening"}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => playAudio(sourceText, sourceLang)}
                                    className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all"
                                    disabled={!sourceText || !voiceEnabled}
                                    title="Listen to Source"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value.slice(0, maxTextLength))}
                                className="w-full h-80 p-8 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] text-lg resize-none focus:ring-4 focus:ring-brand/10 outline-none transition-all shadow-xl custom-scrollbar placeholder:opacity-20 font-medium leading-relaxed"
                                placeholder="Enter text to translate..."
                                maxLength={maxTextLength}
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-[var(--text-muted)]">
                                {sourceText.length}/{maxTextLength}
                            </div>
                        </div>
                    </div>

                    {/* Target */}
                    <div className="space-y-4 group">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-brand" />
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest transition-colors group-focus-within:text-brand">Translation</label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => playAudio(translatedText, targetLang)}
                                    className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all"
                                    disabled={!translatedText || !voiceEnabled}
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
                                    title="Copy Translation"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 hover:bg-brand/10 hover:text-brand text-[var(--text-muted)] rounded-xl transition-all"
                                    disabled={!translatedText}
                                    title="Download Translation"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative w-full h-80 rounded-2xl bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-xl overflow-hidden group-hover:border-brand/30 transition-all">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-brand/20 rounded-full" />
                                        <div className="absolute inset-0 w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">Processing Neural Vectors...</p>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={translatedText}
                                    className="w-full h-full p-8 bg-transparent text-lg resize-none outline-none custom-scrollbar font-medium leading-relaxed"
                                    placeholder="Translation will appear here..."
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-red-500 font-bold">Error</span>
                        </div>
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {/* Translation History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <History className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={searchHistory.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                searchHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {searchHistory.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {searchHistory.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {LANGUAGES.find(l => l.code === entry.sourceLang)?.name || entry.sourceLang} → {LANGUAGES.find(l => l.code === entry.targetLang)?.name || entry.targetLang}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.source.slice(0, 100)}{entry.source.length > 100 ? '...' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <History className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your translation history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* API Info */}
                <div className="p-6 glass rounded-2xl border-dashed border-brand/20 flex flex-col items-center justify-center space-y-2 bg-brand/5 shadow-inner">
                    <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-brand" />
                        <p className="text-[10px] text-brand font-black uppercase tracking-[0.4em]">Neural Engine</p>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                        MyMemory Neural Network • High-Fidelity Translation Vectors
                    </p>
                </div>
            </div>
        </ToolLayout>
    )
}
