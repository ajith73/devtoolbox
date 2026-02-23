import React, { useState, useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { ToolLayout } from './ToolLayout'
import { Network, Download, RefreshCcw } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'

export function ArchitectureDiagramTool() {
  const [input, setInput] = useState(`graph TD
  U[User] --> S[Screen/Device]
  S --> A[Client Application]
  A --> B[API Gateway]
  B --> C[Authentication Service]
  B --> D[User Management Service]
  B --> E[Business Logic Service]
  C --> F[Database]
  D --> F
  E --> F
  E --> G[External API]
  G --> H[Third Party Service]`)

  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderDiagram = async () => {
      if (svgRef.current) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark'
          })
          const { svg } = await mermaid.render('diagram', input)
          svgRef.current.innerHTML = svg
        } catch (error) {
          console.error('Mermaid render error:', error)
          if (svgRef.current) {
            svgRef.current.innerHTML = '<p class="text-red-500">Error rendering diagram. Please check your Mermaid syntax.</p>'
          }
        }
      }
    }

    renderDiagram()
  }, [input])

  const handleDownload = () => {
    if (svgRef.current) {
      const svgElement = svgRef.current.querySelector('svg')
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'architecture-diagram.svg'
        link.click()
        URL.revokeObjectURL(url)
      } else {
        setError('No diagram rendered to download. Please check the Mermaid syntax.')
        setTimeout(() => setError(null), 5000)
      }
    }
  }

  return (
    <ToolLayout
      title="Architecture Diagram Creator"
      description="Create project architecture diagrams using Mermaid syntax. Supports flowcharts, sequence diagrams, and more."
      icon={Network}
      onReset={() => setInput(`graph TD
  U[User] --> S[Screen/Device]
  S --> A[Client Application]
  A --> B[API Gateway]
  B --> C[Authentication Service]
  B --> D[User Management Service]
  B --> E[Business Logic Service]
  C --> F[Database]
  D --> F
  E --> F
  E --> G[External API]
  G --> H[Third Party Service]`)}
      onCopy={() => copyToClipboard(input)}
      onDownload={handleDownload}
    >
      {/* Error Notification */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 animate-fade-in">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px] h-[600px]">
        <div className="flex flex-col space-y-4 group">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] pl-4 transition-colors group-focus-within:text-brand">Mermaid Code</label>
          <textarea
            className="flex-1 font-mono text-sm resize-none custom-scrollbar p-8 rounded-[3rem] bg-[var(--input-bg)] border-[var(--border-primary)] shadow-inner text-[var(--text-primary)] focus:ring-4 focus:ring-brand/10 transition-all font-black opacity-80 focus:opacity-100"
            placeholder="Enter your Mermaid diagram code here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-4">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
            Live Preview
          </label>
          <div className="flex-1 relative glass rounded-[3rem] overflow-hidden border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 group shadow-sm transition-all hover:bg-[var(--bg-secondary)]/40 p-8">
            <div ref={svgRef} className="w-full h-full flex items-center justify-center">
              <div className="text-[var(--text-muted)]">Loading diagram...</div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
