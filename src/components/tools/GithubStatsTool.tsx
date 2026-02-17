import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Github, Search, Book, Users, Star, Link } from 'lucide-react'
import { cn } from '../../lib/utils'

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
}

export function GithubStatsTool() {
    const [username, setUsername] = useState('')
    const [userData, setUserData] = useState<GithubUser | null>(null)
    const [repos, setRepos] = useState<GithubRepo[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                throw new Error('Failed to fetch user data')
            }
            const user = await userRes.json()
            setUserData(user)

            // Fetch Repos
            const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`)
            if (reposRes.ok) {
                const repoData = await reposRes.json()
                setRepos(repoData)
            }
        } catch (err: any) {
            setError(err.message || 'Error fetching data')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') fetchGithubData()
    }

    return (
        <ToolLayout
            title="GitHub Stats Viewer"
            description="View detailed statistics and repositories for any GitHub user."
            icon={Github}
            onReset={() => { setUsername(''); setUserData(null); setRepos([]); setError(null) }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Search */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        GitHub Username
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 text-2xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-mono"
                            placeholder="octocat"
                        />
                        <button
                            onClick={fetchGithubData}
                            disabled={loading || !username.trim()}
                            className={cn(
                                "px-8 py-4 rounded-[2rem] font-black uppercase tracking-wider transition-all",
                                loading || !username.trim()
                                    ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                    : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                        >
                            <Search className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16 animate-pulse">
                        <Github className="w-16 h-16 text-brand mx-auto mb-4 animate-bounce" />
                        <p className="text-brand font-bold text-xl">Searching GitHub...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center">
                        <p className="text-red-500 font-bold text-lg">{error}</p>
                    </div>
                )}

                {/* Results */}
                {userData && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {/* User Profile Card */}
                        <div className="glass p-8 rounded-[3rem] border-[var(--border-primary)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand/20 to-purple-500/20" />

                            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 mt-12">
                                <img
                                    src={userData.avatar_url}
                                    alt={userData.login}
                                    className="w-32 h-32 rounded-full border-4 border-[var(--bg-primary)] shadow-xl"
                                />

                                <div className="text-center md:text-left space-y-2 flex-1">
                                    <h2 className="text-4xl font-black text-[var(--text-primary)]">
                                        {userData.name}
                                    </h2>
                                    <p className="text-xl font-mono text-[var(--text-muted)]">@{userData.login}</p>

                                    {userData.bio && (
                                        <p className="text-lg text-[var(--text-secondary)] italic max-w-2xl">
                                            "{userData.bio}"
                                        </p>
                                    )}

                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                                        {userData.location && (
                                            <span className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm font-bold text-[var(--text-muted)]">
                                                📍 {userData.location}
                                            </span>
                                        )}
                                        {userData.company && (
                                            <span className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm font-bold text-[var(--text-muted)]">
                                                🏢 {userData.company}
                                            </span>
                                        )}
                                        {userData.blog && (
                                            <a href={userData.blog.startsWith('http') ? userData.blog : `https://${userData.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-full text-sm font-bold transition-colors">
                                                🔗 Website
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 min-w-[150px]">
                                    <div className="p-4 bg-[var(--bg-secondary)]/50 rounded-2xl text-center border border-[var(--border-primary)] hover:scale-105 transition-transform">
                                        <Users className="w-6 h-6 mx-auto mb-2 text-brand" />
                                        <p className="text-2xl font-black text-[var(--text-primary)]">{userData.followers}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Followers</p>
                                    </div>
                                    <div className="p-4 bg-[var(--bg-secondary)]/50 rounded-2xl text-center border border-[var(--border-primary)] hover:scale-105 transition-transform">
                                        <Book className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                        <p className="text-2xl font-black text-[var(--text-primary)]">{userData.public_repos}</p>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Repos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Repos Grid */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] pl-4 border-l-4 border-brand">Recent Repositories</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {repos.map((repo) => (
                                    <a
                                        key={repo.id}
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-6 bg-[var(--bg-secondary)]/30 rounded-[2rem] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50 hover:scale-[1.02] transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-lg font-black text-brand line-clamp-1">{repo.name}</h4>
                                            <div className="flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-lg">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold">{repo.stargazers_count}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 h-10 mb-4">
                                            {repo.description || 'No description provided.'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                                <span className="w-2 h-2 rounded-full bg-brand" />
                                                {repo.language || 'Unknown'}
                                            </span>
                                            <Link className="w-4 h-4 text-[var(--text-muted)] group-hover:text-brand transition-colors" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)] pt-8">
                    <p>Powered by GitHub Public API • Rate limits may apply</p>
                </div>
            </div>
        </ToolLayout>
    )
}
