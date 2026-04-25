import { useState, useEffect, useMemo } from 'react'
import { Globe, Search, MapPin, Users, DollarSign, Copy, Settings, Clock, Shield, AlertCircle, Languages, ExternalLink } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface Country {
    name: { common: string; official: string }
    capital?: string[]
    population: number
    region: string
    subregion?: string
    languages?: { [key: string]: string }
    currencies?: { [key: string]: { name: string; symbol: string } }
    flags: { png: string; svg: string; alt?: string }
    timezones: string[]
    area: number
    maps: { googleMaps: string }
}

export function CountryInfoTool() {
    const [query, setQuery] = usePersistentState('country_query', '')
    const [results, setResults] = useState<Country[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [searchHistory, setSearchHistory] = usePersistentState('country_history', [] as Array<{country: string, timestamp: string, resultCount: number}>)
    const [autoSearch, setAutoSearch] = usePersistentState('country_auto_search', false)
    const [showTimezones, setShowTimezones] = usePersistentState('country_show_timezones', true)
    const [showCurrencies, setShowCurrencies] = usePersistentState('country_show_currencies', true)
    const [showLanguages, setShowLanguages] = usePersistentState('country_show_languages', true)
    const [sortBy, setSortBy] = usePersistentState('country_sort_by', 'name')

    const searchCountry = async () => {
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setResults(null)

        try {
            // REST Countries API - completely free, no key!
            const response = await fetch(
                `https://restcountries.com/v3.1/name/${encodeURIComponent(query.trim())}`
            )

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Country not found. Try a different name.')
                }
                throw new Error('Failed to fetch country data')
            }

            const data = await response.json()
            
            // Sort results based on preference
            let sortedData = data
            if (sortBy === 'name') {
                sortedData = data.sort((a: Country, b: Country) => a.name.common.localeCompare(b.name.common))
            } else if (sortBy === 'population') {
                sortedData = data.sort((a: Country, b: Country) => b.population - a.population)
            } else if (sortBy === 'area') {
                sortedData = data.sort((a: Country, b: Country) => b.area - a.area)
            }
            
            setResults(sortedData)
            
            // Add to history
            const newEntry = {
                country: query.trim(),
                timestamp: new Date().toISOString(),
                resultCount: data.length
            }
            setSearchHistory(prev => [newEntry, ...prev.slice(0, 9)])
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    // Auto search when query changes
    useEffect(() => {
        if (autoSearch && query.trim()) {
            const timeoutId = setTimeout(() => {
                searchCountry()
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    }, [query, autoSearch, sortBy])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchCountry()
        }
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num)
    }

    const handleCopy = (text: string) => {
        copyToClipboard(text)
    }

    const handleClearHistory = () => {
        setSearchHistory([])
    }

    const handleHistoryClick = (entry: {country: string}) => {
        setQuery(entry.country)
        searchCountry()
    }

    const getCharacterCount = () => query.length
    const getWordCount = () => query.trim().split(/\s+/).filter(word => word.length > 0).length

    const computed = useMemo(() => {
        if (!results || results.length === 0) return { totalCountries: 0, totalPopulation: 0, totalArea: 0, totalLanguages: 0 }
        
        let totalCountries = results.length
        let totalPopulation = results.reduce((sum, country) => sum + country.population, 0)
        let totalArea = results.reduce((sum, country) => sum + country.area, 0)
        let totalLanguages = new Set<string>()
        
        results.forEach(country => {
            if (country.languages) {
                Object.values(country.languages).forEach(lang => totalLanguages.add(lang))
            }
        })
        
        return { totalCountries, totalPopulation, totalArea, totalLanguages: totalLanguages.size }
    }, [results])

    return (
        <ToolLayout
            title="Country Info"
            description="Look up detailed information about any country in the world with advanced features."
            icon={Globe}
            onReset={() => { setQuery(''); setResults(null); setError(null) }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Country Info</h2>
                            <p className="text-sm text-[var(--text-muted)]">Global country database</p>
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
                    </div>
                </div>

                {/* Enhanced Search Input */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Search Country</label>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-2xl font-bold p-6 rounded-2xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all"
                                placeholder="Type country name..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                                {getCharacterCount()} chars • {getWordCount()} words
                            </div>
                        </div>
                        <button
                            onClick={searchCountry}
                            disabled={loading || !query.trim()}
                            className={cn(
                                "px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center space-x-2",
                                loading || !query.trim()
                                    ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                                    : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                        >
                            <Search className="w-5 h-5" />
                            <span>{loading ? 'Searching...' : 'Search'}</span>
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
                                    id="auto_search"
                                    checked={autoSearch}
                                    onChange={(e) => setAutoSearch(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_search" className="text-sm text-[var(--text-primary)]">Auto Search</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_timezones"
                                    checked={showTimezones}
                                    onChange={(e) => setShowTimezones(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_timezones" className="text-sm text-[var(--text-primary)]">Show Timezones</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_currencies"
                                    checked={showCurrencies}
                                    onChange={(e) => setShowCurrencies(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_currencies" className="text-sm text-[var(--text-primary)]">Show Currencies</label>
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
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="name">Name</option>
                                    <option value="population">Population</option>
                                    <option value="area">Area</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses REST Countries API for comprehensive country data including demographics, geography, languages, currencies, and more.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg">
                            Searching countries...
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
                {results && results.length > 0 && (
                    <div className="space-y-8">
                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Countries</div>
                                <div className="text-2xl font-black text-brand">{computed.totalCountries}</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Population</div>
                                <div className="text-2xl font-black text-brand">{formatNumber(computed.totalPopulation)}</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Area</div>
                                <div className="text-2xl font-black text-brand">{formatNumber(computed.totalArea)} km²</div>
                            </div>
                            <div className="p-4 glass rounded-xl border text-center">
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Languages</div>
                                <div className="text-2xl font-black text-brand">{computed.totalLanguages}</div>
                            </div>
                        </div>

                        {/* Country Results */}
                        {results.map((country, idx) => (
                            <div key={idx} className="glass p-8 rounded-3xl border-[var(--border-primary)] space-y-6">
                                {/* Flag & Name */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <img
                                            src={country.flags.png}
                                            alt={country.flags.alt || `${country.name.common} flag`}
                                            className="w-24 h-16 object-cover rounded-xl shadow-lg border-2 border-[var(--border-primary)] transition-transform group-hover:scale-105"
                                        />
                                        <button
                                            onClick={() => handleCopy(country.name.common)}
                                            className="absolute -top-2 -right-2 p-1 bg-brand text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-brand">
                                            {country.name.common}
                                        </h2>
                                        <p className="text-lg text-[var(--text-muted)] mt-1">
                                            {country.name.official}
                                        </p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Capital */}
                                    {country.capital && (
                                        <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="w-4 h-4 text-brand" />
                                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                    Capital
                                                </p>
                                            </div>
                                            <p className="text-xl font-black text-[var(--text-primary)]">
                                                {country.capital.join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Population */}
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Population
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {formatNumber(country.population)}
                                        </p>
                                    </div>

                                    {/* Region */}
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Region
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {country.region}
                                            {country.subregion && (
                                                <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
                                                    ({country.subregion})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Area */}
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Area
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {formatNumber(country.area)} km²
                                        </p>
                                    </div>
                                </div>

                                {/* Languages */}
                                {showLanguages && country.languages && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Languages className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Languages
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.values(country.languages).map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-bold cursor-pointer hover:bg-brand/20 transition-colors"
                                                    onClick={() => setQuery(lang)}
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Currencies */}
                                {showCurrencies && country.currencies && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <DollarSign className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Currencies
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(country.currencies).map(([code, curr]) => (
                                                <div key={code} className="flex items-center gap-2">
                                                    <span className="font-black text-[var(--text-primary)]">
                                                        {curr.symbol} {code}
                                                    </span>
                                                    <span className="text-sm text-[var(--text-muted)]">
                                                        - {curr.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timezones */}
                                {showTimezones && country.timezones && country.timezones.length > 0 && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="w-4 h-4 text-brand" />
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                Timezones
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {country.timezones.map((tz, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm font-mono text-[var(--text-primary)]"
                                                >
                                                    {tz}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Google Maps Link */}
                                <div className="pt-4">
                                    <a
                                        href={country.maps.googleMaps}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-full transition-all font-bold text-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View on Google Maps
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                                                {entry.resultCount} results
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.country}
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

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)]">
                    <div className="flex items-center justify-center space-x-2">
                        <Globe className="w-3 h-3" />
                        <p>Powered by REST Countries API • Free & Open Source</p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
