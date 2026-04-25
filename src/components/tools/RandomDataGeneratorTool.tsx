import { useState, useEffect, useMemo } from 'react'
import { Dices, User, Mail, Phone, MapPin, CreditCard, Calendar, Copy, Check, Settings, Clock, Shield, RefreshCw, Users, FileText } from 'lucide-react'
import { ToolLayout } from './ToolLayout'
import { copyToClipboard, cn } from '../../lib/utils'
import { usePersistentState } from '../../lib/storage'

interface RandomPerson {
    name: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    zipCode: string
    company: string
    jobTitle: string
    creditCard: string
    dateOfBirth: string
    username: string
}

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
const COMPANIES = ['Tech Corp', 'Global Solutions', 'Innovation Labs', 'Digital Systems', 'Cloud Services', 'Data Analytics', 'Smart Technologies', 'Future Ventures', 'Prime Consulting', 'Apex Industries']
const JOB_TITLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager', 'Sales Director', 'HR Manager', 'Financial Analyst', 'Operations Manager', 'Business Analyst']
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Brazil', 'India', 'Singapore']

export function RandomDataGeneratorTool() {
    const [person, setPerson] = useState<RandomPerson | null>(null)
    const [count, setCount] = usePersistentState('random_count', 1)
    const [people, setPeople] = useState<RandomPerson[]>([])
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [copied, setCopied] = useState(false)
    const [generationHistory, setGenerationHistory] = usePersistentState('random_history', [] as Array<{count: number, timestamp: string, format: string}>)
    const [autoGenerate, setAutoGenerate] = usePersistentState('random_auto_generate', false)
    const [outputFormat, setOutputFormat] = usePersistentState('random_output_format', 'json')
    const [includeFields, setIncludeFields] = usePersistentState('random_include_fields', {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        zipCode: true,
        company: true,
        jobTitle: true,
        creditCard: true,
        dateOfBirth: true,
        username: true
    })
    const [dataTypes, setDataTypes] = usePersistentState('random_data_types', ['person'])

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

    const randomNumber = (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min

    const randomString = (length: number, chars: string = 'abcdefghijklmnopqrstuvwxyz') => {
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    const randomDate = () => {
        const year = randomNumber(1950, 2005)
        const month = String(randomNumber(1, 12)).padStart(2, '0')
        const day = String(randomNumber(1, 28)).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const randomCreditCard = () => {
        const parts = Array.from({ length: 4 }, () =>
            String(randomNumber(1000, 9999))
        )
        return parts.join(' ')
    }

    const randomPhone = () => {
        const area = randomNumber(200, 999)
        const exchange = randomNumber(200, 999)
        const number = randomNumber(1000, 9999)
        return `+1 (${area}) ${exchange}-${number}`
    }

    const randomZip = () => String(randomNumber(10000, 99999))

    const generatePerson = (): RandomPerson => {
        const firstName = randomItem(FIRST_NAMES)
        const lastName = randomItem(LAST_NAMES)
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNumber(10, 99)}`

        return {
            name: `${firstName} ${lastName}`,
            email: `${username}@example.com`,
            phone: randomPhone(),
            address: `${randomNumber(100, 9999)} ${randomItem(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} ${randomItem(['St', 'Ave', 'Blvd', 'Rd'])}`,
            city: randomItem(CITIES),
            country: randomItem(COUNTRIES),
            zipCode: randomZip(),
            company: randomItem(COMPANIES),
            jobTitle: randomItem(JOB_TITLES),
            creditCard: randomCreditCard(),
            dateOfBirth: randomDate(),
            username
        }
    }

    const generateRandomEmail = () => {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com']
        const username = randomString(8)
        return `${username}@${randomItem(domains)}`
    }

    const generateRandomPhone = () => {
        const formats = [
            () => `+1 (${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`,
            () => `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`,
            () => `${randomNumber(200, 999)}-${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`
        ]
        return randomItem(formats)()
    }

    const generateRandomAddress = () => {
        const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm Blvd']
        const number = randomNumber(1, 9999)
        return `${number} ${randomItem(streets)}`
    }

    const generateRandomCompany = () => {
        const adjectives = ['Tech', 'Global', 'Digital', 'Smart', 'Innovative', 'Advanced']
        const nouns = ['Solutions', 'Systems', 'Technologies', 'Consulting', 'Ventures', 'Industries']
        return `${randomItem(adjectives)} ${randomItem(nouns)}`
    }

    const generateRandomJobTitle = () => {
        const levels = ['Junior', 'Senior', 'Lead', 'Principal', 'Chief']
        const roles = ['Engineer', 'Manager', 'Developer', 'Analyst', 'Designer', 'Consultant']
        return `${randomItem(levels)} ${randomItem(roles)}`
    }

    const generateData = () => {
        if (dataTypes.includes('person')) {
            return generatePerson()
        }
        
        // Generate other data types based on selection
        const data: any = {}
        
        if (dataTypes.includes('email')) {
            data.email = generateRandomEmail()
        }
        if (dataTypes.includes('phone')) {
            data.phone = generateRandomPhone()
        }
        if (dataTypes.includes('address')) {
            data.address = generateRandomAddress()
            data.city = randomItem(CITIES)
            data.country = randomItem(COUNTRIES)
            data.zipCode = randomZip()
        }
        if (dataTypes.includes('company')) {
            data.company = generateRandomCompany()
            data.jobTitle = generateRandomJobTitle()
        }
        
        return data
    }

    const filterPerson = (person: RandomPerson): Partial<RandomPerson> => {
        const filtered: Partial<RandomPerson> = {}
        
        if (includeFields.name) filtered.name = person.name
        if (includeFields.email) filtered.email = person.email
        if (includeFields.phone) filtered.phone = person.phone
        if (includeFields.address) filtered.address = person.address
        if (includeFields.city) filtered.city = person.city
        if (includeFields.country) filtered.country = person.country
        if (includeFields.zipCode) filtered.zipCode = person.zipCode
        if (includeFields.company) filtered.company = person.company
        if (includeFields.jobTitle) filtered.jobTitle = person.jobTitle
        if (includeFields.creditCard) filtered.creditCard = person.creditCard
        if (includeFields.dateOfBirth) filtered.dateOfBirth = person.dateOfBirth
        if (includeFields.username) filtered.username = person.username
        
        return filtered
    }

    const handleGenerate = () => {
        if (count === 1) {
            const newData = generateData()
            if (dataTypes.includes('person')) {
                setPerson(filterPerson(newData) as RandomPerson)
                setPeople([])
            } else {
                setPerson(newData)
                setPeople([])
            }
        } else {
            const newPeople = Array.from({ length: count }, generateData)
            if (dataTypes.includes('person')) {
                setPeople(newPeople.map(p => filterPerson(p as RandomPerson) as RandomPerson))
                setPerson(null)
            } else {
                setPeople(newPeople)
                setPerson(null)
            }
        }

        // Add to history
        const newEntry = {
            count,
            timestamp: new Date().toISOString(),
            format: outputFormat
        }
        setGenerationHistory(prev => [newEntry, ...prev.slice(0, 9)])
    }

    // Auto generate when settings change
    useEffect(() => {
        if (autoGenerate && (count > 0)) {
            const timeoutId = setTimeout(() => {
                handleGenerate()
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    }, [autoGenerate, count, dataTypes, includeFields, outputFormat])

    const handleCopy = () => {
        const data = count === 1 ? person : people
        if (!data) return
        
        let textToCopy = ''
        if (outputFormat === 'json') {
            textToCopy = JSON.stringify(data, null, 2)
        } else if (outputFormat === 'csv') {
            if (count === 1 && person) {
                const headers = Object.keys(person).join(',')
                const values = Object.values(person).map(v => `"${v}"`).join(',')
                textToCopy = `${headers}\n${values}`
            } else {
                if (people.length > 0) {
                    const headers = Object.keys(people[0]).join(',')
                    const rows = people.map(p => Object.values(p).map(v => `"${v}"`).join(','))
                    textToCopy = `${headers}\n${rows.join('\n')}`
                }
            }
        } else if (outputFormat === 'xml') {
            if (count === 1 && person) {
                textToCopy = '<?xml version="1.0" encoding="UTF-8"?>\n<person>\n'
                Object.entries(person).forEach(([key, value]) => {
                    textToCopy += `  <${key}>${value}</${key}>\n`
                })
                textToCopy += '</person>'
            }
        }
        
        copyToClipboard(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const data = count === 1 ? person : people
        if (!data) return
        
        let content = ''
        let filename = `random-data-${Date.now()}`
        let mimeType = 'application/json'
        
        if (outputFormat === 'json') {
            content = JSON.stringify(data, null, 2)
            filename += '.json'
        } else if (outputFormat === 'csv') {
            if (count === 1 && person) {
                const headers = Object.keys(person).join(',')
                const values = Object.values(person).map(v => `"${v}"`).join(',')
                content = `${headers}\n${values}`
            } else {
                if (people.length > 0) {
                    const headers = Object.keys(people[0]).join(',')
                    const rows = people.map(p => Object.values(p).map(v => `"${v}"`).join(','))
                    content = `${headers}\n${rows.join('\n')}`
                }
            }
            filename += '.csv'
            mimeType = 'text/csv'
        } else if (outputFormat === 'xml') {
            if (count === 1 && person) {
                content = '<?xml version="1.0" encoding="UTF-8"?>\n<person>\n'
                Object.entries(person).forEach(([key, value]) => {
                    content += `  <${key}>${value}</${key}>\n`
                })
                content += '</person>'
            }
            filename += '.xml'
            mimeType = 'application/xml'
        }
        
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleClearHistory = () => {
        setGenerationHistory([])
    }

    const handleHistoryClick = (entry: {count: number}) => {
        setCount(entry.count)
        handleGenerate()
    }

    const getCharacterCount = () => {
        const data = count === 1 ? person : people
        return data ? JSON.stringify(data).length : 0
    }

    const computed = useMemo(() => {
        if (!person && people.length === 0) return { totalRecords: 0, totalFields: 0 }
        
        const data = count === 1 ? person : people[0]
        if (!data) return { totalRecords: 0, totalFields: 0 }
        
        const totalRecords = count === 1 ? 1 : people.length
        const totalFields = Object.keys(data).length
        
        return { totalRecords, totalFields }
    }, [person, people, count])

    const getFormatPreview = () => {
        if (outputFormat === 'json') return '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
        if (outputFormat === 'csv') return 'name,email\n"John Doe","john@example.com"'
        if (outputFormat === 'xml') return '<person>\n  <name>John Doe</name>\n  <email>john@example.com</email>\n</person>'
        return ''
    }

    return (
        <ToolLayout
            title="Random Data Generator"
            description="Generate realistic fake data for testing and development with advanced features."
            icon={Dices}
            onReset={() => { setPerson(null); setPeople([]); setCount(1) }}
            onCopy={(person || people.length > 0) ? handleCopy : undefined}
            onDownload={(person || people.length > 0) ? handleDownload : undefined}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between p-4 glass rounded-2xl border">
                    <div className="flex items-center space-x-3">
                        <Dices className="w-6 h-6 text-brand" />
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Advanced Random Data</h2>
                            <p className="text-sm text-[var(--text-muted)]">Test data generator</p>
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
                            disabled={(!person && people.length === 0)}
                            className={cn(
                                "flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                (person || people.length > 0) ? "brand-gradient text-white shadow-lg hover:scale-105" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                            )}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Enhanced Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Records</label>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                            className="w-full text-xl font-bold p-4 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-center"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-brand" />
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Format</label>
                        </div>
                        <select
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            className="w-full text-xl font-bold p-4 rounded-xl bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-center"
                        >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="xml">XML</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            className="w-full px-6 py-4 rounded-xl bg-brand text-white font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 text-lg flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Generate
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
                                    id="auto_generate"
                                    checked={autoGenerate}
                                    onChange={(e) => setAutoGenerate(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="auto_generate" className="text-sm text-[var(--text-primary)]">Auto Generate</label>
                            </div>
                            
                            <div>
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Data Types</label>
                                <div className="space-y-2">
                                    {['person', 'email', 'phone', 'address', 'company'].map(type => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={type}
                                                checked={dataTypes.includes(type)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setDataTypes([...dataTypes, type])
                                                    } else {
                                                        setDataTypes(dataTypes.filter(t => t !== type))
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={type} className="text-sm text-[var(--text-primary)] capitalize">{type}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-sm text-[var(--text-primary)] block mb-2">Include Fields (Person)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.keys(includeFields).map(field => (
                                        <div key={field} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={field}
                                                checked={includeFields[field as keyof typeof includeFields]}
                                                onChange={(e) => setIncludeFields({...includeFields, [field]: e.target.checked})}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={field} className="text-sm text-[var(--text-primary)] capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 glass rounded-lg border bg-[var(--bg-tertiary)]">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-4 h-4 text-brand" />
                                <span className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Format Preview</span>
                            </div>
                            <pre className="text-xs text-[var(--text-primary)] font-mono bg-[var(--bg-primary)] p-2 rounded">
                                {getFormatPreview()}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                {(person || people.length > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Records</div>
                            <div className="text-2xl font-black text-brand">{computed.totalRecords}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Fields</div>
                            <div className="text-2xl font-black text-brand">{computed.totalFields}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Characters</div>
                            <div className="text-2xl font-black text-brand">{getCharacterCount()}</div>
                        </div>
                        <div className="p-4 glass rounded-xl border text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Format</div>
                            <div className="text-2xl font-black text-brand uppercase">{outputFormat}</div>
                        </div>
                    </div>
                )}

                {/* Single Person View */}
                {person && (
                    <div className="glass p-8 rounded-3xl border-[var(--border-primary)] space-y-6">
                        <h3 className="text-3xl font-black text-brand flex items-center gap-3">
                            <User className="w-8 h-8" />
                            {person.name || 'Generated Data'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {person.email && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Email</p>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{person.email}</p>
                                </div>
                            )}

                            {person.phone && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Phone</p>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{person.phone}</p>
                                </div>
                            )}

                            {(person.address || person.city || person.country || person.zipCode) && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl md:col-span-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Address</p>
                                    </div>
                                    <p className="text-[var(--text-primary)]">
                                        {[person.address, person.city, person.country, person.zipCode].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            )}

                            {(person.company || person.jobTitle) && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Company</p>
                                    </div>
                                    <p className="font-bold text-[var(--text-primary)]">{person.company}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{person.jobTitle}</p>
                                </div>
                            )}

                            {person.dateOfBirth && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Date of Birth</p>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{person.dateOfBirth}</p>
                                </div>
                            )}

                            {person.creditCard && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Test Card</p>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{person.creditCard}</p>
                                </div>
                            )}

                            {person.username && (
                                <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-brand" />
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Username</p>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{person.username}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Multiple Records View */}
                {people.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-brand">
                            Generated {people.length} Records
                        </h3>
                        <div className="glass p-6 rounded-2xl border-[var(--border-primary)] max-h-[600px] overflow-auto custom-scrollbar">
                            <pre className="text-sm font-mono text-[var(--text-primary)]">
                                {outputFormat === 'json' ? JSON.stringify(people, null, 2) : 
                                 outputFormat === 'csv' ? (() => {
                                    if (people.length > 0) {
                                        const headers = Object.keys(people[0]).join(',')
                                        const rows = people.map(p => Object.values(p).map(v => `"${v}"`).join(','))
                                        return `${headers}\n${rows.join('\n')}`
                                    }
                                    return ''
                                 })() :
                                 (() => {
                                    if (people.length > 0) {
                                        return '<?xml version="1.0" encoding="UTF-8"?>\n<records>\n' + 
                                               people.map(p => {
                                                   let xml = '  <record>\n'
                                                   Object.entries(p).forEach(([key, value]) => {
                                                       xml += `    <${key}>${value}</${key}>\n`
                                                   })
                                                   xml += '  </record>'
                                                   return xml
                                               }).join('\n') + '\n</records>'
                                    }
                                    return ''
                                 })()}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Generation History */}
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-brand" />
                            <label className="px-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">History</label>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            disabled={generationHistory.length === 0}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                generationHistory.length > 0 ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 glass rounded-2xl border bg-[#0d1117] shadow-inner relative overflow-hidden max-h-[400px]">
                        {generationHistory.length > 0 ? (
                            <div className="p-4 space-y-2">
                                {generationHistory.map((entry, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleHistoryClick(entry)}
                                        className="p-3 glass rounded-lg border bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
                                                {entry.count} records • {entry.format.toUpperCase()}
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
                                <p className="text-xs">Your generation history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center text-xs text-[var(--text-muted)] space-y-2">
                    <p className="font-bold text-orange-500">⚠️ For Testing Only</p>
                    <p>This generates fake data for development and testing purposes.</p>
                    <p>Do not use for fraudulent activities or production systems.</p>
                </div>
            </div>
        </ToolLayout>
    )
}
