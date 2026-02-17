import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react'

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
    const [amount, setAmount] = useState('100')
    const [fromCurrency, setFromCurrency] = useState('USD')
    const [toCurrency, setToCurrency] = useState('EUR')
    const [rates, setRates] = useState<ExchangeRates>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [result, setResult] = useState<number | null>(null)

    const fetchRates = async () => {
        setLoading(true)
        setError(null)
        try {
            // Frankfurter API - Free, no API key required!
            const response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`)
            if (!response.ok) throw new Error('Failed to fetch exchange rates')
            const data = await response.json()
            setRates(data.rates)
            setLastUpdated(new Date(data.date))
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRates()
    }, [fromCurrency])

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

    const swapCurrencies = () => {
        setFromCurrency(toCurrency)
        setToCurrency(fromCurrency)
    }

    const fromSymbol = POPULAR_CURRENCIES.find(c => c.code === fromCurrency)?.symbol || fromCurrency
    const toSymbol = POPULAR_CURRENCIES.find(c => c.code === toCurrency)?.symbol || toCurrency

    return (
        <ToolLayout
            title="Currency Converter"
            description="Real-time currency conversion with live exchange rates."
            icon={DollarSign}
            onReset={() => { setAmount('100'); setFromCurrency('USD'); setToCurrency('EUR') }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Amount Input */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        Amount
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-4xl font-black p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-center"
                        placeholder="100"
                        step="0.01"
                    />
                </div>

                {/* From Currency */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        From
                    </label>
                    <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="w-full text-xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer"
                    >
                        {POPULAR_CURRENCIES.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                                {curr.symbol} {curr.code} - {curr.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                    <button
                        onClick={swapCurrencies}
                        className="p-4 rounded-full bg-brand hover:bg-brand/80 text-white transition-all hover:scale-110 shadow-lg shadow-brand/20"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                </div>

                {/* To Currency */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                        To
                    </label>
                    <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="w-full text-xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer"
                    >
                        {POPULAR_CURRENCIES.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                                {curr.symbol} {curr.code} - {curr.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Result */}
                {result !== null && (
                    <div className="glass p-10 rounded-[3rem] border-[var(--border-primary)] space-y-4">
                        <div className="flex items-baseline justify-center space-x-3">
                            <span className="text-6xl font-black text-brand">
                                {toSymbol}
                            </span>
                            <span className="text-6xl font-black text-[var(--text-primary)]">
                                {result.toFixed(2)}
                            </span>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[var(--text-muted)] text-sm">
                                {fromSymbol}{parseFloat(amount).toFixed(2)} {fromCurrency} = {toSymbol}{result.toFixed(2)} {toCurrency}
                            </p>
                            {lastUpdated && (
                                <p className="text-[var(--text-muted)] text-xs flex items-center justify-center space-x-2">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Rate updated: {lastUpdated.toLocaleDateString()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Exchange Rate */}
                {rates[toCurrency] && (
                    <div className="text-center p-6 rounded-[2rem] bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]">
                        <p className="text-sm text-[var(--text-muted)] mb-2 uppercase tracking-widest font-bold">Current Rate</p>
                        <p className="text-xl font-black text-brand">
                            1 {fromCurrency} = {rates[toCurrency].toFixed(4)} {toCurrency}
                        </p>
                    </div>
                )}

                {/* Loading/Error States */}
                {loading && (
                    <div className="text-center text-brand font-bold animate-pulse">
                        Fetching latest rates...
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)] space-y-1">
                    <p>Powered by Frankfurter API • Free & Open Source</p>
                    <p>Rates are indicative and may differ from actual transaction rates</p>
                </div>
            </div>
        </ToolLayout>
    )
}
