import { useState, useEffect, useMemo } from 'react'
import { DollarSign, Copy, Check, Settings, Search, Clock, Shield, TrendingUp, Database, Zap, ArrowRightLeft, Globe } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface ExchangeRates {
    [key: string]: number
}

const POPULAR_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
]

export function CurrencyConverterTool() {
    const [amount, setAmount] = usePersistentState('currency_amount', '100')
    const [fromCurrency, setFromCurrency] = usePersistentState('currency_from', 'USD')
    const [toCurrency, setToCurrency] = usePersistentState('currency_to', 'EUR')
    const [rates, setRates] = useState<ExchangeRates>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [result, setResult] = useState<number | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [conversionHistory, setConversionHistory] = usePersistentState('currency_history', [] as Array<{amount: string, from: string, to: string, result: number, rate: number, timestamp: string}>)
    const [autoRefresh, setAutoRefresh] = usePersistentState('currency_auto_refresh', false)
    const [refreshInterval, setRefreshInterval] = usePersistentState('currency_refresh_interval', 30000)
    const [decimalPlaces, setDecimalPlaces] = usePersistentState('currency_decimal_places', 2)
    const [showInverseRate, setShowInverseRate] = usePersistentState('currency_show_inverse', true)

    const fetchRates = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`)
            if (!response.ok) throw new Error('Failed to fetch exchange rates')
            const data = await response.json()
            setRates(data.rates)
            setLastUpdated(new Date(data.date))
        } catch (err: any) {
            setError(err.message || 'Network error')
            setRates({})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRates()
    }, [fromCurrency])

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchRates, refreshInterval)
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, fromCurrency])

    useEffect(() => {
        if (rates[toCurrency] && amount) {
            const numAmount = parseFloat(amount)
            if (!isNaN(numAmount)) {
                setResult(numAmount * rates[toCurrency])
            } else {
                setResult(null)
            }
        }
    }, [amount, toCurrency, rates])

    const computed = useMemo(() => {
        if (!result || !rates[toCurrency]) return { inverseRate: null, rate: null }
        const rate = rates[toCurrency]
        const inverseRate = rate > 0 ? 1 / rate : null
        return { inverseRate, rate }
    }, [result, rates, toCurrency])

    const handleCopy = () => {
        if (result !== null) {
            const formattedResult = `${result.toFixed(decimalPlaces)} ${toCurrency}`
            copyToClipboard(formattedResult)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const addToHistory = (amountValue: string, fromValue: string, toValue: string, resultValue: number, rateValue: number) => {
        const newEntry = {
            amount: amountValue,
            from: fromValue,
            to: toValue,
            result: resultValue,
            rate: rateValue,
            timestamp: new Date().toISOString()
        }
        setConversionHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    const handleClearHistory = () => {
        setConversionHistory([])
    }

    const handleHistoryClick = (entry: {amount: string, from: string, to: string}) => {
        setAmount(entry.amount)
        setFromCurrency(entry.from)
        setToCurrency(entry.to)
    }

    // Add to history when conversion succeeds
    useEffect(() => {
        if (result !== null && rates[toCurrency] && amount) {
            addToHistory(amount, fromCurrency, toCurrency, result, rates[toCurrency])
        }
    }, [result, rates, toCurrency, amount])

    const swapCurrencies = () => {
        const tempFrom = fromCurrency
        setFromCurrency(toCurrency)
        setToCurrency(tempFrom)
    }

    const fromSymbol = POPULAR_CURRENCIES.find(c => c.code === fromCurrency)?.symbol || fromCurrency
    const toSymbol = POPULAR_CURRENCIES.find(c => c.code === toCurrency)?.symbol || toCurrency
    const fromCurrencyInfo = POPULAR_CURRENCIES.find(c => c.code === fromCurrency)
    const toCurrencyInfo = POPULAR_CURRENCIES.find(c => c.code === toCurrency)

    const getFormattedResult = () => {
        if (result === null) return ''
        return result.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
    }

    const getRateInfo = () => {
        if (!computed.rate) return ''
        return `1 ${fromCurrency} = ${computed.rate.toFixed(4)} ${toCurrency}`
    }

    const getInverseRateInfo = () => {
        if (!computed.inverseRate) return ''
        return `1 ${toCurrency} = ${computed.inverseRate.toFixed(4)} ${fromCurrency}`
    }

    return (
        <ToolLayout
            title="Currency Converter"
            description="Real-time currency exchange rates for 15+ popular currencies with advanced features."
            icon={DollarSign}
            onReset={() => { setAmount('100'); setFromCurrency('USD'); setToCurrency('EUR') }}
            onCopy={result !== null ? handleCopy : undefined}
            copyDisabled={result === null}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Currency Converter</h2>
                            <p className="text-sm text-[var(--text-muted)]">Real-time exchange rates</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {loading && rates && (
                            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2" />
                        )}
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
                            disabled={result === null}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                result !== null ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Amount Input */}
                <div className="space-y-6 text-center">
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-brand" />
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Amount</label>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-brand scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700" />
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-6xl font-black text-brand pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                            {fromSymbol}
                        </span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-5xl md:text-7xl font-black p-12 pr-12 rounded-[4rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-8 focus:ring-brand/5 transition-all text-center outline-none shadow-2xl placeholder:opacity-10"
                            placeholder="100.00"
                            step="0.01"
                        />
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                        {getFormattedResult()} {toCurrency}
                    </div>
                </div>

                {/* Enhanced Exchange Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">From</label>
                        </div>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="w-full text-xl font-black p-8 rounded-2xl bg-[var(--bg-secondary)]/40 border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-8 focus:ring-brand/5 transition-all cursor-pointer outline-none appearance-none shadow-xl"
                        >
                            {POPULAR_CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code} className="bg-[var(--bg-primary)]">
                                    {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
                        {fromCurrencyInfo && (
                            <div className="mt-2 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest pl-6">
                                {fromCurrencyInfo.name} • {fromCurrencyInfo.symbol}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center pt-8">
                        <button
                            onClick={swapCurrencies}
                            className="p-6 rounded-3xl glass hover:bg-brand hover:text-white text-brand transition-all hover:scale-110 active:scale-95 shadow-2xl border-[var(--border-primary)]"
                            title="Swap Currencies"
                        >
                            <ArrowRightLeft className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">To</label>
                        </div>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="w-full text-xl font-black p-8 rounded-2xl bg-[var(--bg-secondary)]/40 border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-8 focus:ring-brand/5 transition-all cursor-pointer outline-none appearance-none shadow-xl"
                        >
                            {POPULAR_CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code} className="bg-[var(--bg-primary)]">
                                    {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
                        {toCurrencyInfo && (
                            <div className="mt-2 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest pl-6">
                                {toCurrencyInfo.name} • {toCurrencyInfo.symbol}
                            </div>
                        )}
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
                                    id="show_inverse_rate"
                                    checked={showInverseRate}
                                    onChange={(e) => setShowInverseRate(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="show_inverse_rate" className="text-sm text-[var(--text-primary)]">Show Inverse Rate</label>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Refresh Interval (seconds)</label>
                                <input
                                    type="number"
                                    value={refreshInterval / 1000}
                                    onChange={(e) => setRefreshInterval(Number(e.target.value) * 1000)}
                                    min={5}
                                    max={300}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">5-300 seconds</p>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Decimal Places</label>
                                <input
                                    type="number"
                                    value={decimalPlaces}
                                    onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                                    min={0}
                                    max={8}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-sm font-mono"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">0-8 decimal places</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">API Information</span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">
                                Uses Frankfurter API for real-time exchange rates. Data is refreshed based on your settings and cached for performance.
                            </p>
                        </div>
                    </div>
                )}

                {/* Enhanced Result Section */}
                {result !== null && (
                    <div className="glass p-12 rounded-4xl border-[var(--border-primary)] space-y-8 bg-brand/5 shadow-3xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-4xl group-hover:bg-brand/10 transition-colors pointer-events-none" />

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.6em]">Conversion Results</p>
                            <div className="flex items-baseline justify-center space-x-4">
                                <span className="text-4xl md:text-5xl font-black text-brand opacity-40">
                                    {toSymbol}
                                </span>
                                <span className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter">
                                    {getFormattedResult()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-4 pt-6 border-t border-brand/10">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center space-x-3">
                                <Zap className="w-3.5 h-3.5 text-brand" />
                                <span>{parseFloat(amount).toLocaleString()} {fromCurrency} EQUALS {getFormattedResult()} {toCurrency}</span>
                            </p>
                            {lastUpdated && (
                                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 opacity-40">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Rate Updated: {lastUpdated.toLocaleDateString()}</span>
                                </p>
                            )}
                            {showInverseRate && computed.inverseRate && (
                                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 opacity-40">
                                    <Database className="w-3 h-3" />
                                    <span>{getInverseRateInfo()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Enhanced Telemetry Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
                    {computed.rate && (
                        <div className="p-8 rounded-2xl bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-inner text-center space-y-3 group hover:border-brand/30 transition-all">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">Exchange Rate</p>
                            <p className="text-2xl font-black text-brand group-hover:scale-110 transition-transform">
                                {getRateInfo()}
                            </p>
                        </div>
                    )}
                    {showInverseRate && computed.inverseRate && (
                        <div className="p-8 rounded-2xl bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-inner text-center space-y-3 group hover:border-brand/30 transition-all">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">Inverse Rate</p>
                            <p className="text-2xl font-black text-brand group-hover:scale-110 transition-transform">
                                {getInverseRateInfo()}
                            </p>
                        </div>
                    )}
                    <div className="p-8 rounded-2xl bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-inner text-center space-y-3 group hover:border-brand/30 transition-all flex flex-col justify-center">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">Source Provider</p>
                        <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Frankfurter API • Real-time</p>
                    </div>
                </div>

                {/* Conversion History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={conversionHistory.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                conversionHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {conversionHistory.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {conversionHistory.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {entry.from} → {entry.to}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-primary)] font-mono truncate">
                                            {entry.amount} {entry.from} = {entry.result.toFixed(2)} {entry.to}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-1">
                                            Rate: {entry.rate.toFixed(6)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] opacity-50">
                                <Clock className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">No history yet</p>
                                <p className="text-xs">Your conversion history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Overlays */}
                {loading && !rates && (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-brand font-bold text-lg flex items-center justify-center gap-3">
                            <DollarSign className="w-8 h-8 animate-bounce" />
                            Fetching exchange rates...
                        </div>
                    </div>
                )}
                {error && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center text-red-500 font-black text-[10px] uppercase tracking-widest shadow-lg">
                        {error}
                    </div>
                )}
            </div>
        </ToolLayout>
    )
}
