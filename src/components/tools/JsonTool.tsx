import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Braces, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'
import yaml from 'js-yaml'

function generateTSInterface(obj: any, name: string = 'Root'): string {
  const generate = (obj: any, name: string, interfaces: string[] = []): string => {
    if (typeof obj !== 'object' || obj === null) return getType(obj);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      const itemType = generate(obj[0], `${name}Item`, interfaces);
      return `${itemType}[]`;
    }
    const keys = Object.keys(obj);
    const props = keys.map(key => {
      const value = obj[key];
      const type = generate(value, `${name}_${key}`, interfaces);
      return `  ${key}: ${type};`;
    });
    const interfaceDef = `interface ${name} {\n${props.join('\n')}\n}`;
    interfaces.push(interfaceDef);
    return name;
  };

  const interfaces: string[] = [];
  generate(obj, name, interfaces);
  return interfaces.join('\n\n');
}

function getType(value: any): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'any';
}

function generateApiPreview(json: any, type: 'fetch' | 'axios' | 'curl'): string {
  const body = JSON.stringify(json, null, 2);
  switch (type) {
    case 'fetch':
      return `fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: \`${body}\`,
});`;
    case 'axios':
      return `axios.post('/api/endpoint', \`${body}\`);`;
    case 'curl':
      return `curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(json)}' \\
  /api/endpoint`;
    default:
      return '';
  }
}

function calculateStats(obj: any): {size: number, keys: number, depth: number, arrays: number} {
  let keys = 0;
  let depth = 0;
  let arrays = 0;
  const traverse = (o: any, d: number) => {
    depth = Math.max(depth, d);
    if (Array.isArray(o)) {
      arrays++;
      o.forEach(item => traverse(item, d + 1));
    } else if (typeof o === 'object' && o !== null) {
      keys += Object.keys(o).length;
      Object.values(o).forEach(val => traverse(val, d + 1));
    }
  };
  traverse(obj, 0);
  const size = new Blob([JSON.stringify(obj)]).size / 1024;
  return { size: Math.round(size * 100) / 100, keys, depth, arrays };
}

function highlightText(text: string, term: string): string {
  if (!term.trim()) return text;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function getLineColumn(text: string, position: number): {line: number, column: number} {
  const before = text.substring(0, position);
  const lines = before.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return {line, column};
}

function JsonTree({ data, path = 'root', expanded, toggleExpanded }: { data: any, path: string, expanded: Set<string>, toggleExpanded: (path: string) => void }) {
  if (typeof data !== 'object' || data === null) {
    return <span className="text-green-500 font-mono">{JSON.stringify(data)}</span>;
  }

  const isExpanded = expanded.has(path);
  const isArray = Array.isArray(data);
  const keys = isArray ? data.map((_, i) => i.toString()) : Object.keys(data);

  return (
    <div className="ml-4">
      <div onClick={() => toggleExpanded(path)} className="cursor-pointer flex items-center hover:bg-[var(--bg-primary)] p-1 rounded">
        <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
        <span className="text-brand font-mono text-sm">
          {isArray ? `[${keys.length}]` : `{${keys.length}}`}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-4">
          {keys.map(key => (
            <div key={key} className="mb-1">
              <span className="text-blue-500 font-mono text-sm">{key}: </span>
              <JsonTree data={data[key]} path={`${path}.${key}`} expanded={expanded} toggleExpanded={toggleExpanded} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function JsonTool() {
    const [input, setInput] = usePersistentState('json_input', '')
    const [output, setOutput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'pretty' | 'minify' | 'ts-interface' | 'api-preview' | 'yaml' | 'tree'>('pretty')
    const [apiType, setApiType] = useState<'fetch' | 'axios' | 'curl'>('fetch')
    const [parsedJson, setParsedJson] = useState<any>(null)
    const [stats, setStats] = useState<{size: number, keys: number, depth: number, arrays: number} | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const highlighted = output ? highlightText(output, searchTerm) : '<span style="color: var(--text-muted); opacity: 0.3; font-style: italic; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px;">Waiting for input...</span>';
    const content = searchTerm ? highlighted : (output || '<span style="color: var(--text-muted); opacity: 0.3; font-style: italic; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px;">Waiting for input...</span>');

    const formatJson = (val: string, currentMode: 'pretty' | 'minify' | 'ts-interface' | 'api-preview' | 'yaml' | 'tree') => {
        if (!val.trim()) {
            setOutput('')
            setError(null)
            setParsedJson(null)
            setStats(null)
            return
        }
        try {
            const parsed = JSON.parse(val)
            setParsedJson(parsed)
            setStats(calculateStats(parsed))
            let formatted: string;
            if (currentMode === 'ts-interface') {
                formatted = generateTSInterface(parsed, 'GeneratedInterface')
            } else if (currentMode === 'api-preview') {
                formatted = generateApiPreview(parsed, apiType)
            } else if (currentMode === 'yaml') {
                formatted = yaml.dump(parsed)
            } else if (currentMode === 'tree') {
                formatted = '' // Tree mode doesn't use output text
            } else {
                formatted = currentMode === 'pretty'
                    ? JSON.stringify(parsed, null, 2)
                    : JSON.stringify(parsed)
            }
            setOutput(formatted)
            setError(null)
        } catch (e: any) {
            setError(e.message)
            setOutput('')
            setParsedJson(null)
            setStats(null)
        }
    }

    const toggleExpanded = (path: string) => {
        const newExpanded = new Set(expanded)
        if (newExpanded.has(path)) {
            newExpanded.delete(path)
        } else {
            newExpanded.add(path)
        }
        setExpanded(newExpanded)
    }

    useEffect(() => {
        formatJson(input, mode)
    }, [input, mode, apiType])

    const handleDownload = () => {
        const blob = new Blob([output], { type: mode === 'ts-interface' || mode === 'yaml' ? 'text/plain' : 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = mode === 'ts-interface' ? 'generated-interface.ts' : mode === 'yaml' ? 'output.yaml' : `devbox-${mode}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="JSON Formatter"
            description="Validate, format, and minify your JSON data."
            icon={Braces}
            onReset={() => { setInput(''); setOutput(''); setError(null); }}
            onCopy={output ? () => copyToClipboard(output) : undefined}
            onDownload={output && mode !== 'api-preview' && mode !== 'tree' ? handleDownload : undefined}
        >
            <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[var(--bg-secondary)]/50 p-1 rounded-xl flex gap-1 border border-[var(--border-primary)] shadow-sm">
                        <button
                            onClick={() => setMode('pretty')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'pretty'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            Pretty Print
                        </button>
                        <button
                            onClick={() => setMode('minify')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'minify'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            Minify
                        </button>
                        <button
                            onClick={() => setMode('ts-interface')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'ts-interface'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            TS Interface
                        </button>
                        <button
                            onClick={() => setMode('api-preview')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'api-preview'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            API Preview
                        </button>
                        <button
                            onClick={() => setMode('yaml')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'yaml'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            YAML
                        </button>
                        <button
                            onClick={() => setMode('tree')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                mode === 'tree'
                                    ? "bg-brand text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                            )}
                        >
                            Tree View
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px] h-[600px]">
                    <div className="flex flex-col space-y-4 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Raw JSON Stream</label>
                        <textarea
                            className="flex-1 font-mono text-sm resize-none custom-scrollbar p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
                            placeholder='{ "action": "parse", "status": "pending" }'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
                                {mode === 'pretty' ? 'Formatted Output' : mode === 'minify' ? 'Minified Output' : mode === 'ts-interface' ? 'TypeScript Interface' : mode === 'api-preview' ? 'API Request Preview' : mode === 'yaml' ? 'YAML Output' : 'Tree View'}
                            </label>
                            {input && (
                                <div className={cn(
                                    "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm",
                                    error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'
                                )}>
                                    {error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span className="tracking-[0.1em]">{error ? 'Syntax Violation' : 'Valid JSON'}</span>
                                </div>
                            )}
                        </div>
                        {mode !== 'tree' && (
                            <div className="px-4">
                                <input
                                    type="text"
                                    placeholder="Search in output..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg focus:ring-4 focus:ring-brand/10 transition-all"
                                />
                            </div>
                        )}
                        {mode === 'api-preview' && (
                            <div className="px-4">
                                <select
                                    value={apiType}
                                    onChange={(e) => setApiType(e.target.value as 'fetch' | 'axios' | 'curl')}
                                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm font-mono"
                                >
                                    <option value="fetch">Fetch</option>
                                    <option value="axios">Axios</option>
                                    <option value="curl">cURL</option>
                                </select>
                            </div>
                        )}
                        <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 group shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40">
                            {error ? (
                                <div className="absolute inset-0 p-10 text-red-500/80 font-mono text-sm overflow-auto custom-scrollbar">
                                    <div className="flex items-center space-x-3 mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="font-black uppercase tracking-widest text-[10px]">Parsing Error</p>
                                    </div>
                                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] italic leading-relaxed text-[11px] font-black opacity-80">
                                        {(() => {
                                            const match = error.match(/at position (\d+)/);
                                            if (match) {
                                                const pos = parseInt(match[1]);
                                                const {line, column} = getLineColumn(input, pos);
                                                return `Error at line ${line}, column ${column}: ${error}`;
                                            }
                                            return error;
                                        })()}
                                    </div>
                                </div>
                            ) : mode === 'tree' && parsedJson ? (
                                <div className="absolute inset-0 p-10 overflow-auto custom-scrollbar">
                                    <JsonTree data={parsedJson} path="root" expanded={expanded} toggleExpanded={toggleExpanded} />
                                </div>
                            ) : (
                                <pre className={cn(
                                    "absolute inset-0 p-10 text-brand font-mono text-sm overflow-auto custom-scrollbar leading-relaxed font-black opacity-90 select-all",
                                    mode === 'minify' && "whitespace-pre-wrap break-all"
                                )} dangerouslySetInnerHTML={{ __html: content }} />
                            )}
                        </div>
                        {stats && (
                            <div className="px-4 py-2 text-xs text-[var(--text-muted)] font-mono">
                                Size: {stats.size} KB | Keys: {stats.keys} | Depth: {stats.depth} | Arrays: {stats.arrays}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Copy Formats</label>
                    <div className="flex justify-center gap-2 mt-2">
                        {parsedJson && (
                            <>
                                <button
                                    onClick={() => copyToClipboard(JSON.stringify(parsedJson, null, 2))}
                                    className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-xs border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all"
                                >
                                    Copy Formatted
                                </button>
                                <button
                                    onClick={() => copyToClipboard(JSON.stringify(parsedJson))}
                                    className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-xs border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all"
                                >
                                    Copy Minified
                                </button>
                                <button
                                    onClick={() => copyToClipboard(JSON.stringify(JSON.stringify(parsedJson)))}
                                    className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-xs border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all"
                                >
                                    Copy Escaped
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
