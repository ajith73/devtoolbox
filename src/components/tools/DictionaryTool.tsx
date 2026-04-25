import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Search, Copy, Check, Settings, Clock, Shield, AlertCircle, Globe, Headphones } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface Definition {
    definition: string
    example?: string
    synonyms?: string[]
    antonyms?: string[]
}

interface Meaning {
    partOfSpeech: string
    definitions: Definition[]
}

interface DictionaryResult {
    word: string
    phonetic?: string
    phonetics?: { text?: string; audio?: string }[]
    meanings: Meaning[]
}

export function DictionaryTool() {
    const [query, setQuery] = usePersistentState('dictionary_query', '')
    const [results, setResults] = useState<DictionaryResult[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [searchHistory, setSearchHistory] = usePersistentState('dictionary_history', [] as Array<{word: string, timestamp: string, resultCount: number}>)
    const [autoSearch, setAutoSearch] = usePersistentState('dictionary_auto_search', false)
    const [showSynonyms, setShowSynonyms] = usePersistentState('dictionary_show_synonyms', true)
    const [showAntonyms, setShowAntonyms] = usePersistentState('dictionary_show_antonyms', true)
    const [showExamples, setShowExamples] = usePersistentState('dictionary_show_examples', true)
    const [maxDefinitions, setMaxDefinitions] = usePersistentState('dictionary_max_definitions', 3)

    const searchWord = async () => {
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setResults(null)

        try {
            // Free Dictionary API - no key required!
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`
            )

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Word not found. Try a different spelling.')
                }
                throw new Error('Failed to fetch definition')
            }

            const data = await response.json()
            setResults(data)
            
            // Add to history
            const newEntry = {
                word: query.trim(),
                timestamp: new Date().toISOString(),
                resultCount: data.length
            }
            setSearchHistory(prev => [newEntry, ...prev.slice(0, 9)])
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    // Auto search when query changes
    useEffect(() => {
        if (autoSearch && query.trim()) {
            const timeoutId = setTimeout(() => {
                searchWord()
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    }, [query, autoSearch])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchWord()
        }
    }

    const playAudio = (audioUrl: string) => {
        const audio = new Audio(audioUrl)
        audio.play()
    }

    const handleCopy = (text: string) => {
        copyToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClearHistory = () => {
        setSearchHistory([])
    }

    const handleHistoryClick = (entry: {word: string}) => {
        setQuery(entry.word)
        searchWord()
    }

    const getWordCount = () => query.trim().split(/\s+/).filter(word => word.length > 0).length
    const getCharacterCount = () => query.length

    const computed = useMemo(() => {
        if (!results || results.length === 0) return { totalDefinitions: 0, totalSynonyms: 0, totalAntonyms: 0, totalExamples: 0 }
        
        let totalDefinitions = 0
        let totalSynonyms = 0
        let totalAntonyms = 0
        let totalExamples = 0
        
        results.forEach(result => {
            result.meanings.forEach(meaning => {
                totalDefinitions += meaning.definitions.length
                meaning.definitions.forEach(def => {
                    if (def.synonyms) totalSynonyms += def.synonyms.length
                    if (def.antonyms) totalAntonyms += def.antonyms.length
                    if (def.example) totalExamples += 1
                })
            })
        })
        
        return { totalDefinitions, totalSynonyms, totalAntonyms, totalExamples }
    }, [results])

    return (
        <ToolLayout
            title="Dictionary"
            description="Look up word definitions, pronunciations, and examples with advanced features."
            icon={BookOpen}
            onReset={() => { setQuery(''); setResults(null); setError(null) }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Dictionary</h2>
                            <p className="text-sm text-[var(--text-muted)]">Word definitions & pronunciations</p>
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
                    </div>
                </div>

                {/* Enhanced Search Input */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Search Word</label>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-2xl font-bold p-6 rounded-2xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all"
                                placeholder="Type a word..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {getCharacterCount()} chars • {getWordCount()} words
                            </div>
                        </div>
                        <button
                            onClick={searchWord}
                            disabled={loading || !query.trim()}
                            className={cn(
                                "px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center space-x-2",
                                loading || !query.trim()
                                    ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                    : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                        >
                            <Search className="w-5 h-5" />
                            <span>{loading ? 'Searching...' : 'Search'}</span>
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
                                    id="auto_search"
                                    checked={autoSearch}
                                    onChange={(e) => setAutoSearch(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_search" className="text-sm text-[var(--text-primary)]">Auto Search</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_synonyms"
                                    checked={showSynonyms}
                                    onChange={(e) => setShowSynonyms(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_synonyms" className="text-sm text-[var(--text-primary)]">Show Synonyms</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_antonyms"
                                    checked={showAntonyms}
                                    onChange={(e) => setShowAntonyms(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_antonyms" className="text-sm text-[var(--text-primary)]">Show Antonyms</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_examples"
                                    checked={showExamples}
                                    onChange={(e) => setShowExamples(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_examples" className="text-sm text-[var(--text-primary)]">Show Examples</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Max Definitions</label>
                                <input
                                    type="number"
                                    value={maxDefinitions}
                                    onChange={(e) => setMaxDefinitions(Number(e.target.value))}
                                    min={1}
                                    max={10}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">1-10 definitions per meaning</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses Free Dictionary API for comprehensive English dictionary data including definitions, pronunciations, synonyms, antonyms, and examples.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg">
                            Searching dictionary...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-red-500 font-bold">Error</span>
                        </div>
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results && results.length > 0 && (
                    <div className="space-y-8">
                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Definitions</div>
                                <div className="text-2xl font-black text-brand">{computed.totalDefinitions}</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Synonyms</div>
                                <div className="text-2xl font-black text-brand">{computed.totalSynonyms}</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Antonyms</div>
                                <div className="text-2xl font-black text-brand">{computed.totalAntonyms}</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Examples</div>
                                <div className="text-2xl font-black text-brand">{computed.totalExamples}</div>
                            </div>
                        </div>

                        {/* Word Results */}
                        {results.map((result, idx) => (
                            <div key={idx} className="glass p-8 rounded-3xl border-[var(--border-primary)] space-y-6">
                                {/* Word & Phonetic */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-5xl font-black text-brand capitalize">
                                            {result.word}
                                        </h2>
                                        <button
                                            onClick={() => handleCopy(result.word)}
                                            className="flex items-center space-x-2 px-3 py-1 bg-brand/10 hover:bg-brand/20 text-brand rounded-full text-sm font-bold transition-all"
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>

                                    {result.phonetic && (
                                        <p className="text-xl text-[var(--text-muted)] font-mono">
                                            {result.phonetic}
                                        </p>
                                    )}

                                    {/* Audio Pronunciation */}
                                    {result.phonetics && result.phonetics.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {result.phonetics
                                                .filter(p => p.audio)
                                                .map((phonetic, pIdx) => (
                                                    <button
                                                        key={pIdx}
                                                        onClick={() => phonetic.audio && playAudio(phonetic.audio)}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-full transition-all text-sm font-bold"
                                                    >
                                                        <Headphones className="w-4 h-4" />
                                                        <span>Play Pronunciation</span>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                {/* Meanings */}
                                {result.meanings.map((meaning, mIdx) => (
                                    <div key={mIdx} className="space-y-4 border-l-4 border-brand/30 pl-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-brand">
                                            {meaning.partOfSpeech}
                                        </h3>

                                        <div className="space-y-4">
                                            {meaning.definitions.slice(0, maxDefinitions).map((def, dIdx) => (
                                                <div key={dIdx} className="space-y-2">
                                                    <p className="text-[var(--text-primary)] leading-relaxed">
                                                        <span className="text-brand font-bold mr-2">{dIdx + 1}.</span>
                                                        <button
                                                            onClick={() => handleCopy(def.definition)}
                                                            className="inline-flex items-center space-x-1 text-brand hover:text-brand/80 transition-colors"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        {def.definition}
                                                    </p>

                                                    {showExamples && def.example && (
                                                        <div className="pl-6">
                                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                                                Example:
                                                            </p>
                                                            <p className="text-[var(--text-muted)] italic text-sm">
                                                                "{def.example}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Synonyms */}
                                                    {showSynonyms && def.synonyms && def.synonyms.length > 0 && (
                                                        <div className="pl-6">
                                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                                                Synonyms:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {def.synonyms.slice(0, 5).map((syn, sIdx) => (
                                                                    <span
                                                                        key={sIdx}
                                                                        className="px-3 py-1 bg-brand/5 text-brand rounded-full text-xs font-medium cursor-pointer hover:bg-brand/10 transition-colors"
                                                                        onClick={() => setQuery(syn)}
                                                                    >
                                                                        {syn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Antonyms */}
                                                    {showAntonyms && def.antonyms && def.antonyms.length > 0 && (
                                                        <div className="pl-6">
                                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                                                Antonyms:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {def.antonyms.slice(0, 5).map((ant, aIdx) => (
                                                                    <span
                                                                        key={aIdx}
                                                                        className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                                                                        onClick={() => setQuery(ant)}
                                                                    >
                                                                        {ant}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {meaning.definitions.length > maxDefinitions && (
                                                <p className="text-xs text-[var(--text-muted)] italic">
                                                    + {meaning.definitions.length - maxDefinitions} more definitions
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Search History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
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
                                                {entry.resultCount} results
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.word}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <Clock className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your search history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)]">
                    <div className="flex items-center justify-center space-x-2">
                        <Globe className="w-3 h-3" />
                        <p>Powered by Free Dictionary API • Open Source</p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
