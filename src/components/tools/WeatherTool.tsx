import React, { useState, useEffect, useMemo } from 'react'
import { Cloud, Sun, Wind, Droplets, MapPin, Search, Navigation, Copy, Check, Settings, Clock, Shield, AlertCircle, RefreshCw, Eye, Gauge, Compass, X } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

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
        pressure_msl?: number
        precipitation?: number
        cloud_cover?: number
        visibility?: number
    }
    current_units: {
        temperature_2m: string
        relative_humidity_2m: string
        wind_speed_10m: string
        pressure_msl?: string
        precipitation?: string
        cloud_cover?: string
        visibility?: string
    }
    daily?: Array<{
        time: string
        temperature_2m_max: number
        temperature_2m_min: number
        weather_code: number
        precipitation_sum: number
        wind_speed_10m_max: number
    }>
    hourly?: Array<{
        temperature_2m: number
        weather_code: number
        precipitation: number
        wind_speed_10m: number
        time: string
    }>
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
    const [query, setQuery] = usePersistentState('weather_query', 'London')
    const [geoResults, setGeoResults] = useState<GeoResult[]>([])
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<GeoResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [searchHistory, setSearchHistory] = usePersistentState('weather_history', [] as Array<{location: string, timestamp: string, temperature: number}>)
    const [autoRefresh, setAutoRefresh] = usePersistentState('weather_auto_refresh', false)
    const [refreshInterval, setRefreshInterval] = usePersistentState('weather_refresh_interval', 300000) // 5 minutes
    const [temperatureUnit, setTemperatureUnit] = usePersistentState('weather_temp_unit', 'celsius')
    const [windSpeedUnit, setWindSpeedUnit] = usePersistentState('weather_wind_unit', 'mph')
    const [showForecast, setShowForecast] = usePersistentState('weather_show_forecast', false)
    const [showDetails, setShowDetails] = usePersistentState('weather_show_details', true)

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
            const tempUnit = temperatureUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
            const windUnit = windSpeedUnit === 'kmh' ? 'kmh' : windSpeedUnit === 'ms' ? 'ms' : 'mph'
            
            let url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,pressure_msl,precipitation,cloud_cover,visibility&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`
            
            if (showForecast) {
                url += '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max'
                url += '&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m'
                url += '&forecast_days=7'
            }
            
            const response = await fetch(url)
            const data = await response.json()
            setWeather(data)
            
            // Add to history
            const newEntry = {
                location: location.name,
                timestamp: new Date().toISOString(),
                temperature: Math.round(data.current.temperature_2m)
            }
            setSearchHistory(prev => [newEntry, ...prev.slice(0, 9)])
        } catch (err) {
            setError('Failed to fetch weather data')
        } finally {
            setLoading(false)
        }
    }

    // Auto refresh functionality
    useEffect(() => {
        if (autoRefresh && selectedLocation) {
            const interval = setInterval(() => {
                getWeather(selectedLocation)
            }, refreshInterval)
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, selectedLocation, temperatureUnit, windSpeedUnit, showForecast])

    // Auto search on query change (with debouncing)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim() && query.length >= 2 && !selectedLocation) {
                searchLocation()
            } else if (!query.trim()) {
                setGeoResults([])
            }
        }, 300) // 300ms debounce

        return () => clearTimeout(timeoutId)
    }, [query, selectedLocation])

    // Auto search on initial load
    useEffect(() => {
        if (query && !selectedLocation) {
            searchLocation()
        }
    }, [])

    const handleClearInput = () => {
        setQuery('')
        setGeoResults([])
        setError(null)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') searchLocation()
    }

    const handleCopy = () => {
        if (!weather || !selectedLocation) return
        
        const weatherText = `Weather for ${selectedLocation.name}:\n` +
            `Temperature: ${Math.round(weather.current.temperature_2m)}°${temperatureUnit === 'fahrenheit' ? 'F' : 'C'}\n` +
            `Condition: ${getWeatherDescription(weather.current.weather_code)}\n` +
            `Humidity: ${weather.current.relative_humidity_2m}%\n` +
            `Wind: ${weather.current.wind_speed_10m} ${windSpeedUnit}\n` +
            (weather.current.pressure_msl ? `Pressure: ${weather.current.pressure_msl} hPa\n` : '') +
            (weather.current.precipitation ? `Precipitation: ${weather.current.precipitation} mm\n` : '') +
            (weather.current.cloud_cover ? `Cloud Cover: ${weather.current.cloud_cover}%\n` : '') +
            (weather.current.visibility ? `Visibility: ${weather.current.visibility} km\n` : '')
        
        copyToClipboard(weatherText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClearHistory = () => {
        setSearchHistory([])
    }

    const handleHistoryClick = (entry: {location: string}) => {
        setQuery(entry.location)
        searchLocation()
    }

    const getTemperatureIcon = (code: number, isDay: number) => {
        if (code === 0) return isDay ? Sun : Cloud
        if (code >= 1 && code <= 3) return Cloud
        if (code >= 45 && code <= 48) return Cloud
        if (code >= 51 && code <= 55) return Cloud
        if (code >= 61 && code <= 65) return Cloud
        if (code >= 71 && code <= 77) return Cloud
        if (code >= 80 && code <= 86) return Cloud
        if (code >= 95 && code <= 99) return Cloud
        return Cloud
    }

    const getTemperatureColor = (temp: number) => {
        if (temp <= 0) return 'text-blue-500'
        if (temp <= 10) return 'text-cyan-500'
        if (temp <= 20) return 'text-green-500'
        if (temp <= 30) return 'text-yellow-500'
        return 'text-red-500'
    }

    const computed = useMemo(() => {
        if (!weather) return { feelsLike: 0, uvIndex: 0, airQuality: 'Good' }
        
        // Simple feels like calculation
        const feelsLike = weather.current.temperature_2m - (weather.current.wind_speed_10m * 0.2)
        
        return {
            feelsLike: Math.round(feelsLike),
            uvIndex: weather.current.is_day ? 5 : 0, // Placeholder
            airQuality: 'Good' // Placeholder
        }
    }, [weather])

    return (
        <ToolLayout
            title="Weather Lookup"
            description="Real-time weather information using Open-Meteo API with advanced features."
            icon={Cloud}
            onReset={() => {
                setQuery('London')
                setGeoResults([])
                setWeather(null)
                setSelectedLocation(null)
                setError(null)
            }}
            onCopy={weather ? handleCopy : undefined}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Cloud className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Weather</h2>
                            <p className="text-sm text-[var(--text-muted)]">Real-time weather data</p>
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
                            disabled={!weather}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                weather ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Search */}
                <div className="relative">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-lg font-bold p-4 rounded-xl bg-[var(--input-bg)] border-2 border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/20 focus:border-brand transition-all pl-12 pr-16 shadow-lg"
                                placeholder="Enter city name..."
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {query && !loading && (
                                    <button
                                        onClick={handleClearInput}
                                        className="p-1 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
                                        title="Clear input"
                                    >
                                        <X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                                    </button>
                                )}
                                {loading && (
                                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={searchLocation}
                            disabled={loading || !query.trim()}
                            className="px-6 py-4 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-white font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Search
                        </button>
                    </div>

                    {/* Enhanced Geo Results Dropdown */}
                    {geoResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl">
                            <div className="p-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                                    Found {geoResults.length} location{geoResults.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {geoResults.map((result, index) => (
                                    <button
                                        key={result.id}
                                        onClick={() => getWeather(result)}
                                        className="w-full text-left p-3 hover:bg-[var(--bg-primary)] transition-all duration-200 flex items-center justify-between group border-b border-[var(--border-primary)] last:border-0 hover:border-brand/30"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-base text-[var(--text-primary)] group-hover:text-brand transition-colors">
                                                {result.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] font-mono mt-1 opacity-70">
                                                {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Select</p>
                                                <p className="text-xs text-[var(--text-muted)] font-mono">#{index + 1}</p>
                                            </div>
                                            <Navigation className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
                                    id="show_forecast"
                                    checked={showForecast}
                                    onChange={(e) => setShowForecast(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_forecast" className="text-sm text-[var(--text-primary)]">Show Forecast</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show_details"
                                    checked={showDetails}
                                    onChange={(e) => setShowDetails(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_details" className="text-sm text-[var(--text-primary)]">Show Details</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Temperature Unit</label>
                                <select
                                    value={temperatureUnit}
                                    onChange={(e) => setTemperatureUnit(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="celsius">Celsius</option>
                                    <option value="fahrenheit">Fahrenheit</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Wind Speed Unit</label>
                                <select
                                    value={windSpeedUnit}
                                    onChange={(e) => setWindSpeedUnit(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                >
                                    <option value="mph">mph</option>
                                    <option value="kmh">km/h</option>
                                    <option value="ms">m/s</option>
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
                                Uses Open-Meteo API for real-time weather data. Includes current conditions, forecasts, and detailed atmospheric information.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg flex items-center justify-center gap-3">
                            <Cloud className="w-8 h-8 animate-bounce" />
                            Fetching weather data...
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

                {/* Weather Display */}
                {weather && selectedLocation && (
                    <div className="glass p-8 rounded-3xl border-[var(--border-primary)] space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black text-brand flex items-center justify-center gap-3">
                                <MapPin className="w-8 h-8" />
                                {selectedLocation.name}
                            </h2>
                            <p className="text-lg text-[var(--text-muted)] font-medium">
                                {selectedLocation.admin1 ? `${selectedLocation.admin1}, ` : ''}{selectedLocation.country}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs font-mono text-[var(--text-muted]">
                                {selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E
                            </div>
                        </div>

                        {/* Main Weather */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-gradient-to-br from-brand/20 to-brand/5 rounded-2xl border border-brand/10 flex flex-col items-center justify-center text-center space-y-4">
                                <div className={`w-16 h-16 ${weather.current.is_day ? 'text-orange-400' : 'text-slate-400'}`}>
                                    {React.createElement(getTemperatureIcon(weather.current.weather_code, weather.current.is_day), { className: "w-full h-full" })}
                                </div>
                                <span className={`text-6xl font-black ${getTemperatureColor(Math.round(weather.current.temperature_2m))}`}>
                                    {Math.round(weather.current.temperature_2m)}°{temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                                </span>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    {getWeatherDescription(weather.current.weather_code)}
                                </span>
                                {showDetails && (
                                    <div className="text-xs text-[var(--text-muted)]">
                                        Feels like: {computed.feelsLike}°{temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)] grid grid-cols-2 gap-4">
                                {showDetails && weather.current.pressure_msl && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Gauge className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pressure</p>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {weather.current.pressure_msl} hPa
                                        </p>
                                    </div>
                                )}
                                {showDetails && weather.current.precipitation && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Droplets className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Precipitation</p>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {weather.current.precipitation} mm
                                        </p>
                                    </div>
                                )}
                                {showDetails && weather.current.cloud_cover && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Cloud className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Cloud Cover</p>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {weather.current.cloud_cover}%
                                        </p>
                                    </div>
                                )}
                                {showDetails && weather.current.visibility && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Eye className="w-5 h-5 text-green-500" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Visibility</p>
                                        <p className="text-xl font-black text-[var(--text-primary)]">
                                            {weather.current.visibility} km
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)] flex items-center gap-4">
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

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-primary)] flex items-center gap-4">
                                <div className="p-3 bg-teal-500/10 rounded-full text-teal-500">
                                    <Wind className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Wind Speed</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">
                                        {weather.current.wind_speed_10m} <span className="text-sm">{windSpeedUnit}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Forecast */}
                        {showForecast && weather.daily && (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-brand flex items-center gap-2">
                                    <Clock className="w-6 h-6" />
                                    7-Day Forecast
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                                    {weather.daily.slice(0, 7).map((day, index) => (
                                        <div key={index} className="p-4 bg-[var(--bg-secondary)]/20 rounded-xl border border-[var(--border-primary)] text-center">
                                            <p className="text-xs text-[var(--text-muted)] font-bold">
                                                {new Date(day.time).toLocaleDateString('en', { weekday: 'short' })}
                                            </p>
                                            <div className={`w-8 h-8 mx-auto ${day.weather_code === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                {React.createElement(getTemperatureIcon(day.weather_code, 1), { className: "w-full h-full" })}
                                            </div>
                                            <p className="text-lg font-black text-[var(--text-primary)]">
                                                {Math.round(day.temperature_2m_max)}°
                                            </p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {Math.round(day.temperature_2m_min)}°
                                            </p>
                                        </div>
                                    ))}
                                </div>
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
                                                        {entry.temperature}°{temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                                    {entry.location}
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
                                <Compass className="w-3 h-3" />
                                <p>Powered by Open-Meteo • No API Key Required</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
