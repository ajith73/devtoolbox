import { useMemo, useState, useRef } from 'react'
import { FileCode, Upload, Copy, CheckCircle, FileText, Zap, Eye, EyeOff, Hash, Binary, Globe, Filter } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

// Enhanced character analysis functions
function getUnicodeName(codePoint: number): string {
    const names: { [key: number]: string } = {
        // Control characters
        0x0000: 'NULL',
        0x0001: 'START OF HEADING',
        0x0002: 'START OF TEXT',
        0x0003: 'END OF TEXT',
        0x0004: 'END OF TRANSMISSION',
        0x0005: 'ENQUIRY',
        0x0006: 'ACKNOWLEDGE',
        0x0007: 'BELL',
        0x0008: 'BACKSPACE',
        0x0009: 'HORIZONTAL TAB',
        0x000A: 'LINE FEED',
        0x000B: 'VERTICAL TAB',
        0x000C: 'FORM FEED',
        0x000D: 'CARRIAGE RETURN',
        0x000E: 'SHIFT OUT',
        0x000F: 'SHIFT IN',
        0x0010: 'DATA LINK ESCAPE',
        0x0011: 'DEVICE CONTROL 1',
        0x0012: 'DEVICE CONTROL 2',
        0x0013: 'DEVICE CONTROL 3',
        0x0014: 'DEVICE CONTROL 4',
        0x0015: 'NEGATIVE ACKNOWLEDGE',
        0x0016: 'SYNCHRONOUS IDLE',
        0x0017: 'END OF TRANSMISSION BLOCK',
        0x0018: 'CANCEL',
        0x0019: 'END OF MEDIUM',
        0x001A: 'SUBSTITUTE',
        0x001B: 'ESCAPE',
        0x001C: 'FILE SEPARATOR',
        0x001D: 'GROUP SEPARATOR',
        0x001E: 'RECORD SEPARATOR',
        0x001F: 'UNIT SEPARATOR',
        0x0020: 'SPACE',
        0x0021: 'EXCLAMATION MARK',
        0x0022: 'QUOTATION MARK',
        0x0023: 'NUMBER SIGN',
        0x0024: 'DOLLAR SIGN',
        0x0025: 'PERCENT SIGN',
        0x0026: 'AMPERSAND',
        0x0027: 'APOSTROPHE',
        0x0028: 'LEFT PARENTHESIS',
        0x0029: 'RIGHT PARENTHESIS',
        0x002A: 'ASTERISK',
        0x002B: 'PLUS SIGN',
        0x002C: 'COMMA',
        0x002D: 'HYPHEN-MINUS',
        0x002E: 'FULL STOP',
        0x002F: 'SOLIDUS',
        0x0030: 'DIGIT ZERO',
        0x0031: 'DIGIT ONE',
        0x0032: 'DIGIT TWO',
        0x0033: 'DIGIT THREE',
        0x0034: 'DIGIT FOUR',
        0x0035: 'DIGIT FIVE',
        0x0036: 'DIGIT SIX',
        0x0037: 'DIGIT SEVEN',
0x0038: 'DIGIT EIGHT',
        0x0039: 'DIGIT NINE',
        0x003A: 'COLON',
        0x003B: 'SEMICOLON',
        0x003C: 'LESS-THAN SIGN',
        0x003D: 'EQUALS SIGN',
        0x003E: 'GREATER-THAN SIGN',
        0x003F: 'QUESTION MARK',
        0x0040: 'COMMERCIAL AT',
        0x0041: 'LATIN CAPITAL LETTER A',
        0x0042: 'LATIN CAPITAL LETTER B',
        0x0043: 'LATIN CAPITAL LETTER C',
        0x0044: 'LATIN CAPITAL LETTER D',
        0x0045: 'LATIN CAPITAL LETTER E',
        0x0046: 'LATIN CAPITAL LETTER F',
        0x0047: 'LATIN CAPITAL LETTER G',
        0x0048: 'LATIN CAPITAL LETTER H',
        0x0049: 'LATIN CAPITAL LETTER I',
        0x004A: 'LATIN CAPITAL LETTER J',
        0x004B: 'LATIN CAPITAL LETTER K',
        0x004C: 'LATIN CAPITAL LETTER L',
        0x004D: 'LATIN CAPITAL LETTER M',
        0x004E: 'LATIN CAPITAL LETTER N',
        0x004F: 'LATIN CAPITAL LETTER O',
        0x0050: 'LATIN CAPITAL LETTER P',
        0x0051: 'LATIN CAPITAL LETTER Q',
        0x0052: 'LATIN CAPITAL LETTER R',
        0x0053: 'LATIN CAPITAL LETTER S',
        0x0054: 'LATIN CAPITAL LETTER T',
        0x0055: 'LATIN CAPITAL LETTER U',
        0x0056: 'LATIN CAPITAL LETTER V',
        0x0057: 'LATIN CAPITAL LETTER W',
        0x0058: 'LATIN CAPITAL LETTER X',
        0x0059: 'LATIN CAPITAL LETTER Y',
        0x005A: 'LATIN CAPITAL LETTER Z',
        0x005B: 'LEFT SQUARE BRACKET',
        0x005C: 'REVERSE SOLIDUS',
        0x005D: 'RIGHT SQUARE BRACKET',
        0x005E: 'CIRCUMFLEX ACCENT',
        0x005F: 'LOW LINE',
        0x0060: 'GRAVE ACCENT',
        0x0061: 'LATIN SMALL LETTER A',
        0x0062: 'LATIN SMALL LETTER B',
        0x0063: 'LATIN SMALL LETTER C',
        0x0064: 'LATIN SMALL LETTER D',
        0x0065: 'LATIN SMALL LETTER E',
        0x0066: 'LATIN SMALL LETTER F',
        0x0067: 'LATIN SMALL LETTER G',
        0x0068: 'LATIN SMALL LETTER H',
        0x0069: 'LATIN SMALL LETTER I',
        0x006A: 'LATIN SMALL LETTER J',
        0x006B: 'LATIN SMALL LETTER K',
        0x006C: 'LATIN SMALL LETTER L',
        0x006D: 'LATIN SMALL LETTER M',
        0x006E: 'LATIN SMALL LETTER N',
        0x006F: 'LATIN SMALL LETTER O',
        0x0070: 'LATIN SMALL LETTER P',
        0x0071: 'LATIN SMALL LETTER Q',
        0x0072: 'LATIN SMALL LETTER R',
        0x0073: 'LATIN SMALL LETTER S',
        0x0074: 'LATIN SMALL LETTER T',
        0x0075: 'LATIN SMALL LETTER U',
        0x0076: 'LATIN SMALL LETTER V',
        0x0077: 'LATIN SMALL LETTER W',
        0x0078: 'LATIN SMALL LETTER X',
        0x0079: 'LATIN SMALL LETTER Y',
        0x007A: 'LATIN SMALL LETTER Z',
        0x007B: 'LEFT CURLY BRACKET',
        0x007C: 'VERTICAL LINE',
        0x007D: 'RIGHT CURLY BRACKET',
        0x007E: 'TILDE',
        0x007F: 'DELETE',
        // Common Unicode characters
        0x00A0: 'NO-BREAK SPACE',
        0x00A9: 'COPYRIGHT SIGN',
        0x00AE: 'REGISTERED SIGN',
        0x2122: 'TRADE MARK SIGN',
        0x20AC: 'EURO SIGN',
        0x201C: 'LEFT DOUBLE QUOTATION MARK',
        0x201D: 'RIGHT DOUBLE QUOTATION MARK',
        0x2018: 'LEFT SINGLE QUOTATION MARK',
        0x2019: 'RIGHT SINGLE QUOTATION MARK',
        0x2026: 'HORIZONTAL ELLIPSIS',
        0x2013: 'EN DASH',
        0x2014: 'EM DASH',
        // Emoji
        0x1F600: 'GRINNING FACE',
        0x1F44D: 'THUMBS UP SIGN',
        0x2764: 'HEAVY BLACK HEART',
        0x1F30D: 'EARTH GLOBE EURO-AFRICA',
        0x1F680: 'ROCKET'
    }
    return names[codePoint] || 'UNNAMED'
}

function getCategory(codePoint: number): string {
    if (codePoint <= 0x7F) return 'ASCII'
    if (codePoint <= 0xFF) return 'Latin-1'
    if (codePoint <= 0x17F) return 'Extended Latin'
    if (codePoint <= 0x24F) return 'IPA Extensions'
    if (codePoint <= 0x2AF) return 'Spacing Modifier Letters'
    if (codePoint <= 0x36F) return 'Combining Diacritical Marks'
    if (codePoint <= 0x3FF) return 'Greek and Coptic'
    if (codePoint <= 0x4FF) return 'Cyrillic'
    if (codePoint <= 0x52F) return 'Armenian'
    if (codePoint <= 0x58F) return 'Hebrew'
    if (codePoint <= 0x5FF) return 'Arabic'
    if (codePoint <= 0x6FF) return 'Syriac'
    if (codePoint <= 0x7FF) return 'Thaana'
    if (codePoint <= 0x8FF) return 'Nko'
    if (codePoint <= 0x97F) return 'Devanagari'
    if (codePoint <= 0x9FF) return 'Bengali'
    if (codePoint <= 0xA7F) return 'Gurmukhi'
    if (codePoint <= 0xAF) return 'Gujarati'
    if (codePoint <= 0xB7F) return 'Oriya'
    if (codePoint <= 0xBFF) return 'Tamil'
    if (codePoint <= 0xC7F) return 'Telugu'
    if (codePoint <= 0xCF) return 'Kannada'
    if (codePoint <= 0xD7F) return 'Malayalam'
    if (codePoint <= 0xDFF) return 'Sinhala'
    if (codePoint <= 0xE7F) return 'Thai'
    if (codePoint <= 0xEFF) return 'Lao'
    if (codePoint <= 0xF7F) return 'Tibetan'
    if (codePoint <= 0xFFF) return 'Myanmar'
    if (codePoint <= 0x109F) return 'Georgian'
    if (codePoint <= 0x10FF) return 'Hangul Jamo'
    if (codePoint <= 0x115F) return 'Ethiopic'
    if (codePoint <= 0x11FF) return 'Cherokee'
    if (codePoint <= 0x137F) return 'Unified Canadian Aboriginal Syllabics'
    if (codePoint <= 0x167F) return 'Ogham'
    if (codePoint <= 0x169F) return 'Runic'
    if (codePoint <= 0x16CF) return 'Tagalog'
    if (codePoint <= 0x171F) return 'Hanunoo'
    if (codePoint <= 0x173F) return 'Buhid'
    if (codePoint <= 0x17AF) return 'Tagbanwa'
    if (codePoint <= 0x17FF) return 'Khmer'
    if (codePoint <= 0x18AF) return 'Mongolian'
    if (codePoint <= 0x1AFF) return 'Unified Canadian Aboriginal Syllabics Extended'
    if (codePoint <= 0x1BFF) return 'Limbu'
    if (codePoint <= 0x1CFF) return 'Tai Le'
    if (codePoint <= 0x1DFF) return 'New Tai Lue'
    if (codePoint <= 0x1EFF) return 'Buginese'
    if (codePoint <= 0x1FFF) return 'Tai Tham'
    if (codePoint <= 0x206F) return 'Balinese'
    if (codePoint <= 0x20CF) return 'Sundanese'
    if (codePoint <= 0x214F) return 'Batak'
    if (codePoint <= 0x217F) return 'Lepcha'
    if (codePoint <= 0x21AF) return 'Ol Chiki'
    if (codePoint <= 0x21CF) return 'Carian'
    if (codePoint <= 0x221F) return 'Chakma'
    if (codePoint <= 0x224F) return 'Kayah Li'
    if (codePoint <= 0x22AF) return 'Rejang'
    if (codePoint <= 0x22BF) return 'Saurashtra'
    if (codePoint <= 0x23AF) return 'Cham'
    if (codePoint <= 0x23FF) return 'Ancient Symbols'
    if (codePoint <= 0x243F) return 'Phags-pa'
    if (codePoint <= 0x245F) return 'Soyombo'
    if (codePoint <= 0x246F) return 'Brahmi'
    if (codePoint <= 0x24FF) return 'Kaithi'
    if (codePoint <= 0x27BF) return 'Siddham'
    if (codePoint <= 0x27EF) return 'Modi'
    if (codePoint <= 0x27FF) return 'Mongolian'
    if (codePoint <= 0x28FF) return 'Takri'
    if (codePoint <= 0x2AFF) return 'Ancient Greek Musical Notation'
    if (codePoint <= 0x2BFF) return 'Counting Rod Numerals'
    if (codePoint <= 0x2D2F) return 'Kana Supplement'
    if (codePoint <= 0x2DFF) return 'Katakana Phonetic Extensions'
    if (codePoint <= 0x2F7F) return 'Byzantine Musical Notation'
    if (codePoint <= 0x2FFF) return 'Musical Symbols'
    if (codePoint <= 0x30FF) return 'CJK Compatibility'
    if (codePoint <= 0x31BF) return 'CJK Strokes'
    if (codePoint <= 0x31EF) return 'CJK Compatibility Ideographs'
    if (codePoint <= 0x9FFF) return 'CJK Unified Ideographs'
    if (codePoint <= 0xA4CF) return 'Hangul Syllables'
    if (codePoint <= 0xA4FF) return 'Hangul Jamo Extended-A'
    if (codePoint <= 0xA4FF) return 'Hangul Jamo Extended-B'
    if (codePoint <= 0xABFF) return 'High Surrogates'
    if (codePoint <= 0xBFFF) return 'Private Use Area'
    if (codePoint <= 0xBFFF) return 'CJK Compatibility Ideographs'
    if (codePoint <= 0xD7AF) return 'Private Use Area'
    if (codePoint <= 0xDFFF) return 'Low Surrogates'
    if (codePoint <= 0xF8FF) return 'Private Use Area'
    if (codePoint <= 0xFFFF) return 'Specials'
    if (codePoint <= 0x10FFFF) return 'Supplementary Private Use Area'
    return 'Unknown'
}

function getScript(codePoint: number): string {
    if (codePoint <= 0x007F) return 'Basic Latin'
    if (codePoint <= 0x00FF) return 'Latin-1 Supplement'
    if (codePoint <= 0x017F) return 'Latin Extended-A'
    if (codePoint <= 0x024F) return 'IPA Extensions'
    if (codePoint <= 0x02AF) return 'Spacing Modifier Letters'
    if (codePoint <= 0x036F) return 'Combining Diacritical Marks'
    if (codePoint <= 0x03FF) return 'Greek and Coptic'
    if (codePoint <= 0x04FF) return 'Cyrillic'
    if (codePoint <= 0x052F) return 'Cyrillic Supplement'
    if (codePoint <= 0x058F) return 'Armenian'
    if (codePoint <= 0x05FF) return 'Hebrew'
    if (codePoint <= 0x06FF) return 'Arabic'
    if (codePoint <= 0x074F) return 'Syriac'
    if (codePoint <= 0x07BF) return 'Arabic Supplement'
    if (codePoint <= 0x07FF) return 'Thaana'
    if (codePoint <= 0x08FF) return 'Nko'
    if (codePoint <= 0x097F) return 'Devanagari'
    if (codePoint <= 0x09FF) return 'Bengali'
    if (codePoint <= 0x0A7F) return 'Gurmukhi'
        
    // Add more script ranges as needed
    return 'Unknown'
}

function isControl(char: string): boolean {
    const cp = char.codePointAt(0) || 0
    return (cp >= 0x00 && cp <= 0x1F) || (cp >= 0x7F && cp <= 0x9F)
}

function isPrintable(char: string): boolean {
    const cp = char.codePointAt(0) || 0
    return cp >= 0x20 && cp <= 0x7E
}

function isWhitespace(char: string): boolean {
    return /\s/.test(char)
}

function getBinaryRepresentation(codePoint: number): string {
    return codePoint.toString(2).padStart(Math.ceil(Math.log2(codePoint + 1)), '0')
}

function getOctalRepresentation(codePoint: number): string {
    return codePoint.toString(8).padStart(Math.ceil(Math.log(codePoint + 1) / Math.log(8)), '0')
}

function analyzeText(text: string) {
    const chars = Array.from(text)
    const analysis = {
        total: chars.length,
        ascii: 0,
        unicode: 0,
        control: 0,
        printable: 0,
        whitespace: 0,
        categories: {} as Record<string, number>,
        scripts: {} as Record<string, number>,
        codePoints: chars.map(ch => ({
            char: ch,
            codePoint: ch.codePointAt(0) || 0,
            hex: (ch.codePointAt(0) || 0).toString(16).toUpperCase(),
            binary: getBinaryRepresentation(ch.codePointAt(0) || 0),
            octal: getOctalRepresentation(ch.codePointAt(0) || 0),
            category: getCategory(ch.codePointAt(0) || 0),
            script: getScript(ch.codePointAt(0) || 0),
            name: getUnicodeName(ch.codePointAt(0) || 0),
            isControl: isControl(ch),
            isPrintable: isPrintable(ch),
            isWhitespace: isWhitespace(ch)
        }))
    }
    
    chars.forEach(ch => {
        const cp = ch.codePointAt(0) || 0
        if (cp <= 0x7F) analysis.ascii++
        else analysis.unicode++
        if (isControl(ch)) analysis.control++
        if (isPrintable(ch)) analysis.printable++
        if (isWhitespace(ch)) analysis.whitespace++
        
        const category = getCategory(cp)
        const script = getScript(cp)
        analysis.categories[category] = (analysis.categories[category] || 0) + 1
        analysis.scripts[script] = (analysis.scripts[script] || 0) + 1
    })
    
    return analysis
}

export function AsciiCodepointTool() {
    const [input, setInput] = usePersistentState('ascii_codepoint_input', '')
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [showDetails, setShowDetails] = useState(true)
    const [showSyntaxHighlighting, setShowSyntaxHighlighting] = useState(true)
    const [copied, setCopied] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | null>(null)
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const analysis = useMemo(() => {
        const startTime = performance.now()
        const result = analyzeText(input)
        const endTime = performance.now()
        setProcessingTime(Math.round(endTime - startTime))
        return result
    }, [input])

    const filteredCodePoints = useMemo(() => {
        if (filterCategory === 'all') return analysis.codePoints
        return analysis.codePoints.filter(cp => cp.category === filterCategory)
    }, [analysis.codePoints, filterCategory])

    const enhancedExportText = useMemo(() => {
        if (filteredCodePoints.length === 0) return ''
        return filteredCodePoints
            .map((r, idx) => `${idx}\t${JSON.stringify(r.char)}\t${r.codePoint}\t0x${r.hex}\t${r.binary}\t${r.octal}\t${r.category}\t${r.name}`)
            .join('\n')
    }, [filteredCodePoints])

    const handleCopy = async () => {
        if (enhancedExportText) {
            await copyToClipboard(enhancedExportText)
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
        setInput('Hello World! 🌍 🚀 ©®™ 12345')
    }

    const getUniqueCategories = () => {
        const categories = new Set(analysis.codePoints.map(cp => cp.category))
        return Array.from(categories).sort()
    }

    return (
        <ToolLayout
            title="ASCII / Code Point Pro"
            description="Advanced character inspector with Unicode analysis, categories, and multiple representations."
            icon={FileCode}
            onReset={() => setInput('')}
            onCopy={enhancedExportText ? handleCopy : undefined}
            copyDisabled={!enhancedExportText}
        >
            <div className="space-y-6">
                {/* Header with Performance */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <FileCode className="w-5 h-5 text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-primary)]">Character Inspector</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Unicode code points, categories, and representations</p>
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
                        accept=".txt,.json,.csv"
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
                        disabled={!enhancedExportText}
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
                            <Binary className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showDetails 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <Hash className="w-3.5 h-3.5" />
                            <span>Details</span>
                        </button>
                        
                        <button
                            onClick={() => setShowSyntaxHighlighting(!showSyntaxHighlighting)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-xs font-bold",
                                showSyntaxHighlighting 
                                    ? "bg-brand/10 text-brand" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            {showSyntaxHighlighting ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>Syntax</span>
                        </button>
                    </div>
                </div>

                {/* Character Analysis */}
                {showAnalysis && (
                    <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-2 mb-4">
                            <Binary className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Character Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-black text-brand">{analysis.total}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-green-400">{analysis.ascii}</div>
                                <div className="text-xs text-[var(--text-secondary)]">ASCII</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-blue-400">{analysis.unicode}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Unicode</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{analysis.control}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Control</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{analysis.printable}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Printable</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-cyan-400">{analysis.whitespace}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Whitespace</div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="mt-4">
                            <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">Categories</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(analysis.categories).map(([category, count]) => (
                                    <div key={category} className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs">
                                        <span className="text-brand font-bold">{count}</span>
                                        <span className="text-[var(--text-secondary)] ml-1">{category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter */}
                <div className="p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Filter by Category</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                filterCategory === 'all' 
                                    ? "bg-brand text-white" 
                                    : "glass border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            All ({analysis.total})
                        </button>
                        {getUniqueCategories().map(category => (
                            <button
                                key={category}
                                onClick={() => setFilterCategory(category)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                    filterCategory === category 
                                        ? "bg-brand text-white" 
                                        : "glass border-[var(--border-primary)] hover:border-brand/40"
                                )}
                            >
                                {category} ({analysis.categories[category] || 0})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Input Text
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {input.length} chars
                            </div>
                        </div>
                        <textarea
                            className="h-[300px] font-mono text-sm resize-none focus:border-brand/40 bg-[var(--input-bg)] p-6 rounded-2xl border border-[var(--border-primary)] outline-none custom-scrollbar shadow-inner transition-all"
                            placeholder="Type or paste text to analyze..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                                Character Details
                            </label>
                            <div className="text-[10px] text-brand font-black uppercase tracking-widest">
                                {filteredCodePoints.length} shown
                            </div>
                        </div>
                        
                        <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                            <div className="p-6 overflow-auto custom-scrollbar max-h-[300px]">
                                {filteredCodePoints.length === 0 ? (
                                    <div className="text-[var(--text-muted)] opacity-30 italic text-sm p-2">No input yet...</div>
                                ) : (
                                    <table className="w-full text-xs font-mono text-[var(--text-primary)]">
                                        <thead className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] sticky top-0 bg-[var(--input-bg)]">
                                            <tr>
                                                <th className="text-left py-2 pr-2">#</th>
                                                <th className="text-left py-2 pr-2">Char</th>
                                                <th className="text-left py-2 pr-2">Dec</th>
                                                <th className="text-left py-2 pr-2">Hex</th>
                                                {showDetails && (
                                                    <>
                                                        <th className="text-left py-2 pr-2">Binary</th>
                                                        <th className="text-left py-2 pr-2">Octal</th>
                                                        <th className="text-left py-2 pr-2">Category</th>
                                                        <th className="text-left py-2">Name</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCodePoints.map((cp, idx) => (
                                                <tr key={idx} className="border-t border-[var(--border-primary)]/40 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                                                    <td className="py-2 pr-2 text-[var(--text-muted)]">{idx}</td>
                                                    <td className="py-2 pr-2">
                                                        {cp.char === ' ' ? <span className="text-[var(--text-muted)]">␠</span> : 
                                                         cp.char === '\n' ? <span className="text-[var(--text-muted)]">␤</span> :
                                                         cp.char === '\t' ? <span className="text-[var(--text-muted)]">␉</span> :
                                                         cp.char}
                                                    </td>
                                                    <td className="py-2 pr-2">{cp.codePoint}</td>
                                                    <td className="py-2 pr-2 text-brand">0x{cp.hex}</td>
                                                    {showDetails && (
                                                        <>
                                                            <td className="py-2 pr-2 text-blue-400 text-[10px]">{cp.binary}</td>
                                                            <td className="py-2 pr-2 text-purple-400 text-[10px]">{cp.octal}</td>
                                                            <td className="py-2 pr-2 text-orange-400">{cp.category}</td>
                                                            <td className="py-2 text-[10px] text-[var(--text-secondary)]">{cp.name}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Format Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Binary className="w-5 h-5 mx-auto mb-2 text-brand" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Binary</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Base-2 representation</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Hash className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Hexadecimal</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Base-16 representation</div>
                    </div>
                    <div className="p-3 glass rounded-xl border-[var(--border-primary)] text-center">
                        <Globe className="w-5 h-5 mx-auto mb-2 text-green-400" />
                        <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">Unicode</div>
                        <div className="text-[10px] text-[var(--text-muted)]">International characters</div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
