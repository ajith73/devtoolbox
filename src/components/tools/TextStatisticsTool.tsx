import { useMemo, useState, useRef } from 'react'
import { FileEdit, Upload, Copy, CheckCircle, FileText, BarChart3, TrendingUp, Clock, BookOpen, Languages, Zap } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced text analysis functions
function countWords(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).filter(Boolean).length
}

function countSentences(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    const matches = trimmed.match(/[^.!?]+[.!?]+/g)
    return matches ? matches.length : 1
}

function countParagraphs(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return 0
    const paragraphs = trimmed.split(/\n\n+/).filter(p => p.trim().length > 0)
    return paragraphs.length
}

function calculateReadingTime(text: string, wpm: number = 200) {
    const words = countWords(text)
    return Math.ceil(words / wpm)
}

function calculateFleschReadingEase(text: string): number {
    const words = countWords(text)
    const sentences = countSentences(text)
    const syllables = countSyllables(text)
    
    if (words === 0 || sentences === 0) return 0
    
    const avgWordsPerSentence = words / sentences
    const avgSyllablesPerWord = syllables / words
    
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)))
}

function countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean)
    let totalSyllables = 0
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^a-z]/g, '')
        if (cleanWord.length === 0) return
        
        let syllableCount = 0
        const vowelGroups = cleanWord.match(/[aeiouy]+/g)
        
        if (vowelGroups) {
            syllableCount = vowelGroups.length
        }
        
        if (cleanWord.endsWith('e')) {
            syllableCount--
        }
        
        if (syllableCount < 1) syllableCount = 1
        
        totalSyllables += syllableCount
    })
    
    return totalSyllables
}

function getReadingLevel(score: number): string {
    if (score >= 90) return 'Very Easy'
    if (score >= 80) return 'Easy'
    if (score >= 70) return 'Fairly Easy'
    if (score >= 60) return 'Standard'
    if (score >= 50) return 'Fairly Difficult'
    if (score >= 30) return 'Difficult'
    return 'Very Difficult'
}

function getCharacterFrequency(text: string) {
        const frequency: Record<string, number> = {}
        for (const char of text) {
            frequency[char] = (frequency[char] || 0) + 1
        }
        return frequency
    }
    
    function getWordFrequency(text: string) {
        const words = text.toLowerCase().split(/\s+/).filter(Boolean)
        const frequency: Record<string, number> = {}
        
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-z]/g, '')
            if (cleanWord.length > 2) {
                frequency[cleanWord] = (frequency[cleanWord] || 0) + 1
            }
        })
        
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
    }

    function analyzeTextComplexity(text: string) {
        const sentences = countSentences(text)
        const words = countWords(text)
        const chars = text.length
        
        const avgWordsPerSentence = words > 0 && sentences > 0 ? words / sentences : 0
        const avgCharsPerWord = words > 0 ? chars / words : 0
        
        const complexWords = text.toLowerCase().split(/\s+/).filter(word => {
            const cleanWord = word.replace(/[^a-z]/g, '')
            return cleanWord.length > 6
        }).length
        
        const complexWordsRatio = words > 0 ? (complexWords / words) * 100 : 0
        
        return {
            avgWordsPerSentence,
            avgCharsPerWord,
            complexWords,
            complexWordsRatio
        }
    }
    
function getLanguageDistribution(text: string) {
    const totalChars = text.length
    if (totalChars === 0) return { ascii: 0, unicode: 0, emoji: 0, other: 0 }
    
    let ascii = 0, unicode = 0, emoji = 0, other = 0
    
    for (const char of text) {
        const code = char.codePointAt(0) || 0
        if (code <= 0x7F) {
            ascii++
        } else if (code >= 0x1F600 && code <= 0x1F64F) {
            emoji++
        } else if (code <= 0xFFFF) {
            unicode++
        } else {
            other++
        }
    }
    
    return {
        ascii: Math.round((ascii / totalChars) * 100),
        unicode: Math.round((unicode / totalChars) * 100),
        emoji: Math.round((emoji / totalChars) * 100),
        other: Math.round((other / totalChars) * 100)
    }
}

export function TextStatisticsTool() {
    const [input, setInput] = usePersistentState('text_stats_input', '')
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showFrequency, setShowFrequency] = useState(false)
    const [showComplexity, setShowComplexity] = useState(false)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedStats = useMemo(() => {
        const startTime = performance.now()
        
        const chars = input.length
        const charsNoSpaces = input.replace(/\s/g, '').length
        const words = countWords(input)
        const lines = input ? input.split(/\r\n|\r|\n/).length : 0
        const bytes = new TextEncoder().encode(input).length
        const sentences = countSentences(input)
        const paragraphs = countParagraphs(input)
        const readingTime = calculateReadingTime(input)
        const fleschScore = calculateFleschReadingEase(input)
        const readingLevel = getReadingLevel(fleschScore)
        const characterFreq = getCharacterFrequency(input)
        const wordFreq = getWordFrequency(input)
        const complexity = analyzeTextComplexity(input)
        const languageDist = getLanguageDistribution(input)
        
        const endTime = performance.now()
        setProcessingTime(Math.round(endTime - startTime))
        
        return {
            chars, charsNoSpaces, words, lines, bytes, sentences, paragraphs,
            readingTime, fleschScore, readingLevel, characterFreq, wordFreq, complexity, languageDist
        }
    }, [input])

    const exportText = useMemo(() => {
        if (!input) return ''
        return [
            `=== Basic Statistics ===`,
            `Characters: ${enhancedStats.chars}`,
            `Characters (no spaces): ${enhancedStats.charsNoSpaces}`,
            `Words: ${enhancedStats.words}`,
            `Lines: ${enhancedStats.lines}`,
            `Sentences: ${enhancedStats.sentences}`,
            `Paragraphs: ${enhancedStats.paragraphs}`,
            `Bytes (UTF-8): ${enhancedStats.bytes}`,
            ``,
            `=== Reading Analysis ===`,
            `Reading Time: ${enhancedStats.readingTime} minutes`,
            `Flesch Reading Ease: ${enhancedStats.fleschScore.toFixed(1)}`,
            `Reading Level: ${enhancedStats.readingLevel}`,
            ``,
            `=== Text Complexity ===`,
            `Avg Words/Sentence: ${enhancedStats.complexity.avgWordsPerSentence.toFixed(1)}`,
            `Avg Chars/Word: ${enhancedStats.complexity.avgCharsPerWord.toFixed(1)}`,
            `Complex Words: ${enhancedStats.complexity.complexWords}`,
            `Complex Words Ratio: ${enhancedStats.complexity.complexWordsRatio.toFixed(1)}%`,
            ``,
            `=== Language Distribution ===`,
            `ASCII: ${enhancedStats.languageDist.ascii}%`,
            `Unicode: ${enhancedStats.languageDist.unicode}%`,
            `Emoji: ${enhancedStats.languageDist.emoji}%`,
            `Other: ${enhancedStats.languageDist.other}%`,
            ``,
            `=== Top Characters ===`,
            ...Object.entries(enhancedStats.characterFreq).slice(0, 8).map(([char, count]: [string, number]) => `${char}: ${count}`),
            ``,
            `=== Top Words ===`,
            ...enhancedStats.wordFreq.map(([word, count]: [string, number]) => `${word}: ${count}`)
        ].join('\n')
    }, [enhancedStats, input])

    const handleCopy = async () => {
        if (exportText) {
            await copyToClipboard(exportText)
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
        setInput(`The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the alphabet at least once. It's commonly used for testing typewriters, computer keyboards, and font displays.

Text analysis is the process of examining written text to understand its characteristics. This includes counting words, characters, sentences, and paragraphs. We can also analyze reading difficulty, complexity, and language distribution.

Advanced text statistics can help writers improve their work, teachers assess reading materials, and developers optimize text processing algorithms. By understanding these metrics, we can make better decisions about content creation and presentation.`)
    }

    return (
        <ToolLayout
            title="Text Statistics Pro"
            description="Advanced text analysis with reading level, complexity, and frequency analysis."
            icon={FileEdit}
            onReset={() => setInput('')}
            onCopy={exportText ? handleCopy : undefined}
            copyDisabled={!exportText}
        >
            <div className="space-y-6">
                {/* Header with Performance */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <FileEdit className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Text Analyzer</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Comprehensive text statistics and readability analysis</p>
                        </div>
                    </div>

                    {/* Performance */}
                    {processingTime !== null && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 glass rounded-xl border border-[var(--border-primary)]">
                            <Zap className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{processingTime}ms</span>
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.docx"
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
                        <span>Sample Text</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!exportText}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="ml-auto flex items-center space-x-3">
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showAnalysis 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => setShowFrequency(!showFrequency)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showFrequency 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Frequency</span>
                        </button>
                        
                        <button
                            onClick={() => setShowComplexity(!showComplexity)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showComplexity 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Complexity</span>
                        </button>
                    </div>
                </div>

                {/* Reading Analysis */}
                {showAnalysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Reading Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand">{enhancedStats.readingTime}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Minutes to read</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{enhancedStats.fleschScore.toFixed(1)}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Flesch Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{enhancedStats.readingLevel}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Reading Level</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{enhancedStats.paragraphs}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Paragraphs</div>
                            </div>
                        </div>

                        {/* Language Distribution */}
                        <div className="mt-4">
                            <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Language Distribution</div>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                    <span className="text-brand font-bold">{enhancedStats.languageDist.ascii}%</span>
                                    <span className="text-[var(--text-secondary)] ml-1">ASCII</span>
                                </div>
                                <div className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                    <span className="text-blue-400 font-bold">{enhancedStats.languageDist.unicode}%</span>
                                    <span className="text-[var(--text-secondary)] ml-1">Unicode</span>
                                </div>
                                <div className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                    <span className="text-green-400 font-bold">{enhancedStats.languageDist.emoji}%</span>
                                    <span className="text-[var(--text-secondary)] ml-1">Emoji</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Frequency Analysis */}
                {showFrequency && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Frequency Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Top Characters</div>
                                <div className="space-y-1">
                                    {Object.entries(enhancedStats.characterFreq).slice(0, 8).map(([char, count]: [string, number]) => (
                                        <div key={char} className="flex justify-between items-center px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs">
                                            <span className="font-mono text-brand">{char === ' ' ? '␠' : char}</span>
                                            <span className="text-[var(--text-secondary)]">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Top Words</div>
                                <div className="space-y-1">
                                    {enhancedStats.wordFreq.slice(0, 8).map(([word, count]: [string, number]) => (
                                        <div key={word} className="flex justify-between items-center px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs">
                                            <span className="text-blue-400">{word}</span>
                                            <span className="text-[var(--text-secondary)]">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Complexity */}
                {showComplexity && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Text Complexity</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{enhancedStats.complexity.avgWordsPerSentence.toFixed(1)}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Words/Sentence</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-cyan-400">{enhancedStats.complexity.avgCharsPerWord.toFixed(1)}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Chars/Word</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{enhancedStats.complexity.complexWords}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Complex Words</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-red-400">{enhancedStats.complexity.complexWordsRatio.toFixed(1)}%</div>
                                <div className="text-xs text-[var(--text-secondary)]">Complex Ratio</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Input Text
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {enhancedStats.chars} chars
                            </div>
                        </div>
                        <textarea
                            className="h-[400px] font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder="Paste text here to analyze..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Statistics
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {enhancedStats.words} words
                            </div>
                        </div>
                        
                        <div className="glass rounded-[2.5rem] border-[var(--border-primary)] p-8 bg-[var(--bg-secondary)]/30 overflow-auto custom-scrollbar max-h-[400px]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Stat label="Characters" value={enhancedStats.chars} />
                                <Stat label="Words" value={enhancedStats.words} />
                                <Stat label="Lines" value={enhancedStats.lines} />
                                <Stat label="Bytes (UTF-8)" value={enhancedStats.bytes} />
                                <Stat label="Chars (no spaces)" value={enhancedStats.charsNoSpaces} />
                                <Stat label="Sentences" value={enhancedStats.sentences} />
                                <Stat label="Paragraphs" value={enhancedStats.paragraphs} />
                                <Stat label="Reading Time" value={`${enhancedStats.readingTime} min`} />
                            </div>
                            
                            <div className="pt-6 mt-6 border-t border-[var(--border-primary)]/40">
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Export Data</div>
                                <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap break-words">{exportText}</pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Format Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-brand" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Reading Time</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Based on 200 WPM</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <BookOpen className="w-5 h-5 mx-auto mb-2 text-green-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Flesch Score</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Readability analysis</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Languages className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Language Mix</div>
                        <div className="text-[10px] text-[var(--text-muted)]">ASCII/Unicode/Emoji</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function Stat({ label, value }: { label: string, value: number | string }) {
    return (
        <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
            <div className="mt-2 text-2xl font-black text-[var(--text-primary)]">{value}</div>
        </div>
    )
}
