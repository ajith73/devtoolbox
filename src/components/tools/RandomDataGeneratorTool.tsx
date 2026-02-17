import { useState } from 'react'
import { ToolLayout } from './ToolLayout'
import { Dices, User, Mail, Phone, MapPin, CreditCard, Calendar } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'

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
    const [count, setCount] = useState(1)
    const [people, setPeople] = useState<RandomPerson[]>([])

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

    const randomNumber = (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min

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

    const handleGenerate = () => {
        if (count === 1) {
            const newPerson = generatePerson()
            setPerson(newPerson)
            setPeople([])
        } else {
            const newPeople = Array.from({ length: count }, generatePerson)
            setPeople(newPeople)
            setPerson(null)
        }
    }

    const handleCopyJSON = () => {
        const data = count === 1 ? person : people
        copyToClipboard(JSON.stringify(data, null, 2))
    }

    const handleDownloadJSON = () => {
        const data = count === 1 ? person : people
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `random-data-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="Random Data Generator"
            description="Generate realistic fake data for testing and development."
            icon={Dices}
            onReset={() => { setPerson(null); setPeople([]); setCount(1) }}
            onCopy={(person || people.length > 0) ? handleCopyJSON : undefined}
            onDownload={(person || people.length > 0) ? handleDownloadJSON : undefined}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">
                            Number of Records
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                            className="w-full text-2xl font-bold p-6 rounded-[2rem] bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all text-center"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            className="w-full px-8 py-6 rounded-[2rem] bg-brand text-white font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 text-xl"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Dices className="w-6 h-6" />
                                Generate
                            </div>
                        </button>
                    </div>
                </div>

                {/* Single Person View */}
                {person && (
                    <div className="glass p-8 rounded-[3rem] border-[var(--border-primary)] space-y-6">
                        <h3 className="text-3xl font-black text-brand flex items-center gap-3">
                            <User className="w-8 h-8" />
                            {person.name}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Email</p>
                                </div>
                                <p className="font-mono text-[var(--text-primary)]">{person.email}</p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Phone</p>
                                </div>
                                <p className="font-mono text-[var(--text-primary)]">{person.phone}</p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Address</p>
                                </div>
                                <p className="text-[var(--text-primary)]">
                                    {person.address}, {person.city}, {person.country} {person.zipCode}
                                </p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Company</p>
                                </div>
                                <p className="font-bold text-[var(--text-primary)]">{person.company}</p>
                                <p className="text-sm text-[var(--text-muted)]">{person.jobTitle}</p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Date of Birth</p>
                                </div>
                                <p className="font-mono text-[var(--text-primary)]">{person.dateOfBirth}</p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Test Card</p>
                                </div>
                                <p className="font-mono text-[var(--text-primary)]">{person.creditCard}</p>
                            </div>

                            <div className="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-brand" />
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Username</p>
                                </div>
                                <p className="font-mono text-[var(--text-primary)]">{person.username}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Multiple People View */}
                {people.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-brand">
                            Generated {people.length} Records
                        </h3>
                        <div className="glass p-6 rounded-[2rem] border-[var(--border-primary)] max-h-[600px] overflow-auto custom-scrollbar">
                            <pre className="text-sm font-mono text-[var(--text-primary)]">
                                {JSON.stringify(people, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

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
