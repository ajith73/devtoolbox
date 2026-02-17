import { useMemo } from 'react'
import { FileEdit } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

const WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod',
    'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim',
    'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex',
    'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit', 'in', 'voluptate',
    'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
    'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim',
    'id', 'est', 'laborum'
]

function makeText(paragraphs: number, wordsPerParagraph: number) {
    const out: string[] = []
    let idx = 0

    for (let p = 0; p < paragraphs; p++) {
        const words: string[] = []
        for (let w = 0; w < wordsPerParagraph; w++) {
            words.push(WORDS[idx % WORDS.length])
            idx++
        }
        const first = words[0] ? words[0][0].toUpperCase() + words[0].slice(1) : ''
        words[0] = first
        out.push(words.join(' ') + '.')
    }

    return out.join('\n\n')
}

export function LoremIpsumTool() {
    const [paragraphs, setParagraphs] = usePersistentState<number>('lorem_paragraphs', 3)
    const [wordsPerParagraph, setWordsPerParagraph] = usePersistentState<number>('lorem_words_per_paragraph', 40)

    const text = useMemo(() => {
        const p = Math.max(1, Math.min(20, Number(paragraphs) || 1))
        const w = Math.max(5, Math.min(200, Number(wordsPerParagraph) || 40))
        return makeText(p, w)
    }, [paragraphs, wordsPerParagraph])

    return (
        <ToolLayout
            title="Lorem Ipsum"
            description="Generate placeholder text locally."
            icon={FileEdit}
            onReset={() => { setParagraphs(3); setWordsPerParagraph(40) }}
            onCopy={() => copyToClipboard(text)}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border-[var(--border-primary)] p-5 bg-[var(--bg-secondary)]/30">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Paragraphs</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={paragraphs}
                            onChange={(e) => setParagraphs(Number(e.target.value))}
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
                        />
                    </div>
                </div>

                <div className="glass rounded-[2.5rem] overflow-hidden border-[var(--border-primary)] bg-[var(--input-bg)] shadow-inner">
                    <pre className="p-8 text-[var(--text-primary)] font-mono text-xs overflow-auto custom-scrollbar whitespace-pre-wrap break-words max-h-[520px]">
                        {text}
                    </pre>
                </div>
            </div>
        </ToolLayout>
    )
}
