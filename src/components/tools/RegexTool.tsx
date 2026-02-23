import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { SearchCode, AlertCircle, Copy, Check, Info } from 'lucide-react'
import { cn, copyToClipboard } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

type Flag = 'g' | 'i' | 'm' | 's' | 'u' | 'y'
type Mode = 'test' | 'replace'
type Language = 'javascript' | 'python' | 'java' | 'pcre'

interface MatchResult {
  match: string
  index: number
  groups: { [key: string]: string | undefined }
  line: number
  lineStart: number
  lineEnd: number
}

const REGEX_PRESETS = [
  {
    name: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: 'Matches most common email formats',
    example: 'user@example.com'
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: 'Matches HTTP/HTTPS URLs',
    example: 'https://example.com/page?param=value'
  },
  {
    name: 'Phone Number',
    pattern: '\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}',
    description: 'Matches various international phone number formats',
    example: '+1 (555) 123-4567'
  },
  {
    name: 'IPv4 Address',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    description: 'Matches IPv4 addresses',
    example: '192.168.1.1'
  },
  {
    name: 'Password Strength',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    description: 'Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char',
    example: 'Password123!'
  },
  {
    name: 'Credit Card',
    pattern: '\\b(?:\\d{4}[- ]?){3}\\d{4}\\b',
    description: 'Matches most credit card number formats',
    example: '4111-1111-1111-1111'
  }
]

const LANGUAGE_FEATURES = {
  javascript: [
    'Lookahead/Lookbehind: (?=), (?!), (?<=), (?<!)',
    'Unicode properties: \\p{...}, \\P{...} (with u flag)',
    'Named capture groups: (?<name>...)',
    'Dotall mode: s flag',
    'Unicode mode: u flag',
    'Sticky matching: y flag'
  ],
  python: [
    'Lookahead/Lookbehind: (?=), (?!), (?<=), (?<!)',
    'Named capture groups: (?P<name>...)',
    'Inline flags: (?i), (?m), etc.',
    'Conditional patterns: (?(id/name)yes|no)',
    'Atomic grouping: (?>...)',
    'Possessive quantifiers: *+, ?+, ++, {n,m}+'
  ],
  java: [
    'Lookahead/Lookbehind: (?=), (?!), (?<=), (?<!)',
    'Named capture groups: (?<name>...)',
    'Possessive quantifiers: *+, ?+, ++, {n,m}+',
    'Atomic grouping: (?>...)',
    'Unicode support',
    'Canonical equivalence: \\u00E9 matches é'
  ],
  pcre: [
    'Lookahead/Lookbehind: (?=), (?!), (?<=), (?<!)',
    'Named capture groups: (?<name>...) or (?\'name\'...)',
    'Atomic grouping: (?>...)',
    'Possessive quantifiers: *+, ?+, ++, {n,m}+',
    'Backreferences: \\1, \\k<name>',
    'Subroutines: (?1), (?&name)'
  ]
}

const FLAGS: { value: Flag; description: string }[] = [
  { value: 'g', description: 'Global - Find all matches' },
  { value: 'i', description: 'Case-insensitive' },
  { value: 'm', description: 'Multiline - ^ and $ match start/end of line' },
  { value: 's', description: 'Dotall - . matches newlines' },
  { value: 'u', description: 'Unicode - Full unicode support' },
  { value: 'y', description: 'Sticky - Matches only at lastIndex' }
]

// Helper function to find all matches with line numbers
function findMatches(text: string, regex: RegExp): MatchResult[] {
  const matches: MatchResult[] = []
  const lines = text.split('\n')
  let globalIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let match
    const lineStart = globalIndex
    const lineEnd = globalIndex + line.length

    // Reset lastIndex for each line when not using global flag
    if (!regex.global) {
      regex.lastIndex = 0
    }

    while ((match = regex.exec(line)) !== null) {
      const matchStart = match.index

      // For non-global regex, break after first match
      if (!regex.global) {
        matches.push({
          match: match[0],
          index: lineStart + matchStart,
          groups: match.groups || {},
          line: i,
          lineStart,
          lineEnd
        })
        break
      }

      // For global regex, collect all matches
      matches.push({
        match: match[0],
        index: lineStart + matchStart,
        groups: match.groups || {},
        line: i,
        lineStart,
        lineEnd
      })

      // Prevent infinite loops for zero-length matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }

    globalIndex += line.length + 1 // +1 for the newline character
  }

  return matches
}

// Function to explain regex patterns
function explainRegex(pattern: string): string[] {
  const explanations: string[] = []
  const tokens = {
    '^': 'Start of line/string',
    '$': 'End of line/string',
    '.': 'Any character except newline',
    '\\d': 'Digit (0-9)',
    '\\D': 'Not a digit',
    '\\w': 'Word character (a-z, A-Z, 0-9, _)',
    '\\W': 'Not a word character',
    '\\s': 'Whitespace character',
    '\\S': 'Not a whitespace character',
    '\\b': 'Word boundary',
    '\\B': 'Not a word boundary',
    '\\n': 'Newline',
    '\\t': 'Tab',
    '\\r': 'Carriage return',
    '\\f': 'Form feed',
    '\\v': 'Vertical tab',
    '[...]': 'Character class - match any one of the enclosed characters',
    '[^...]': 'Negated character class - match any character not enclosed',
    '|': 'OR - match either the pattern before or after',
    '?': '0 or 1 of the preceding element',
    '*': '0 or more of the preceding element',
    '+': '1 or more of the preceding element',
    '{n}': 'Exactly n of the preceding element',
    '{n,}': 'n or more of the preceding element',
    '{n,m}': 'Between n and m of the preceding element',
    '(...)': 'Capturing group',
    '(?:...)': 'Non-capturing group',
    '(?<name>...)': 'Named capturing group',
    '(?=...)': 'Positive lookahead',
    '(?!...)': 'Negative lookahead',
    '(?<=...)': 'Positive lookbehind',
    '(?<!...)': 'Negative lookbehind',
    '\\1, \\2, etc.': 'Backreference to capturing group'
  }

  // Add explanations for each token found in the pattern
  Object.entries(tokens).forEach(([token, explanation]) => {
    if (pattern.includes(token)) {
      explanations.push(`${token}: ${explanation}`)
    }
  })

  if (explanations.length === 0) {
    explanations.push('No specific regex tokens found in the pattern.')
  }

  return explanations
}

// Function to check for potential performance issues
function checkForPerformanceIssues(pattern: string): string[] {
  const warnings: string[] = []

  // Check for nested quantifiers
  const nestedQuantifiers = /(?:[+*?]|\{\d*,?\d*\})\s*[+*?]/;
  if (nestedQuantifiers.test(pattern)) {
    warnings.push('Warning: Nested quantifiers detected which may cause performance issues.')
  }

  // Check for exponential backtracking patterns
  const backtrackingPatterns = [
    /(a+)*$/,
    /(a|a)*$/,
    /(a*)*$/,
    /(a+)+$/,
    /(a*?)*$/
  ]

  if (backtrackingPatterns.some(p => p.test(pattern))) {
    warnings.push('Warning: Pattern may cause catastrophic backtracking on certain inputs.')
  }

  // Check for very complex patterns
  if (pattern.length > 200) {
    warnings.push('Warning: Very long pattern detected. Consider breaking it into smaller parts.')
  }

  return warnings
}
export function RegexTool() {
  const [pattern, setPattern] = usePersistentState('regex_pattern', '');
  const [activeFlags, setActiveFlags] = usePersistentState<Flag[]>('regex_flags', ['g']);
  const [testString, setTestString] = usePersistentState('regex_test_string', '');
  const [replacement, setReplacement] = usePersistentState('regex_replacement', '');
  const [mode, setMode] = usePersistentState<Mode>('regex_mode', 'test');
  const [language, setLanguage] = usePersistentState<Language>('regex_language', 'javascript');
  const [showExplanation, setShowExplanation] = usePersistentState('regex_show_explanation', false);
  const [copied, setCopied] = useState(false);

  // Process regex and find matches
  const { regex, matches, error, performanceWarnings } = useMemo(() => {
    const result = {
      regex: null as RegExp | null,
      matches: [] as MatchResult[],
      error: null as string | null,
      performanceWarnings: [] as string[]
    };

    if (!pattern) return result;

    try {
      const flagsStr = activeFlags.join('');
      result.regex = new RegExp(pattern, flagsStr);
      result.matches = findMatches(testString, result.regex);
      
      // Check for performance issues
      result.performanceWarnings = checkForPerformanceIssues(pattern);
    } catch (e: any) {
      result.error = e.message;
    }

    return result;
  }, [pattern, activeFlags, testString]);

  // Generate replaced text if in replace mode
  const replacedText = useMemo(() => {
    if (mode !== 'replace' || !regex || error) return '';
    return testString.replace(regex, replacement);
  }, [mode, regex, testString, replacement, error]);

  // Toggle flag
  const toggleFlag = (flag: Flag) => {
    const newFlags = activeFlags.includes(flag)
      ? activeFlags.filter((f: Flag) => f !== flag)
      : [...activeFlags, flag].sort();
    setActiveFlags(newFlags);
  };

  // Load a preset
  const loadPreset = (preset: typeof REGEX_PRESETS[number]) => {
    setPattern(preset.pattern);
    setTestString(preset.example);
  };

  // Copy results to clipboard
  const copyResults = () => {
    const text = mode === 'test'
      ? matches.map(m => m.match).join('\n')
      : replacedText;
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    return (
    <ToolLayout
      title="Regex Tester"
      description="Test and debug regular expressions with live preview, explanation, and performance warnings"
      icon={SearchCode}
      onReset={() => {
        setPattern('');
        setTestString('');
        setReplacement('');
        setActiveFlags(['g']);
        setMode('test');
        setLanguage('javascript');
        setShowExplanation(false);
      }}
      onCopy={copyResults}
    >
      <div className="space-y-8">
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Presets</label>
          <div className="flex flex-wrap gap-2">
            {REGEX_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Regex Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Regular Expression</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">/</div>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className={cn(
                "w-full pl-8 pr-16 py-3 bg-muted/50 border rounded-lg font-mono text-sm focus:bg-background focus:ring-2 focus:ring-brand/50 transition-all",
                error && "border-red-500 focus:ring-red-500/50"
              )}
              placeholder="Enter your regex pattern..."
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="text-muted-foreground font-mono">/</div>
              <div className="text-xs text-muted-foreground font-mono">
                {activeFlags.join('')}
              </div>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Flags</label>
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((flag) => (
              <button
                key={flag.value}
                onClick={() => toggleFlag(flag.value)}
                className={cn(
                  "px-3 py-1 text-xs border rounded-md transition-all font-mono",
                  activeFlags.includes(flag.value)
                    ? "bg-brand text-brand-foreground border-brand"
                    : "bg-background hover:bg-muted border-border"
                )}
                title={flag.description}
              >
                {flag.value}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('test')}
              className={cn(
                "px-4 py-2 text-sm border rounded-md transition-all",
                mode === 'test' ? "bg-brand text-brand-foreground border-brand" : "bg-background hover:bg-muted border-border"
              )}
            >
              Test
            </button>
            <button
              onClick={() => setMode('replace')}
              className={cn(
                "px-4 py-2 text-sm border rounded-md transition-all",
                mode === 'replace' ? "bg-brand text-brand-foreground border-brand" : "bg-background hover:bg-muted border-border"
              )}
            >
              Replace
            </button>
          </div>
        </div>

        {/* Test String */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test String</label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            className="w-full h-32 p-3 bg-muted/50 border rounded-lg font-mono text-sm focus:bg-background focus:ring-2 focus:ring-brand/50 transition-all resize-none"
            placeholder="Enter text to test your regex against..."
          />
        </div>

        {/* Replacement (only in replace mode) */}
        {mode === 'replace' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Replacement</label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border rounded-lg font-mono text-sm focus:bg-background focus:ring-2 focus:ring-brand/50 transition-all"
              placeholder="Enter replacement string..."
            />
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {mode === 'test' ? 'Matches' : 'Replaced Text'}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={copyResults}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                <Info className="w-3 h-3" />
                Explain
              </button>
            </div>
          </div>

          {/* Test Results */}
          {mode === 'test' && (
            <div className="space-y-2">
              {matches.length === 0 ? (
                <div className="text-muted-foreground text-sm">No matches found</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Found {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </div>
                  {matches.map((match, index) => (
                    <div key={index} className="bg-muted/50 p-2 rounded border font-mono text-sm">
                      <div className="text-brand font-medium">Match {index + 1}:</div>
                      <div className="text-foreground">{match.match}</div>
                      <div className="text-xs text-muted-foreground">
                        Line {match.line + 1}, Position {match.index}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Replace Results */}
          {mode === 'replace' && (
            <div className="bg-muted/50 p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
              {replacedText || 'No replacement performed'}
            </div>
          )}

          {/* Performance Warnings */}
          {performanceWarnings.length > 0 && (
            <div className="space-y-2">
              {performanceWarnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Regex Explanation */}
          {showExplanation && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Pattern Explanation</label>
              <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                {explainRegex(pattern).map((explanation, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono font-medium">{explanation.split(':')[0]}</span>: {explanation.split(':').slice(1).join(':')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language Features */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Language Features</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-xs bg-muted border rounded px-2 py-1"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="pcre">PCRE</option>
              </select>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border space-y-1">
              {LANGUAGE_FEATURES[language].map((feature, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
