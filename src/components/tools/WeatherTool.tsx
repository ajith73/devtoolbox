import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Cloud, Sun, Wind, Droplets, MapPin, Thermometer, Search, Navigation } from 'lucide-react'

interface GeoResult {
    id: number
    name: string
    latitude: number
    longitude: number
    country: string
    admin1?: string
}

interface WeatherData {
    current: {
        temperature_2m: number
        relative_humidity_2m: number
        wind_speed_10m: number
        weather_code: number
        is_day: number
    }
    current_units: {
        temperature_2m: string
        relative_humidity_2m: string
        wind_speed_10m: string
    }
}

// WMO Weather interpretation codes (WW)
const getWeatherDescription = (code: number) => {
    const descriptions: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail'
    }
    return descriptions[code] || 'Unknown'
}

export function WeatherTool() {
    const [query, setQuery] = useState('')
    const [geoResults, setGeoResults] = useState<GeoResult[]>([])
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<GeoResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const searchLocation = async () => {
        if (!query.trim()) return
        setLoading(true)
        setError(null)
        setGeoResults([])
        setWeather(null)
        setSelectedLocation(null)

        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
            )
            const data = await response.json()

            if (!data.results || data.results.length === 0) {
                setError('Location not found')
            } else {
                setGeoResults(data.results)
            }
        } catch (err) {
            setError('Failed to search location')
        } finally {
            setLoading(false)
        }
    }

    const getWeather = async (location: GeoResult) => {
        setLoading(true)
        setError(null)
        setSelectedLocation(location)
        setGeoResults([]) // Clear search results

        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&wind_speed_unit=mph`
            )
            const data = await response.json()
            setWeather(data)
        } catch (err) {
            setError('Failed to fetch weather data')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') searchLocation()
    }

    return (
        <ToolLayout
            title="Weather Lookup"
            description="Real-time weather information using Open-Meteo API."
            icon={Cloud}
            onReset={() => {
                setQuery('')
                setGeoResults([])
                setWeather(null)
                setSelectedLocation(null)
                setError(null)
            }}
        >
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Search */}
                <div className="relative">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 text-xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all pl-14"
                            placeholder="Enter city name..."
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-muted)]" />
                        <button
                            onClick={searchLocation}
                            disabled={loading || !query.trim()}
                            className="px-8 rounded-[2rem] bg-brand text-white font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            Search
                        </button>
                    </div>

                    {/* Geo Results Dropdown */}
                    {geoResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] overflow-hidden shadow-2xl z-50">
                            {geoResults.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => getWeather(result)}
                                    className="w-full text-left p-4 hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-between group border-b border-[var(--border-primary)] last:border-0"
                                >
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">{result.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                                        </p>
                                    </div>
                                    <Navigation className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12 animate-pulse">
                        <Cloud className="w-12 h-12 text-brand mx-auto mb-4" />
                        <p className="text-brand font-bold">Fetching weather data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center text-red-500 font-bold">
                        {error}
                    </div>
                )}

                {/* Weather Display */}
                {weather && selectedLocation && (
                    <div className="glass p-8 rounded-[3rem] border-[var(--border-primary)] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black text-brand flex items-center justify-center gap-3">
                                <MapPin className="w-8 h-8" />
                                {selectedLocation.name}
                            </h2>
                            <p className="text-lg text-[var(--text-muted)] font-medium">
                                {selectedLocation.country}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs font-mono text-[var(--text-muted)]">
                                {selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E
                            </div>
                        </div>

                        {/* Main Weather */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gradient-to-br from-brand/20 to-brand/5 rounded-[2.5rem] border border-brand/10 flex flex-col items-center justify-center text-center space-y-2">
                                <Thermometer className="w-10 h-10 text-brand" />
                                <span className="text-5xl font-black text-[var(--text-primary)]">
                                    {Math.round(weather.current.temperature_2m)}°
                                </span>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    Temperature
                                </span>
                            </div>

                            <div className="p-6 bg-[var(--bg-secondary)]/30 rounded-[2.5rem] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center space-y-2">
                                {weather.current.is_day ? (
                                    <Sun className="w-10 h-10 text-orange-400" />
                                ) : (
                                    <Cloud className="w-10 h-10 text-slate-400" />
                                )}
                                <span className="text-xl font-bold text-[var(--text-primary)]">
                                    {getWeatherDescription(weather.current.weather_code)}
                                </span>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    Condition
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-[2rem] border border-[var(--border-primary)] flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                                    <Droplets className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Humidity</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">
                                        {weather.current.relative_humidity_2m}%
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-[2rem] border border-[var(--border-primary)] flex items-center gap-4">
                                <div className="p-3 bg-teal-500/10 rounded-full text-teal-500">
                                    <Wind className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Wind</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">
                                        {weather.current.wind_speed_10m} <span className="text-sm">mph</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-xs text-[var(--text-muted)]">
                            Powered by Open-Meteo • No API Key Required
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
