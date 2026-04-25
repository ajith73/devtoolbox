import { useMemo, useState, useRef } from 'react'
import { FileEdit, Upload, Copy, CheckCircle, Settings, FileText, Type, Shuffle } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced word collections for different languages and styles
const WORD_COLLECTIONS = {
    latin: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod',
        'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim',
        'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex',
        'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit', 'in', 'voluptate',
        'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
        'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim',
        'id', 'est', 'laborum'
    ],
    english: [
        'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'pack', 'my', 'box', 'with',
        'five', 'dozen', 'liquor', 'jugs', 'amazingly', 'few', 'discotheques', 'jive', 'quiz', 'jock',
        'tv', 'pack', 'girls', 'whimper', 'while', 'vexing', 'nymphs', 'go', 'quick', 'waltz', 'bad',
        'quandary', 'dwarves', 'jinx', 'my', 'grumpy', 'wizards', 'make', 'toxic', 'brew', 'for', 'evil',
        'queen', 'jack', 'love', 'big', 'sphinx', 'of', 'quartz', 'five', 'dozen', 'ivory', 'jugs',
        'bawdy', 'jokes', 'zip', 'quick', 'brown', 'foxes', 'jump', 'over', 'lazy', 'dogs', 'how', 'razorback',
        'jumping', 'frogs', 'can', 'level', 'six', 'piqued', 'hedgehogs', 'amazingly', 'few', 'discotheques',
        'jive', 'quiz', 'jocks', 'tv', 'pack', 'girls', 'whimper', 'while', 'vexing', 'nymphs', 'go',
        'quick', 'waltz', 'bad', 'quandary', 'dwarves', 'jinx', 'my', 'grumpy', 'wizards', 'make', 'toxic'
    ],
    tech: [
        'algorithm', 'database', 'interface', 'framework', 'component', 'module', 'function', 'variable',
        'constant', 'method', 'property', 'class', 'object', 'array', 'string', 'number', 'boolean',
        'null', 'undefined', 'async', 'await', 'promise', 'callback', 'event', 'listener', 'handler',
        'response', 'request', 'server', 'client', 'frontend', 'backend', 'fullstack', 'devops', 'agile',
        'scrum', 'sprint', 'commit', 'branch', 'merge', 'deploy', 'build', 'test', 'debug', 'optimize',
        'refactor', 'scalable', 'performance', 'security', 'authentication', 'authorization', 'encryption',
        'decryption', 'hash', 'token', 'session', 'cookie', 'cache', 'storage', 'memory', 'bandwidth',
        'latency', 'throughput', 'concurrency', 'parallel', 'serial', 'synchronous', 'asynchronous',
        'blocking', 'nonblocking', 'stream', 'buffer', 'queue', 'stack', 'heap', 'pointer', 'reference',
        'iteration', 'recursion', 'loop', 'condition', 'exception', 'error', 'warning', 'info', 'log'
    ],
    business: [
        'synergy', 'paradigm', 'leverage', 'optimize', 'streamline', 'empower', 'innovate', 'transform',
        'disrupt', 'pivot', 'scale', 'grow', 'expand', 'diversify', 'integrate', 'collaborate', 'partner',
        'stakeholder', 'shareholder', 'investor', 'venture', 'capital', 'revenue', 'profit', 'margin',
        'growth', 'market', 'competition', 'advantage', 'strategy', 'tactic', 'goal', 'objective',
        'mission', 'vision', 'value', 'proposition', 'customer', 'client', 'user', 'experience',
        'journey', 'funnel', 'pipeline', 'conversion', 'retention', 'acquisition', 'churn', 'engagement',
        'metrics', 'analytics', 'insights', 'data', 'intelligence', 'artificial', 'machine', 'learning',
        'automation', 'efficiency', 'productivity', 'quality', 'excellence', 'premium', 'luxury',
        'budget', 'forecast', 'projection', 'trend', 'pattern', 'cycle', 'season', 'quarter',
        'annual', 'monthly', 'weekly', 'daily', 'hourly', 'realtime', 'instant', 'immediate'
    ],
    culinary: [
        'delicious', 'flavorful', 'aromatic', 'savory', 'sweet', 'spicy', 'bitter', 'sour', 'umami', 'tangy',
        'crunchy', 'creamy', 'smooth', 'rough', 'tender', 'juicy', 'dry', 'moist', 'rich', 'light',
        'heavy', 'fresh', 'frozen', 'cooked', 'raw', 'grilled', 'baked', 'fried', 'steamed', 'roasted',
        'seasoned', 'marinated', 'cured', 'aged', 'young', 'ripe', 'unripe', 'organic', 'natural',
        'artificial', 'homemade', 'restaurant', 'kitchen', 'chef', 'recipe', 'ingredient', 'spice',
        'herb', 'vegetable', 'fruit', 'meat', 'fish', 'poultry', 'dairy', 'grain', 'pasta', 'rice',
        'bread', 'soup', 'salad', 'appetizer', 'entree', 'dessert', 'beverage', 'wine', 'coffee', 'tea',
        'juice', 'water', 'soda', 'cocktail', 'mocktail', 'snack', 'meal', 'breakfast', 'lunch', 'dinner'
    ]
}

// Sentence structures for more natural text
type SentenceStructure = {
    minLength: number
    maxLength: number
    commaChance: number
    periodChance: number
}

const SENTENCE_STRUCTURES: SentenceStructure[] = [
    { minLength: 5, maxLength: 15, commaChance: 0.2, periodChance: 0.8 },
    { minLength: 8, maxLength: 20, commaChance: 0.3, periodChance: 0.7 },
    { minLength: 10, maxLength: 25, commaChance: 0.4, periodChance: 0.6 },
    { minLength: 12, maxLength: 30, commaChance: 0.5, periodChance: 0.5 }
]

// Text generation options
type TextOptions = {
    paragraphs: number
    wordsPerParagraph: number
    wordsPerSentence: number
    startWithLorem: boolean
    language: keyof typeof WORD_COLLECTIONS
    format: 'plain' | 'html' | 'markdown' | 'json'
    punctuation: 'minimal' | 'normal' | 'rich'
    case: 'lowercase' | 'uppercase' | 'titlecase' | 'sentencecase'
}

// Enhanced text generation function
function generateText(options: TextOptions): string {
    const words = WORD_COLLECTIONS[options.language]
    const paragraphs: string[] = []
    let wordIndex = 0

    for (let p = 0; p < options.paragraphs; p++) {
        const sentences: string[] = []
        const targetWords = options.wordsPerParagraph
        let wordsInParagraph = 0

        // Start with Lorem Ipsum if requested
        if (options.startWithLorem && p === 0 && options.language === 'latin') {
            sentences.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
            wordsInParagraph = 8
            wordIndex = 8
        }

        while (wordsInParagraph < targetWords) {
            const structure = SENTENCE_STRUCTURES[Math.floor(Math.random() * SENTENCE_STRUCTURES.length)]
            const sentenceLength = Math.min(
                Math.max(structure.minLength, targetWords - wordsInParagraph),
                structure.maxLength
            )
            
            const sentenceWords: string[] = []
            for (let w = 0; w < sentenceLength; w++) {
                let word = words[wordIndex % words.length]
                
                // Apply case transformation
                if (options.case === 'lowercase') {
                    word = word.toLowerCase()
                } else if (options.case === 'uppercase') {
                    word = word.toUpperCase()
                } else if (options.case === 'titlecase') {
                    word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                } else if (options.case === 'sentencecase' && w === 0) {
                    word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                }
                
                sentenceWords.push(word)
                wordIndex++
            }
            
            // Add punctuation
            let sentence = sentenceWords.join(' ')
            
            if (options.punctuation === 'rich' && Math.random() < structure.commaChance && wordsInParagraph + sentenceLength < targetWords) {
                const commaPos = Math.floor(sentenceLength * 0.3) + 1
                sentence = sentenceWords.slice(0, commaPos).join(' ') + ',' + sentenceWords.slice(commaPos).join(' ')
            }
            
            if (options.punctuation !== 'minimal') {
                if (Math.random() < structure.periodChance || wordsInParagraph + sentenceLength >= targetWords) {
                    sentence += '.'
                }
            }
            
            sentences.push(sentence)
            wordsInParagraph += sentenceLength
        }
        
        paragraphs.push(sentences.join(' '))
    }

    let result = paragraphs.join('\n\n')
    
    // Apply formatting
    if (options.format === 'html') {
        result = paragraphs.map(p => `<p>${p}</p>`).join('\n')
    } else if (options.format === 'markdown') {
        result = paragraphs.map(p => p).join('\n\n')
    } else if (options.format === 'json') {
        result = JSON.stringify({
            text: paragraphs.join('\n\n'),
            metadata: {
                paragraphs: options.paragraphs,
                wordsPerParagraph: options.wordsPerParagraph,
                language: options.language,
                format: options.format,
                punctuation: options.punctuation,
                case: options.case,
                wordCount: paragraphs.join('\n\n').split(/\s+/).length,
                characterCount: paragraphs.join('\n\n').length
            }
        }, null, 2)
    }
    
    return result
}

// Sample configurations
function getSampleConfigs() {
    return [
        { paragraphs: 3, wordsPerParagraph: 40, wordsPerSentence: 10, startWithLorem: true, language: 'latin', format: 'plain', punctuation: 'normal', case: 'sentencecase' },
        { paragraphs: 5, wordsPerParagraph: 30, wordsPerSentence: 8, startWithLorem: false, language: 'english', format: 'plain', punctuation: 'normal', case: 'sentencecase' },
        { paragraphs: 2, wordsPerParagraph: 50, wordsPerSentence: 15, startWithLorem: false, language: 'tech', format: 'plain', punctuation: 'rich', case: 'lowercase' },
        { paragraphs: 4, wordsPerParagraph: 25, wordsPerSentence: 12, startWithLorem: false, language: 'business', format: 'html', punctuation: 'normal', case: 'titlecase' },
        { paragraphs: 3, wordsPerParagraph: 35, wordsPerSentence: 11, startWithLorem: false, language: 'culinary', format: 'markdown', punctuation: 'rich', case: 'sentencecase' }
    ]
}

export function LoremIpsumTool() {
    const [paragraphs, setParagraphs] = usePersistentState<number>('lorem_paragraphs', 3)
    const [wordsPerParagraph, setWordsPerParagraph] = usePersistentState<number>('lorem_words_per_paragraph', 40)
    const [startWithLorem, setStartWithLorem] = usePersistentState<boolean>('lorem_start_with_lorem', true)
    const [language, setLanguage] = usePersistentState<keyof typeof WORD_COLLECTIONS>('lorem_language', 'latin')
    const [format, setFormat] = usePersistentState<'plain' | 'html' | 'markdown' | 'json'>('lorem_format', 'plain')
    const [punctuation, setPunctuation] = usePersistentState<'minimal' | 'normal' | 'rich'>('lorem_punctuation', 'normal')
    const [textCase, setTextCase] = usePersistentState<'lowercase' | 'uppercase' | 'titlecase' | 'sentencecase'>('lorem_case', 'sentencecase')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const enhancedText = useMemo(() => {
        const options: TextOptions = {
            paragraphs: Math.max(1, Math.min(20, Number(paragraphs) || 1)),
            wordsPerParagraph: Math.max(5, Math.min(200, Number(wordsPerParagraph) || 40)),
            wordsPerSentence: 10,
            startWithLorem,
            language,
            format,
            punctuation,
            case: textCase
        }
        return generateText(options)
    }, [paragraphs, wordsPerParagraph, startWithLorem, language, format, punctuation, textCase])

    const textStats = useMemo(() => {
        if (!enhancedText) return { words: 0, characters: 0, paragraphs: 0, sentences: 0 }
        
        const words = enhancedText.split(/\s+/).filter(word => word.length > 0).length
        const characters = enhancedText.length
        const paragraphs = enhancedText.split(/\n\n/).filter(p => p.trim().length > 0).length
        const sentences = enhancedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length
        
        return { words, characters, paragraphs, sentences }
    }, [enhancedText])

    const handleCopy = async () => {
        if (enhancedText) {
            await copyToClipboard(enhancedText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = (files: FileList) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                // Parse configuration from file if it contains JSON
                try {
                    const parsed = JSON.parse(content)
                    if (parsed.paragraphs) setParagraphs(parsed.paragraphs)
                    if (parsed.wordsPerParagraph) setWordsPerParagraph(parsed.wordsPerParagraph)
                    if (parsed.language && Object.keys(WORD_COLLECTIONS).includes(parsed.language)) {
                        setLanguage(parsed.language as keyof typeof WORD_COLLECTIONS)
                    }
                } catch (e) {
                    // If not JSON, just use the content as text
                    const lines = content.split('\n')
                    const firstLine = lines[0] || ''
                    const wordCount = firstLine.split(/\s+/).length
                    if (wordCount > 0) {
                        setWordsPerParagraph(wordCount)
                        setParagraphs(lines.length)
                    }
                }
            }
            reader.readAsText(file)
        })
    }

    const insertSample = () => {
        const samples = getSampleConfigs()
        const sample = samples[Math.floor(Math.random() * samples.length)]
        setParagraphs(sample.paragraphs)
        setWordsPerParagraph(sample.wordsPerParagraph)
        setStartWithLorem(sample.startWithLorem)
        setLanguage(sample.language as 'latin' | 'english' | 'tech' | 'business' | 'culinary')
        setFormat(sample.format as 'plain' | 'html' | 'markdown' | 'json')
        setPunctuation(sample.punctuation as 'minimal' | 'normal' | 'rich')
        setTextCase(sample.case as 'lowercase' | 'uppercase' | 'titlecase' | 'sentencecase')
    }

    const randomizeAll = () => {
        setParagraphs(Math.floor(Math.random() * 10) + 1)
        setWordsPerParagraph(Math.floor(Math.random() * 50) + 20)
        setStartWithLorem(Math.random() > 0.5)
        const languages = Object.keys(WORD_COLLECTIONS) as (keyof typeof WORD_COLLECTIONS)[]
        setLanguage(languages[Math.floor(Math.random() * languages.length)])
        const formats: Array<'plain' | 'html' | 'markdown' | 'json'> = ['plain', 'html', 'markdown', 'json']
        setFormat(formats[Math.floor(Math.random() * formats.length)])
        const punctuations: Array<'minimal' | 'normal' | 'rich'> = ['minimal', 'normal', 'rich']
        setPunctuation(punctuations[Math.floor(Math.random() * punctuations.length)])
        const cases: Array<'lowercase' | 'uppercase' | 'titlecase' | 'sentencecase'> = ['lowercase', 'uppercase', 'titlecase', 'sentencecase']
        setTextCase(cases[Math.floor(Math.random() * cases.length)])
    }

    return (
        <ToolLayout
            title="Lorem Ipsum Pro"
            description="Advanced placeholder text generator with multiple languages, formats, and customization options."
            icon={FileEdit}
            onReset={() => { setParagraphs(3); setWordsPerParagraph(40); setStartWithLorem(true); setLanguage('latin'); setFormat('plain'); setPunctuation('normal'); setTextCase('sentencecase') }}
            onCopy={handleCopy}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <FileEdit className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Lorem Ipsum Generator</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Advanced placeholder text generation with multiple languages and formats</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.json,.md,.html"
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
                        <span>Sample</span>
                    </button>

                    <button
                        onClick={randomizeAll}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold"
                    >
                        <Shuffle className="w-4 h-4" />
                        <span>Randomize</span>
                    </button>

                    <div className="w-px h-6 bg-[var(--border-primary)]" />

                    <button
                        onClick={handleCopy}
                        disabled={!enhancedText}
                        className="flex items-center space-x-2 px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <Settings className="w-3.5 h-3.5" />
                            <span>Advanced</span>
                        </button>
                        
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showStats 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Type className="w-3.5 h-3.5" />
                            <span>Stats</span>
                        </button>
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-blue-400">{textStats.words}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Words</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-green-400">{textStats.paragraphs}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Paragraphs</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-yellow-400">{textStats.sentences}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Sentences</div>
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/30 text-center">
                        <div className="text-lg font-black text-purple-400">{textStats.characters}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Characters</div>
                    </div>
                </div>

                {/* Basic Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Paragraphs</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={paragraphs}
                            onChange={(e) => setParagraphs(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        />
                    </div>
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Words per paragraph</label>
                        <input
                            type="number"
                            min={5}
                            max={200}
                            value={wordsPerParagraph}
                            onChange={(e) => setWordsPerParagraph(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                        />
                    </div>
                </div>

                {/* Advanced Controls */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Advanced Options</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Language</label>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value as keyof typeof WORD_COLLECTIONS)}
                                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                                >
                                    {Object.keys(WORD_COLLECTIONS).map(lang => (
                                        <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Format</label>
                                <select 
                                    value={format} 
                                    onChange={(e) => setFormat(e.target.value as 'plain' | 'html' | 'markdown' | 'json')}
                                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                                >
                                    <option value="plain">Plain Text</option>
                                    <option value="html">HTML</option>
                                    <option value="markdown">Markdown</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Punctuation</label>
                                <select 
                                    value={punctuation} 
                                    onChange={(e) => setPunctuation(e.target.value as 'minimal' | 'normal' | 'rich')}
                                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                                >
                                    <option value="minimal">Minimal</option>
                                    <option value="normal">Normal</option>
                                    <option value="rich">Rich</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Case</label>
                                <select 
                                    value={textCase} 
                                    onChange={(e) => setTextCase(e.target.value as 'lowercase' | 'uppercase' | 'titlecase' | 'sentencecase')}
                                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg text-sm focus:border-brand/40 outline-none"
                                >
                                    <option value="sentencecase">Sentence Case</option>
                                    <option value="titlecase">Title Case</option>
                                    <option value="lowercase">lowercase</option>
                                    <option value="uppercase">UPPERCASE</option>
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={startWithLorem}
                                        onChange={(e) => setStartWithLorem(e.target.checked)}
                                        className="w-4 h-4 text-brand accent-brand focus:ring-brand focus:ring-offset-2"
                                    />
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Start with Lorem Ipsum</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                {showStats && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Type className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Text Statistics</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Content Analysis</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Words:</span>
                                        <span className="text-blue-400">{textStats.words.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Characters:</span>
                                        <span className="text-green-400">{textStats.characters.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Paragraphs:</span>
                                        <span className="text-yellow-400">{textStats.paragraphs}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Sentences:</span>
                                        <span className="text-purple-400">{textStats.sentences}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Averages</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Words/Paragraph:</span>
                                        <span className="text-orange-400">
                                            {textStats.paragraphs > 0 ? Math.round(textStats.words / textStats.paragraphs) : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Words/Sentence:</span>
                                        <span className="text-pink-400">
                                            {textStats.sentences > 0 ? Math.round(textStats.words / textStats.sentences) : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Chars/Word:</span>
                                        <span className="text-cyan-400">
                                            {textStats.words > 0 ? Math.round(textStats.characters / textStats.words) : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Format Info</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Language:</span>
                                        <span className="text-blue-400">{language}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Format:</span>
                                        <span className="text-green-400">{format}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Punctuation:</span>
                                        <span className="text-yellow-400">{punctuation}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Case:</span>
                                        <span className="text-purple-400">{textCase}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Reading Time</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Reading Speed:</span>
                                        <span className="text-orange-400">
                                            {textStats.words > 0 ? `${Math.round(textStats.words / 200)} min` : '0 min'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Speaking Time:</span>
                                        <span className="text-pink-400">
                                            {textStats.words > 0 ? `${Math.round(textStats.words / 150)} min` : '0 min'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Output */}
                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {enhancedText || <span className="text-[var(--text-muted)] opacity-30 italic">Generated text will appear here...</span>}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
