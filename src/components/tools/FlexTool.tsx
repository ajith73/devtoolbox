import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Layout, Plus, Minus, Copy } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function FlexTool() {
    const [itemCount, setItemCount] = useState(4)
    const [containerStyle, setContainerStyle] = useState({
        display: 'flex',
        flexDirection: 'row' as const,
        flexWrap: 'nowrap' as const,
        justifyContent: 'flex-start' as const,
        alignItems: 'stretch' as const,
        alignContent: 'stretch' as const,
        gap: '16px',
    })

    const generateCss = () => {
        return `/* Flex Container Styling */
.flex-container {
  display: ${containerStyle.display};
  flex-direction: ${containerStyle.flexDirection};
  flex-wrap: ${containerStyle.flexWrap};
  justify-content: ${containerStyle.justifyContent};
  align-items: ${containerStyle.alignItems};
  align-content: ${containerStyle.alignContent};
  gap: ${containerStyle.gap};
}`
    }

    const options = {
        flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
        flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
        justifyContent: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
        alignItems: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
        alignContent: ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
    }

    return (
        <ToolLayout
            title="CSS Flexbox Generator"
            description="Visually design flexbox layouts and generate production-ready CSS code."
            icon={Layout}
            onReset={() => {
                setItemCount(4)
                setContainerStyle({
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    alignContent: 'stretch',
                    gap: '16px',
                })
            }}
            onCopy={() => copyToClipboard(generateCss())}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 glass rounded-3xl border-[var(--border-primary)] space-y-6 bg-[var(--bg-secondary)]/30">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand uppercase tracking-widest pl-1">Grid Density</label>
                            <div className="flex items-center justify-between bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--border-primary)]">
                                <button
                                    onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-mono font-black text-lg">{itemCount} Nodes</span>
                                <button
                                    onClick={() => setItemCount(Math.min(20, itemCount + 1))}
                                    className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-[var(--text-secondary)]"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {Object.entries(options).map(([prop, values]) => (
                            <div key={prop} className="space-y-3">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">
                                    {prop.replace(/([A-Z])/g, ' $1')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {values.map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setContainerStyle(prev => ({ ...prev, [prop]: val }))}
                                            className={cn(
                                                "px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                                                (containerStyle as any)[prop] === val
                                                    ? "brand-gradient text-white border-transparent shadow-lg shadow-brand/20"
                                                    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-brand/40"
                                            )}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Gap Spacing</label>
                            <input
                                type="range"
                                min="0"
                                max="64"
                                value={parseInt(containerStyle.gap)}
                                onChange={(e) => setContainerStyle(prev => ({ ...prev, gap: `${e.target.value}px` }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                <span>0px</span>
                                <span className="text-brand font-black">{containerStyle.gap}</span>
                                <span>64px</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview & Code */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Preview */}
                    <div className="p-8 glass rounded-[3rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/10 min-h-[400px] relative overflow-hidden">
                        <div className="absolute top-6 left-6 flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Live Rendering Engine</span>
                        </div>

                        <div
                            className="w-full h-full mt-8 rounded-2xl border border-dashed border-[var(--border-primary)] p-4 bg-black/5 dark:bg-white/5"
                            style={containerStyle as any}
                        >
                            <AnimatePresence mode='popLayout'>
                                {Array.from({ length: itemCount }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        layout
                                        className="min-w-[80px] min-h-[80px] brand-gradient rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/20"
                                    >
                                        {i + 1}
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
                            <pre className="font-mono text-xs md:text-sm text-blue-300 overflow-auto custom-scrollbar leading-relaxed">
                                {generateCss()}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
