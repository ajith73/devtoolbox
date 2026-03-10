import { useState, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { usePersistentState } from '../../lib/storage'
import { DollarSign, TrendingUp, Zap, ArrowRightLeft } from 'lucide-react'

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
        const tempFrom = fromCurrency
        setFromCurrency(toCurrency)
        setToCurrency(tempFrom)
    }

    const fromSymbol = POPULAR_CURRENCIES.find(c => c.code === fromCurrency)?.symbol || fromCurrency
    const toSymbol = POPULAR_CURRENCIES.find(c => c.code === toCurrency)?.symbol || toCurrency

    return (
        <ToolLayout
            title="Currency Converter"
            description="Real-time currency transformation system utilizing live neural exchange rate telemetry."
            icon={DollarSign}
            onReset={() => { setAmount('100'); setFromCurrency('USD'); setToCurrency('EUR') }}
        >
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Amount Matrix */}
                <div className="space-y-6 text-center">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em]">
                        Quantum Amount Descriptor
                    </label>
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
                </div>

                {/* Exchange Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-6">
                            Origin
                        </label>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="w-full text-xl font-black p-8 rounded-[2.5rem] bg-[var(--bg-secondary)]/40 border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-8 focus:ring-brand/5 transition-all cursor-pointer outline-none appearance-none shadow-xl"
                        >
                            {POPULAR_CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code} className="bg-[var(--bg-primary)]">
                                    {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
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
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-6">
                            Destination
                        </label>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="w-full text-xl font-black p-8 rounded-[2.5rem] bg-[var(--bg-secondary)]/40 border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-8 focus:ring-brand/5 transition-all cursor-pointer outline-none appearance-none shadow-xl"
                        >
                            {POPULAR_CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code} className="bg-[var(--bg-primary)]">
                                    {curr.code} - {curr.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Result Section */}
                {result !== null && (
                    <div className="glass p-12 rounded-[4rem] border-[var(--border-primary)] space-y-8 bg-brand/5 shadow-3xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-[4rem] group-hover:bg-brand/10 transition-colors pointer-events-none" />

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.6em]">Transformation Results</p>
                            <div className="flex items-baseline justify-center space-x-4">
                                <span className="text-4xl md:text-5xl font-black text-brand opacity-40">
                                    {toSymbol}
                                </span>
                                <span className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter">
                                    {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-4 pt-6 border-t border-brand/10">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center space-x-3">
                                <Zap className="w-3.5 h-3.5 text-brand" />
                                <span>{parseFloat(amount).toLocaleString()} {fromCurrency} EQUALS {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}</span>
                            </p>
                            {lastUpdated && (
                                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 opacity-40">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Rate Telemetry Updated: {lastUpdated.toLocaleDateString()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Telemetry Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    {rates[toCurrency] && (
                        <div className="p-8 rounded-[2.5rem] bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-inner text-center space-y-3 group hover:border-brand/30 transition-all">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">Neural Exchange Vector</p>
                            <p className="text-2xl font-black text-brand group-hover:scale-110 transition-transform">
                                1.00 {fromCurrency} = {rates[toCurrency].toFixed(4)} {toCurrency}
                            </p>
                        </div>
                    )}
                    <div className="p-8 rounded-[2.5rem] bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] shadow-inner text-center space-y-3 group hover:border-brand/30 transition-all flex flex-col justify-center">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">Source Provider</p>
                        <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Frankfurter Federated API • Real-time</p>
                    </div>
                </div>

                {/* Status Overlays */}
                {loading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/40 backdrop-blur-sm pointer-events-none">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 border-4 border-brand/20 rounded-full border-t-brand animate-spin" />
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.5em]">Synchronizing Exchange Telemetry...</p>
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
