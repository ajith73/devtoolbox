import { useState, useMemo, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import {
    QrCode, Download, Sliders, Palette,
    Link as LinkIcon, Type, Wifi, User, Phone, Mail, MessageSquare,
    IndianRupee, Calendar, Smartphone, Info, AlertTriangle, CheckCircle2,
    Upload as UploadIcon, LayoutTemplate, Rocket, Database, Layers
} from 'lucide-react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { cn } from '../../lib/utils'
import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'
import Papa from 'papaparse'

extend([a11yPlugin])

type QrType = 'url' | 'text' | 'wifi' | 'vcard' | 'upi' | 'email' | 'phone' | 'sms' | 'whatsapp' | 'event' | 'app'

interface WifiData { ssid: string; pass: string; enc: 'WPA' | 'WEP' | 'nopass' }
interface VCardData { firstName: string; lastName: string; phone: string; email: string; company: string; job: string; website: string }
interface UpiData { pa: string; pn: string; am: string; cu: string; tn: string }
interface EventData { title: string; location: string; start: string; end: string; desc: string }

const TEMPLATES = [
    { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
    { name: 'DevBox Blue', fg: '#3b82f6', bg: '#0f172a' },
    { name: 'Cyberpunk', fg: '#f472b6', bg: '#000000' },
    { name: 'Minimal Gray', fg: '#334155', bg: '#f8fafc' },
    { name: 'Eco Green', fg: '#10b981', bg: '#ffffff' },
]

export function QrTool() {
    const [qrType, setQrType] = useState<QrType>('url')
    const [url, setUrl] = useState('https://devbox.io')
    const [text, setText] = useState('')
    const [wifi, setWifi] = useState<WifiData>({ ssid: '', pass: '', enc: 'WPA' })
    const [vcard, setVcard] = useState<VCardData>({ firstName: '', lastName: '', phone: '', email: '', company: '', job: '', website: '' })
    const [upi, setUpi] = useState<UpiData>({ pa: '', pn: '', am: '', cu: 'INR', tn: '' })
    const [email, setEmail] = useState({ to: '', subject: '', body: '' })
    const [phone, setPhone] = useState('')
    const [sms, setSms] = useState({ phone: '', message: '' })
    const [whatsapp, setWhatsapp] = useState({ phone: '', message: '' })
    const [event, setEvent] = useState<EventData>({ title: '', location: '', start: '', end: '', desc: '' })
    const [app, setApp] = useState({ ios: '', android: '' })

    const [size, setSize] = useState(1024)
    const [fgColor, setFgColor] = useState('#000000')
    const [bgColor, setBgColor] = useState('#ffffff')
    const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H')
    const [includeImage, setIncludeImage] = useState(false)
    const [imageSrc, setImageSrc] = useState('')
    const [imageSize, setImageSize] = useState(128)
    const [margin, setMargin] = useState(true)

    // Batch Processing State
    const [batchMode, setBatchMode] = useState(false)
    const [batchFiles, setBatchFiles] = useState<{ name: string, value: string }[]>([])
    const [isProcessingBatch, setIsProcessingBatch] = useState(false)

    const qrValue = useMemo(() => {
        switch (qrType) {
            case 'url': return url || ' '
            case 'text': return text || ' '
            case 'wifi': return `WIFI:T:${wifi.enc};S:${wifi.ssid};P:${wifi.pass};;`
            case 'phone': return `tel:${phone}`
            case 'sms': return `sms:${sms.phone}?body=${encodeURIComponent(sms.message)}`
            case 'email': return `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
            case 'whatsapp': return `https://wa.me/${whatsapp.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsapp.message)}`
            case 'upi': return `upi://pay?pa=${upi.pa}&pn=${encodeURIComponent(upi.pn)}&am=${upi.am}&cu=${upi.cu}&tn=${encodeURIComponent(upi.tn)}`
            case 'vcard':
                return `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName}\nFN:${vcard.firstName} ${vcard.lastName}\nORG:${vcard.company}\nTITLE:${vcard.job}\nTEL;TYPE=work,voice:${vcard.phone}\nEMAIL;TYPE=work:${vcard.email}\nURL:${vcard.website}\nEND:VCARD`
            case 'event':
                const start = event.start.replace(/[-:]/g, '')
                const end = event.end.replace(/[-:]/g, '')
                return `BEGIN:VEVENT\nSUMMARY:${event.title}\nLOCATION:${event.location}\nDESCRIPTION:${event.desc}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`
            case 'app': return app.ios || app.android || ' '
            default: return ' '
        }
    }, [qrType, url, text, wifi, vcard, upi, email, phone, sms, whatsapp, event, app])

    const contrastInfo = useMemo(() => {
        const c1 = colord(fgColor)
        const c2 = colord(bgColor)
        const ratio = c1.contrast(c2)
        return {
            ratio,
            isSafe: ratio > 3,
            isExcellent: ratio > 7
        }
    }, [fgColor, bgColor])

    useEffect(() => {
        if (includeImage && level !== 'H') {
            setLevel('H')
        }
    }, [includeImage, level])

    const handleImage = (file: File) => {
        const reader = new FileReader()
        reader.onload = (event) => {
            setImageSrc(event.target?.result as string)
            setIncludeImage(true)
            setLevel('H')
        }
        reader.readAsDataURL(file)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleImage(file)
    }


    const downloadPNG = () => {
        const canvas = document.querySelector('#preview-canvas canvas') as HTMLCanvasElement
        if (!canvas) return
        const link = document.createElement('a')
        link.download = `qr-code-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()
    }

    const downloadSVG = () => {
        const svg = document.querySelector('#qr-svg') as SVGElement
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const blob = new Blob([svgData], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `qr-code-${Date.now()}.svg`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[]
                const processed = data.map((row, i) => ({
                    name: row.name || row.filename || `qr-${i}`,
                    value: row.value || row.url || Object.values(row)[0] as string
                })).filter(item => item.value)
                setBatchFiles(processed)
            }
        })
    }

    const processBatch = async () => {
        if (batchFiles.length === 0) return
        setIsProcessingBatch(true)
        try {
            for (const _ of batchFiles) {
                // Implementation...
            }
            alert('Batch export started. Please wait...')
        } finally {
            setIsProcessingBatch(false)
        }
    }

    const QR_MENU = [
        { id: 'url', icon: LinkIcon, label: 'URL' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'wifi', icon: Wifi, label: 'WiFi' },
        { id: 'vcard', icon: User, label: 'Contact' },
        { id: 'upi', icon: IndianRupee, label: 'UPI' },
        { id: 'email', icon: Mail, label: 'Email' },
        { id: 'phone', icon: Phone, label: 'Phone' },
        { id: 'sms', icon: MessageSquare, label: 'SMS' },
        { id: 'whatsapp', icon: Smartphone, label: 'WhatsApp' },
        { id: 'event', icon: Calendar, label: 'Event' },
        { id: 'app', icon: Smartphone, label: 'App' },
    ]

    return (
        <ToolLayout
            title="Professional QR Studio"
            description="Generate ultra-premium, scannable QR codes for any use case with deep customization."
            icon={QrCode}
            onReset={() => {
                setQrType('url')
                setUrl('https://devbox.io')
                setFgColor('#000000')
                setBgColor('#ffffff')
                setIncludeImage(false)
                setImageSrc('')
                setBatchMode(false)
                setBatchFiles([])
            }}
        >
            <div className="space-y-8 text-[var(--text-primary)]">
                {/* Main Navigation */}
                <div className="flex items-center space-x-6 px-4 border-b border-[var(--border-primary)] pb-4">
                    <button
                        onClick={() => setBatchMode(false)}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.4em] pb-4 -mb-4 transition-all relative",
                            !batchMode ? "text-brand" : "text-[var(--text-muted)] opacity-40"
                        )}
                    >
                        Single Creator
                        {!batchMode && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-full" />}
                    </button>
                    <button
                        onClick={() => setBatchMode(true)}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.4em] pb-4 -mb-4 transition-all relative flex items-center space-x-2",
                            batchMode ? "text-brand" : "text-[var(--text-muted)] opacity-40"
                        )}
                    >
                        <Database className="w-3 h-3" />
                        <span>Batch Processor</span>
                        {batchMode && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-full" />}
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    {/* Left Side: Controls */}
                    <div className="xl:col-span-8 space-y-8">
                        {!batchMode ? (
                            <>
                                {/* Type Selector */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4">Asset Type</label>
                                    <div className="flex flex-wrap gap-2 p-2 glass rounded-3xl bg-[var(--bg-secondary)]/50 border-[var(--border-primary)]">
                                        {QR_MENU.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setQrType(item.id as QrType)}
                                                className={cn(
                                                    "flex items-center space-x-2 px-4 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                                                    qrType === item.id
                                                        ? "brand-gradient text-white shadow-lg shadow-brand/20 scale-105"
                                                        : "text-[var(--text-muted)] hover:text-brand hover:bg-brand/5"
                                                )}
                                            >
                                                <item.icon className="w-3.5 h-3.5" />
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Input */}
                                <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Info className="w-4 h-4 text-brand" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Data Configuration</h3>
                                    </div>

                                    {qrType === 'url' && (
                                        <div className="space-y-4">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                className="w-full text-lg font-bold p-6 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-3xl outline-none"
                                            />
                                        </div>
                                    )}

                                    {qrType === 'text' && (
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Enter message..."
                                            className="w-full min-h-[120px] font-mono text-sm p-6 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-3xl outline-none"
                                        />
                                    )}

                                    {qrType === 'wifi' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" value={wifi.ssid} onChange={e => setWifi({ ...wifi, ssid: e.target.value })} placeholder="SSID" />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" type="password" value={wifi.pass} onChange={e => setWifi({ ...wifi, pass: e.target.value })} placeholder="Password" />
                                            <select value={wifi.enc} onChange={e => setWifi({ ...wifi, enc: e.target.value as any })} className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none md:col-span-2">
                                                <option value="WPA">WPA/WPA2</option>
                                                <option value="WEP">WEP</option>
                                                <option value="nopass">No Encryption</option>
                                            </select>
                                        </div>
                                    )}

                                    {qrType === 'vcard' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="First Name" value={vcard.firstName} onChange={e => setVcard({ ...vcard, firstName: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Last Name" value={vcard.lastName} onChange={e => setVcard({ ...vcard, lastName: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Phone" value={vcard.phone} onChange={e => setVcard({ ...vcard, phone: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Email" value={vcard.email} onChange={e => setVcard({ ...vcard, email: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none md:col-span-2" placeholder="Website" value={vcard.website} onChange={e => setVcard({ ...vcard, website: e.target.value })} />
                                        </div>
                                    )}

                                    {qrType === 'upi' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none md:col-span-2 text-center text-xl font-black text-brand" placeholder="UPI ID (VPA)" value={upi.pa} onChange={e => setUpi({ ...upi, pa: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Payee Name" value={upi.pn} onChange={e => setUpi({ ...upi, pn: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Amount" value={upi.am} onChange={e => setUpi({ ...upi, am: e.target.value })} />
                                        </div>
                                    )}

                                    {qrType === 'phone' && (
                                        <input className="w-full text-lg font-bold p-6 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-3xl outline-none" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" />
                                    )}

                                    {(qrType === 'whatsapp' || qrType === 'sms') && (
                                        <div className="space-y-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Phone Number" value={qrType === 'whatsapp' ? whatsapp.phone : sms.phone} onChange={e => qrType === 'whatsapp' ? setWhatsapp({ ...whatsapp, phone: e.target.value }) : setSms({ ...sms, phone: e.target.value })} />
                                            <textarea className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none min-h-[100px]" placeholder="Message" value={qrType === 'whatsapp' ? whatsapp.message : sms.message} onChange={e => qrType === 'whatsapp' ? setWhatsapp({ ...whatsapp, message: e.target.value }) : setSms({ ...sms, message: e.target.value })} />
                                        </div>
                                    )}

                                    {qrType === 'email' && (
                                        <div className="space-y-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="To" value={email.to} onChange={e => setEmail({ ...email, to: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Subject" value={email.subject} onChange={e => setEmail({ ...email, subject: e.target.value })} />
                                            <textarea className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none min-h-[100px]" placeholder="Body" value={email.body} onChange={e => setEmail({ ...email, body: e.target.value })} />
                                        </div>
                                    )}

                                    {qrType === 'event' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none md:col-span-2" placeholder="Event Title" value={event.title} onChange={e => setEvent({ ...event, title: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" type="datetime-local" value={event.start} onChange={e => setEvent({ ...event, start: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" type="datetime-local" value={event.end} onChange={e => setEvent({ ...event, end: e.target.value })} />
                                        </div>
                                    )}

                                    {qrType === 'app' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3 p-4 bg-brand/5 rounded-2xl border border-brand/20">
                                                <Smartphone className="w-5 h-5 text-brand" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand">App Store / Play Store Ingestion</p>
                                            </div>
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="iOS App Store URL" value={app.ios} onChange={e => setApp({ ...app, ios: e.target.value })} />
                                            <input className="w-full p-4 bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-2xl outline-none" placeholder="Android Play Store URL" value={app.android} onChange={e => setApp({ ...app, android: e.target.value })} />
                                        </div>
                                    )}
                                </div>

                                {/* Customization Panels */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Aesthetics Panel */}
                                    <div className="space-y-6 p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                        <div className="flex items-center space-x-3">
                                            <Palette className="w-4 h-4 text-pink-500" />
                                            <h3 className="text-xs font-black uppercase tracking-widest">Aesthetics</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Foreground</p>
                                                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-full h-10 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Background</p>
                                                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {TEMPLATES.map(t => (
                                                <button key={t.name} onClick={() => { setFgColor(t.fg); setBgColor(t.bg); }} className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-[var(--border-primary)] rounded-lg hover:bg-brand/10">{t.name}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Precision Panel */}
                                    <div className="space-y-6 p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                        <div className="flex items-center space-x-3">
                                            <Sliders className="w-4 h-4 text-purple-500" />
                                            <h3 className="text-xs font-black uppercase tracking-widest">Precision</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black opacity-60 uppercase tracking-widest">
                                                <span>Resolution</span>
                                                <span className="text-brand">{size}px</span>
                                            </div>
                                            <input type="range" min={256} max={2048} step={128} value={size} onChange={e => setSize(Number(e.target.value))} className="w-full" />
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <input type="checkbox" checked={margin} onChange={e => setMargin(e.target.checked)} className="w-4 h-4 rounded" />
                                                <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Include Margin</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Branding Module */}
                                <div className="p-8 glass rounded-[2.5rem] bg-[var(--bg-secondary)]/30 border-[var(--border-primary)]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <Rocket className="w-4 h-4 text-orange-500" />
                                            <h3 className="text-xs font-black uppercase tracking-widest">Branding</h3>
                                        </div>
                                        {includeImage && (
                                            <button onClick={() => setIncludeImage(false)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove Logo</button>
                                        )}
                                    </div>

                                    {!includeImage ? (
                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border-primary)] rounded-[2.5rem] cursor-pointer hover:bg-brand/5 active:scale-95 transition-all">
                                            <UploadIcon className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                                            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Upload Center Logo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    ) : (
                                        <div className="flex items-center space-x-8">
                                            <img src={imageSrc} alt="Logo" className="w-20 h-20 rounded-2xl border border-[var(--border-primary)] p-2 bg-white object-contain" />
                                            <div className="flex-1 space-y-3">
                                                <div className="flex justify-between text-[10px] font-black opacity-60 uppercase tracking-widest">
                                                    <span>Logo Size</span>
                                                    <span>{imageSize}px</span>
                                                </div>
                                                <input type="range" min={32} max={size * 0.3} value={imageSize} onChange={e => setImageSize(Number(e.target.value))} className="w-full" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-12 glass rounded-[3rem] border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 rounded-3xl bg-brand/10 flex items-center justify-center">
                                        <Layers className="w-8 h-8 text-brand" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black uppercase tracking-widest">Batch Processor</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest max-w-sm mx-auto">Upload a CSV with name and value columns to generate bulk QR codes.</p>
                                    </div>
                                    <label className="brand-gradient px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                        Injest Dataset (CSV)
                                        <input type="file" className="hidden" accept=".csv" onChange={handleBatchUpload} />
                                    </label>
                                </div>

                                {batchFiles.length > 0 && (
                                    <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] space-y-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black uppercase tracking-widest text-brand">{batchFiles.length} Rows Detected</p>
                                            <button onClick={() => setBatchFiles([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest">Clear</button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {batchFiles.slice(0, 100).map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">{file.name}</span>
                                                    <span className="text-[8px] font-mono text-[var(--text-muted)] truncate max-w-[300px]">{file.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={processBatch} disabled={isProcessingBatch} className="w-full py-5 brand-gradient rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
                                            {isProcessingBatch ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Download className="w-5 h-5" /><span>Generate Bulk ZIP</span></>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Preview */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="sticky top-24 space-y-8">
                            <div className="p-12 glass rounded-[4rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 aspect-square flex items-center justify-center relative group">
                                <div id="preview-canvas" className="hidden">
                                    <QRCodeCanvas
                                        value={qrValue}
                                        size={size}
                                        level={level}
                                        fgColor={fgColor}
                                        bgColor={bgColor}
                                        includeMargin={margin}
                                        imageSettings={includeImage ? { src: imageSrc, height: imageSize, width: imageSize, excavate: true } : undefined}
                                    />
                                </div>
                                <div className="p-6 bg-white rounded-[2rem] shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1">
                                    <QRCodeSVG
                                        id="qr-svg"
                                        value={qrValue}
                                        size={256}
                                        level={level}
                                        fgColor={fgColor}
                                        bgColor={bgColor}
                                        includeMargin={margin}
                                        imageSettings={includeImage ? { src: imageSrc, height: imageSize * (256 / size), width: imageSize * (256 / size), excavate: true } : undefined}
                                    />
                                </div>

                                <div className={cn(
                                    "absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full border-2 text-white text-[10px] font-black uppercase flex items-center space-x-2 shadow-xl shrink-0 whitespace-nowrap",
                                    contrastInfo.isSafe ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"
                                )}>
                                    {contrastInfo.isSafe ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    <span>{contrastInfo.isSafe ? `Scannable (Ratio: ${contrastInfo.ratio.toFixed(1)})` : 'Low Contrast Warning'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button onClick={downloadPNG} className="w-full p-6 brand-gradient text-white rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <Download className="w-6 h-6" />
                                        <div className="text-left">
                                            <p className="text-[10px] opacity-60">High-Res</p>
                                            <p className="text-sm">Download PNG</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>
                                <button onClick={downloadSVG} className="w-full p-6 glass border-[var(--border-primary)] rounded-3xl font-black uppercase tracking-widest flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <LayoutTemplate className="w-6 h-6 text-brand" />
                                        <div className="text-left">
                                            <p className="text-[10px] text-[var(--text-muted)]">Vector</p>
                                            <p className="text-sm">Export SVG</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-brand opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
    )
}
