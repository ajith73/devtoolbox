import { useState, useEffect, useMemo } from 'react'
import { Github, Search, Book, Users, Star, Link, Copy, Check, Settings, Clock, Shield, AlertCircle, RefreshCw, Calendar, GitBranch, Package, Code, ExternalLink, Twitter, Mail, MapPin } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface GithubUser {
    login: string
    avatar_url: string
    html_url: string
    name: string
    company: string
    blog: string
    location: string
    email: string
    bio: string
    twitter_username: string
    public_repos: number
    public_gists: number
    followers: number
    following: number
    created_at: string
}

interface GithubRepo {
    id: number
    name: string
    full_name: string
    html_url: string
    description: string
    stargazers_count: number
    language: string
    forks_count: number
    created_at: string
    updated_at: string
    size: number
    open_issues_count: number
    default_branch: string
    topics: string[]
    license?: {
        key: string
        name: string
    }
}

export function GithubStatsTool() {
    const [username, setUsername] = usePersistentState('github_username', 'octocat')
    const [userData, setUserData] = useState<GithubUser | null>(null)
    const [repos, setRepos] = useState<GithubRepo[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [searchHistory, setSearchHistory] = usePersistentState('github_history', [] as Array<{username: string, timestamp: string, followers: number}>)
    const [autoRefresh, setAutoRefresh] = usePersistentState('github_auto_refresh', false)
    const [refreshInterval, setRefreshInterval] = usePersistentState('github_refresh_interval', 300000) // 5 minutes
    const [repoSort, setRepoSort] = usePersistentState('github_repo_sort', 'updated')
    const [showStats, setShowStats] = usePersistentState('github_show_stats', true)
    const [showLanguages, setShowLanguages] = usePersistentState('github_show_languages', true)
    const [maxRepos, setMaxRepos] = usePersistentState('github_max_repos', 6)

    const fetchGithubData = async () => {
        if (!username.trim()) return
        setLoading(true)
        setError(null)
        setUserData(null)
        setRepos([])

        try {
            // Fetch User
            const userRes = await fetch(`https://api.github.com/users/${username}`)
            if (!userRes.ok) {
                if (userRes.status === 404) throw new Error('User not found')
                if (userRes.status === 403) throw new Error('API rate limit exceeded. Please try again later.')
                throw new Error('Failed to fetch user data')
            }
            const user = await userRes.json()
            setUserData(user)

            // Fetch Repos
            const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=${repoSort}&per_page=${maxRepos}`)
            if (reposRes.ok) {
                const repoData = await reposRes.json()
                setRepos(repoData)
            }

            // Add to history
            const newEntry = {
                username: username.trim(),
                timestamp: new Date().toISOString(),
                followers: user.followers
            }
            setSearchHistory(prev => [newEntry, ...prev.slice(0, 9)])
        } catch (err: any) {
            setError(err.message || 'Error fetching data')
        } finally {
            setLoading(false)
        }
    }

    // Auto refresh functionality
    useEffect(() => {
        if (autoRefresh && username) {
            const interval = setInterval(() => {
                fetchGithubData()
            }, refreshInterval)
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, username, repoSort, maxRepos])

    // Auto search on initial load
    useEffect(() => {
        if (username && !userData) {
            fetchGithubData()
        }
    }, [])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') fetchGithubData()
    }

    const handleCopy = () => {
        if (!userData) return
        
        const profileText = `GitHub Profile: ${userData.name || userData.login}\n` +
            `Username: @${userData.login}\n` +
            `Followers: ${userData.followers}\n` +
            `Following: ${userData.following}\n` +
            `Public Repos: ${userData.public_repos}\n` +
            `Public Gists: ${userData.public_gists}\n` +
            `Created: ${new Date(userData.created_at).toLocaleDateString()}\n` +
            (userData.bio ? `Bio: ${userData.bio}\n` : '') +
            (userData.location ? `Location: ${userData.location}\n` : '') +
            (userData.company ? `Company: ${userData.company}\n` : '') +
            (userData.email ? `Email: ${userData.email}\n` : '') +
            (userData.blog ? `Website: ${userData.blog}\n` : '') +
            (userData.twitter_username ? `Twitter: @${userData.twitter_username}\n` : '')
        
        copyToClipboard(profileText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClearHistory = () => {
        setSearchHistory([])
    }

    const handleHistoryClick = (entry: {username: string}) => {
        setUsername(entry.username)
        fetchGithubData()
    }

    const computed = useMemo(() => {
        if (!repos.length) return { totalStars: 0, totalForks: 0, languages: {}, mostStarred: null, mostForked: null, recentActivity: 0 }
        
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)
        
        const languages: Record<string, number> = {}
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1
            }
        })
        
        const mostStarred = repos.reduce((prev, current) => 
            prev.stargazers_count > current.stargazers_count ? prev : current
        , repos[0])
        
        const mostForked = repos.reduce((prev, current) => 
            prev.forks_count > current.forks_count ? prev : current
        , repos[0])
        
        const recentActivity = repos.filter(repo => {
            const updatedAt = new Date(repo.updated_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return updatedAt > weekAgo
        }).length
        
        return { totalStars, totalForks, languages, mostStarred, mostForked, recentActivity }
    }, [repos])

    const getLanguageColor = (language: string) => {
        const colors: Record<string, string> = {
            'JavaScript': 'bg-yellow-500',
            'TypeScript': 'bg-blue-500',
            'Python': 'bg-green-500',
            'Java': 'bg-orange-500',
            'C++': 'bg-purple-500',
            'C#': 'bg-indigo-500',
            'Go': 'bg-cyan-500',
            'Rust': 'bg-red-500',
            'PHP': 'bg-pink-500',
            'Ruby': 'bg-red-600',
            'Swift': 'bg-orange-600',
            'Kotlin': 'bg-purple-600',
            'HTML': 'bg-orange-500',
            'CSS': 'bg-blue-500',
            'Vue': 'bg-green-600',
            'React': 'bg-cyan-600'
        }
        return colors[language] || 'bg-gray-500'
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    return (
        <ToolLayout
            title="GitHub Stats Viewer"
            description="View detailed statistics and repositories for any GitHub user with advanced features."
            icon={Github}
            onReset={() => { setUsername('octocat'); setUserData(null); setRepos([]); setError(null) }}
            onCopy={userData ? handleCopy : undefined}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Github className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced GitHub Stats</h2>
                            <p className="text-sm text-[var(--text-muted)]">User statistics & repositories</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                                showAdvanced ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!userData}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                userData ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Search */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">GitHub Username</label>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-xl font-bold p-4 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-mono pl-12"
                                placeholder="octocat"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-black text-sm">@</span>
                        </div>
                        <button
                            onClick={fetchGithubData}
                            disabled={loading || !username.trim()}
                            className={cn(
                                "px-6 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                loading || !username.trim()
                                    ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                    : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            {loading ? 'Loading...' : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="p-4 glass rounded-2xl border">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Advanced Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="auto_refresh"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_refresh" className="text-sm text-[var(--text-primary)]">Auto Refresh</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_stats"
                                    checked={showStats}
                                    onChange={(e) => setShowStats(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_stats" className="text-sm text-[var(--text-primary)]">Show Statistics</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_languages"
                                    checked={showLanguages}
                                    onChange={(e) => setShowLanguages(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_languages" className="text-sm text-[var(--text-primary)]">Show Languages</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Sort Repos By</label>
                                <select
                                    value={repoSort}
                                    onChange={(e) => setRepoSort(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="updated">Last Updated</option>
                                    <option value="created">Created</option>
                                    <option value="pushed">Last Pushed</option>
                                    <option value="full_name">Name</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Max Repositories</label>
                                <select
                                    value={maxRepos}
                                    onChange={(e) => setMaxRepos(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value={6}>6</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Refresh Interval</label>
                                <select
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value={60000}>1 minute</option>
                                    <option value={300000}>5 minutes</option>
                                    <option value={600000}>10 minutes</option>
                                    <option value={1800000}>30 minutes</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses GitHub Public API for user profiles and repositories. Rate limits may apply for unauthenticated requests.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg flex items-center justify-center gap-3">
                            <Github className="w-8 h-8 animate-bounce" />
                            Fetching GitHub data...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-red-500 font-bold">Error</span>
                        </div>
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {/* Results */}
                {userData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Statistics Dashboard */}
                        {showStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 glass rounded-xl border text-center">
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Followers</div>
                                    <div className="text-2xl font-black text-brand">{userData.followers}</div>
                                </div>
                                <div className="p-4 glass rounded-xl border text-center">
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Following</div>
                                    <div className="text-2xl font-black text-purple-500">{userData.following}</div>
                                </div>
                                <div className="p-4 glass rounded-xl border text-center">
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Stars</div>
                                    <div className="text-2xl font-black text-yellow-500">{computed.totalStars}</div>
                                </div>
                                <div className="p-4 glass rounded-xl border text-center">
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Forks</div>
                                    <div className="text-2xl font-black text-cyan-500">{computed.totalForks}</div>
                                </div>
                            </div>
                        )}

                        {/* User Profile Card */}
                        <div className="glass p-8 rounded-3xl border-[var(--border-primary)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand/20 to-purple-500/20" />

                            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 mt-12">
                                <div className="relative group">
                                    <img
                                        src={userData.avatar_url}
                                        alt={userData.login}
                                        className="w-32 h-32 rounded-full border-4 border-[var(--bg-primary)] shadow-xl transition-transform group-hover:scale-105"
                                    />
                                    <a
                                        href={userData.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute -bottom-2 -right-2 p-2 bg-brand text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                <div className="text-center md:text-left space-y-3 flex-1">
                                    <h2 className="text-4xl font-black text-[var(--text-primary)]">
                                        {userData.name || userData.login}
                                    </h2>
                                    <p className="text-xl font-mono text-[var(--text-muted)]">@{userData.login}</p>

                                    {userData.bio && (
                                        <p className="text-lg text-[var(--text-secondary)] italic max-w-2xl">
                                            "{userData.bio}"
                                        </p>
                                    )}

                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                        {userData.location && (
                                            <span className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-sm font-bold text-[var(--text-muted)]">
                                                <MapPin className="w-3 h-3" />
                                                {userData.location}
                                            </span>
                                        )}
                                        {userData.company && (
                                            <span className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-sm font-bold text-[var(--text-muted)]">
                                                <Package className="w-3 h-3" />
                                                {userData.company}
                                            </span>
                                        )}
                                        {userData.twitter_username && (
                                            <a href={`https://twitter.com/${userData.twitter_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-full text-sm font-bold transition-colors">
                                                <Twitter className="w-3 h-3" />
                                                @{userData.twitter_username}
                                            </a>
                                        )}
                                        {userData.email && (
                                            <a href={`mailto:${userData.email}`} className="flex items-center gap-2 px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-full text-sm font-bold transition-colors">
                                                <Mail className="w-3 h-3" />
                                                Email
                                            </a>
                                        )}
                                        {userData.blog && (
                                            <a href={userData.blog.startsWith('http') ? userData.blog : `https://${userData.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1 bg-brand/10 hover:bg-brand/20 text-brand rounded-full text-sm font-bold transition-colors">
                                                <Link className="w-3 h-3" />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[120px]">
                                    <div className="p-3 bg-[var(--bg-secondary)]/50 rounded-xl text-center border border-[var(--border-primary)] hover:scale-105 transition-transform">
                                        <Users className="w-5 h-5 mx-auto mb-1 text-brand" />
                                        <p className="text-xl font-black text-[var(--text-primary)]">{userData.followers}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Followers</p>
                                    </div>
                                    <div className="p-3 bg-[var(--bg-secondary)]/50 rounded-xl text-center border border-[var(--border-primary)] hover:scale-105 transition-transform">
                                        <Book className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                                        <p className="text-xl font-black text-[var(--text-primary)]">{userData.public_repos}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Repos</p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Joined {formatDate(userData.created_at)}
                                    </span>
                                    <span className="text-[var(--text-muted)]">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {computed.recentActivity} active repos this week
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Languages */}
                        {showLanguages && Object.keys(computed.languages).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                    <Code className="w-6 h-6" />
                                    Languages Used
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(computed.languages).map(([lang, count]) => (
                                        <div key={lang} className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-sm font-bold">
                                            <span className={`w-2 h-2 rounded-full ${getLanguageColor(lang)}`} />
                                            {lang} ({count})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Repositories */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                <GitBranch className="w-6 h-6" />
                                Recent Repositories
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {repos.map((repo) => (
                                    <a
                                        key={repo.id}
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-6 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50 hover:scale-[1.02] transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="text-lg font-black text-brand line-clamp-1">{repo.name}</h4>
                                            <div className="flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-lg">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold">{repo.stargazers_count}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 h-10 mb-3">
                                            {repo.description || 'No description provided.'}
                                        </p>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                                <span className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language || 'Unknown')}`} />
                                                {repo.language || 'Unknown'}
                                            </span>
                                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <GitBranch className="w-3 h-3" />
                                                    {repo.forks_count}
                                                </span>
                                                {repo.open_issues_count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {repo.open_issues_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {repo.topics && repo.topics.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {repo.topics.slice(0, 3).map((topic, index) => (
                                                    <span key={index} className="px-2 py-1 bg-brand/10 text-brand rounded text-xs font-mono">
                                                        {topic}
                                                    </span>
                                                ))}
                                                {repo.topics.length > 3 && (
                                                    <span className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded text-xs">
                                                        +{repo.topics.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-3">
                                            <span>Created {formatDate(repo.created_at)}</span>
                                            <span>Updated {formatDate(repo.updated_at)}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Search History */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-brand" />
                                    <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                                </div>
                                <button
                                    onClick={handleClearHistory}
                                    disabled={searchHistory.length === 0}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        searchHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                                    )}
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                                {searchHistory.length > 0 ? (
                                    <div className="p-4 space-y-2">
                                        {searchHistory.map((entry, index) => (
                                            <div 
                                                key={index} 
                                                onClick={() => handleHistoryClick(entry)}
                                                className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                        @{entry.username} • {entry.followers} followers
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                        <Clock className="w-12 h-12 mx-auto mb-2" />
                                        <p className="text-sm">No history yet</p>
                                        <p className="text-xs">Your search history will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center text-xs text-[var(--text-muted)]">
                            <div className="flex items-center justify-center space-x-2">
                                <Github className="w-3 h-3" />
                                <p>Powered by GitHub Public API • Rate limits may apply</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
