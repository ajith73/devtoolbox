import { Link, useLocation } from 'react-router-dom'
import { TOOLS } from '../../lib/config'
import type { Tool } from '../../lib/config'
import { cn } from '../../lib/utils'
import { LayoutGrid, Command, History, Sparkles, Lightbulb, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Define tool groups
const TOOL_GROUPS: Record<string, string[]> = {
    'Data & Formats': ['json', 'json-string', 'json-xml', 'json-yaml', 'csv', 'xml-yaml', 'base-converter', 'sql', 'random-data'],
    'Encoding': ['base64', 'url', 'unicode', 'hex', 'html-entity'],
    'Web Dev': ['api', 'html', 'regex', 'jwt', 'flex', 'grid', 'bezier', 'gradient', 'github-readme', 'github-stats'],
    'Security': ['password', 'password-checker', 'tokens', 'hash', 'hmac', 'aes', 'file-hash'],
    'Network': ['ip', 'ip-validator', 'dns', 'whois', 'mac', 'http-status', 'url-parser', 'subnet', 'country-info', 'weather'],
    'Time & Date': ['timestamp', 'iso8601', 'cron', 'timezone', 'world-clock', 'duration', 'age', 'date-diff'],
    'Images & Media': ['image', 'image-base64', 'image-info', 'image-convert', 'pdf', 'color', 'qr', 'placeholder-image'],
    'Text & Utilities': ['text', 'markdown', 'text-stats', 'lorem', 'slug', 'ascii', 'diff', 'morse', 'unit', 'ua', 'currency', 'dictionary', 'translator']
}

export function Sidebar() {
    const location = useLocation()
    const [recentIds, setRecentIds] = useState<string[]>([])
    const [tipIndex, setTipIndex] = useState(0)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        // Default first 3 groups expanded
        const groups = Object.keys(TOOL_GROUPS)
        return groups.reduce((acc, group, idx) => ({ ...acc, [group]: idx < 3 }), {})
    })

    const tips = [
        "Use CMD + K to search and switch tools instantly.",
        "All tools run 100% locally in your browser.",
        "You can copy sharing links for any tool from the header.",
        "The API Tester supports raw text and JSON responses.",
        "Hover over tool icons on the dashboard for a sneak peek."
    ]

    useEffect(() => {
        const stored = localStorage.getItem('recent_tools')
        if (stored) {
            setRecentIds(JSON.parse(stored))
        }

        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % tips.length)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    // Update recents when location changes to a tool path
    useEffect(() => {
        const tool = TOOLS.find(t => t.path === location.pathname)
        if (tool) {
            setRecentIds(prev => {
                const filtered = prev.filter(id => id !== tool.id)
                const updated = [tool.id, ...filtered].slice(0, 3)
                localStorage.setItem('recent_tools', JSON.stringify(updated))
                return updated
            })
        }
    }, [location.pathname])

    const recentTools = recentIds
        .map(id => TOOLS.find(t => t.id === id))
        .filter((t): t is Tool => !!t)

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    return (
        <aside className="w-64 border-r border-[var(--border-primary)] hidden lg:flex flex-col bg-[var(--bg-secondary)] sticky top-0 h-screen transition-all duration-500">
            <div className="p-6">
                <Link to="/" className="flex items-center space-x-2 group focus:outline-none">
                    <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-brand/20">
                        <Command className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">DevBox</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4 no-scrollbar">
                <motion.div whileTap={{ scale: 0.98 }}>
                    <Link
                        to="/"
                        className={cn(
                            "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all mb-6",
                            location.pathname === '/'
                                ? "bg-brand/10 text-brand shadow-sm shadow-brand/5"
                                : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                        )}
                    >
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wide">Dashboard</span>
                    </Link>
                </motion.div>

                {recentTools.length > 0 && (
                    <div className="pb-6 space-y-1">
                        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center">
                            <History className="w-3 h-3 mr-2 text-brand" />
                            Recent
                        </p>
                        {recentTools.map((tool) => {
                            const Icon = tool.icon
                            return (
                                <motion.div whileTap={{ scale: 0.98 }} key={`recent-${tool.id}`}>
                                    <Link
                                        to={tool.path}
                                        className={cn(
                                            "flex items-center space-x-3 px-3 py-2 rounded-xl transition-all group",
                                            location.pathname === tool.path
                                                ? "bg-brand/10 text-brand font-bold"
                                                : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-colors", location.pathname === tool.path ? "text-brand" : "group-hover:text-brand")} />
                                        <span className="text-sm">{tool.name}</span>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                <div className="pt-2 pb-2">
                    <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Tools</p>
                </div>

                {Object.entries(TOOL_GROUPS).map(([groupName, toolIds]) => {
                    const groupTools = toolIds.map(id => TOOLS.find(t => t.id === id)).filter((t): t is Tool => !!t)
                    const isExpanded = expandedGroups[groupName]

                    return (
                        <div key={groupName} className="mb-2">
                            <button
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-brand transition-colors group"
                            >
                                <span className="uppercase tracking-wider">{groupName}</span>
                                <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded ? "rotate-180" : "")} />
                            </button>

                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-0.5 pt-1">
                                            {groupTools.map((tool) => {
                                                const Icon = tool.icon
                                                return (
                                                    <motion.div whileTap={{ scale: 0.98 }} key={tool.id}>
                                                        <Link
                                                            to={tool.path}
                                                            className={cn(
                                                                "flex items-center space-x-3 px-3 py-1.5 rounded-xl transition-all group",
                                                                location.pathname === tool.path
                                                                    ? "bg-brand/10 text-brand font-bold"
                                                                    : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                                                            )}
                                                        >
                                                            <Icon className={cn("w-3.5 h-3.5 transition-colors", location.pathname === tool.path ? "text-brand" : "group-hover:text-brand")} />
                                                            <span className="text-xs">{tool.name}</span>
                                                        </Link>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-[var(--border-primary)]">
                <div className="p-5 rounded-[1.5rem] bg-brand/5 border border-brand/10 relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-16 h-16 text-brand" />
                    </div>
                    <div className="relative space-y-2">
                        <div className="flex items-center space-x-2 text-brand">
                            <Lightbulb className="w-3 h-3" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Pro Tip</p>
                        </div>
                        <div className="h-10 relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={tipIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium"
                                >
                                    {tips[tipIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
