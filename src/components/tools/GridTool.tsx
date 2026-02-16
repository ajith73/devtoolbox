import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Grid, Plus, Minus, Copy } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function GridTool() {
    const [columns, setColumns] = useState(3)
    const [rows, setRows] = useState(3)
    const [columnGap, setColumnGap] = useState(16)
    const [rowGap, setRowGap] = useState(16)

    const generateCss = () => {
        return `/* Grid Container Styling */
.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  column-gap: ${columnGap}px;
  row-gap: ${rowGap}px;
}`
    }

    return (
        <ToolLayout
            title="CSS Grid Generator"
            description="Architect complex grid layouts visually and extract optimized CSS code."
            icon={Grid}
            onReset={() => {
                setColumns(3)
                setRows(3)
                setColumnGap(16)
                setRowGap(16)
            }}
            onCopy={() => copyToClipboard(generateCss())}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 glass rounded-3xl border-[var(--border-primary)] space-y-8 bg-[var(--bg-secondary)]/30">
                        {/* Column Control */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand uppercase tracking-widest pl-1">Columns</label>
                            <div className="flex items-center justify-between bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--border-primary)]">
                                <button
                                    onClick={() => setColumns(Math.max(1, columns - 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-mono font-black text-lg">{columns} Cols</span>
                                <button
                                    onClick={() => setColumns(Math.min(12, columns + 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Row Control */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand uppercase tracking-widest pl-1">Rows</label>
                            <div className="flex items-center justify-between bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--border-primary)]">
                                <button
                                    onClick={() => setRows(Math.max(1, rows - 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-mono font-black text-lg">{rows} Rows</span>
                                <button
                                    onClick={() => setRows(Math.min(12, rows + 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Gap Controls */}
                        <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]/30">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Column Gap</label>
                                    <span className="text-[10px] font-mono font-black text-brand">{columnGap}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="64"
                                    value={columnGap}
                                    onChange={(e) => setColumnGap(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Row Gap</label>
                                    <span className="text-[10px] font-mono font-black text-brand">{rowGap}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="64"
                                    value={rowGap}
                                    onChange={(e) => setRowGap(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview & Code */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Preview */}
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/10 min-h-[500px] relative overflow-hidden flex flex-col">
                        <div className="mb-8 flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Real-time Layout Canvas</span>
                        </div>

                        <div
                            className="flex-1 w-full rounded-2xl border border-dashed border-[var(--border-primary)] p-4 bg-black/5 dark:bg-white/5 overflow-auto custom-scrollbar"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                gridTemplateRows: `repeat(${rows}, 1fr)`,
                                columnGap: `${columnGap}px`,
                                rowGap: `${rowGap}px`,
                            }}
                        >
                            <AnimatePresence mode='popLayout'>
                                {Array.from({ length: columns * rows }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        layout
                                        className="min-h-[60px] bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand font-black text-xs shadow-sm hover:scale-[1.02] transition-transform cursor-crosshair group"
                                    >
                                        <span className="group-hover:scale-110 transition-transform">{i + 1}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Generated Code */}
                    <div className="relative group">
                        <div className="absolute top-6 right-8 z-10">
                            <button
                                onClick={() => copyToClipboard(generateCss())}
                                className="flex items-center space-x-2 px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand hover:scale-105 active:scale-95 transition-all bg-white dark:bg-black border-[var(--border-primary)]"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                            </button>
                        </div>
                        <div className="p-8 glass rounded-[2.5rem] bg-[#0d1117] border-[#30363d] overflow-hidden">
                            <pre className="font-mono text-xs md:text-sm text-cyan-400 overflow-auto custom-scrollbar leading-relaxed">
                                {generateCss()}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
