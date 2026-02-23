import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TOOLS } from '../lib/config'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, Filter, Search, Star, History, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { getLocalData, useFavorites } from '../lib/storage'

export function Dashboard() {
    const [activeCategory, setActiveCategory] = useState<'all' | 'dev' | 'media' | 'data' | 'util' | 'text'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const { favorites, toggleFavorite } = useFavorites()
    const recentIds = getLocalData('recent_tools', [])
    const recentTools = TOOLS.filter(t => recentIds.includes(t.id)).slice(0, 5)
    const favoriteTools = TOOLS.filter(t => favorites.includes(t.id))

    const categories = [
        { id: 'all', label: 'All Tools' },
        { id: 'dev', label: 'Developer' },
        { id: 'data', label: 'Data' },
        { id: 'media', label: 'Media' },
        { id: 'text', label: 'Text' },
        { id: 'util', label: 'Utilities' },
    ]

    const filteredTools = TOOLS.filter(tool => {
        const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 space-y-16">
            <header className="space-y-8 text-center max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border-brand/20 text-brand font-black text-[10px] uppercase tracking-[0.3em] bg-brand/5 shadow-sm"
                >
                    <Sparkles className="w-3.5 h-3.5 fill-brand animate-pulse" />
                    <span>v4.5 Cloud Migration Complete</span>
                </motion.div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1]"
                    >
                        Engineering <br />
                        <span className="text-brand">Simplified.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-[var(--text-secondary)] text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        Professional-grade utilities designed for extreme speed and precision.
                    </motion.p>
                </div>

                {/* Instant Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative max-w-2xl mx-auto group"
                >
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-brand/10 blur-[100px] opacity-0 group-focus-within:opacity-100 transition-opacity" />

                    {/* Search container */}
                    <div
                        className="
    relative flex items-center rounded-[2rem]
    border border-gray-300
    transition-all duration-200
    bg-[var(--bg-secondary)]
  "
                    >
                        {/* Search icon */}
                        <Search className="w-5 h-5 ml-6 text-brand" />

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="Find a tool (e.g. JSON, QR, Markdown)..."
                            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0
  p-5 md:p-6 text-base md:text-lg font-medium
  placeholder:text-[var(--text-muted)]
  text-[var(--text-primary)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />


                        {/* Clear button */}
                        {searchQuery && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSearchQuery("")}
                                className="p-3 mr-4 hover:bg-brand/10 rounded-xl transition-all flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-[var(--text-muted)]" />
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </header>

            {!searchQuery && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recently Used */}
                    {recentTools.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center space-x-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">
                                <History className="w-3 h-3 text-brand" />
                                <span>Recent Operations</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentTools.map(tool => (
                                    <Link
                                        key={tool.id}
                                        to={tool.path}
                                        className="px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 text-xs font-bold transition-all flex items-center space-x-2"
                                    >
                                        <tool.icon className={cn("w-3 h-3", tool.color)} />
                                        <span className="text-[var(--text-secondary)]">{tool.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Favorites */}
                    {favoriteTools.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center space-x-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-2">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span>Pinned Essentials</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {favoriteTools.map(tool => (
                                    <Link
                                        key={tool.id}
                                        to={tool.path}
                                        className="px-4 py-2 glass rounded-xl border-[var(--border-primary)] hover:border-brand/40 text-xs font-bold transition-all flex items-center space-x-2 group"
                                    >
                                        <tool.icon className={cn("w-3 h-3", tool.color)} />
                                        <span className="text-[var(--text-secondary)]">{tool.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-col items-center space-y-8">
                <div className="flex items-center space-x-2 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.3em]">
                    <Filter className="w-3.5 h-3.5 text-brand" />
                    <span>Filter by Category</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 p-2 glass rounded-2xl md:rounded-3xl">
                    {categories.map((cat) => (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as any)}
                            className={cn(
                                "px-5 md:px-8 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300",
                                activeCategory === cat.id
                                    ? "brand-gradient text-white shadow-xl shadow-brand/25 scale-105"
                                    : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            {cat.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            <motion.section
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredTools.map((tool) => {
                        const Icon = tool.icon
                        return (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="h-full"
                                >
                                    <Link
                                        to={tool.path}
                                        className="group relative flex flex-col p-8 glass rounded-[2rem] glass-hover h-full overflow-hidden"
                                    >
                                        {/* Favorite Pin */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                toggleFavorite(tool.id)
                                            }}
                                            className="absolute right-6 top-6 p-2 rounded-xl glass hover:brand-gradient group/star z-10 transition-all shadow-xl bg-[var(--bg-secondary)]/50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                        >
                                            <Star className={cn("w-4 h-4 transition-all", favorites.includes(tool.id) ? "text-yellow-500 fill-yellow-500" : "text-[var(--text-secondary)] group-hover/star:text-[var(--text-primary)]")} />
                                        </motion.button>

                                        {/* Decorative Background Icon */}
                                        <Icon className="absolute -right-4 -bottom-4 w-32 h-32 text-[var(--text-muted)] opacity-10 group-hover:text-brand/10 group-hover:opacity-100 transition-all duration-500 -rotate-12 group-hover:rotate-0" />

                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:brand-gradient transition-all duration-300", tool.color)}>
                                            <Icon className="w-7 h-7 text-inherit group-hover:text-black transition-colors" />
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-brand transition-colors text-[var(--text-primary)]">{tool.name}</h3>
                                        <p className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors text-sm leading-relaxed mb-6 line-clamp-2">
                                            {tool.description}
                                        </p>

                                        <div className="flex items-center text-brand font-bold text-xs mt-auto uppercase tracking-widest">
                                            <span>Open Tool</span>
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.section>

            {/* Ad Placeholder - Top Banner Style */}
            <div className="py-8">
                <div className="w-full h-32 glass rounded-[2.5rem] border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center space-y-2">
                    <span className="text-[var(--text-muted)] text-[10px] font-black tracking-[0.3em] uppercase">Sponsorship Opportunity</span>
                    <p className="text-[var(--text-secondary)] text-xs font-medium">Reach 50k+ developers monthly with your product.</p>
                </div>
            </div>
        </div>
    )
}
