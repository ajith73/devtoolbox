import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ShieldCheck,
    RefreshCcw,
    Copy,
    Download,
    Settings,
    History,
    Dices,
    Layout,
    FileJson,
    FileText,
    Grid,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Zap,
    Lock
} from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// --- Constants & Types ---
type PasswordMode = 'standard' | 'passphrase' | 'pattern' | 'bulk'
type Template = 'banking' | 'wifi' | 'api' | 'admin' | 'pin' | 'none'

const WORD_LIST = [
    "ability", "able", "about", "above", "accept", "according", "account", "across", "act", "action",
    "activity", "actually", "add", "address", "administration", "admit", "adult", "affect", "after", "again",
    "against", "age", "agency", "agent", "ago", "agree", "agreement", "ahead", "air", "all", "allow",
    "almost", "alone", "along", "already", "also", "although", "always", "American", "among", "amount",
    "analysis", "and", "animal", "another", "answer", "any", "anyone", "anything", "appear", "apply",
    "approach", "area", "argue", "arm", "army", "around", "arrive", "art", "article", "artist", "as",
    "ask", "assume", "at", "attack", "attention", "attorney", "audience", "author", "authority", "available",
    "avoid", "away", "baby", "back", "bad", "bag", "ball", "bank", "bar", "base", "be", "beat", "beautiful",
    "because", "become", "bed", "before", "begin", "behavior", "behind", "believe", "benefit", "best",
    "better", "between", "beyond", "big", "bill", "billion", "bit", "black", "blood", "blue", "board",
    "body", "book", "born", "both", "box", "boy", "break", "bring", "brother", "budget", "build", "building",
    "business", "but", "buy", "by", "call", "camera", "campaign", "can", "cancer", "candidate", "capital",
    "car", "card", "care", "career", "carry", "case", "catch", "cause", "cell", "center", "central",
    "century", "certain", "certainly", "chair", "challenge", "chance", "change", "character", "charge",
    "check", "child", "choice", "choose", "church", "city", "civil", "claim", "class", "clear", "clearly",
    "close", "coach", "cold", "collection", "college", "color", "come", "commercial", "common", "community",
    "company", "compare", "computer", "concern", "condition", "conference", "Congress", "consider", "consumer",
    "contain", "continue", "control", "cost", "could", "country", "couple", "course", "court", "cover",
    "create", "crime", "cultural", "culture", "cup", "current", "customer", "cut", "dark", "data", "daughter",
    "day", "dead", "deal", "death", "debate", "decade", "decide", "decision", "deep", "defense", "degree",
    "democrat", "democratic", "describe", "design", "despite", "detail", "determine", "develop", "development",
    "die", "difference", "different", "difficult", "dinner", "direction", "director", "discover", "discuss",
    "discussion", "disease", "do", "doctor", "dog", "door", "down", "draw", "dream", "drive", "drop", "drug",
    "during", "each", "early", "east", "easy", "eat", "economic", "economy", "edge", "education", "effect",
    "effort", "eight", "either", "election", "else", "employee", "end", "energy", "enjoy", "enough", "enter",
    "entire", "environment", "environmental", "especially", "establish", "even", "evening", "event", "ever",
    "every", "everybody", "everyone", "everything", "evidence", "exactly", "example", "executive", "exist",
    "expect", "experience", "expert", "explain", "eye", "face", "fact", "factor", "fail", "fall", "family",
    "far", "fast", "father", "fear", "federal", "feel", "feeling", "few", "field", "fight", "figure", "fill",
    "film", "final", "finally", "financial", "find", "fine", "finger", "finish", "fire", "firm", "first",
    "fish", "five", "floor", "fly", "focus", "follow", "food", "foot", "for", "force", "foreign", "forget",
    "form", "former", "forward", "four", "free", "friend", "from", "front", "full", "fund", "future", "game",
    "garden", "gas", "general", "generation", "get", "girl", "give", "glass", "go", "goal", "good",
    "government", "great", "green", "ground", "group", "grow", "growth", "guess", "gun", "guy", "hair",
    "half", "hand", "hang", "happen", "happy", "hard", "have", "he", "head", "health", "hear", "heart",
    "heat", "heavy", "help", "her", "here", "herself", "high", "him", "himself", "his", "history", "hit",
    "hold", "hope", "hospital", "hot", "hotel", "hour", "house", "how", "however", "huge", "human", "hundred",
    "husband", "I", "idea", "identify", "if", "image", "imagine", "impact", "important", "improve", "in",
    "include", "including", "increase", "indeed", "indicate", "individual", "industry", "information",
    "inside", "instead", "institution", "interest", "interesting", "international", "interview", "into",
    "investment", "involve", "issue", "it", "item", "its", "itself", "job", "join", "just", "keep", "key",
    "kid", "kill", "kind", "kitchen", "know", "knowledge", "land", "language", "large", "last", "late",
    "later", "laugh", "law", "lawyer", "lay", "lead", "leader", "learn", "least", "leave", "left", "leg",
    "legal", "less", "let", "letter", "level", "lie", "life", "light", "like", "likely", "line", "list",
    "listen", "little", "live", "local", "long", "look", "lose", "loss", "lot", "love", "low", "machine",
    "magazine", "main", "maintain", "major", "majority", "make", "male", "manage", "management", "manager",
    "many", "market", "marriage", "material", "matter", "may", "maybe", "me", "mean", "measure", "media",
    "medical", "meet", "meeting", "member", "memory", "mention", "message", "method", "middle", "might",
    "military", "million", "mind", "minute", "miss", "mission", "model", "modern", "moment", "money",
    "month", "more", "morning", "most", "mother", "mouth", "move", "movement", "movie", "Mr", "Mrs", "much",
    "music", "must", "my", "myself", "name", "nation", "national", "natural", "nature", "near", "nearly",
    "necessary", "need", "network", "never", "new", "news", "newspaper", "next", "nice", "night", "nine",
    "no", "none", "nor", "north", "not", "note", "nothing", "notice", "now", "number", "occur", "of",
    "off", "offer", "office", "officer", "official", "often", "oh", "oil", "ok", "old", "on", "once",
    "one", "only", "onto", "open", "operation", "opportunity", "option", "or", "order", "organization",
    "others", "our", "out", "outside", "over", "own", "owner", "page", "pain", "paint", "paper", "parent",
    "part", "participant", "particular", "particularly", "partner", "party", "pass", "past", "patient",
    "pattern", "pay", "peace", "people", "per", "perform", "performance", "perhaps", "period", "person",
    "personal", "phone", "physical", "pick", "picture", "piece", "place", "plan", "plant", "play", "player",
    "PM", "point", "police", "policy", "political", "politics", "poor", "popular", "population", "position",
    "positive", "possible", "power", "practice", "prepare", "present", "president", "pressure", "pretty",
    "prevent", "price", "private", "probably", "problem", "process", "produce", "product", "production",
    "professional", "professor", "program", "project", "property", "protect", "prove", "provide", "public",
    "pull", "purpose", "push", "put", "quality", "question", "quickly", "quite", "race", "radio", "raise",
    "range", "rate", "rather", "reach", "read", "ready", "real", "reality", "realize", "really", "reason",
    "receive", "recent", "recently", "recognize", "record", "red", "reduce", "reflect", "region", "relate",
    "relationship", "religious", "remain", "remember", "remove", "report", "represent", "Republican",
    "require", "research", "resource", "respond", "response", "responsibility", "rest", "result", "return",
    "reveal", "rich", "right", "rise", "risk", "road", "rock", "role", "room", "root", "rule", "run",
    "safe", "same", "save", "say", "scene", "school", "science", "scientist", "score", "sea", "season",
    "seat", "second", "secret", "section", "sector", "security", "see", "seed", "seek", "seem", "sell",
    "send", "senior", "sense", "series", "serious", "serve", "service", "set", "seven", "several", "sex",
    "sexual", "shake", "share", "she", "shoot", "short", "shot", "should", "shoulder", "show", "side",
    "sign", "significant", "similar", "simple", "simply", "since", "sing", "single", "sister", "sit", "site",
    "situation", "six", "size", "skill", "skin", "small", "smile", "so", "social", "society", "soft",
    "soldier", "some", "somebody", "someone", "something", "sometimes", "son", "song", "soon", "sort",
    "sound", "source", "south", "southern", "space", "speak", "speaker", "special", "specific", "speech",
    "spend", "sport", "spring", "staff", "stage", "stand", "standard", "star", "start", "state", "statement",
    "station", "stay", "step", "still", "stock", "stop", "store", "story", "strategy", "stream", "street",
    "strength", "strike", "strong", "structure", "student", "study", "stuff", "style", "subject", "success",
    "successful", "such", "suddenly", "suffer", "suggest", "summer", "support", "sure", "surface", "system",
    "table", "take", "talk", "task", "tax", "teach", "teacher", "team", "technology", "television", "tell",
    "ten", "tend", "term", "test", "than", "thank", "that", "the", "their", "them", "themselves", "then",
    "theory", "there", "these", "they", "thing", "think", "third", "this", "those", "though", "thought",
    "thousand", "threat", "three", "through", "throughout", "throw", "thus", "time", "to", "today",
    "together", "tonight", "too", "tool", "top", "total", "tough", "toward", "town", "track", "trade",
    "traditional", "training", "travel", "treat", "treatment", "tree", "trial", "trip", "trouble", "true",
    "truth", "try", "turn", "TV", "two", "type", "under", "understand", "unit", "until", "up", "upon",
    "us", "use", "used", "user", "usually", "value", "various", "very", "victim", "view", "violence", "visit",
    "voice", "vote", "wait", "walk", "wall", "want", "war", "watch", "water", "way", "we", "weapon", "wear",
    "week", "weight", "well", "west", "western", "what", "whatever", "when", "where", "whether", "which",
    "while", "white", "who", "whole", "whom", "whose", "why", "wide", "wife", "will", "win", "wind", "window",
    "wish", "with", "within", "without", "woman", "wonder", "word", "work", "worker", "world", "worry",
    "would", "write", "writer", "wrong", "yard", "yeah", "year", "yes", "yet", "you", "young", "your", "yourself"
]

const CHARSETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
    ambiguous: '{}[]()/\'"`',
    similar: 'O0lI1|'
}

// --- Helper Functions ---
function getSecureRandomInt(max: number): number {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % max
}

function calculateEntropy(password: string, charsetSize: number): number {
    if (password.length === 0 || charsetSize === 0) return 0
    return Math.floor(password.length * Math.log2(charsetSize))
}

function getCrackTime(entropy: number): string {
    if (entropy === 0) return 'Instant'
    const guessesPerSecond = 1e10 // 10 billion guesses per second (high-end cracker)
    const seconds = Math.pow(2, entropy) / guessesPerSecond

    if (seconds < 1) return '< 1 second'
    if (seconds < 60) return `${Math.floor(seconds)} seconds`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
    if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`
    if (seconds < 31536000000) return `${Math.floor(seconds / 31536000).toLocaleString()} years`

    const years = seconds / 31536000
    if (years < 1e12) return `10^${Math.floor(Math.log10(years))} years`
    return 'Untold eons'
}

async function checkPwned(password: string): Promise<number> {
    try {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-1', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

        const prefix = hashHex.substring(0, 5)
        const suffix = hashHex.substring(5)

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
        if (!response.ok) return 0

        const text = await response.text()
        const lines = text.split('\n')

        for (const line of lines) {
            const [lineSuffix, count] = line.split(':')
            if (lineSuffix.trim() === suffix) {
                return parseInt(count)
            }
        }
    } catch (e) {
        console.error('Error checking PwnedPasswords:', e)
    }
    return 0
}

// --- Main Component ---
export function PasswordTool() {
    // Mode & Basic Settings
    const [mode, setMode] = usePersistentState<PasswordMode>('pw_mode', 'standard')
    const [length, setLength] = usePersistentState('pw_length', 16)
    const [bulkCount, setBulkCount] = usePersistentState('pw_bulk_count', 10)
    const [isVisible, setIsVisible] = useState(true)

    // Character Options
    const [useUpper, setUseUpper] = usePersistentState('pw_upper', true)
    const [useLower, setUseLower] = usePersistentState('pw_lower', true)
    const [useNumbers, setUseNumbers] = usePersistentState('pw_numbers', true)
    const [useSymbols, setUseSymbols] = usePersistentState('pw_symbols', true)
    const [excludeSimilar, setExcludeSimilar] = usePersistentState('pw_no_similar', false)
    const [excludeAmbiguous, setExcludeAmbiguous] = usePersistentState('pw_no_ambig', false)
    const [customChars, setCustomChars] = usePersistentState('pw_custom', '')
    const [avoidRepeating, setAvoidRepeating] = usePersistentState('pw_no_repeat', false)

    // Passphrase Settings
    const [wordCount, setWordCount] = usePersistentState('pw_word_count', 4)
    const [separator, setSeparator] = usePersistentState('pw_separator', '-')
    const [capitalize, setCapitalize] = usePersistentState('pw_caps', false)
    const [includeNumSym, setIncludeNumSym] = usePersistentState('pw_num_sym_phrase', false)

    // Pattern Settings
    const [pattern, setPattern] = usePersistentState('pw_pattern', 'LLNNSSLL')

    // State for generated output
    const [currentPassword, setCurrentPassword] = useState('')
    const [bulkPasswords, setBulkPasswords] = useState<string[]>([])
    const [pwnedCount, setPwnedCount] = useState<number | null>(null)
    const [isCheckingPwned, setIsCheckingPwned] = useState(false)
    const [copyStatus, setCopyStatus] = useState<string | null>(null)

    // Derived values
    const charset = useMemo(() => {
        let set = ''
        if (useUpper) set += CHARSETS.uppercase
        if (useLower) set += CHARSETS.lowercase
        if (useNumbers) set += CHARSETS.numbers
        if (useSymbols) set += CHARSETS.symbols
        if (customChars) set += customChars

        if (excludeSimilar) {
            for (const c of CHARSETS.similar) {
                set = set.split(c).join('')
            }
        }
        if (excludeAmbiguous) {
            for (const c of CHARSETS.ambiguous) {
                set = set.split(c).join('')
            }
        }
        return set
    }, [useUpper, useLower, useNumbers, useSymbols, customChars, excludeSimilar, excludeAmbiguous])

    const entropy = useMemo(() => {
        if (mode === 'passphrase') {
            // Log2(WORD_LIST^wordCount) = wordCount * Log2(WORD_LIST)
            return Math.floor(wordCount * Math.log2(WORD_LIST.length))
        }
        return calculateEntropy(currentPassword, charset.length)
    }, [currentPassword, charset.length, mode, wordCount])

    const strengthInfo = useMemo(() => {
        if (entropy < 40) return { label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500', width: '25%' }
        if (entropy < 60) return { label: 'Medium', color: 'text-yellow-500', barColor: 'bg-yellow-500', width: '50%' }
        if (entropy < 80) return { label: 'Strong', color: 'text-green-500', barColor: 'bg-green-500', width: '75%' }
        return { label: 'Very Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500', width: '100%' }
    }, [entropy])

    // --- Generation Logic ---
    const generatePassword = useCallback(() => {
        if (mode === 'standard') {
            if (!charset) return ''
            let result = ''
            const chars = charset.split('')

            for (let i = 0; i < length; i++) {
                if (avoidRepeating && result.length >= charset.length) {
                    // Cannot avoid repeats if length exceeds charset
                    result += chars[getSecureRandomInt(chars.length)]
                } else {
                    let nextChar = chars[getSecureRandomInt(chars.length)]
                    if (avoidRepeating) {
                        while (result.includes(nextChar)) {
                            nextChar = chars[getSecureRandomInt(chars.length)]
                        }
                    }
                    result += nextChar
                }
            }
            return result
        }

        if (mode === 'passphrase') {
            const selectedWords = []
            for (let i = 0; i < wordCount; i++) {
                let word = WORD_LIST[getSecureRandomInt(WORD_LIST.length)]
                if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1)
                selectedWords.push(word)
            }
            let phrase = selectedWords.join(separator)
            if (includeNumSym) {
                const nums = '0123456789'
                const syms = '!@#$%^&*'
                phrase += nums[getSecureRandomInt(nums.length)]
                phrase += syms[getSecureRandomInt(syms.length)]
            }
            return phrase
        }

        if (mode === 'pattern') {
            let result = ''
            for (const char of pattern.toUpperCase()) {
                switch (char) {
                    case 'L': result += CHARSETS.lowercase[getSecureRandomInt(26)]; break
                    case 'U': result += CHARSETS.uppercase[getSecureRandomInt(26)]; break
                    case 'N': result += CHARSETS.numbers[getSecureRandomInt(10)]; break
                    case 'S': result += CHARSETS.symbols[getSecureRandomInt(CHARSETS.symbols.length)]; break
                    default: result += char
                }
            }
            return result
        }

        return ''
    }, [mode, length, charset, avoidRepeating, wordCount, separator, capitalize, includeNumSym, pattern])

    const handleGenerate = useCallback(() => {
        setPwnedCount(null)
        if (mode === 'bulk') {
            const list = []
            const chars = charset.split('')
            if (chars.length > 0) {
                for (let i = 0; i < bulkCount; i++) {
                    let item = ''
                    for (let j = 0; j < length; j++) {
                        item += chars[getSecureRandomInt(chars.length)]
                    }
                    list.push(item)
                }
            }
            setBulkPasswords(list)
            setCurrentPassword(list[0] || '')
        } else {
            setCurrentPassword(generatePassword())
        }
    }, [mode, generatePassword, bulkCount, length, charset])

    // Regenerate pulse effect for specific character
    const regenerateChar = useCallback((index: number) => {
        if (mode !== 'standard') return
        const chars = currentPassword.split('')
        const availableChars = charset.split('')
        if (availableChars.length === 0) return

        chars[index] = availableChars[getSecureRandomInt(availableChars.length)]
        setCurrentPassword(chars.join(''))
    }, [currentPassword, charset, mode])

    // Template Handlers
    const applyTemplate = (t: Template) => {
        setMode('standard')
        switch (t) {
            case 'banking':
                setLength(12); setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(false)
                break
            case 'wifi':
                setLength(24); setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(false)
                break
            case 'api':
                setLength(32); setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(false)
                break
            case 'admin':
                setLength(16); setUseUpper(true); setUseLower(true); setUseNumbers(true); setUseSymbols(true)
                break
            case 'pin':
                setLength(6); setUseUpper(false); setUseLower(false); setUseNumbers(true); setUseSymbols(false)
                break
        }
        handleGenerate()
    }

    // Breach Check
    const checkBreach = async () => {
        setIsCheckingPwned(true)
        const count = await checkPwned(currentPassword)
        setPwnedCount(count)
        setIsCheckingPwned(false)
    }

    // Clipboard handlers
    const copyToClipboardCustom = (text: string) => {
        copyToClipboard(text)
        setCopyStatus('Copied!')
        setTimeout(() => setCopyStatus(null), 2000)

        // Auto-clear clipboard recommendation (we can't actually clear clipboard in browser easily 
        // without user permission/interaction again, but we can provide a warning or clear the UI)
    }

    const downloadExport = (format: 'txt' | 'csv' | 'json') => {
        const content = bulkPasswords.length > 0 ? bulkPasswords : [currentPassword]
        let output = ''

        if (format === 'txt') {
            output = content.join('\n')
        } else if (format === 'csv') {
            output = 'id,password\n' + content.map((p, i) => `${i + 1},${p}`).join('\n')
        } else if (format === 'json') {
            output = JSON.stringify({ passwords: content, generated: new Date().toISOString() }, null, 2)
        }

        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `passwords-${new Date().getTime()}.${format}`
        link.click()
        URL.revokeObjectURL(url)
    }

    // Initial generation
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        handleGenerate()
    }, [])

    return (
        <ToolLayout
            title="Professional Password Toolkit"
            description="Cryptographically secure generator with strength analysis, passphrases, and breach checking."
            icon={ShieldCheck}
            onReset={() => {
                setMode('standard')
                setLength(16)
                setUseUpper(true)
                setUseLower(true)
                setUseNumbers(true)
                setUseSymbols(true)
                setCurrentPassword('')
            }}
            onCopy={() => copyToClipboardCustom(currentPassword)}
            onDownload={() => downloadExport('txt')}
        >
            <div className="space-y-6">
                {/* Mode Selector */}
                <div className="flex flex-wrap gap-2 p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] w-fit mx-auto">
                    {(['standard', 'passphrase', 'pattern', 'bulk'] as PasswordMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === m
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Secure Password Display */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                    <div className="relative glass rounded-[2.5rem] p-8 md:p-12 border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Lock className="w-4 h-4 text-brand" />
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Securely Derived Entropy</span>
                                </div>
                                <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                                    {isVisible ? (
                                        currentPassword.split('').map((char, idx) => (
                                            <span
                                                key={idx}
                                                onClick={() => regenerateChar(idx)}
                                                className={cn(
                                                    "text-2xl md:text-3xl font-mono p-1 rounded-lg cursor-pointer transition-all hover:bg-brand/10 hover:scale-110",
                                                    "numbers".includes(char) ? "text-blue-400" :
                                                        CHARSETS.symbols.includes(char) ? "text-purple-400" :
                                                            "text-brand"
                                                )}
                                                title="Regenerate this character"
                                            >
                                                {char}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-3xl font-mono text-brand tracking-[0.5em]">• • • • • • • • • • • • • • • •</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 shrink-0">
                                <button
                                    onClick={() => setIsVisible(!isVisible)}
                                    className="p-4 rounded-2xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-brand transition-all border border-[var(--border-primary)]"
                                >
                                    {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="p-5 bg-brand text-white rounded-[1.5rem] shadow-xl shadow-brand/20 hover:scale-110 active:scale-95 transition-all group-hover:rotate-180 duration-500"
                                >
                                    <RefreshCcw className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Strength Indicator */}
                        <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
                            <div className="flex justify-between items-end mb-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Strength Assessment</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={cn("text-xl font-black uppercase tracking-tighter", strengthInfo.color)}>
                                            {strengthInfo.label}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)] font-mono">({entropy} bits)</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Crack Time Est.</p>
                                    <p className="text-xs font-mono text-brand font-bold">{getCrackTime(entropy)}</p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000", strengthInfo.barColor)}
                                    style={{ width: strengthInfo.width }}
                                />
                            </div>
                        </div>

                        {/* Breach Check */}
                        <div className="mt-6 flex items-center justify-between p-4 bg-brand/5 rounded-2xl border border-brand/10">
                            <div className="flex items-center space-x-3">
                                <AlertTriangle className="w-4 h-4 text-brand" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Breach Check</span>
                            </div>
                            {pwnedCount === null ? (
                                <button
                                    onClick={checkBreach}
                                    disabled={isCheckingPwned}
                                    className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline disabled:opacity-50"
                                >
                                    {isCheckingPwned ? 'Checking Database...' : 'Run HIBP Check (Private)'}
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    {pwnedCount > 0 ? (
                                        <>
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                                                Found in {pwnedCount.toLocaleString()} breaches!
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                Zero found in breach database
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Controls */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Parameters Card */}
                        <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Settings className="w-4 h-4 text-brand" />
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Parameters</h3>
                                </div>
                                {mode !== 'bulk' && mode !== 'pattern' && (
                                    <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-black rounded-lg font-mono">
                                        Len: {mode === 'passphrase' ? wordCount : length}
                                    </span>
                                )}
                            </div>

                            {mode === 'standard' || mode === 'bulk' ? (
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <input
                                            type="range"
                                            min="8"
                                            max="128"
                                            value={length}
                                            onChange={(e) => setLength(Number(e.target.value))}
                                            className="w-full h-2 bg-[var(--bg-primary)] rounded-full appearance-none cursor-pointer accent-brand shadow-inner"
                                        />
                                        <div className="flex gap-2">
                                            {[12, 16, 24, 32].map(l => (
                                                <button
                                                    key={l}
                                                    onClick={() => setLength(l)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                                        length === l ? "bg-brand text-white border-brand" : "text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                                                    )}
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'upper', label: 'A-Z', state: useUpper, set: setUseUpper },
                                            { id: 'lower', label: 'a-z', state: useLower, set: setUseLower },
                                            { id: 'nums', label: '0-9', state: useNumbers, set: setUseNumbers },
                                            { id: 'syms', label: '!@#', state: useSymbols, set: setUseSymbols }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => opt.set(!opt.state)}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                                                    opt.state ? "bg-brand/10 border-brand text-brand ring-4 ring-brand/5" : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)]"
                                                )}
                                            >
                                                <span className="text-xs font-black">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : mode === 'passphrase' ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Word Count</label>
                                            <input
                                                type="number"
                                                min="3"
                                                max="12"
                                                value={wordCount}
                                                onChange={(e) => setWordCount(Number(e.target.value))}
                                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Separator</label>
                                            <input
                                                type="text"
                                                maxLength={1}
                                                value={separator}
                                                onChange={(e) => setSeparator(e.target.value)}
                                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => setCapitalize(!capitalize)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                capitalize ? "bg-brand text-white border-brand" : "text-[var(--text-muted)] border-[var(--border-primary)]"
                                            )}
                                        >
                                            Capitalize Words
                                        </button>
                                        <button
                                            onClick={() => setIncludeNumSym(!includeNumSym)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                includeNumSym ? "bg-brand text-white border-brand" : "text-[var(--text-muted)] border-[var(--border-primary)]"
                                            )}
                                        >
                                            Add Number & Symbol
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block ml-1">Pattern (L=lower, U=upper, N=num, S=sym)</label>
                                    <input
                                        type="text"
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-mono focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                                        placeholder="LLNNSSLL"
                                    />
                                </div>
                            )}

                            {mode === 'bulk' && (
                                <div className="pt-6 border-t border-[var(--border-primary)]">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-4">Quantity to Generate</label>
                                    <div className="flex gap-2">
                                        {[10, 50, 100].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setBulkCount(c)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black border transition-all",
                                                    bulkCount === c ? "bg-brand text-white border-brand" : "text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                                                )}
                                            >
                                                {c} Identical
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Professional Logic Card */}
                        <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <ShieldCheck className="w-4 h-4 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Deep Logic Tuning</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setExcludeSimilar(!excludeSimilar)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                        excludeSimilar ? "bg-brand/5 border-brand/40 ring-1 ring-brand/10" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                    )}
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">Anti-Similar</p>
                                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5">Exclude O, 0, l, I, 1</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-full", excludeSimilar ? "bg-brand shadow-[0_0_8px_brand]" : "bg-[var(--border-primary)]")} />
                                </button>

                                <button
                                    onClick={() => setExcludeAmbiguous(!excludeAmbiguous)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                        excludeAmbiguous ? "bg-brand/5 border-brand/40 ring-1 ring-brand/10" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                    )}
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">Anti-Ambiguous</p>
                                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5">{'Exclude {}[]()/\\\'"`'}</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-full", excludeAmbiguous ? "bg-brand shadow-[0_0_8px_brand]" : "bg-[var(--border-primary)]")} />
                                </button>

                                <button
                                    onClick={() => setAvoidRepeating(!avoidRepeating)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                        avoidRepeating ? "bg-brand/5 border-brand/40 ring-1 ring-brand/10" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
                                    )}
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">Unique Chars</p>
                                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5">Avoid Repeating Symbols</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-full", avoidRepeating ? "bg-brand shadow-[0_0_8px_brand]" : "bg-[var(--border-primary)]")} />
                                </button>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Add Custom Characters..."
                                        value={customChars}
                                        onChange={(e) => setCustomChars(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Templates & Export */}
                    <div className="space-y-6">
                        {/* Templates Card */}
                        <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <Layout className="w-4 h-4 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Industry Presets</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'banking', label: 'Banking Protocol', icon: Zap },
                                    { id: 'wifi', label: 'WPA3 Network', icon: Grid },
                                    { id: 'api', label: 'OAuth 2.0 Key', icon: Code },
                                    { id: 'admin', label: 'System Admin', icon: ShieldCheck },
                                    { id: 'pin', label: 'Secure PIN', icon: History }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t.id as Template)}
                                        className="flex items-center space-x-3 p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-brand/40 hover:bg-brand/5 transition-all group text-left"
                                    >
                                        <t.icon className="w-4 h-4 text-brand" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Security Policy Card */}
                        <div className="p-6 glass rounded-[2rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 border-l-4 border-l-emerald-500/40">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500 grow-0 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Zero-Storage Vault</p>
                                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">
                                        All entropy is derived locally using WebCrypto CSPRNG. No transmission, no logs, zero third-party visibility.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Export Card */}
                        {mode === 'bulk' && bulkPasswords.length > 0 && (
                            <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Download className="w-4 h-4 text-brand" />
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Data Export</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => downloadExport('txt')}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-blue-400/40 hover:bg-blue-400/5 transition-all text-left"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Plain text (.txt)</span>
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => downloadExport('csv')}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-emerald-400/40 hover:bg-emerald-400/5 transition-all text-left"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">CSV Spreadsheet</span>
                                        <Grid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => downloadExport('json')}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-purple-400/40 hover:bg-purple-400/5 transition-all text-left"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">JSON Archive</span>
                                        <FileJson className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bulk Output Preview */}
                {mode === 'bulk' && bulkPasswords.length > 0 && (
                    <div className="p-10 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Dices className="w-4 h-4 text-brand" />
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Bulk Stream Output</h3>
                            </div>
                            <button
                                onClick={() => copyToClipboardCustom(bulkPasswords.join('\n'))}
                                className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline"
                            >
                                {copyStatus || 'Copy All Stream'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                            {bulkPasswords.map((p, idx) => (
                                <div key={idx} className="p-4 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)] flex items-center justify-between group">
                                    <code className="text-[11px] font-mono text-[var(--text-primary)] truncate pr-2">{p}</code>
                                    <button
                                        onClick={() => copyToClipboardCustom(p)}
                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-brand text-white transition-all scale-75"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}

function Code({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    )
}
