import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Globe, Search, MapPin, Users, DollarSign } from 'lucide-react'
import { cn } from '../../lib/utils'

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
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Country[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            setResults(data)
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchCountry()
        }
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num)
    }

    return (
        <ToolLayout
            title="Country Info"
            description="Look up detailed information about any country in the world."
            icon={Globe}
            onReset={() => { setQuery(''); setResults(null); setError(null) }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Search Input */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        Search Country
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 text-2xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all"
                            placeholder="Type country name..."
                        />
                        <button
                            onClick={searchCountry}
                            disabled={loading || !query.trim()}
                            className={cn(
                                "px-8 py-4 rounded-[2rem] font-black uppercase tracking-wider transition-all",
                                loading || !query.trim()
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
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg">
                            Searching countries...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center">
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results && results.length > 0 && (
                    <div className="space-y-6">
                        {results.map((country, idx) => (
                            <div key={idx} className="glass p-8 rounded-[3rem] border-[var(--border-primary)] space-y-6">
                                {/* Flag & Name */}
                                <div className="flex items-center gap-6">
                                    <img
                                        src={country.flags.png}
                                        alt={country.flags.alt || `${country.name.common} flag`}
                                        className="w-24 h-16 object-cover rounded-xl shadow-lg border-2 border-[var(--border-primary)]"
                                    />
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
                                {country.languages && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                            Languages
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.values(country.languages).map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-bold"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Currencies */}
                                {country.currencies && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                            Currencies
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(country.currencies).map(([code, curr]) => (
                                                <div key={code} className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-brand" />
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
                                {country.timezones && country.timezones.length > 0 && (
                                    <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                            Timezones
                                        </p>
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
                                        <MapPin className="w-4 h-4" />
                                        View on Google Maps
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)]">
                    <p>Powered by REST Countries API • Free & Open Source</p>
                </div>
            </div>
        </ToolLayout>
    )
}
