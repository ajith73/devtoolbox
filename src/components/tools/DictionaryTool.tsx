import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { BookOpen, Search, Volume2 } from 'lucide-react'
import { cn } from '../../lib/utils'

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
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<DictionaryResult[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchWord()
        }
    }

    const playAudio = (audioUrl: string) => {
        const audio = new Audio(audioUrl)
        audio.play()
    }

    return (
        <ToolLayout
            title="Dictionary"
            description="Look up word definitions, pronunciations, and examples."
            icon={BookOpen}
            onReset={() => { setQuery(''); setResults(null); setError(null) }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Search Input */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        Search Word
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 text-2xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all"
                            placeholder="Type a word..."
                        />
                        <button
                            onClick={searchWord}
                            disabled={loading || !query.trim()}
                            className={cn(
                                "px-8 py-4 rounded-[2rem] font-black uppercase tracking-wider transition-all",
                                loading || !query.trim()
                                    ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                    : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                        >
                            <Search className="w-6 h-6" />
                        </button>
                    </div>
                </div>

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
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center">
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results && results.length > 0 && (
                    <div className="space-y-8">
                        {results.map((result, idx) => (
                            <div key={idx} className="glass p-8 rounded-[3rem] border-[var(--border-primary)] space-y-6">
                                {/* Word & Phonetic */}
                                <div className="space-y-3">
                                    <h2 className="text-5xl font-black text-brand capitalize">
                                        {result.word}
                                    </h2>

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
                                                        <Volume2 className="w-4 h-4" />
                                                        <span>Play</span>
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
                                            {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                                                <div key={dIdx} className="space-y-2">
                                                    <p className="text-[var(--text-primary)] leading-relaxed">
                                                        <span className="text-brand font-bold mr-2">{dIdx + 1}.</span>
                                                        {def.definition}
                                                    </p>

                                                    {def.example && (
                                                        <p className="text-[var(--text-muted)] italic pl-6 text-sm">
                                                            " {def.example} "
                                                        </p>
                                                    )}

                                                    {/* Synonyms */}
                                                    {def.synonyms && def.synonyms.length > 0 && (
                                                        <div className="pl-6">
                                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                                                Synonyms:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {def.synonyms.slice(0, 5).map((syn, sIdx) => (
                                                                    <span
                                                                        key={sIdx}
                                                                        className="px-3 py-1 bg-brand/5 text-brand rounded-full text-xs font-medium"
                                                                    >
                                                                        {syn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Antonyms */}
                                                    {def.antonyms && def.antonyms.length > 0 && (
                                                        <div className="pl-6">
                                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                                                Antonyms:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {def.antonyms.slice(0, 5).map((ant, aIdx) => (
                                                                    <span
                                                                        key={aIdx}
                                                                        className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium"
                                                                    >
                                                                        {ant}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {meaning.definitions.length > 3 && (
                                                <p className="text-xs text-[var(--text-muted)] italic">
                                                    + {meaning.definitions.length - 3} more definitions
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)]">
                    <p>Powered by Free Dictionary API • Open Source</p>
                </div>
            </div>
        </ToolLayout>
    )
}
