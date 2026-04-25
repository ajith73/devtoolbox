import { useState, useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { ToolLayout } from './ToolLayout'
import {
  Network,
  Download,
  FileCode,
  Database,
  Clock,
  PieChart as PieChartIcon,
  Layers,
  ShieldCheck,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Share2,
  FileText,
  Box,
  Cloud,
  Terminal,
  Workflow,
  Eye,
  Upload
} from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { jsPDF } from 'jspdf'
import { usePersistentState } from '../../lib/storage'

const TEMPLATES = [
  {
    id: 'microservices',
    name: 'Microservices Flow',
    icon: Cloud,
    code: `graph TD
    User([User Entity]) --> GW[API Gateway]
    GW --> Auth{Auth Guard}
    Auth --> |Valid| Users[User Service]
    Auth --> |Valid| Orders[Order Service]
    Auth --> |Valid| Billing[Payment Engine]
    
    Users <--> DB1[(User DB)]
    Orders <--> DB2[(Order DB)]
    Billing <--> DB3[(Payment DB)]
    
    Orders -.-> |Event| Billing
    Billing -.-> |Webhook| Stripe[Stripe API]`
  },
  {
    id: 'three-tier',
    name: '3-Tier Web App',
    icon: Layers,
    code: `graph LR
    subgraph Presentation
        LB[Load Balancer] --> Web1[Web Server A]
        LB --> Web2[Web Server B]
    end
    
    subgraph Application
        Web1 --> App[App Logic]
        Web2 --> App
    end
    
    subgraph Data
        App --> SQL[(Main DB)]
        App --> Redis((Cache))
    end`
  },
  {
    id: 'cicd',
    name: 'CI/CD Pipeline',
    icon: Workflow,
    code: `graph LR
    Git[GitHub/GitLab] --> |Commit| Build[Build Phase]
    Build --> Test[Unit Tests]
    Test --> Lint[Linting Check]
    Lint --> |Pass| Docker[Dockerize]
    Docker --> Push[Registry Push]
    Push --> |Deploy| K8s[Staging K8s]
    K8s --> |Approval| Prod[Production]`
  },
  {
    id: 'kubernetes',
    name: 'K8s Cluster',
    icon: Box,
    code: `graph TD
    subgraph Master Node
        API[API Server] --> ETCD[(Etcd)]
        API --> SCH[Scheduler]
        API --> CM[Controller]
    end
    
    subgraph Worker 1
        KUBE1[Kubelet] --> Pod1[Pod A]
        Pod1 --> C1[Container]
    end
    
    subgraph Worker 2
        KUBE2[Kubelet] --> Pod2[Pod B]
        Pod2 --> C2[Container]
    end`
  },
  {
    id: 'sequence',
    name: 'Auth Sequence',
    icon: ShieldCheck,
    code: `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    participant DB as Database

    U->>A: Enter Credentials
    A->>S: POST /login
    S->>DB: Query User
    DB-->>S: User Found & Valid
    S-->>A: 200 OK + JWT
    A-->>U: Redirect to Dashboard`
  },
  {
    id: 'er',
    name: 'ER Diagram',
    icon: Database,
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    ORDER ||--|{ DELIVERY : scheduled
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        string status
    }`
  },
  {
    id: 'gantt',
    name: 'Deployment Timeline',
    icon: Clock,
    code: `gantt
    title System Launch Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1
    Infra Setup      :a1, 2024-01-01, 7d
    Beta Analytics   :after a1, 10d
    section Phase 2
    Public Release   :2024-01-15, 5d`
  },
  {
    id: 'pie',
    name: 'Cost Distribution',
    icon: PieChartIcon,
    code: `pie title Infrastructure Spend
    "Compute" : 45
    "Storage" : 20
    "Networking" : 15
    "Security" : 20`
  },
  {
    id: 'cloud-native',
    name: 'Cloud Native',
    icon: Cloud,
    code: `graph TD
    subgraph "Cloud Provider"
        CDN[Content Delivery]
        LB[Load Balancer]
        CDN --> LB
    end
    
    subgraph "Kubernetes Cluster"
        LB --> Ingress[Ingress Controller]
        Ingress --> Service1[Service A]
        Ingress --> Service2[Service B]
        
        Service1 --> Pod1[Pod 1]
        Service1 --> Pod2[Pod 2]
        Service2 --> Pod3[Pod 3]
        Service2 --> Pod4[Pod 4]
    end
    
    subgraph "Data Layer"
        Pod1 --> Redis[(Redis Cache)]
        Pod2 --> PostgreSQL[(PostgreSQL)]
        Pod3 --> MongoDB[(MongoDB)]
        Pod4 --> S3[S3 Storage]
    end`
  },
  {
    id: 'serverless',
    name: 'Serverless Architecture',
    icon: Cloud,
    code: `graph LR
    subgraph "Frontend"
        Web[React App]
        Mobile[Mobile App]
    end
    
    subgraph "API Gateway"
        API[API Gateway]
        Auth[Cognito Auth]
    end
    
    subgraph "Serverless Functions"
        Lambda1[User Functions]
        Lambda2[Order Functions]
        Lambda3[Payment Functions]
    end
    
    subgraph "Data & Storage"
        Dynamo[(DynamoDB)]
        S3[S3 Storage]
        CDN[CloudFront CDN]
    end
    
    Web --> API
    Mobile --> API
    API --> Auth
    API --> Lambda1
    API --> Lambda2
    API --> Lambda3
    
    Lambda1 --> Dynamo
    Lambda2 --> Dynamo
    Lambda3 --> Dynamo
    
    Lambda1 --> S3
    Lambda2 --> S3
    Lambda3 --> S3
    
    S3 --> CDN`
  },
  {
    id: 'hybrid-cloud',
    name: 'Hybrid Cloud',
    icon: Network,
    code: `graph TD
    subgraph "On-Premise"
        OnPrem[(Legacy Database)]
        OnPremApp[Legacy App]
        VPN[VPN Gateway]
    end
    
    subgraph "Public Cloud"
        CloudLB[Cloud Load Balancer]
        CloudApp[Cloud Application]
        CloudDB[(Cloud Database)]
    end
    
    subgraph "Private Cloud"
        PrivateLB[Private Load Balancer]
        PrivateApp[Private Application]
        PrivateDB[(Private Database)]
    end
    
    OnPremApp --> VPN
    VPN --> CloudLB
    CloudLB --> CloudApp
    CloudApp --> CloudDB
    
    CloudLB --> PrivateLB
    PrivateLB --> PrivateApp
    PrivateApp --> PrivateDB
    
    CloudDB -.-> |Sync| PrivateDB`
  }
]

const MERMAID_THEMES = [
  { id: 'dark', name: 'Dark', color: 'bg-slate-900 border-white/20' },
  { id: 'default', name: 'Light', color: 'bg-white border-slate-200' },
  { id: 'neutral', name: 'Neutral', color: 'bg-gray-100 border-gray-300' },
  { id: 'forest', name: 'Eco', color: 'bg-emerald-900 border-emerald-400' },
  { id: 'base', name: 'Enterprise', color: 'bg-brand/10 border-brand/40' }
]

export function ArchitectureDiagramTool() {
  const [input, setInput] = usePersistentState('architecture_diagram_input', TEMPLATES[0].code)
  const [error, setError] = useState<string | null>(null)
  const [mermaidTheme, setMermaidTheme] = usePersistentState('architecture_diagram_theme', 'dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [zoom, setZoom] = useState(1)
  const svgRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = usePersistentState<'split' | 'canvas'>('architecture_diagram_layout', 'split')
  const [activeTab, setActiveTab] = usePersistentState<'preview' | 'editor'>('architecture_diagram_active_tab', 'preview')

  // Unified rendering effect for Mermaid
  useEffect(() => {
    const handleRender = async () => {
      if (!svgRef.current) return

      try {
        if (!input.trim()) {
          svgRef.current.innerHTML = '<div class="text-[var(--text-muted)] opacity-50 text-[10px] font-black uppercase tracking-widest">Awaiting Command Input...</div>'
          setError(null)
          return
        }

        // Initialize Mermaid with current theme settings
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme as any,
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          themeVariables: {
            fontSize: '14px',
            primaryColor: '#3b82f6',
            primaryTextColor: mermaidTheme === 'dark' || mermaidTheme === 'forest' ? '#fff' : '#000',
            primaryBorderColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            tertiaryColor: '#f472b6',
            mainBkg: mermaidTheme === 'dark' ? '#1e293b' : '#ffffff',
            nodeBorder: '#3b82f6',
            clusterBkg: mermaidTheme === 'dark' ? '#0f172a' : '#f8fafc',
            lineColor: mermaidTheme === 'dark' ? '#94a3b8' : '#334155'
          }
        })

        const id = `mermaid-render-${Date.now()}`
        const { svg } = await mermaid.render(id, input)

        svgRef.current.innerHTML = svg
        setError(null)

        // Post-render scaling and styling
        const el = svgRef.current.querySelector('svg')
        if (el) {
          el.style.maxWidth = '100%'
          el.style.maxHeight = '100%'
          el.style.width = 'auto'
          el.style.height = 'auto'
          el.style.display = 'block'
          el.setAttribute('id', 'mermaid-svg-output')

          // Force text visibility for standard node labels
          el.querySelectorAll('.nodeText, .label, .edgeLabel, .messageText').forEach((node: any) => {
            node.style.fill = mermaidTheme === 'dark' || mermaidTheme === 'forest' ? '#fff' : '#000'
          })
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err)
        setError(err.message || 'Syntax error in Mermaid configuration.')
      }
    }

    handleRender()
  }, [input, mermaidTheme])

  // Handle URL state sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('diagram')
    if (code) {
      try {
        const decoded = atob(code)
        setInput(decoded)
      } catch (e) {
        console.error('Failed to decode diagram from URL')
      }
    }
  }, [])

  const handleLoadDiagram = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(content)
            if (jsonData.diagram) {
              setInput(jsonData.diagram)
              if (jsonData.theme) setMermaidTheme(jsonData.theme)
            }
          } else {
            setInput(content)
          }
        } catch (err) {
          setError('Failed to load diagram file')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDownloadSVG = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `architecture-diagram-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(url)
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }

  const handleDownloadPNG = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (svg) {
      const canvas = document.createElement('canvas')
      const bbox = svg.getBBox()
      const padding = 50
      canvas.width = (bbox.width + padding * 2) * 2
      canvas.height = (bbox.height + padding * 2) * 2

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(2, 2)
        ctx.fillStyle = mermaidTheme === 'dark' ? '#0f172a' : '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.onload = () => {
          ctx.drawImage(img, padding, padding)
          const pngUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = `architecture-${Date.now()}.png`
          link.click()
          URL.revokeObjectURL(url)
          confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } })
        }
        img.src = url
      }
    }
  }

  const handleDownloadPDF = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (svg) {
      const canvas = document.createElement('canvas')
      const bbox = svg.getBBox()
      canvas.width = bbox.width + 100
      canvas.height = bbox.height + 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = mermaidTheme === 'dark' ? '#0f172a' : '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const img = new Image()
        const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.onload = () => {
          ctx.drawImage(img, 50, 50)
          const pdf = new jsPDF({
            orientation: bbox.width > bbox.height ? 'l' : 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
          })
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
          pdf.save(`diagram-${Date.now()}.pdf`)
          URL.revokeObjectURL(url)
        }
        img.src = url
      }
    }
  }

  const handleShare = () => {
    const encoded = btoa(input)
    const url = `${window.location.origin}${window.location.pathname}?diagram=${encoded}`
    copyToClipboard(url)
    confetti({ particleCount: 50, spread: 360, colors: ['#3b82f6', '#8b5cf6', '#f472b6'] })
  }

  return (
    <ToolLayout
      title="Architecture Studio"
      description="The professional standard for high-fidelity system design and cloud visualization."
      icon={Network}
      onReset={() => setInput(TEMPLATES[0].code)}
    >
      <div className="relative space-y-6">
        {/* Modern Studio Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 pl-4 sm:p-2 sm:pl-6 bg-[var(--bg-secondary)]/50 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[2rem] shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex p-1 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)]">
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'preview' ? "brand-gradient text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >Visualizer</button>
              <button
                onClick={() => setActiveTab('editor')}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'editor' ? "brand-gradient text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >Source</button>
            </div>

            <div className="hidden lg:flex p-1 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)]">
              <button
                onClick={() => setLayoutMode('split')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  layoutMode === 'split' ? "bg-brand/10 text-brand shadow-inner" : "text-[var(--text-muted)] hover:text-brand"
                )}
                title="Side-by-Side View"
              ><LayoutGrid className="w-4 h-4" /></button>
              <button
                onClick={() => setLayoutMode('canvas')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  layoutMode === 'canvas' ? "bg-brand/10 text-brand shadow-inner" : "text-[var(--text-muted)] hover:text-brand"
                )}
                title="Workspace Focus"
              ><Maximize2 className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pr-2">
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-[var(--bg-primary)]/40 rounded-2xl border border-[var(--border-primary)]">
              {MERMAID_THEMES.slice(0, 4).map(t => (
                <button
                  key={t.id}
                  onClick={() => setMermaidTheme(t.id)}
                  title={t.name}
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all hover:scale-110 relative group",
                    mermaidTheme === t.id ? "border-brand p-0.5" : "border-transparent"
                  )}
                >
                  <div className={cn("w-full h-full rounded-full shadow-lg", t.color)} />
                  <span className="absolute -bottom-8 left-1/2 -translateX-1/2 text-[8px] font-black uppercase text-brand opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={handleShare} className="p-2.5 glass rounded-xl text-brand border-[var(--border-primary)] hover:bg-brand/5 transition-all shadow-sm" title="Share Snapshot"><Share2 className="w-4 h-4" /></button>
              <div className="relative group/export">
                <button className="px-4 py-2 sm:px-7 bg-brand text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Deploy</span>
                </button>
                <div className="absolute right-0 top-full mt-3 w-48 glass rounded-[1.5rem] p-2.5 shadow-2xl opacity-0 translate-y-3 pointer-events-none group-hover/export:opacity-100 group-hover/export:translate-y-0 group-hover/export:pointer-events-auto transition-all z-[100] border border-[var(--border-primary)]">
                  <button onClick={handleDownloadSVG} className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-brand/5 group transition-colors text-left">
                    <FileCode className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] group-hover:text-brand">SVG Original</span>
                  </button>
                  <button onClick={handleDownloadPNG} className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-500/5 group transition-colors text-left">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] group-hover:text-purple-500">PNG Image</span>
                  </button>
                  <button onClick={handleDownloadPDF} className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-cyan-500/5 group transition-colors text-left">
                    <FileText className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] group-hover:text-cyan-500">PDF Document</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Immersive Workspace Environment */}
        <div className={cn(
          "grid grid-cols-1 gap-6 transition-all duration-700",
          isFullscreen ? "fixed inset-0 z-[150] bg-[var(--bg-primary)] p-6 overflow-hidden" :
            layoutMode === 'split' ? "lg:grid-cols-12 h-[750px] lg:h-[850px]" : "grid-cols-1 h-[850px]"
        )}>
          {/* Visualizer Stage */}
          <div className={cn(
            "h-full flex flex-col space-y-4 group transition-all duration-700 relative order-1",
            isFullscreen ? "w-full" :
              layoutMode === 'split' ? "lg:col-span-8" : "w-full",
            activeTab === 'editor' && "hidden lg:flex"
          )}>
            <div className={cn(
              "flex-1 relative glass rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden border-2 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-none transition-all flex items-center justify-center",
              mermaidTheme === 'dark' ? "bg-[#0f172a] border-[#1e293b]" :
                mermaidTheme === 'default' ? "bg-white border-[#f1f5f9]" :
                  mermaidTheme === 'forest' ? "bg-[#064e3b] border-[#065f46]" :
                    mermaidTheme === 'neutral' ? "bg-[#f8fafc] border-[#e2e8f0]" : "bg-[var(--bg-secondary)] border-[var(--border-primary)]"
            )}>
              {/* Visualizer Content Container */}
              <div
                ref={svgRef}
                className="w-full h-full flex items-center justify-center p-6 sm:p-20 overflow-auto scrollbar-hide select-none transition-transform duration-500 ease-out"
                style={{ transform: `scale(${zoom})` }}
              />

              {/* Intelligent Navigation Floating Bar */}
              <div className="absolute bottom-8 left-1/2 -translateX-1/2 flex items-center px-2 py-1.5 bg-[var(--bg-primary)]/90 dark:bg-black/80 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[1.5rem] shadow-2xl z-30 transition-transform hover:scale-105">
                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 sm:p-2.5 hover:bg-brand/10 text-[var(--text-muted)] hover:text-brand rounded-xl transition-all"><Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /></button>
                <div className="w-16 sm:w-20 text-center flex flex-col">
                  <span className="text-[10px] font-mono font-black text-[var(--text-primary)]">{Math.round(zoom * 100)}%</span>
                  <span className="text-[6px] font-black uppercase text-brand/60 tracking-tighter">Scale Factor</span>
                </div>
                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-2 sm:p-2.5 hover:bg-brand/10 text-[var(--text-muted)] hover:text-brand rounded-xl transition-all"><Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /></button>
                <div className="w-px h-6 bg-[var(--border-primary)] mx-2" />
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2.5 hover:bg-brand/10 text-[var(--text-muted)] hover:text-brand rounded-xl transition-all group">
                  {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5 group-hover:scale-110" />}
                </button>
              </div>

              {/* Professional Architectural Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
                style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                  backgroundSize: '40px 40px, 200px 200px, 200px 200px'
                }}
              />

              {/* Precision Error Heads-up Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                    className="absolute top-8 left-8 right-8 p-5 glass border border-red-500/30 rounded-3xl bg-red-500/10 backdrop-blur-3xl z-40 shadow-2xl"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                        <AlertTriangle className="w-5 h-5 text-red-100" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-red-200">Syntax Exception Detected</h4>
                        <p className="text-[10px] font-mono leading-relaxed text-red-100/90 italic line-clamp-2">{error.split('\n')[0]}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Engineering Side Panel */}
          <div className={cn(
            "h-full flex flex-col space-y-6 order-2 transition-all duration-700",
            isFullscreen ? "hidden" :
              layoutMode === 'split' ? "lg:col-span-4" : "hidden lg:flex lg:fixed lg:right-10 lg:bottom-10 lg:w-[480px] lg:h-[750px] lg:z-50",
            activeTab === 'preview' && "hidden lg:flex"
          )}>
            {/* Dynamic Preset Command Center */}
            <div className="p-7 glass rounded-[3rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 shadow-xl overflow-hidden group/presets">
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Blueprints</h3>
                  <span className="text-[7px] font-black text-brand uppercase tracking-tighter">Ready to Instantiate</span>
                </div>
                <div className="p-2 bg-brand/10 rounded-xl"><LayoutGrid className="w-4 h-4 text-brand" /></div>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setInput(t.code)}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[var(--border-primary)] hover:border-brand/40 hover:bg-brand/5 hover:scale-[1.05] transition-all group/btn bg-[var(--bg-primary)]/30"
                    title={t.name}
                  >
                    <t.icon className="w-4.5 h-4.5 text-[var(--text-muted)] group-hover/btn:text-brand transition-colors" />
                    <span className="text-[6.5px] font-black uppercase mt-2.5 text-center text-[var(--text-primary)] truncate w-full tracking-tighter">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pro Editor Control */}
            <div className="flex-1 flex flex-col space-y-5 p-7 glass rounded-[3rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 shadow-xl group/editor relative">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <Terminal className="w-4 h-4 text-brand" />
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Source Logic</h3>
                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">Live Link Active</span>
                  </div>
                </div>
                <div className="flex -space-x-1.5 overflow-hidden py-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-full border border-[var(--bg-primary)] bg-brand shrink-0" />)}
                  <input
                    type="file"
                    accept=".json,.md,.txt"
                    onChange={handleLoadDiagram}
                    className="hidden"
                    id="diagram-file-input"
                  />
                  <label htmlFor="diagram-file-input" className="cursor-pointer">
                    <Upload className="w-4 h-4 text-[var(--text-muted)] group-hover/btn:text-brand transition-colors" />
                  </label>
                </div>
              </div>
              <div className="relative flex-1 group/text">
                <textarea
                  className="w-full h-full font-mono text-xs leading-relaxed resize-none custom-scrollbar p-10 rounded-[2.5rem] bg-black/10 dark:bg-black/40 border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner placeholder:opacity-30"
                  placeholder="Instantiate your architecture here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="absolute bottom-6 right-6 p-3 opacity-0 group-hover/text:opacity-40 transition-opacity pointer-events-none">
                  <Eye className="w-8 h-8 text-brand/30" />
                </div>
              </div>

              <div className="absolute -right-4 top-1/2 -translate-y-1-2 w-8 h-32 glass rounded-full border border-brand/20 items-center justify-center hidden lg:flex">
                <div className="w-0.5 h-20 bg-brand/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fast-Action FAB */}
        <div className="lg:hidden fixed bottom-10 right-10 flex flex-col space-y-4 items-end z-[200]">
          <button onClick={() => setShowTemplates(!showTemplates)} className="w-16 h-16 rounded-[2rem] brand-gradient text-white shadow-[0_20px_50px_rgba(59,130,246,0.4)] flex items-center justify-center transform active:scale-90 transition-transform">
            <LayoutGrid className="w-7 h-7" />
          </button>
        </div>

        {/* Mobile Bottom Sheets */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[210] glass bg-[var(--bg-primary)]/90 backdrop-blur-3xl border-t-2 border-brand/20 rounded-t-[4rem] p-12 max-h-[80vh] overflow-y-auto shadow-[0_-50px_100px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-1.5 bg-brand/20 rounded-full mx-auto mb-10" />
              <div className="flex flex-col items-center mb-10 text-center">
                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-[var(--text-primary)] mb-2">Architectural Patterns</h3>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">Select to quick-start rendering</p>
              </div>
              <div className="grid grid-cols-2 gap-5 mb-10">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setInput(t.code); setShowTemplates(false); }}
                    className="p-8 rounded-[3rem] border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex flex-col items-center space-y-4 shadow-sm active:bg-brand/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center"><t.icon className="w-6 h-6 text-brand" /></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">{t.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTemplates(false)} className="w-full py-5 rounded-[2rem] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] border border-[var(--border-primary)] shadow-inner">Dismiss Studio</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolLayout>
  )
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  )
}
