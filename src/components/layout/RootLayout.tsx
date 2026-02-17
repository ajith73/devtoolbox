import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, Search, Bell, X, Command as CommandIcon, ArrowRight, LayoutGrid, Share2, Check, Sun, Moon } from 'lucide-react'
import { TOOLS } from '../../lib/config'
import type { Tool } from '../../lib/config'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { cn, copyToClipboard } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function RootLayout({ children }: { children: React.ReactNode }) {
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showShareToast, setShowShareToast] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as any) || 'dark'
    })
    const navigate = useNavigate()
    const location = useLocation()

    const filteredTools = TOOLS.filter((tool: Tool) =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setSearchOpen(true)
            }
            if (e.key === 'Escape') {
                setSearchOpen(false)
                setNotificationsOpen(false)
                setMobileMenuOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        localStorage.setItem('theme', theme)
    }, [theme])

    // Dynamic Tab Titles & Mobile Menu Reset
    useEffect(() => {
        setMobileMenuOpen(false)
        const tool = TOOLS.find(t => t.path === location.pathname)
        if (tool) {
            document.title = `${tool.name} | DevBox`
        } else if (location.pathname === '/') {
            document.title = 'DevBox | Modern Developer Toolkit'
        } else {
            const pageName = location.pathname.split('/').pop()?.replace(/^\w/, c => c.toUpperCase())
            document.title = `${pageName || 'DevBox'} | DevBox`
        }
    }, [location.pathname])

    const handleSelectTool = (path: string) => {
        navigate(path)
        setSearchOpen(false)
        setQuery('')
    }

    const handleShare = () => {
        const url = window.location.href
        copyToClipboard(url)
        setShowShareToast(true)
        setTimeout(() => setShowShareToast(false), 2000)
    }

    return (
        <div className={cn(
            "flex min-h-screen transition-all duration-500",
            theme === 'dark' ? "dark" : "light"
        )}>
            <Sidebar />

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm z-[45] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-[50] lg:hidden overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
                                <Link to="/" className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
                                        <CommandIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-bold text-xl tracking-tight text-[var(--text-primary)] focus:outline-none">DevBox</span>
                                </Link>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[var(--text-muted)] hover:text-brand">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-4">
                                <SidebarContent location={location} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="h-16 border-b border-[var(--border-primary)] flex items-center justify-between px-4 lg:px-8 bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center space-x-4 flex-1">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => setSearchOpen(true)}
                            className="relative max-w-md w-full hidden md:flex items-center text-left px-4 h-11 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-[var(--text-muted)] hover:border-brand/40 transition-all group"
                        >
                            <Search className="w-4 h-4 mr-3 text-brand" />
                            <span className="text-sm flex-1">Search tools... (Ctrl+K)</span>
                            <kbd className="hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[10px] font-bold text-[var(--text-muted)] group-hover:text-brand">
                                <CommandIcon className="w-2.5 h-2.5" />
                                <span>K</span>
                            </kbd>
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-4">
                            {location.pathname !== '/' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShare}
                                    className="p-3 text-[var(--text-muted)] hover:text-brand hover:bg-brand/5 rounded-full transition-all relative flex items-center justify-center min-w-[40px] min-h-[40px]"
                                    title="Share Tool"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <AnimatePresence>
                                        {showShareToast && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full whitespace-nowrap z-50 flex items-center"
                                            >
                                                <Check className="w-3 h-3 mr-1" /> URL Copied
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            )}

                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className={cn(
                                        "p-3 rounded-xl transition-all relative min-w-[40px] min-h-[40px] flex items-center justify-center",
                                        notificationsOpen ? "bg-brand/10 text-brand" : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                                    )}
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full border-2 border-[var(--bg-primary)]"></span>
                                </motion.button>

                                <AnimatePresence>
                                    {notificationsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="fixed md:absolute right-4 md:right-0 mt-3 w-[calc(100vw-32px)] md:w-80 rounded-2xl p-4 shadow-2xl border-[var(--border-primary)] z-50 text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-sm">Notifications</h4>
                                                <span className="text-[10px] bg-brand text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-lg shadow-brand/20">2 Priority</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] hover:border-brand/30 transition-all cursor-pointer text-left shadow-sm group/notif">
                                                    <p className="text-xs font-black mb-1 group-hover:text-brand transition-colors">10 New Primitives ✨</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">JWT, Regex, Cron, and more are now fully integrated into the engine.</p>
                                                </div>
                                                <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] hover:border-brand/30 transition-all cursor-pointer text-left shadow-sm group/notif">
                                                    <p className="text-xs font-black mb-1 group-hover:text-brand transition-colors">Vite 7 Architecture</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">System core optimized for substantial performance gains.</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-3 rounded-full glass border-[var(--border-primary)] hover:brand-gradient transition-all group shadow-sm bg-[var(--bg-secondary)]/50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--text-muted)] group-hover:text-white" /> : <Moon className="w-5 h-5 text-brand" />}
                            </motion.button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden">
                    {children}

                    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
                        <div className="w-full h-32 glass rounded-[2.5rem] border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center space-y-4 relative overflow-hidden group bg-[var(--bg-secondary)]/30">
                            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="space-y-4 text-center relative">
                                <span className="text-[var(--text-muted)] text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Trusted and Used by 1,000+ Developers Weekly</span>
                                <div className="flex items-center justify-center space-x-12 opacity-30 grayscale brightness-100 text-[var(--text-primary)]">
                                    <div className="font-bold text-xl tracking-tighter uppercase">Abc</div>
                                    <div className="font-bold text-xl tracking-tighter uppercase">Abc</div>
                                    <div className="font-bold text-xl tracking-tighter uppercase">Abc</div>
                                    <div className="font-bold text-xl tracking-tighter uppercase">Abc</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="border-t border-[var(--border-primary)] py-16 px-4 lg:px-8 bg-[var(--bg-secondary)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                            <div className="col-span-1 md:col-span-2 space-y-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
                                        <CommandIcon className="text-white w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-2xl tracking-tight">DevBox</span>
                                </div>
                                <p className="text-[var(--text-secondary)] text-sm max-w-sm leading-relaxed">
                                    The ultimate open-source toolbench for modern software engineers.
                                    Zero logging. Zero tracking. Just pure engineering in your browser.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-brand">Legal</h4>
                                <div className="flex flex-col space-y-3">
                                    <Link to="/privacy" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">Privacy Policy</Link>
                                    <Link to="/terms" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">Terms of Service</Link>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-brand">Project</h4>
                                <div className="flex flex-col space-y-3">
                                    <Link to="/changelog" className="text-sm text-[var(--text-secondary)] hover:text-brand transition-colors">Changelog</Link>
                                </div>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-[var(--text-muted)] text-[10px] font-medium uppercase tracking-wider">
                                © 2026 devbox.io - 100% In-Browser.
                            </p>
                            <p className="text-[var(--text-muted)] text-[10px] font-medium uppercase tracking-wider">
                                Built for developers by developers.
                            </p>
                        </div>
                    </div>
                </footer>

                {/* Global Search Modal */}
                {searchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-surface-900/80 backdrop-blur-xl" onClick={() => setSearchOpen(false)}></div>
                        <div className="relative w-full max-w-2xl glass rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden animate-scale-in border-[var(--border-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)]/95 backdrop-blur-2xl">
                            <div className="p-8 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center space-x-6">
                                <Search className="w-6 h-6 text-brand" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Execute search pattern..."
                                    className="bg-transparent border-none text-2xl p-0 h-auto focus:ring-0 flex-1 placeholder:text-[var(--text-muted)] placeholder:opacity-40 font-black tracking-tight"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    onClick={() => setSearchOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-white/20 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredTools.map((tool) => {
                                        const Icon = tool.icon
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleSelectTool(tool.path)}
                                                className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-[var(--bg-secondary)] transition-all group text-left border border-transparent hover:border-[var(--border-primary)]"
                                            >
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center group-hover:brand-gradient transition-all shadow-sm", tool.color)}>
                                                    <Icon className="w-5 h-5 group-hover:text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold group-hover:text-brand transition-colors text-[var(--text-primary)]">{tool.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate">{tool.description}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-brand -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                                            </button>
                                        )
                                    })}
                                    {filteredTools.length === 0 && (
                                        <div className="p-12 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-3xl glass border-dashed flex items-center justify-center mx-auto">
                                                <X className="w-8 h-8 text-[var(--text-muted)]" />
                                            </div>
                                            <p className="text-[var(--text-muted)] italic">No tools found matching "{query}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/80 border-t border-[var(--border-primary)] flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                                    <div className="flex items-center">
                                        <kbd className="px-2 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--border-primary)] mr-2 shadow-sm font-sans">ESC</kbd> Close
                                    </div>
                                    <div className="flex items-center">
                                        <kbd className="px-2 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--border-primary)] mr-2 shadow-sm font-sans">↵</kbd> Select
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-tighter">DevBox Search Pro</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SidebarContent({ location }: { location: any }) {
    return (
        <nav className="space-y-4 overflow-y-auto no-scrollbar pb-10">
            <Link
                to="/"
                className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all shadow-sm",
                    location.pathname === '/'
                        ? "brand-gradient text-white"
                        : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                )}
            >
                <LayoutGrid className="w-5 h-5" />
                <span className="font-bold">Dashboard</span>
            </Link>

            <div className="pt-2 px-2">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Module Registry</p>
            </div>

            <div className="space-y-1">
                {TOOLS.map((tool: Tool) => {
                    const Icon = tool.icon
                    return (
                        <Link
                            key={tool.id}
                            to={tool.path}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group",
                                location.pathname === tool.path
                                    ? "bg-brand/10 text-brand ring-1 ring-brand/20 shadow-inner"
                                    : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            <Icon className={cn("w-4 h-4 transition-colors", location.pathname === tool.path ? "text-brand" : "group-hover:text-brand")} />
                            <span className="text-sm font-bold">{tool.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
